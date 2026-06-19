const mongoose = require("mongoose");
const xlsx = require("xlsx");
const Result = require("../models/Result");
const Student = require("../models/Student");
const ClassModel = require("../models/Class");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// =====================================
// GRADE SYSTEM
// =====================================
const calculateGrade = (score) => {
  if (score >= 70) return { grade: "A", remark: "Excellent" };
  if (score >= 60) return { grade: "B", remark: "Very Good" };
  if (score >= 50) return { grade: "C", remark: "Good" };
  if (score >= 40) return { grade: "D", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
};

// =====================================
// POSITION FORMATTER
// =====================================
const calculatePosition = (index) => {
  const pos = index + 1;
  if (pos === 1) return "1st";
  if (pos === 2) return "2nd";
  if (pos === 3) return "3rd";
  return `${pos}th`;
};

// =====================================
// UPLOAD RESULT  (per-student, parsed from template)
// =====================================
const uploadResult = async (req, res) => {
  try {
    const { term, session, classId } = req.body;

    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    if (!classId)  return res.status(400).json({ success: false, message: "Class is required" });
    if (!term)     return res.status(400).json({ success: false, message: "Term is required" });

    // Upload to Cloudinary so students can still open the original file
    const cloudFile = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    const fileUrl = cloudFile.secure_url;

    // Parse Excel — expect columns: Reg No | Term | Class | Subject1 | Subject2 | ...
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      return res.status(400).json({ success: false, message: "The Excel file is empty or unreadable." });
    }

    const SKIP_COLS = new Set(["Reg No", "Term", "Class"]);

    const created = [];
    const failed  = [];

    for (const row of rows) {
      const regNo = String(row["Reg No"] || "").trim();
      if (!regNo) continue;

      // Match student by registration number (case-insensitive)
      const student = await Student.findOne({
        registrationNumber: { $regex: new RegExp(`^${regNo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      });

      if (!student) {
        failed.push(regNo);
        continue;
      }

      // Extract subject scores from every column that isn't a meta column
      const subjects = [];
      let grandTotal = 0;

      for (const key of Object.keys(row)) {
        if (SKIP_COLS.has(key)) continue;
        const score = Number(row[key]) || 0;
        const { grade, remark } = calculateGrade(score);
        subjects.push({ subjectName: key, firstCA: 0, examScore: 0, total: score, grade, remark });
        grandTotal += score;
      }

      const average = subjects.length > 0 ? Math.round((grandTotal / subjects.length) * 10) / 10 : 0;

      // Replace any existing result for this student / class / term
      await Result.deleteOne({ student: student._id, class: classId, term });

      await Result.create({
        student: student._id,
        class: classId,
        teacher: req.user?.id,
        term,
        session: session || "",
        subjects,
        grandTotal,
        average,
        fileUrl,
        isApproved: true,
        isSubmitted: true,
      });

      created.push(regNo);
    }

    const message = `Results saved for ${created.length} student(s)${
      failed.length ? `. Not found in database: ${failed.join(", ")}` : ""
    }`;

    return res.status(201).json({
      success: true,
      message,
      totalSaved: created.length,
      notFound: failed,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================
// GET STUDENT RESULTS
// =====================================
const getStudentResults = async (req, res) => {
  try {
    const rawId = req.user?.id || req.user?._id;

    if (!rawId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (!mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ success: false, message: "Invalid student ID" });
    }

    const studentId = new mongoose.Types.ObjectId(rawId);

    const results = await Result.find({ student: studentId })
      .populate("student", "fullname registrationNumber email")
      .populate("class", "name")
      .populate("teacher", "fullname email subject")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, results });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================
// GET CLASS STUDENTS (for teacher Excel template)
// =====================================
const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "Invalid class ID" });
    }

    const classDoc = await ClassModel.findById(classId).populate(
      "students",
      "fullname registrationNumber gender email"
    );

    if (!classDoc) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    return res.status(200).json({
      success: true,
      className: classDoc.name,
      students: classDoc.students || [],
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadResult,
  getStudentResults,
  getClassStudents,
  calculateGrade,
  calculatePosition,
};
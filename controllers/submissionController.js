const Submission   = require("../models/Submission");
const Assignment   = require("../models/Assignment");
const Student      = require("../models/Student");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// ── STUDENT: SUBMIT ASSIGNMENT ────────────────────────────────────────────────

const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const studentId = req.user.id;

    if (!assignmentId) {
      return res.status(400).json({ success: false, message: "assignmentId is required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "A file attachment is required" });
    }

    const assignment = await Assignment.findById(assignmentId).populate("teacher", "fullname");
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    // ── Deadline check ────────────────────────────────────────────────────────
    const deadline = assignment.deadline || assignment.dueDate;
    if (deadline && new Date() > new Date(deadline)) {
      return res.status(403).json({
        success: false,
        message: "Submission deadline has passed. No submissions allowed.",
      });
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    const existing = await Submission.findOne({ assignment: assignmentId, student: studentId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this assignment.",
      });
    }

    // ── Upload file to Cloudinary ─────────────────────────────────────────────
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    const submission = await Submission.create({
      assignment: assignmentId,
      student:    studentId,
      fileUrl:    result.secure_url,
      filename:   req.file.originalname,
    });

    await submission.populate([
      { path: "student",    select: "fullname registrationNumber" },
      { path: "assignment", select: "title teacher" },
    ]);

    // ── Real-time: notify the teacher ─────────────────────────────────────────
    const io = req.app.get("io");
    if (io && assignment.teacher?._id) {
      io.to(`teacher:${assignment.teacher._id.toString()}`).emit("new_submission", {
        assignmentId:    assignment._id.toString(),
        assignmentTitle: assignment.title,
        studentName:     submission.student.fullname,
        studentId:       studentId.toString(),
        submittedAt:     submission.createdAt,
        fileUrl:         result.secure_url,
        filename:        req.file.originalname,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Assignment submitted successfully!",
      submission,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already submitted this assignment." });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── TEACHER: GET SUBMISSIONS FOR AN ASSIGNMENT ────────────────────────────────

const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    // Ensure requesting teacher owns this assignment
    if (assignment.teacher.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "Not your assignment" });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate("student", "fullname registrationNumber")
      .sort({ createdAt: -1 });

    return res.json({ success: true, submissions, count: submissions.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── STUDENT: GET MY SUBMISSIONS ───────────────────────────────────────────────

const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate("assignment", "title deadline class")
      .sort({ createdAt: -1 });

    // Return a map keyed by assignmentId for quick lookup
    const submissionMap = {};
    submissions.forEach((s) => {
      if (s.assignment?._id) {
        submissionMap[s.assignment._id.toString()] = s;
      }
    });

    return res.json({ success: true, submissions, submissionMap });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitAssignment, getAssignmentSubmissions, getMySubmissions };

const Assignment = require("../models/Assignment");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const uploadToCloudinary = require("../utils/uploadToCloudinary");


// =====================================
// CREATE ASSIGNMENT (with optional file)
// =====================================

const createAssignment = async (req, res) => {
  try {
    const { title, description, subject, classId, deadline, dueDate } = req.body;

    let fileUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      fileUrl = result.secure_url;
    }

    const assignment = await Assignment.create({
      title,
      description,
      subject,
      class: classId,
      deadline: deadline || dueDate,
      teacher: req.user.id,
      fileUrl,
    });

    await assignment.populate("class", "name");

    res.status(201).json({
      success: true,
      message: "Assignment created",
      assignment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// =====================================
// GET TEACHER'S ASSIGNMENTS
// =====================================

const getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user.id })
      .populate("class", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// =====================================
// GET STUDENT CLASS ASSIGNMENTS
// =====================================

const getStudentAssignments = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id, "class");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const assignments = await Assignment.find({ class: student.class })
      .populate("class", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// =====================================
// MARK ATTENDANCE
// =====================================

const markAttendance = async (req, res) => {
  try {
    const { studentId, classId, status } = req.body;

    const attendance = await Attendance.create({
      student: studentId,
      class: classId,
      status,
      markedBy: req.user.id,
    });

    res.status(201).json({ success: true, message: "Attendance marked", attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAssignment,
  getTeacherAssignments,
  getStudentAssignments,
  markAttendance,
};

const Admin = require("../models/Admin");
const Principal = require("../models/Principal");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const ClassModel = require("../models/Class");
const HeadOfActivities = require("../models/HeadOfActivities");
const Secretary = require("../models/Secretary");
const Developer = require("../models/Developer");
const Result = require("../models/Result");
const Attendance = require("../models/Attendance");
const Payment = require("../models/Payment");
const generateToken = require("../utils/generateToken");
const ROLES = require("../utils/roles");

// ── CREATE ADMIN ────────────────────────
const createAdmin = async (req, res) => {
  try {
    const { fullname, email, password, schoolName } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ success: false, message: "fullname, email and password are required" });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    const admin = await Admin.create({
      fullname,
      email,
      password,
      schoolName: schoolName || "Not Assigned",
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE PRINCIPAL ────────────────────────
const createPrincipal = async (req, res) => {
  try {
    const { fullname, email, password, schoolName, phone } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ success: false, message: "fullname, email and password are required" });
    }

    const exists = await Principal.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Principal already exists" });
    }

    const principal = await Principal.create({
      fullname,
      email,
      password,
      schoolName: schoolName || "Not Assigned",
      phone,
      admin: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Principal created successfully",
      principal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE TEACHER ────────────────────────
const createTeacher = async (req, res) => {
  try {
    const { fullname, email, password, subject, phone } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ success: false, message: "fullname, email and password are required" });
    }

    const exists = await Teacher.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Teacher already exists" });
    }

    const teacher = await Teacher.create({
      fullname,
      email,
      password,
      subject,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      teacher,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE CLASS (FIXED) ────────────────────────
const createClass = async (req, res) => {
  try {
    const { name, section, capacity, teacher, subjects } = req.body;

    // ✅ VALIDATION
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Class name is required",
      });
    }

    const cleanClassName = name.trim();

    // ✅ FIXED: use correct field
    const exists = await ClassModel.findOne({ name: cleanClassName });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Class already exists",
      });
    }

    // determine school
    let schoolName = "Default School";

    if (req.user.role === ROLES.ADMIN) {
      const admin = await Admin.findById(req.user.id);
      schoolName = admin?.schoolName;
    } else if (req.user.role === ROLES.PRINCIPAL) {
      const principal = await Principal.findById(req.user.id);
      schoolName = principal?.schoolName;
    } else if (req.user.role === ROLES.HOA) {
      const hoa = await HeadOfActivities.findById(req.user.id);
      schoolName = hoa?.schoolName || "School";
    } else if (req.user.role === ROLES.DEVELOPER) {
      schoolName = req.body.schoolName || "Developer Managed School";
    }

    // CREATE CLASS
    const newClass = await ClassModel.create({
      name: cleanClassName, // ✅ FIXED FIELD
      section,
      capacity: capacity || 30,
      classTeacher: teacher?.trim() ? teacher : null,
      subjects: subjects || [],
      schoolName,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });

  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ── GET CLASSES ────────────────────────
const getClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find()
      .populate("classTeacher", "fullname email subject")
      .sort({ name: 1 });

    res.status(200).json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET STUDENTS ────────────────────────
const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("class", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET TEACHERS ────────────────────────
const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ASSIGN TEACHER ────────────────────────
const assignTeacherToClass = async (req, res) => {
  try {
    const { classId, teacherId } = req.body;

    if (!classId || !teacherId) {
      return res.status(400).json({
        success: false,
        message: "classId and teacherId are required",
      });
    }

    // FIND CLASS
    const existingClass = await ClassModel.findById(classId);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // FIND TEACHER
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // ASSIGN TEACHER TO CLASS
    existingClass.classTeacher = teacher._id;

    // OPTIONAL
    teacher.assignedClass = existingClass._id;

    // SAVE BOTH
    await existingClass.save();
    await teacher.save();

    // RETURN UPDATED CLASS
    const updatedClass = await ClassModel.findById(classId)
      .populate("classTeacher", "fullname email subject");

    res.status(200).json({
      success: true,
      message: "Teacher assigned successfully",
      class: updatedClass,
    });

  } catch (error) {
    console.error("ASSIGN TEACHER ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ── UPDATE CLASS ────────────────────────
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, section, capacity, subjects } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Class name is required" });
    }

    const existingClass = await ClassModel.findById(id);
    if (!existingClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const duplicate = await ClassModel.findOne({ name });
    if (duplicate && duplicate._id.toString() !== id) {
      return res.status(400).json({ success: false, message: "Class name already exists" });
    }

    existingClass.name = name;
    existingClass.section = section || existingClass.section;
    existingClass.capacity = capacity || existingClass.capacity;
    existingClass.subjects = subjects || existingClass.subjects;

    const updated = await existingClass.save();

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      class: updated,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE CLASS ────────────────────────
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ClassModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getTeacherClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find()
      .populate("classTeacher", "fullname email")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ── CREATE SECRETARY ────────────────────────
const createSecretary = async (req, res) => {
  try {
    const { fullname, email, password, schoolName } = req.body;
    if (!fullname || !email || !password)
      return res.status(400).json({ success: false, message: "fullname, email and password are required" });

    const exists = await Secretary.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, message: "Secretary already exists" });

    const secretary = await Secretary.create({
      fullname, email, password,
      schoolName: schoolName || "Not Assigned",
    });

    res.status(201).json({ success: true, message: "Secretary created successfully", secretary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE HEAD OF ACTIVITIES ────────────────────────
const createHOA = async (req, res) => {
  try {
    const { fullname, email, password, schoolName } = req.body;
    if (!fullname || !email || !password)
      return res.status(400).json({ success: false, message: "fullname, email and password are required" });

    const exists = await HeadOfActivities.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, message: "Head of Activities already exists" });

    const hoa = await HeadOfActivities.create({
      fullname, email, password,
      schoolName: schoolName || "Not Assigned",
    });

    res.status(201).json({ success: true, message: "Head of Activities created successfully", hoa });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── SUSPEND / UNSUSPEND TEACHER ────────────────────────
const suspendTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher)
      return res.status(404).json({ success: false, message: "Teacher not found" });

    teacher.suspended = !teacher.suspended;
    await teacher.save();

    res.status(200).json({
      success: true,
      message: teacher.suspended ? "Teacher suspended" : "Teacher unsuspended",
      suspended: teacher.suspended,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE TEACHER ────────────────────────
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher)
      return res.status(404).json({ success: false, message: "Teacher not found" });

    // unassign from any class
    await ClassModel.updateMany({ classTeacher: teacher._id }, { $unset: { classTeacher: "" } });

    res.status(200).json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE STUDENT ────────────────────────
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });

    res.status(200).json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET TEACHERS WITH RESULT STATUS ────────────────────────
const getTeachersResultStatus = async (req, res) => {
  try {
    const { term, session } = req.query;

    const teachers = await Teacher.find()
      .select("-password")
      .populate("assignedClass", "name")
      .sort({ createdAt: -1 });

    // Build a set of teacherIds that have submitted results for the given term/session
    const filter = {};
    if (term) filter.term = term;
    if (session) filter.session = session;

    const submittedResults = await Result.find(filter).distinct("teacher");
    const submittedSet = new Set(submittedResults.map(id => id.toString()));

    const teachersWithStatus = teachers.map(t => ({
      ...t.toObject(),
      hasSubmittedResults: submittedSet.has(t._id.toString()),
    }));

    res.status(200).json({ success: true, teachers: teachersWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── HOA DASHBOARD STATS ────────────────────────
const getHoaStats = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalClasses, payments] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      ClassModel.countDocuments(),
      Payment.find({ amountPaid: { $gt: 0 } }),
    ]);

    const totalPaid = payments.length;
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    const suspendedTeachers = await Teacher.countDocuments({ suspended: true });

    res.status(200).json({
      success: true,
      stats: { totalStudents, totalTeachers, totalClasses, totalPaid, totalRevenue, suspendedTeachers },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET ATTENDANCE (HOA VIEW) ────────────────────────
const getAttendanceView = async (req, res) => {
  try {
    const { classId, date } = req.query;
    const filter = {};
    if (classId) filter.class = classId;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }

    const records = await Attendance.find(filter)
      .populate("student", "fullname registrationNumber")
      .populate("class", "name")
      .populate("markedBy", "fullname")
      .sort({ date: -1 })
      .limit(500);

    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getKeyUsers = async (req, res) => {
  try {
    const [developers, admins, principals, hoas, secretaries] = await Promise.all([
      Developer.find().select("fullname email role schoolName createdAt"),
      Admin.find().select("fullname email role schoolName createdAt"),
      Principal.find().select("fullname email role schoolName createdAt"),
      HeadOfActivities.find().select("fullname email role schoolName createdAt"),
      Secretary.find().select("fullname email role schoolName createdAt"),
    ]);
    const users = [...developers, ...admins, ...principals, ...hoas, ...secretaries]
      .map(u => u.toObject())
      .sort((a, b) => {
        const order = ["developer", "admin", "principal", "hoa", "secretary"];
        return order.indexOf(a.role) - order.indexOf(b.role);
      });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAdmin,
  createPrincipal,
  createTeacher,
  createHOA,
  createSecretary,
  createClass,
  updateClass,
  deleteClass,
  assignTeacherToClass,
  getClasses,
  getStudents,
  getTeachers,
  getTeacherClasses,
  suspendTeacher,
  deleteTeacher,
  deleteStudent,
  getTeachersResultStatus,
  getHoaStats,
  getAttendanceView,
  getKeyUsers,
};
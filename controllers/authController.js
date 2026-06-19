const Developer = require('../models/Developer');
const Admin = require('../models/Admin');
const Principal = require('../models/Principal');
const HeadOfActivities = require('../models/HeadOfActivities');
const Secretary = require('../models/Secretary');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const generateToken = require('../utils/generateToken');
// ─── DEVELOPER REGISTER ──────────────────────────────────
const registerDeveloper = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    const exists = await Developer.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Developer already exists' });

    const developer = await Developer.create({ fullname, email, password });

    res.status(201).json({
      success: true,
      message: 'Developer registered successfully',
      token: generateToken(developer._id, developer.role),
      developer: {
        _id: developer._id,
        fullname: developer.fullname,
        email: developer.email,
        role: developer.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DEVELOPER LOGIN ─────────────────────────────────────
const loginDeveloper = async (req, res) => {
  try {
    const { email, password } = req.body;

    const developer = await Developer.findOne({ email });
    if (!developer) return res.status(404).json({ success: false, message: 'Developer not found' });

    const isMatch = await developer.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(developer._id, developer.role),
      developer: {
        _id: developer._id,
        fullname: developer.fullname,
        email: developer.email,
        role: developer.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN LOGIN (also handles HOA) ──────────────────────
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin login handles Admin, HOA, and Secretary — all share this endpoint
    let user = await Admin.findOne({ email });
    if (!user) user = await HeadOfActivities.findOne({ email });
    if (!user) user = await Secretary.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'Account not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        schoolName: user.schoolName,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PRINCIPAL LOGIN ─────────────────────────────────────
const loginPrincipal = async (req, res) => {
  try {
    const { email, password } = req.body;

    const principal = await Principal.findOne({ email });
    if (!principal) return res.status(404).json({ success: false, message: 'Principal not found' });

    const isMatch = await principal.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(principal._id, principal.role),
      user: {
        _id: principal._id,
        fullname: principal.fullname,
        email: principal.email,
        role: principal.role,
        schoolName: principal.schoolName,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── HEAD OF ACTIVITIES LOGIN ────────────────────────────
const loginHOA = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hoa = await HeadOfActivities.findOne({ email });
    if (!hoa) return res.status(404).json({ success: false, message: 'Head of Activities not found' });

    const isMatch = await hoa.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(hoa._id, hoa.role),
      user: { _id: hoa._id, fullname: hoa.fullname, email: hoa.email, role: hoa.role, schoolName: hoa.schoolName },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── TEACHER LOGIN ───────────────────────────────────────
const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(teacher._id, teacher.role),
      user: {
        _id: teacher._id,
        fullname: teacher.fullname,
        email: teacher.email,
        role: teacher.role,
        subject: teacher.subject,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── STUDENT LOGIN (serial number) ───────────────────────
const loginStudent = async (req, res) => {
  try {

    let { email } = req.body;

    // CHECK EMAIL
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // NORMALIZE EMAIL
    email = email.trim().toLowerCase();

    console.log("LOGIN EMAIL:", email);

    // FIND STUDENT
    const student = await Student.findOne({
      email,
    });

    console.log("FOUND STUDENT:", student);

    // NOT FOUND
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // SUCCESS
    res.status(200).json({
      success: true,
      message: "Login successful",

      token: generateToken(
        student._id,
        "student"
      ),

      user: {
        _id: student._id,
        fullname: student.fullname,
        email: student.email,
        role: "student",
      },
    });

  } catch (error) {

    console.log(
      "STUDENT LOGIN ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── UNIFIED LOGIN (tries admin → principal → teacher) ───
const unifiedLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Try each model in order
    const models = [
      { Model: Admin, name: 'admin' },
      { Model: Principal, name: 'principal' },
      { Model: HeadOfActivities, name: 'hoa' },
      { Model: Secretary, name: 'secretary' },
      { Model: Teacher, name: 'teacher' },
    ];

    for (const { Model } of models) {
      const user = await Model.findOne({ email });
      if (user) {
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token: generateToken(user._id, user.role),
          user: {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            schoolName: user.schoolName,
            subject: user.subject,
          },
        });
      }
    }

    return res.status(404).json({ success: false, message: 'User not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerDeveloper,
  loginDeveloper,
  loginAdmin,
  loginPrincipal,
  loginHOA,
  loginTeacher,
  loginStudent,
  unifiedLogin,
};

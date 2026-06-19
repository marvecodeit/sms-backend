const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { createAdmin, getStudents, getTeachers } = require("../controllers/adminController");
const ROLES = require("../utils/roles");

const router = express.Router();

// Developer creates admin
router.post("/admins", protect, authorizeRoles(ROLES.DEVELOPER), createAdmin);

// Developer views all schools (placeholder — extend when School model is added)
router.get("/schools", protect, authorizeRoles(ROLES.DEVELOPER), async (req, res) => {
  res.status(200).json({ success: true, schools: [] });
});

// Developer analytics (placeholder)
router.get("/analytics", protect, authorizeRoles(ROLES.DEVELOPER), async (req, res) => {
  const Admin = require("../models/Admin");
  const Student = require("../models/Student");
  const Teacher = require("../models/Teacher");

  const [totalAdmins, totalStudents, totalTeachers] = await Promise.all([
    Admin.countDocuments(),
    Student.countDocuments(),
    Teacher.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    totalSchools: totalAdmins,
    totalUsers: totalAdmins + totalStudents + totalTeachers,
    totalStudents,
    totalTeachers,
    activeSubscriptions: totalAdmins,
    revenue: "₦0",
  });
});

// Developer gets all users
router.get("/users", protect, authorizeRoles(ROLES.DEVELOPER), async (req, res) => {
  const Admin = require("../models/Admin");
  const [admins, teachers] = await Promise.all([
    Admin.find().select("-password"),
    require("../models/Teacher").find().select("-password"),
  ]);
  res.status(200).json({ success: true, users: [...admins, ...teachers] });
});

module.exports = router;

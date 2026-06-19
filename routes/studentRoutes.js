const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const ROLES = require("../utils/roles");

const {
  createStudent,
  updateStudent,
  assignStudentToClass
} = require("../controllers/studentController");
const { getStudents } = require("../controllers/adminController");
const { getStudentAssignments } = require("../controllers/teacherController");


// ── STUDENT SELF-SERVICE ROUTES (logged-in student) ──────────────────────────

router.get(
  "/assignments",
  protect,
  authorizeRoles(ROLES.STUDENT),
  getStudentAssignments
);


// ====================================
// STUDENT MANAGEMENT (ADMIN, PRINCIPAL, DEVELOPER)
// ====================================

// Create Student
router.post(
  "/create",
  protect,
  authorizeRoles(ROLES.PRINCIPAL, ROLES.ADMIN, ROLES.DEVELOPER),
  createStudent
);

// Get All Students (Frontend calls /api/students/all)
router.get(
  "/all",
  protect,
  authorizeRoles(ROLES.PRINCIPAL, ROLES.ADMIN, ROLES.DEVELOPER),
  getStudents
);

// Update Student
router.put(
  "/:id",
  protect,
  authorizeRoles(ROLES.PRINCIPAL, ROLES.ADMIN, ROLES.DEVELOPER),
  updateStudent
);

// Assign to Class
router.post(
  "/assign-to-class",
  protect,
  authorizeRoles(ROLES.PRINCIPAL, ROLES.ADMIN, ROLES.DEVELOPER),
  assignStudentToClass
);

// Get Students by Class
router.get(
  "/class/:classId",
  protect,
  authorizeRoles(ROLES.PRINCIPAL, ROLES.ADMIN, ROLES.DEVELOPER),
  getStudents
);

module.exports = router;
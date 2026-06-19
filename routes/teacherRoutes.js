const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const ROLES = require("../utils/roles");
const upload = require("../middleware/uploadMiddleware");
const {
  createAssignment,
  getTeacherAssignments,
  getStudentAssignments,
  markAttendance,
} = require("../controllers/teacherController");
const { getTeacherClasses } = require("../controllers/adminController");

// ── ASSIGNMENTS ──────────────────────────────────────────────────────────────

// Teacher: create assignment (with optional file)
router.post(
  "/assignment",
  protect,
  authorizeRoles(ROLES.TEACHER),
  upload.single("file"),
  createAssignment
);

// Teacher: list own assignments
router.get(
  "/assignments",
  protect,
  authorizeRoles(ROLES.TEACHER),
  getTeacherAssignments
);

// Student: get assignments for their class
router.get(
  "/assignments/student",
  protect,
  authorizeRoles(ROLES.STUDENT),
  getStudentAssignments
);

// ── ATTENDANCE ───────────────────────────────────────────────────────────────

router.post(
  "/attendance",
  protect,
  authorizeRoles(ROLES.TEACHER),
  markAttendance
);

// ── TEACHER CLASSES ──────────────────────────────────────────────────────────

router.get(
  "/my-classes",
  protect,
  authorizeRoles(ROLES.TEACHER),
  getTeacherClasses
);

module.exports = router;

const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  createAdmin,
  createPrincipal,
  createClass,
  createTeacher,
  createHOA,
  createSecretary,
  getClasses,
  getStudents,
  searchStudents,
  getStudentById,
  getTeachers,
  assignTeacherToClass,
  updateClass,
  deleteClass,
  getTeacherClasses,
  suspendTeacher,
  deleteTeacher,
  deleteStudent,
  getTeachersResultStatus,
  getHoaStats,
  getAttendanceView,
  getKeyUsers,
} = require("../controllers/adminController");
const ROLES = require("../utils/roles");

const router = express.Router();

// ── DEVELOPER ONLY ───────────────────────────────────────
router.post("/create-admin", protect, authorizeRoles(ROLES.DEVELOPER), createAdmin);
router.get("/key-users",     protect, authorizeRoles(ROLES.DEVELOPER), getKeyUsers);

// ── ADMIN: Create Principal ──────────────────────────────
router.post("/create-principal", protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER), createPrincipal);
router.post("/principals",       protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER), createPrincipal);

// ── ADMIN: Create HOA ────────────────────────────────────
router.post("/create-hoa", protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER), createHOA);

// ── ADMIN: Create Secretary ──────────────────────────────
router.post("/create-secretary", protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER), createSecretary);

// ── ADMIN: Create Teacher ────────────────────────────────
router.post("/create-teacher", protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), createTeacher);
router.post("/teachers",       protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), createTeacher);
router.put("/assign-teacher",  protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), assignTeacherToClass);

// ── TEACHER MANAGEMENT ────────────────────────────────────
// NOTE: /teachers/results-status MUST be before /teachers/:id to avoid param conflict
router.get("/teachers/results-status", protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), getTeachersResultStatus);
router.put("/teachers/:id/suspend",    protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), suspendTeacher);
router.delete("/teachers/:id",         protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), deleteTeacher);

// ── STUDENT MANAGEMENT ───────────────────────────────────
// NOTE: /students/search MUST be before /students/:id to avoid param conflict
router.get("/students/search", protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA, ROLES.SECRETARY, ROLES.TEACHER), searchStudents);
router.get("/students/:id",    protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA, ROLES.SECRETARY, ROLES.TEACHER), getStudentById);
router.delete("/students/:id", protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), deleteStudent);

// ── CLASS MANAGEMENT ─────────────────────────────────────
router.post("/create-class", protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), createClass);
router.post("/classes",      protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), createClass);
router.put("/classes/:id",   protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), updateClass);
router.delete("/classes/:id",protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), deleteClass);

// ── HOA: Stats + Attendance view ─────────────────────────
router.get("/hoa/stats",  protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), getHoaStats);
router.get("/attendance", protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), getAttendanceView);

// ── READ DATA ────────────────────────────────────────────
router.get("/classes",    protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), getClasses);
router.get("/students",   protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA, ROLES.SECRETARY), getStudents);
router.get("/teachers",   protect, authorizeRoles(ROLES.ADMIN, ROLES.DEVELOPER, ROLES.PRINCIPAL, ROLES.HOA), getTeachers);
router.get("/my-classes", protect, authorizeRoles(ROLES.TEACHER), getTeacherClasses);

module.exports = router;

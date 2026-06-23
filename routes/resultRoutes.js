const express = require("express");

const router = express.Router();

const protect =
  require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const upload =
  require("../middleware/uploadMiddleware");

const ROLES =
  require("../utils/roles");

const {
  uploadResult,
  getStudentResults,
  getClassStudents,
  fetchSheetProxy,
} = require("../controllers/resultController");


// =====================================
// TEACHER UPLOAD RESULT
// =====================================

router.post(
  "/upload",
  protect,
  authorizeRoles(ROLES.TEACHER),

  upload.single("file"),

  uploadResult
);

router.get(
  "/student",
  protect,
  authorizeRoles(ROLES.STUDENT),
  getStudentResults
);

// Teacher fetches class roster (so they know which reg numbers to put in Excel)
router.get(
  "/class-students/:classId",
  protect,
  authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.DEVELOPER),
  getClassStudents
);

// Proxy: fetch Google Sheets as xlsx + parsed JSON for preview
router.get(
  "/fetch-sheet",
  protect,
  authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.DEVELOPER),
  fetchSheetProxy
);

module.exports = router;
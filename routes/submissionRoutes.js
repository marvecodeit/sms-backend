const express  = require("express");
const router   = express.Router();
const protect  = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const ROLES    = require("../utils/roles");
const upload   = require("../middleware/uploadMiddleware");
const {
  submitAssignment,
  getAssignmentSubmissions,
  getMySubmissions,
} = require("../controllers/submissionController");

// Student: submit a completed assignment (with file)
router.post(
  "/",
  protect,
  authorizeRoles(ROLES.STUDENT),
  upload.single("file"),
  submitAssignment
);

// Student: get all my submissions
router.get(
  "/my",
  protect,
  authorizeRoles(ROLES.STUDENT),
  getMySubmissions
);

// Teacher: get all submissions for a specific assignment
router.get(
  "/assignment/:assignmentId",
  protect,
  authorizeRoles(ROLES.TEACHER),
  getAssignmentSubmissions
);

module.exports = router;

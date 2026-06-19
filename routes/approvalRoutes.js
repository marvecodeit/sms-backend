const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const ROLES = require("../utils/roles");

const {
  getPendingResults,
  approveResult,
  rejectResult,
} = require("../controllers/approvalController");


// ===============================
// PRINCIPAL: VIEW PENDING RESULTS
// ===============================

router.get(
  "/pending",
  protect,
  authorizeRoles(ROLES.PRINCIPAL),
  getPendingResults
);


// ===============================
// PRINCIPAL APPROVES RESULT
// ===============================

router.post(
  "/approve",
  protect,
  authorizeRoles(ROLES.PRINCIPAL),
  approveResult
);


// ===============================
// PRINCIPAL REJECTS RESULT
// ===============================

router.post(
  "/reject",
  protect,
  authorizeRoles(ROLES.PRINCIPAL),
  rejectResult
);

module.exports = router;
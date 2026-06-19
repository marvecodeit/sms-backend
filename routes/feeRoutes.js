const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const ROLES = require("../utils/roles");
const {
  createFee,
  getFees,
  getFeePayments,
  getStudentFees,
  initializePayment,
  verifyPayment,
  paystackWebhook,
  opayWebhook,
  getPaidStudents,
  recordCashPayment,
} = require("../controllers/feeController");

// Webhooks — raw body needed, placed before body parsers
router.post("/webhook/paystack", paystackWebhook);
router.post("/webhook/opay",     opayWebhook);

// Admin / Principal / HOA / Secretary
router.post("/", protect, authorizeRoles(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.HOA, ROLES.SECRETARY), createFee);
router.get("/", protect, authorizeRoles(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.HOA, ROLES.SECRETARY, ROLES.TEACHER), getFees);
router.get("/paid-students", protect, authorizeRoles(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.HOA, ROLES.SECRETARY), getPaidStudents);
router.get("/:feeId/payments", protect, authorizeRoles(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.HOA, ROLES.SECRETARY, ROLES.TEACHER), getFeePayments);

// Secretary: cash payment
router.post("/pay/cash", protect, authorizeRoles(ROLES.SECRETARY, ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.HOA), recordCashPayment);

// Student
router.get("/student/my-fees", protect, authorizeRoles(ROLES.STUDENT), getStudentFees);
router.post("/pay/initialize", protect, authorizeRoles(ROLES.STUDENT), initializePayment);
router.get("/pay/verify/:reference", protect, authorizeRoles(ROLES.STUDENT), verifyPayment);

module.exports = router;

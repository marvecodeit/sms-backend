const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const ROLES = require("../utils/roles");

const {
  generateReportCard,
  downloadReportCard,
} = require("../controllers/reportController");

router.post(
  "/generate",
  protect,
  authorizeRoles(ROLES.PRINCIPAL, ROLES.STUDENT),
  generateReportCard
);

router.get(
  "/download",
  protect,
  authorizeRoles(ROLES.STUDENT),
    downloadReportCard
);

module.exports = router;
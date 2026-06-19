const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const ROLES = require("../utils/roles");

const {
  generateCumulativeResults,
} = require("../controllers/cumulativeController");

router.post(
  "/generate",
  protect,
  authorizeRoles(ROLES.PRINCIPAL),
  generateCumulativeResults
);

module.exports = router;
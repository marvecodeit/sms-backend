const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const authorizeRoles =
  require("../middleware/roleMiddleware");

const ROLES = require("../utils/roles");

const {
  generateBroadsheet,
} = require("../controllers/broadsheetController");

router.post(
  "/generate",
  protect,
  authorizeRoles(ROLES.PRINCIPAL),
  generateBroadsheet
);

module.exports = router;
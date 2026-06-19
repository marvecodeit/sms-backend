const express = require("express");
const {
  registerDeveloper,
  loginDeveloper,
  loginAdmin,
  loginPrincipal,
  loginHOA,
  loginTeacher,
  loginStudent,
  unifiedLogin,
} = require("../controllers/authController");

const router = express.Router();

// DEVELOPER
router.post("/developer/register", registerDeveloper);
router.post("/developer/login", loginDeveloper);

// UNIFIED STAFF LOGIN (admin, principal, teacher)
router.post("/login", unifiedLogin);

// INDIVIDUAL LOGINS
router.post("/admin/login",     loginAdmin);
router.post("/principal/login", loginPrincipal);
router.post("/hoa/login",       loginHOA);
router.post("/teacher/login",   loginTeacher);

// STUDENT LOGIN (serial number)
router.post("/student/login", loginStudent);

module.exports = router;

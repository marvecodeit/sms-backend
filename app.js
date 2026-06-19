const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const studentRoutes = require("./routes/studentRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const developerRoutes = require("./routes/developerRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const resultRoutes = require("./routes/resultRoutes");
const cumulativeRoutes = require("./routes/cumulativeRoutes");
const reportRoutes = require("./routes/reportRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const broadsheetRoutes = require("./routes/broadsheetRoutes");
const feeRoutes        = require("./routes/feeRoutes");
const submissionRoutes = require("./routes/submissionRoutes");


const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow localhost and any device on the local network
    const allowed = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
    callback(allowed ? null : new Error(`CORS blocked: ${origin}`), allowed);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────── 
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/results", resultRoutes);
app.use(
  "/api/cumulative",
  cumulativeRoutes
);
app.use("/api/report", reportRoutes);
app.use("/api/approval", approvalRoutes);
app.use("/api/broadsheet", broadsheetRoutes);
app.use("/api/fees",        feeRoutes);
app.use("/api/submissions", submissionRoutes);


module.exports = app;

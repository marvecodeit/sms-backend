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
const ALLOWED_ORIGINS = [
  // Production
  'https://portal.mercanbrilliantschools.com.ng',
  'https://www.portal.mercanbrilliantschools.com.ng',
  'https://mbsonline.vercel.app',
  // Local development
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}(:\d+)?$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
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

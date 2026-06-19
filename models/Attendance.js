const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present",
    },

    date: {
      type: Date,
      default: Date.now,
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Attendance",
  attendanceSchema
);
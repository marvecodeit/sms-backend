const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      enum: ["Primary", "Secondary", ""],
      default: "",
    },

    capacity: {
      type: Number,
      default: 30,
    },

    subjects: [{ type: String }],

    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
    },

    createdByModel: {
      type: String,
      enum: ["Admin", "Developer"],
      default: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
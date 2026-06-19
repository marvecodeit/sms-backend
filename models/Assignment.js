const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    deadline: {
      type: Date,
    },

    fileUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Assignment",
  assignmentSchema
);
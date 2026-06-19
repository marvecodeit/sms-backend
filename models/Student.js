const mongoose = require("mongoose");
const ROLES = require("../utils/roles");

const studentSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },

    serialNumber: {
      type: String,
      required: true,
      unique: true,
    },

    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
   email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
},
    role: {
      type: String,
      default: ROLES.STUDENT,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
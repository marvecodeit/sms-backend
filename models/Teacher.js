const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const ROLES = require("../utils/roles");

const teacherSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
    },

    assignedClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    role: {
      type: String,
      default: ROLES.TEACHER,
    },

    suspended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

teacherSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

teacherSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Teacher", teacherSchema);
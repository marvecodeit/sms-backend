const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const ROLES = require("../utils/roles");

const secretarySchema = new mongoose.Schema(
  {
    fullname:   { type: String, required: true },
    email:      { type: String, required: true, unique: true },
    password:   { type: String, required: true },
    schoolName: { type: String, default: "Not Assigned" },
    role:       { type: String, default: ROLES.SECRETARY },
  },
  { timestamps: true }
);

secretarySchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

secretarySchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Secretary", secretarySchema);

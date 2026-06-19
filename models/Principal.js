const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const ROLES = require("../utils/roles");

const principalSchema = new mongoose.Schema(
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

    schoolName: {
      type: String,
      required: true,
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    role: {
      type: String,
      default: ROLES.PRINCIPAL,
    },
  },
  { timestamps: true }
);

principalSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

principalSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Principal", principalSchema);
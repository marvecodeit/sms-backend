const mongoose = require("mongoose");

// Short-lived store so the webhook can map an OPay reference → student + fee
const schema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  feeId:     { type: mongoose.Schema.Types.ObjectId, ref: "Fee",     required: true },
  amount:    { type: Number },
  method:    { type: String },
}, { timestamps: true });

// Auto-delete after 2 hours (TTL index)
schema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 });

module.exports = mongoose.model("OPayPending", schema);

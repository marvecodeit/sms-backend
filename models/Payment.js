const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  fee: { type: mongoose.Schema.Types.ObjectId, ref: "Fee", required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ["not_paid", "partial", "paid"], default: "not_paid" },
  transactions: [{
    amount:        { type: Number },
    reference:     { type: String },
    method:        { type: String },
    gateway:       { type: String, enum: ["paystack", "monnify", "opay", "cash"], default: "paystack" },
    paidAt:        { type: Date },
    gatewayStatus: { type: String },
  }],
}, { timestamps: true });

paymentSchema.pre("save", async function() {
  this.balance = Math.max(0, this.totalAmount - this.amountPaid);
  if (this.amountPaid >= this.totalAmount) {
    this.status = "paid";
    this.balance = 0;
  } else if (this.amountPaid > 0) {
    this.status = "partial";
  } else {
    this.status = "not_paid";
  }
});

module.exports = mongoose.model("Payment", paymentSchema);

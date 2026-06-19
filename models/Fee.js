const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  term: { type: String, required: true },
  session: { type: String, default: "" },
  amount: { type: Number, required: true },
  paymentOptions: {
    fullPayment: { type: Boolean, default: true },
    installment: { type: Boolean, default: false },
    customAmount: { type: Boolean, default: false },
  },
  dueDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  createdByRole: { type: String, enum: ["admin", "principal"], default: "admin" },
  status: { type: String, enum: ["active", "closed"], default: "active" },
}, { timestamps: true });

module.exports = mongoose.model("Fee", feeSchema);

const mongoose = require("mongoose");

const cumulativeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    session: {
      type: String,
      required: true,
    },

    termBreakdown: {
      firstTerm: { type: Number, default: 0 },
      secondTerm: { type: Number, default: 0 },
      thirdTerm: { type: Number, default: 0 },
    },

    yearlyTotal: {
      type: Number,
      default: 0,
    },

    yearlyAverage: {
      type: Number,
      default: 0,
    },

    position: {
      type: String,
    },

    promotionStatus: {
      type: String,
      enum: ["Promoted", "Repeat", "Pending"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "CumulativeResult",
  cumulativeSchema
);
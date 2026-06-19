const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    term: {
      type: String,
      enum: [
        "First Term",
        "Second Term",
        "Third Term",
      ],
      required: true,
    },

    session: {
      type: String,
    },

    subjects: [
      {
        subjectName: {
          type: String,
        },

        firstCA: {
          type: Number,
          default: 0,
        },

        examScore: {
          type: Number,
          default: 0,
        },

        total: {
          type: Number,
          default: 0,
        },

        grade: {
          type: String,
        },

        remark: {
          type: String,
        },
      },
    ],

    grandTotal: {
      type: Number,
      default: 0,
    },

    average: {
      type: Number,
      default: 0,
    },

    position: {
      type: String,
    },

    cumulativeAverage: {
      type: Number,
      default: 0,
    },
    cumulativeScore: {
  type: Number,
  default: 0,
},

// The `isPublished` field might be used for a separate publishing step,
// but if results should be visible immediately upon approval,
// this field's default might need to be adjusted in the approval logic,
// or it could be removed if `isApproved` is sufficient for visibility.
isSubmitted: {
  type: Boolean,
  default: true,
},

isApproved: {
  type: Boolean,
  default: true, // Change to true if results should be visible to students immediately upon teacher upload
},

approvedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Principal",
},

approvedAt: {
  type: Date,
},
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Result",
  resultSchema
);
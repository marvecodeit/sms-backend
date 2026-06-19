const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  student:    { type: mongoose.Schema.Types.ObjectId, ref: "Student",    required: true },
  fileUrl:    { type: String },
  filename:   { type: String },
}, { timestamps: true });

// One submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);

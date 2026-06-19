const Result = require("../models/Result");
const CumulativeResult = require("../models/CumulativeResult");
const Student = require("../models/Student");


// ===============================
// CALCULATE PROMOTION STATUS
// ===============================

const getPromotionStatus = (avg) => {
  if (avg >= 50) return "Promoted";
  if (avg < 40) return "Repeat";
  return "Pending";
};


// ===============================
// BUILD CUMULATIVE RESULTS
// ===============================

const generateCumulativeResults = async (
  req,
  res
) => {
  try {
    const { session, classId } = req.body;

    const students = await Student.find({
      class: classId,
    });

    let cumulativeData = [];

    for (const student of students) {
      const results = await Result.find({
        student: student._id,
        session,
      });

      let first = 0;
      let second = 0;
      let third = 0;

      results.forEach((r) => {
        if (r.term === "First Term")
          first += r.average;

        if (r.term === "Second Term")
          second += r.average;

        if (r.term === "Third Term")
          third += r.average;
      });

      const yearlyTotal = first + second + third;

      const yearlyAverage = yearlyTotal / 3;

      const cumulative =
        await CumulativeResult.create({
          student: student._id,
          class: classId,
          session,

          termBreakdown: {
            firstTerm: first,
            secondTerm: second,
            thirdTerm: third,
          },

          yearlyTotal,
          yearlyAverage,
          promotionStatus:
            getPromotionStatus(yearlyAverage),
        });

      cumulativeData.push(cumulative);
    }

    // ===============================
    // POSITIONING
    // ===============================

    const sorted =
      await CumulativeResult.find({
        class: classId,
        session,
      }).sort({
        yearlyAverage: -1,
      });

    for (let i = 0; i < sorted.length; i++) {
      sorted[i].position =
        i === 0
          ? "1st"
          : i === 1
          ? "2nd"
          : i === 2
          ? "3rd"
          : `${i + 1}th`;

      await sorted[i].save();
    }

    res.status(200).json({
      success: true,
      message:
        "Cumulative results generated successfully",
      total: cumulativeData.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateCumulativeResults,
};
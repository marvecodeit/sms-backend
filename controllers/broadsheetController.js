const ExcelJS = require("exceljs");

const Result = require("../models/Result");
const Student = require("../models/Student");


// ===============================
// PROMOTION LOGIC
// ===============================

const getPromotionStatus = (avg) => {
  if (avg >= 50) return "PROMOTED";
  if (avg < 40) return "REPEAT";
  return "CARRY OVER";
};


// ===============================
// GENERATE BROADSHEET
// ===============================

const generateBroadsheet = async (req, res) => {
  try {
    const { classId, session, term } = req.body;

    const results = await Result.find({
      class: classId,
      session,
      term,
      isApproved: true,
    })
      .populate("student")
      .sort({ average: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Broadsheet");

    // ===============================
    // HEADER ROW
    // ===============================

    sheet.columns = [
      { header: "Position", key: "position", width: 10 },
      { header: "Name", key: "name", width: 25 },
      { header: "Reg No", key: "reg", width: 20 },
      { header: "Total", key: "total", width: 10 },
      { header: "Average", key: "avg", width: 10 },
      { header: "Grade", key: "grade", width: 10 },
      { header: "Promotion", key: "promo", width: 15 },
    ];

    // ===============================
    // ADD DATA
    // ===============================

    results.forEach((r, index) => {
      const avg = r.average;

      sheet.addRow({
        position:
          index === 0
            ? "1st"
            : index === 1
            ? "2nd"
            : index === 2
            ? "3rd"
            : `${index + 1}th`,

        name: r.student.fullname,
        reg: r.student.registrationNumber,
        total: r.grandTotal,
        avg: avg.toFixed(2),
        grade:
          avg >= 70
            ? "A"
            : avg >= 60
            ? "B"
            : avg >= 50
            ? "C"
            : avg >= 40
            ? "D"
            : "F",

        promo: getPromotionStatus(avg),
      });
    });

    // ===============================
    // DOWNLOAD FILE
    // ===============================

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=broadsheet.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateBroadsheet,
};
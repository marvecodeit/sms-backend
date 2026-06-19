const PDFDocument = require("pdfkit");
const fs = require("fs");

const Result = require("../models/Result");
const Student = require("../models/Student");
const CumulativeResult = require("../models/CumulativeResult");


// ===============================
// GENERATE REPORT CARD
// ===============================

const generateReportCard = async (req, res) => {
  try {
    const { studentId, session } = req.body;

    const student = await Student.findById(studentId).populate("class");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const results = await Result.find({
      student: studentId,
      session,
    });

    const cumulative = await CumulativeResult.findOne({
      student: studentId,
      session,
    });

    // CREATE PDF
    const doc = new PDFDocument();

    const fileName = `report-${student.registrationNumber}.pdf`;

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );

    doc.pipe(res);

    // ===============================
    // SCHOOL HEADER
    // ===============================
    doc.fontSize(20).text("MARVEL ACADEMY", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(14).text("STUDENT REPORT CARD", {
      align: "center",
    });

    doc.moveDown(2);

    // ===============================
    // STUDENT INFO
    // ===============================
    doc.fontSize(12).text(`Name: ${student.fullname}`);
    doc.text(`Class: ${student.class?.name || "N/A"}`);
    doc.text(`Reg No: ${student.registrationNumber}`);
    doc.text(`Session: ${session}`);

    doc.moveDown();

    // ===============================
    // TERM RESULTS
    // ===============================
    results.forEach((result) => {
      doc.fontSize(12).text(`Term: ${result.term}`);

      result.subjects.forEach((sub) => {
        doc.text(
          `${sub.subjectName} | CA: ${sub.firstCA} | Exam: ${sub.examScore} | Total: ${sub.total} | Grade: ${sub.grade}`
        );
      });

      doc.text(`Average: ${result.average}`);
      doc.moveDown();
    });

    // ===============================
    // CUMULATIVE
    // ===============================
    if (cumulative) {
      doc.addPage();

      doc.fontSize(16).text("CUMULATIVE RESULT", {
        align: "center",
      });

      doc.moveDown();

      doc.text(
        `First Term: ${cumulative.termBreakdown.firstTerm}`
      );

      doc.text(
        `Second Term: ${cumulative.termBreakdown.secondTerm}`
      );

      doc.text(
        `Third Term: ${cumulative.termBreakdown.thirdTerm}`
      );

      doc.text(
        `Yearly Average: ${cumulative.yearlyAverage}`
      );

      doc.text(
        `Position: ${cumulative.position}`
      );

      doc.text(
        `Promotion: ${cumulative.promotionStatus}`
      );
    }

    // ===============================
    // COMMENTS SECTION
    // ===============================
    doc.addPage();

    doc.fontSize(14).text("TEACHER COMMENT:");

    doc.text(
      "Good performance. Keep improving in Mathematics."
    );

    doc.moveDown();

    doc.text("PRINCIPAL COMMENT:");

    doc.text(
      "Excellent student. Promoted to next class."
    );

    doc.moveDown(2);

    doc.text("Signature: ________________");

    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ddownload report card

const downloadReportCard = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const results = await Result.find({ student: studentId, isApproved: true })
      .sort({ createdAt: -1 });

    if (!results.length) {
      return res.status(404).json({ message: "No results found for this student" });
    }

    // Build PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-card-${student.registrationNumber}.pdf`
    );

    doc.pipe(res);

    // Header
    doc.fontSize(18).font("Helvetica-Bold").text("STUDENT REPORT CARD", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica").text(`Name: ${student.fullname}`, { align: "left" });
    doc.text(`Reg No: ${student.registrationNumber}`);
    doc.text(`Email: ${student.email}`);
    doc.moveDown();

    results.forEach((result) => {
      doc.fontSize(13).font("Helvetica-Bold").text(`Term: ${result.term}  |  Session: ${result.session || "N/A"}`);
      doc.moveDown(0.3);

      if (result.subjects && result.subjects.length > 0) {
        result.subjects.forEach((sub) => {
          doc.fontSize(11).font("Helvetica").text(
            `${sub.subjectName}   CA: ${sub.firstCA}   Exam: ${sub.examScore}   Total: ${sub.total}   Grade: ${sub.grade}   Remark: ${sub.remark}`
          );
        });
      }

      doc.fontSize(11).font("Helvetica-Bold").text(`Grand Total: ${result.grandTotal}   Average: ${result.average?.toFixed(1)}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to generate report card" });
  }
};

module.exports = {
  generateReportCard,
  downloadReportCard,
};
const Result = require("../models/Result");


// ===============================
// GET PENDING RESULTS
// ===============================

const getPendingResults = async (req, res) => {
  try {
    const results = await Result.find({
      isSubmitted: true,
      isApproved: false,
    })
      .populate("student")
      .populate("class")
      .populate("teacher");

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// APPROVE RESULT
// ===============================

const approveResult = async (req, res) => {
  try {
    const { resultId } = req.body;

    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    result.isApproved = true;
    result.approvedBy = req.user.id;
    result.approvedAt = new Date();

    await result.save();

    res.status(200).json({
      success: true,
      message: "Result approved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// REJECT RESULT
// ===============================

const rejectResult = async (req, res) => {
  try {
    const { resultId } = req.body;

    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    result.isSubmitted = false;

    await result.save();

    res.status(200).json({
      success: true,
      message: "Result rejected and returned to teacher",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPendingResults,
  approveResult,
  rejectResult,
};
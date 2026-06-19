const express = require("express");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// @desc    Test route

router.get("/test", protect, (req, res) => {
    res.json({ message: "Test route is working!",
        user: req.user,
     });
});

module.exports = router;
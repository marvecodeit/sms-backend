const multer = require("multer");

const cloudinary =
  require("../config/cloudinary");

// STORE FILE IN MEMORY (BUFFER)
const storage = multer.memoryStorage();





// ======================================
// MULTER
// ======================================

const upload = multer({
  storage,
});

module.exports = upload;
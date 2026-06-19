const { v2: cloudinary } = require("cloudinary");

const cloudinary_js_config = () => {
  console.log("Cloudinary function started");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log("Cloudinary connected");
};

// ✅ IMPORTANT: export BOTH
module.exports = {
  cloudinary,
  cloudinary_js_config,
};
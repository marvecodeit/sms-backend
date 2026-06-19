const { cloudinary } = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {

    if (!cloudinary?.uploader) {
      return reject(
        new Error("Cloudinary not initialized properly")
      );
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "school-results",
        public_id: `${Date.now()}-${filename}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;
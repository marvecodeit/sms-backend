const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    // DROP OLD INDEX
    try {
      await mongoose.connection.db
        .collection("classes")
        .dropIndex("className_1");

      console.log("✅ className_1 index dropped");
    } catch (error) {
      console.log("Index already removed or not found");
    }

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
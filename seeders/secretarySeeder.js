const mongoose = require("mongoose");
const Secretary = require("../models/Secretary");

require("dotenv").config();

const seedSecretary = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("📦 MongoDB Connected");

  try {
    const existing = await Secretary.findOne({ email: "secretary@school.com" });
    if (existing) {
      console.log("ℹ️  Secretary already exists:", existing.email);
      await mongoose.disconnect();
      return;
    }

    const secretary = await Secretary.create({
      fullname:   "School Secretary",
      email:      "secretary@school.com",
      password:   "123456",
      schoolName: "Marvel Tech Hub School",
    });

    console.log("✅ Secretary seeded successfully!");
    console.log("   Email:    ", secretary.email);
    console.log("   Password:  123456");
    console.log("   Role:     ", secretary.role);
  } catch (error) {
    console.error("❌ Secretary seeding failed:", error.message);
    process.exit(1);
  }

  await mongoose.disconnect();
};

seedSecretary();

const mongoose = require("mongoose");
const HeadOfActivities = require("../models/HeadOfActivities");

require("dotenv").config();

const seedHOA = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("📦 MongoDB Connected");

  try {
    const existing = await HeadOfActivities.findOne({ email: "hoa@school.com" });
    if (existing) {
      console.log("ℹ️  HOA already exists:", existing.email);
      await mongoose.disconnect();
      return;
    }

    const hoa = await HeadOfActivities.create({
      fullname: "Head of Activities",
      email: "hoa@school.com",
      password: "123456",
      schoolName: "Marvel Tech Hub School",
    });

    console.log("✅ HOA seeded successfully!");
    console.log("   Email:    ", hoa.email);
    console.log("   Password: 123456");
    console.log("   Role:     ", hoa.role);
  } catch (error) {
    console.error("❌ HOA seeding failed:", error.message);
    process.exit(1);
  }

  await mongoose.disconnect();
};

seedHOA();

const mongoose = require("mongoose");
const seedUsers = require("./userSeeder");

require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("📦 MongoDB Connected");
    seedUsers();
  })
  .catch((err) => {
    console.error("DB Error:", err);
  });
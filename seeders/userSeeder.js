        const Developer = require("../models/Developer");
        const Admin = require("../models/Admin");
        const Principal = require("../models/Principal");
        const HeadOfActivities = require("../models/HeadOfActivities");
        const Secretary = require("../models/Secretary");
        const Student = require("../models/Student");

        const seedUsers = async () => {
          try {
            console.log("🌱 Seeding users...");

            // =========================
            // CLEAR EXISTING DATA (OPTIONAL)
            // =========================
            await Developer.deleteMany();
            await Admin.deleteMany();
            await Principal.deleteMany();
            await HeadOfActivities.deleteMany();
            await Secretary.deleteMany();
            await Student.deleteMany();

            // =========================
            // CREATE DEVELOPER
            // =========================
            const developer = await Developer.create({
              fullname: "System Developer",
              email: "dev@school.com",
              password: "123456",
              role: "developer",
            });

            // =========================
            // CREATE ADMIN
            // =========================
        const admin = await Admin.create({
        fullname: "School Admin",
        email: "admin@school.com",
        password: "123456",
        schoolName: "Marvel Tech Hub School",
        role: "admin"
        });



            // =========================
            // CREATE PRINCIPAL
            // =========================
            const principal = await Principal.create({
              fullname: "Head Principal",
              email: "principal@school.com",
              password: "123456",
              schoolName: "Marvel Tech Hub School",
              role: "principal",
            });

            // =========================
            // CREATE HEAD OF ACTIVITIES
            // =========================
            const hoa = await HeadOfActivities.create({
              fullname: "Head of Activities",
              email: "hoa@school.com",
              password: "123456",
              schoolName: "Marvel Tech Hub School",
            });

            // =========================
            // CREATE SECRETARY
            // =========================
            const secretary = await Secretary.create({
              fullname:   "School Secretary",
              email:      "secretary@school.com",
              password:   "123456",
              schoolName: "Marvel Tech Hub School",
            });

            // =========================
            // CREATE STUDENTS
            // =========================
           const students = await Student.insertMany([
          {
            fullname: "John Doe",
            email: "john.doe@student.com",
            registrationNumber: "REG/2026/001",
            serialNumber: "SER-1001",
            class: null,
            role: "student",
          },
          {
            fullname: "Jane Smith",
            email: "jane.smith@student.com",
            registrationNumber: "REG/2026/002",
            serialNumber: "SER-1002",
            class: null,
            role: "student",
          },
          {
            fullname: "Michael Brown",
            email: "michael.brown@student.com",
            registrationNumber: "REG/2026/003",
            serialNumber: "SER-1003",
            class: null,
            role: "student",
          },
        ]);

            console.log("✅ Seeding completed!");
            console.log({
              developer: developer.email,
              admin: admin.email,
              principal: principal.email,
              hoa: hoa.email,
              secretary: secretary.email,
              students: students.length,
            });

            process.exit();
          } catch (error) {
            console.error("❌ Seeding failed:", error);
            process.exit(1);
          }
        };

        module.exports = seedUsers;
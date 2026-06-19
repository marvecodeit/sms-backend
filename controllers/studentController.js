const Student = require("../models/Student");
const ClassModel = require("../models/Class");
const Teacher = require("../models/Teacher");

const {
  generateSerialNumber,
  generateRegistrationNumber,
} = require("../utils/generateStudentCredentials");

// CREATE STUDENT
const createStudent = async (req, res) => {
  try {
    const { fullname, gender, classId, email } = req.body;

    if (!fullname || !classId || !email) {
      return res.status(400).json({ success: false, message: "fullname, email and classId are required" });
    }

    const existingClass = await ClassModel.findById(classId);
    if (!existingClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const serialNumber = generateSerialNumber();
    const registrationNumber = generateRegistrationNumber();

    const student = await Student.create({
      fullname,
      gender,
      serialNumber,
      registrationNumber,
      class: classId,
      email,
    });

    existingClass.students.push(student._id);
    await existingClass.save();

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      student: {
        _id: student._id,
        fullname: student.fullname,
        serialNumber: student.serialNumber,
        registrationNumber: student.registrationNumber,
        gender: student.gender,
        email: student.email,
        class: existingClass.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL STUDENTS
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("class", "name").sort({ createdAt: -1 });
    res.status(200).json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE STUDENT
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, gender, email } = req.body;

    const student = await Student.findByIdAndUpdate(
      id,
      { fullname, gender, email },
      { new: true }
    ).populate("class", "name");

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    res.status(200).json({ success: true, message: "Student updated successfully", student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ASSIGN STUDENT TO CLASS
const assignStudentToClass = async (req, res) => {
  try {
    const { studentId, classId } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const newClass = await ClassModel.findById(classId);
    if (!newClass) return res.status(404).json({ success: false, message: "Class not found" });

    // Remove from old class
    if (student.class) {
      await ClassModel.findByIdAndUpdate(student.class, { $pull: { students: student._id } });
    }

    student.class = classId;
    await student.save();

    if (!newClass.students.includes(student._id)) {
      newClass.students.push(student._id);
      await newClass.save();
    }

    res.status(200).json({ success: true, message: "Student assigned to class successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createStudent, getAllStudents, updateStudent, assignStudentToClass };
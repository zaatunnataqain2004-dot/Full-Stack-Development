const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Student = require("./models/Student");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Get all students or search students
app.get("/api/students", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { rollNumber: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { course: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Unable to load students." });
  }
});

// Add a student
app.post("/api/students", async (req, res) => {
  try {
    const { name, rollNumber, email, course, year } = req.body;

    if (
      ![name, rollNumber, email, course].every(
        value => typeof value === "string" && value.trim()
      ) ||
      !Number.isInteger(Number(year)) ||
      Number(year) < 1 ||
      Number(year) > 6
    ) {
      return res.status(400).json({
        message: "Enter valid student details."
      });
    }

    const student = await Student.create({
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      email: email.trim(),
      course: course.trim(),
      year: Number(year)
    });

    res.status(201).json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This roll number already exists."
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Please check the student details."
      });
    }

    res.status(500).json({ message: "Unable to add student." });
  }
});

// Update a student
app.put("/api/students/:id", async (req, res) => {
  try {
    const { name, rollNumber, email, course, year } = req.body;

    if (
      ![name, rollNumber, email, course].every(
        value => typeof value === "string" && value.trim()
      ) ||
      !Number.isInteger(Number(year)) ||
      Number(year) < 1 ||
      Number(year) > 6
    ) {
      return res.status(400).json({
        message: "Enter valid student details."
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        email: email.trim(),
        course: course.trim(),
        year: Number(year)
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json(student);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This roll number already exists."
      });
    }

    res.status(400).json({ message: "Unable to update student." });
  }
});

// Delete a student
app.delete("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json({ message: "Student deleted successfully." });
  } catch (error) {
    res.status(400).json({ message: "Unable to delete student." });
  }
});

// Connect to MongoDB before starting the server
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

const Course = require("./models/Course");
const Enrollment = require("./models/Enrollment");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function validObjectId(id) {
  return mongoose.isValidObjectId(id);
}

// List and search courses
app.get("/api/courses", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { instructor: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Could not load courses." });
  }
});

// Get one course with its lessons
app.get("/api/courses/:id", async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Could not load course." });
  }
});

// Enroll a student
app.post("/api/enrollments", async (req, res) => {
  try {
    const { studentName, studentEmail, courseId } = req.body;

    if (
      typeof studentName !== "string" ||
      !studentName.trim() ||
      studentName.trim().length > 100 ||
      typeof studentEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim()) ||
      !validObjectId(courseId)
    ) {
      return res.status(400).json({
        message: "Enter a valid name, email, and course."
      });
    }

    const courseExists = await Course.exists({ _id: courseId });

    if (!courseExists) {
      return res.status(404).json({ message: "Course not found." });
    }

    const enrollment = await Enrollment.create({
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim().toLowerCase(),
      course: courseId
    });

    res.status(201).json(enrollment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You are already enrolled in this course."
      });
    }

    res.status(500).json({ message: "Enrollment failed." });
  }
});

// List a student's enrollments
app.get("/api/enrollments", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Provide a valid student email."
      });
    }

    const enrollments = await Enrollment.find({ studentEmail: email })
      .populate("course")
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: "Could not load enrollments." });
  }
});

// Mark a lesson as completed
app.post(
  "/api/enrollments/:enrollmentId/lessons/:lessonId/complete",
  async (req, res) => {
    try {
      const { enrollmentId, lessonId } = req.params;
      const email = String(req.body.email || "").trim().toLowerCase();

      if (!validObjectId(enrollmentId) || !validObjectId(lessonId)) {
        return res.status(400).json({ message: "Invalid ID." });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Valid email required." });
      }

      const enrollment = await Enrollment.findOne({
        _id: enrollmentId,
        studentEmail: email
      }).populate("course");

      if (!enrollment || !enrollment.course) {
        return res.status(404).json({
          message: "Enrollment not found."
        });
      }

      const lessonExists = enrollment.course.lessons.some(
        lesson => lesson._id.toString() === lessonId
      );

      if (!lessonExists) {
        return res.status(404).json({
          message: "Lesson not found in this course."
        });
      }

      const alreadyCompleted = enrollment.completedLessons.some(
        id => id.toString() === lessonId
      );

      if (!alreadyCompleted) {
        enrollment.completedLessons.push(lessonId);
        await enrollment.save();
      }

      res.json({
        message: "Lesson marked as completed.",
        completedLessons: enrollment.completedLessons
      });
    } catch (error) {
      res.status(500).json({ message: "Could not update progress." });
    }
  }
);

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`LMS running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    completedLessons: [{
      type: mongoose.Schema.Types.ObjectId
    }]
  },
  { timestamps: true }
);

enrollmentSchema.index(
  { studentEmail: 1, course: 1 },
  { unique: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    default: "10 min"
  },
  content: {
    type: String,
    required: true
  }
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    instructor: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    level: {
      type: String,
      default: "Beginner"
    },
    duration: {
      type: String,
      default: "2 hours"
    },
    image: {
      type: String,
      default: "📚"
    },
    lessons: [lessonSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
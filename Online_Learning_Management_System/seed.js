const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Course = require("./models/Course");

dotenv.config();

const courses = [
  {
    title: "Python Programming for Beginners",
    instructor: "Ananya Sharma",
    category: "Programming",
    level: "Beginner",
    duration: "3 hours",
    image: "🐍",
    description: "Learn Python basics, variables, loops, functions, and simple programs.",
    lessons: [
      {
        title: "Introduction to Python",
        duration: "15 min",
        content: "Python is a beginner-friendly programming language. It is used in web development, data analysis, automation, and artificial intelligence."
      },
      {
        title: "Variables and Data Types",
        duration: "20 min",
        content: "Variables store information. Common Python data types include integers, floats, strings, and booleans."
      },
      {
        title: "Conditions and Loops",
        duration: "25 min",
        content: "Use if and else to make decisions. Use for and while loops to repeat instructions."
      }
    ]
  },
  {
    title: "Web Development Fundamentals",
    instructor: "Rahul Verma",
    category: "Web Development",
    level: "Beginner",
    duration: "4 hours",
    image: "🌐",
    description: "Understand HTML, CSS, responsive layouts, and JavaScript.",
    lessons: [
      {
        title: "Getting Started with HTML",
        duration: "20 min",
        content: "HTML provides the structure of a webpage using elements such as headings, paragraphs, images, and links."
      },
      {
        title: "Styling with CSS",
        duration: "25 min",
        content: "CSS controls the appearance of webpages, including colors, spacing, typography, and layout."
      },
      {
        title: "JavaScript Basics",
        duration: "30 min",
        content: "JavaScript adds behavior to webpages. You can use variables, functions, events, and the DOM to create interactive interfaces."
      }
    ]
  },
  {
    title: "Introduction to Data Analytics",
    instructor: "Meera Reddy",
    category: "Data Science",
    level: "Beginner",
    duration: "3 hours",
    image: "📊",
    description: "Explore data cleaning, analysis, charts, and business insights.",
    lessons: [
      {
        title: "What Is Data Analytics?",
        duration: "15 min",
        content: "Data analytics involves examining data to find patterns, answer questions, and support decisions."
      },
      {
        title: "Working with Data",
        duration: "25 min",
        content: "Data cleaning involves fixing missing values, removing duplicates, and correcting inconsistent formats."
      },
      {
        title: "Visualizing Data",
        duration: "25 min",
        content: "Charts such as bar charts and line charts help communicate comparisons and trends."
      }
    ]
  },
  {
    title: "Database Management Basics",
    instructor: "Arjun Kumar",
    category: "Database",
    level: "Beginner",
    duration: "2 hours",
    image: "🗄️",
    description: "Learn databases, tables, SQL queries, and relationships.",
    lessons: [
      {
        title: "Database Concepts",
        duration: "15 min",
        content: "A database stores organized information so that it can be retrieved and updated efficiently."
      },
      {
        title: "Introduction to SQL",
        duration: "25 min",
        content: "SQL is used to query and manage relational databases. SELECT retrieves data, INSERT adds data, UPDATE modifies it, and DELETE removes it."
      },
      {
        title: "Tables and Relationships",
        duration: "20 min",
        content: "Tables contain rows and columns. Keys and relationships connect records across tables."
      }
    ]
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Re-running this script replaces the sample course catalog.
    await Course.deleteMany({});
    await Course.insertMany(courses);

    console.log("Sample courses added successfully.");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

dotenv.config();
seedDatabase();
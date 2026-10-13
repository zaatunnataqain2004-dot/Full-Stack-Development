# LearnHub — Online Learning Management System

## Project Overview

LearnHub is a web-based learning platform where students can explore courses, enroll, view lessons, and track their learning progress.

## Features

* Course catalog and category filters
* Search courses and instructors
* Student profile
* Course enrollment
* Lesson viewer
* Lesson completion tracking
* Progress bars and dashboard statistics
* Responsive user interface

## Technologies Used

* HTML
* CSS
* JavaScript
* Node.js
* Express.js
* MongoDB
* Mongoose

## Setup Instructions

1. Install Node.js and create a MongoDB Atlas database.
2. Configure the `MONGO_URI` variable in `.env`.
3. Install dependencies using `npm install`.
4. Add sample courses using `npm run seed`.
5. Start the server using `npm run dev`.
6. Open `http://localhost:5000` in your browser.

## API Endpoints

* `GET /api/courses` — List and search courses
* `GET /api/courses/:id` — Get a course and its lessons
* `POST /api/enrollments` — Enroll in a course
* `GET /api/enrollments?email=...` — List enrollments
* `POST /api/enrollments/:enrollmentId/lessons/:lessonId/complete` — Mark a lesson completed

## Future Improvements

* Student and instructor authentication
* Admin dashboard for course management
* Video lessons and downloadable materials
* Quizzes and certificates
* Secure role-based access

## Project Purpose

This project is intended for educational and portfolio use.

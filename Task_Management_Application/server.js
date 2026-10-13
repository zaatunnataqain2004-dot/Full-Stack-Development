
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Task = require("./models/Task");

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(process.env.PORT || 5000, () => {
            console.log(
                `Server running at http://localhost:${process.env.PORT || 5000}`
            );
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });

// API: Get all tasks
app.get("/api/tasks", async (req, res) => {
    try {
        const filter = {};

        if (req.query.status === "completed") {
            filter.completed = true;
        } else if (req.query.status === "pending") {
            filter.completed = false;
        }

        const tasks = await Task.find(filter).sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Unable to fetch tasks." });
    }
});

// API: Create a task
app.post("/api/tasks", async (req, res) => {
    try {
        const { title, description, priority, dueDate } = req.body;

        if (typeof title !== "string" || title.trim().length < 2) {
            return res.status(400).json({
                message: "Title must contain at least 2 characters."
            });
        }

        if (title.trim().length > 120) {
            return res.status(400).json({
                message: "Title cannot exceed 120 characters."
            });
        }

        if (
            description !== undefined &&
            (typeof description !== "string" ||
                description.length > 500)
        ) {
            return res.status(400).json({
                message: "Description must be at most 500 characters."
            });
        }

        if (
            priority !== undefined &&
            !["Low", "Medium", "High"].includes(priority)
        ) {
            return res.status(400).json({
                message: "Invalid task priority."
            });
        }

        let parsedDueDate = null;

        if (dueDate) {
            parsedDueDate = new Date(dueDate);

            if (Number.isNaN(parsedDueDate.getTime())) {
                return res.status(400).json({
                    message: "Invalid due date."
                });
            }
        }

        const task = await Task.create({
            title: title.trim(),
            description: description || "",
            priority: priority || "Medium",
            dueDate: parsedDueDate
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: "Unable to create task." });
    }
});

// API: Update a task
app.put("/api/tasks/:id", async (req, res) => {
    try {
        const allowedFields = [
            "title",
            "description",
            "priority",
            "dueDate",
            "completed"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (Object.hasOwn(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "Provide at least one field to update."
            });
        }

        if (Object.hasOwn(updates, "title")) {
            if (
                typeof updates.title !== "string" ||
                updates.title.trim().length < 2 ||
                updates.title.trim().length > 120
            ) {
                return res.status(400).json({
                    message: "Title must contain 2–120 characters."
                });
            }

            updates.title = updates.title.trim();
        }

        if (Object.hasOwn(updates, "description")) {
            if (
                typeof updates.description !== "string" ||
                updates.description.length > 500
            ) {
                return res.status(400).json({
                    message: "Invalid description."
                });
            }
        }

        if (
            Object.hasOwn(updates, "priority") &&
            !["Low", "Medium", "High"].includes(updates.priority)
        ) {
            return res.status(400).json({
                message: "Invalid priority."
            });
        }

        if (
            Object.hasOwn(updates, "completed") &&
            typeof updates.completed !== "boolean"
        ) {
            return res.status(400).json({
                message: "Completed must be true or false."
            });
        }

        if (Object.hasOwn(updates, "dueDate")) {
            if (updates.dueDate === null || updates.dueDate === "") {
                updates.dueDate = null;
            } else {
                const parsedDate = new Date(updates.dueDate);

                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).json({
                        message: "Invalid due date."
                    });
                }

                updates.dueDate = parsedDate;
            }
        }

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found."
            });
        }

        res.json(task);
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid task ID." });
        }

        res.status(500).json({ message: "Unable to update task." });
    }
});

// API: Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found."
            });
        }

        res.json({ message: "Task deleted successfully." });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid task ID." });
        }

        res.status(500).json({ message: "Unable to delete task." });
    }
});
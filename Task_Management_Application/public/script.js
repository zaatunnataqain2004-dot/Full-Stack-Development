
const taskForm = document.getElementById("task-form");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");

const taskList = document.getElementById("task-list");
const filterInput = document.getElementById("filter");
const formMessage = document.getElementById("form-message");
const loading = document.getElementById("loading");
const emptyMessage = document.getElementById("empty-message");

const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit");

let tasks = [];
let editingId = null;

// Show messages safely as text
function showMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.style.color = isError ? "#fca5a5" : "#86efac";
}

// Communicate with the Express backend
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

// Load tasks from MongoDB through the API
async function loadTasks() {
    loading.classList.remove("hidden");
    emptyMessage.classList.add("hidden");

    try {
        const status = filterInput.value;
        const query = status === "all" ? "" : `?status=${status}`;

        tasks = await apiRequest(`/api/tasks${query}`);
        renderTasks();
    } catch (error) {
        showMessage(error.message, true);
        taskList.replaceChildren();
    } finally {
        loading.classList.add("hidden");
    }
}

// Create HTML elements without injecting user text as HTML
function makeElement(tag, className, text = "") {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

function makeButton(text, className, onClick) {
    const button = makeElement("button", `action-btn ${className}`, text);
    button.type = "button";
    button.addEventListener("click", onClick);
    return button;
}

// Display tasks on the page
function renderTasks() {
    taskList.replaceChildren();

    const allCount = tasks.length;
    document.getElementById("total-count").textContent = allCount;
    document.getElementById("pending-count").textContent =
        tasks.filter(task => !task.completed).length;
    document.getElementById("completed-count").textContent =
        tasks.filter(task => task.completed).length;

    // These counts describe the currently selected filter.
    emptyMessage.classList.toggle("hidden", allCount !== 0);

    tasks.forEach(task => {
        const card = makeElement(
            "article",
            `task-card${task.completed ? " completed" : ""}`
        );

        const content = makeElement("div", "task-content");
        const title = makeElement("h3", "task-title", task.title);
        content.append(title);

        if (task.description) {
            content.append(
                makeElement("p", "task-description", task.description)
            );
        }

        const meta = makeElement("div", "task-meta");

        meta.append(
            makeElement(
                "span",
                `badge priority-${task.priority.toLowerCase()}`,
                `${task.priority} Priority`
            )
        );

        meta.append(
            makeElement(
                "span",
                "badge",
                task.completed ? "Completed" : "Pending"
            )
        );

        if (task.dueDate) {
            const date = new Date(task.dueDate).toLocaleDateString();
            meta.append(makeElement("span", "badge", `Due: ${date}`));
        }

        content.append(meta);

        const actions = makeElement("div", "task-actions");

        actions.append(
            makeButton(
                task.completed ? "Undo" : "Complete",
                "complete-btn",
                () => updateTask(task._id, {
                    completed: !task.completed
                })
            )
        );

        actions.append(
            makeButton("Edit", "edit-btn", () => startEdit(task))
        );

        actions.append(
            makeButton("Delete", "delete-btn", () => deleteTask(task._id))
        );

        card.append(content, actions);
        taskList.append(card);
    });
}

// Add a new task or save an edited task
taskForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();

    if (title.length < 2) {
        showMessage("Task title must contain at least 2 characters.", true);
        return;
    }

    if (description.length > 500) {
        showMessage("Description cannot exceed 500 characters.", true);
        return;
    }

    const taskData = {
        title,
        description,
        priority: priorityInput.value,
        dueDate: dueDateInput.value || null
    };

    const url = editingId
        ? `/api/tasks/${editingId}`
        : "/api/tasks";

    const method = editingId ? "PUT" : "POST";

    submitBtn.disabled = true;

    try {
        await apiRequest(url, {
            method,
            body: JSON.stringify(taskData)
        });

        showMessage(editingId ? "Task updated!" : "Task added!");
        resetForm();
        await loadTasks();
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        submitBtn.disabled = false;
    }
});

// Fill the form with a task's existing details
function startEdit(task) {
    editingId = task._id;
    titleInput.value = task.title;
    descriptionInput.value = task.description || "";
    priorityInput.value = task.priority;

    dueDateInput.value = task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : "";

    submitBtn.textContent = "Save Changes";
    cancelEditBtn.classList.remove("hidden");
    showMessage("Editing task...");
    titleInput.focus();

    document.getElementById("task-form").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function resetForm() {
    taskForm.reset();
    editingId = null;
    submitBtn.textContent = "+ Add Task";
    cancelEditBtn.classList.add("hidden");
}

cancelEditBtn.addEventListener("click", () => {
    resetForm();
    showMessage("");
});

// Update completion status
async function updateTask(id, updates) {
    try {
        await apiRequest(`/api/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify(updates)
        });

        await loadTasks();
    } catch (error) {
        showMessage(error.message, true);
    }
}

// Delete a task
async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        await apiRequest(`/api/tasks/${id}`, {
            method: "DELETE"
        });

        if (editingId === id) {
            resetForm();
        }

        showMessage("Task deleted.");
        await loadTasks();
    } catch (error) {
        showMessage(error.message, true);
    }
}

// Change task filter
filterInput.addEventListener("change", loadTasks);

// Start the application
loadTasks();
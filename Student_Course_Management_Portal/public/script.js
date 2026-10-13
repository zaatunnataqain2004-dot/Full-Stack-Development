const form = document.getElementById("studentForm");
const table = document.getElementById("studentTable");
const message = document.getElementById("message");
const searchInput = document.getElementById("search");

const totalStudents = document.getElementById("totalStudents");
const totalCourses = document.getElementById("totalCourses");

const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const formHeading = document.getElementById("formHeading");

let students = [];
let editingId = null;
let searchTimer;

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

function showMessage(text) {
  message.textContent = text;
}

function makeCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value ?? "";
  return cell;
}

function renderStudents() {
  table.replaceChildren();

  totalStudents.textContent = students.length;
  totalCourses.textContent = new Set(
    students.map(student => student.course.toLowerCase())
  ).size;

  if (students.length === 0) {
    const row = document.createElement("tr");
    const cell = makeCell("No students found.");
    cell.colSpan = 6;
    row.appendChild(cell);
    table.appendChild(row);
    return;
  }

  students.forEach(student => {
    const row = document.createElement("tr");

    row.append(
      makeCell(student.name),
      makeCell(student.rollNumber),
      makeCell(student.email),
      makeCell(student.course),
      makeCell(`Year ${student.year}`)
    );

    const actionCell = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "edit-button";
    editButton.addEventListener("click", () => editStudent(student));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => deleteStudent(student));

    actionCell.append(editButton, deleteButton);
    row.appendChild(actionCell);
    table.appendChild(row);
  });
}

async function loadStudents() {
  try {
    const search = searchInput.value.trim();
    students = await api(
      `/api/students?search=${encodeURIComponent(search)}`
    );
    renderStudents();
  } catch (error) {
    showMessage(error.message);
  }
}

function resetForm() {
  form.reset();
  editingId = null;
  saveButton.textContent = "Add Student";
  cancelButton.hidden = true;
  formHeading.textContent = "Add New Student";
}

function editStudent(student) {
  editingId = student._id;

  document.getElementById("name").value = student.name;
  document.getElementById("rollNumber").value = student.rollNumber;
  document.getElementById("email").value = student.email;
  document.getElementById("course").value = student.course;
  document.getElementById("year").value = student.year;

  saveButton.textContent = "Update Student";
  cancelButton.hidden = false;
  formHeading.textContent = "Edit Student";

  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const studentData = {
    name: document.getElementById("name").value.trim(),
    rollNumber: document.getElementById("rollNumber").value.trim(),
    email: document.getElementById("email").value.trim(),
    course: document.getElementById("course").value.trim(),
    year: Number(document.getElementById("year").value)
  };

  try {
    const isEditing = Boolean(editingId);
    const url = isEditing
      ? `/api/students/${editingId}`
      : "/api/students";

    await api(url, {
      method: isEditing ? "PUT" : "POST",
      body: JSON.stringify(studentData)
    });

    showMessage(
      isEditing
        ? "Student updated successfully."
        : "Student added successfully."
    );

    resetForm();
    await loadStudents();
  } catch (error) {
    showMessage(error.message);
  }
});

async function deleteStudent(student) {
  const confirmed = window.confirm(
    `Delete the record for ${student.name}?`
  );

  if (!confirmed) return;

  try {
    await api(`/api/students/${student._id}`, {
      method: "DELETE"
    });

    showMessage("Student deleted successfully.");
    await loadStudents();
  } catch (error) {
    showMessage(error.message);
  }
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadStudents, 250);
});

cancelButton.addEventListener("click", resetForm);

loadStudents();
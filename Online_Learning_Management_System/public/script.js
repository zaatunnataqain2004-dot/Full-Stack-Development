const $ = id => document.getElementById(id);

let courses = [];
let enrollments = [];
let selectedCategory = "All";
let activeEnrollment = null;
let searchTimer;

// Restore the learner profile saved in this browser.
const savedProfile = JSON.parse(
  localStorage.getItem("learnhubProfile") || "{}"
);

$("studentName").value = savedProfile.name || "";
$("studentEmail").value = savedProfile.email || "";

function getProfile() {
  return {
    name: $("studentName").value.trim(),
    email: $("studentEmail").value.trim().toLowerCase()
  };
}

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

function showMessage(id, text) {
  $(id).textContent = text;
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function makeButton(text, onClick, className = "") {
  const button = makeElement("button", className, text);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

// Save the learner profile in the browser.
$("profileForm").addEventListener("submit", event => {
  event.preventDefault();

  const profile = getProfile();

  if (!profile.name || !profile.email) {
    showMessage("profileMessage", "Enter your name and email.");
    return;
  }

  localStorage.setItem("learnhubProfile", JSON.stringify(profile));

  showMessage(
    "profileMessage",
    "Profile saved. You can now enroll in courses."
  );

  loadEnrollments();
});

// Load the course catalog.
async function loadCourses() {
  try {
    const search = $("searchInput").value.trim();

    courses = await api(
      `/api/courses?search=${encodeURIComponent(search)}`
    );

    renderCategories();
    renderCourses();
  } catch (error) {
    showMessage("courseMessage", error.message);
  }
}

// Create category filter buttons.
function renderCategories() {
  const container = $("categoryFilters");
  container.replaceChildren();

  const categories = [
    "All",
    ...new Set(courses.map(course => course.category))
  ];

  categories.forEach(category => {
    const button = makeButton(
      category,
      () => {
        selectedCategory = category;
        renderCategories();
        renderCourses();
      },
      `filter-button ${selectedCategory === category ? "active" : ""}`
    );

    container.appendChild(button);
  });
}

// Render course cards safely using DOM elements.
function renderCourses() {
  const container = $("courseGrid");
  container.replaceChildren();

  const visibleCourses = courses.filter(course =>
    selectedCategory === "All" ||
    course.category === selectedCategory
  );

  $("courseCount").textContent = courses.length;

  if (visibleCourses.length === 0) {
    container.appendChild(
      makeElement("p", "message", "No courses found.")
    );
    return;
  }

  visibleCourses.forEach(course => {
    const card = makeElement("article", "course-card");
    const banner = makeElement(
      "div",
      "course-banner",
      course.image || "📚"
    );

    const content = makeElement("div", "course-content");
    const meta = makeElement("div", "course-meta");

    meta.append(
      makeElement("span", "pill", course.category),
      makeElement("span", "pill", course.level || "Beginner")
    );

    content.append(
      meta,
      makeElement("h3", "", course.title),
      makeElement("p", "", course.description),
      makeElement("p", "", `Instructor: ${course.instructor}`),
      makeElement(
        "p",
        "",
        `${(course.lessons || []).length} lessons · ${course.duration}`
      )
    );

    const isEnrolled = enrollments.some(
      enrollment => enrollment.course?._id === course._id
    );

    const action = makeButton(
      isEnrolled ? "Continue Learning" : "Enroll Now",
      () => isEnrolled
        ? openLessons(
            enrollments.find(
              enrollment => enrollment.course?._id === course._id
            )
          )
        : enrollInCourse(course),
    );

    content.appendChild(action);
    card.append(banner, content);
    container.appendChild(card);
  });
}

// Enroll the current learner in a course.
async function enrollInCourse(course) {
  const profile = getProfile();

  if (!profile.name || !profile.email) {
    showMessage(
      "profileMessage",
      "Please enter and save your name and email first."
    );

    $("profileForm").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    return;
  }

  try {
    await api("/api/enrollments", {
      method: "POST",
      body: JSON.stringify({
        studentName: profile.name,
        studentEmail: profile.email,
        courseId: course._id
      })
    });

    showMessage(
      "enrollmentMessage",
      `Successfully enrolled in ${course.title}!`
    );

    await loadEnrollments();
  } catch (error) {
    showMessage("enrollmentMessage", error.message);
  }
}

// Retrieve the learner's enrolled courses.
async function loadEnrollments() {
  const profile = getProfile();

  if (!profile.email) {
    enrollments = [];
    renderEnrollments();
    renderCourses();
    return;
  }

  try {
    enrollments = await api(
      `/api/enrollments?email=${encodeURIComponent(profile.email)}`
    );

    renderEnrollments();
    renderCourses();
  } catch (error) {
    showMessage("enrollmentMessage", error.message);
  }
}

// Display enrollment cards and completion percentages.
function renderEnrollments() {
  const container = $("enrollmentGrid");
  container.replaceChildren();

  let completedTotal = 0;

  enrollments.forEach(enrollment => {
    completedTotal += (enrollment.completedLessons || []).length;
  });

  $("enrollmentCount").textContent = enrollments.length;
  $("completedCount").textContent = completedTotal;

  if (enrollments.length === 0) {
    container.appendChild(
      makeElement(
        "p",
        "message",
        "You have no enrollments yet. Choose a course above to get started."
      )
    );
    return;
  }

  enrollments.forEach(enrollment => {
    const course = enrollment.course;

    if (!course) return;

    const lessons = course.lessons || [];
    const completed = enrollment.completedLessons || [];

    const percentage = lessons.length
      ? Math.round((completed.length / lessons.length) * 100)
      : 0;

    const card = makeElement("article", "course-card");
    const banner = makeElement(
      "div",
      "course-banner",
      course.image || "📚"
    );

    const content = makeElement("div", "course-content");

    content.append(
      makeElement("h3", "", course.title),
      makeElement(
        "p",
        "",
        `${completed.length} of ${lessons.length} lessons completed`
      )
    );

    const track = makeElement("div", "progress-track");
    const fill = makeElement("div", "progress-fill");

    fill.style.width = `${percentage}%`;
    track.appendChild(fill);

    content.append(
      track,
      makeElement("p", "progress-label", `${percentage}% complete`),
      makeButton(
        "Open Lessons",
        () => openLessons(enrollment)
      )
    );

    card.append(banner, content);
    container.appendChild(card);
  });
}

// Open lessons for an enrolled course.
function openLessons(enrollment) {
  if (!enrollment?.course) return;

  activeEnrollment = enrollment;

  $("lessonCourseTitle").textContent = enrollment.course.title;
  $("lessonSection").hidden = false;

  renderLessons();

  $("lessonSection").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function renderLessons() {
  const container = $("lessonList");
  container.replaceChildren();

  if (!activeEnrollment?.course) return;

  const lessons = activeEnrollment.course.lessons || [];
  const completed = activeEnrollment.completedLessons || [];

  if (lessons.length === 0) {
    container.appendChild(
      makeElement("p", "message", "No lessons have been added yet.")
    );
    return;
  }

  lessons.forEach((lesson, index) => {
    const isCompleted = completed.some(
      id => String(id) === String(lesson._id)
    );

    const item = makeElement("article", "lesson-item");
    const details = makeElement("div");

    details.append(
      makeElement("h3", "", `${index + 1}. ${lesson.title}`),
      makeElement("p", "", lesson.duration || "10 min"),
      makeElement("p", "", lesson.content)
    );

    const button = makeButton(
      isCompleted ? "✓ Completed" : "Mark Complete",
      () => markLessonComplete(lesson._id),
      isCompleted ? "button-secondary" : ""
    );

    button.disabled = isCompleted;

    item.append(details, button);
    container.appendChild(item);
  });
}

// Record lesson completion in MongoDB.
async function markLessonComplete(lessonId) {
  if (!activeEnrollment) return;

  const profile = getProfile();

  try {
    await api(
      `/api/enrollments/${activeEnrollment._id}/lessons/${lessonId}/complete`,
      {
        method: "POST",
        body: JSON.stringify({ email: profile.email })
      }
    );

    await loadEnrollments();

    // Refresh the active enrollment with the latest progress.
    activeEnrollment = enrollments.find(
      enrollment => enrollment._id === activeEnrollment._id
    );

    if (activeEnrollment) {
      renderLessons();
    }

    showMessage("enrollmentMessage", "Lesson progress saved.");
  } catch (error) {
    showMessage("enrollmentMessage", error.message);
  }
}

$("closeLessons").addEventListener("click", () => {
  $("lessonSection").hidden = true;
  activeEnrollment = null;
});

$("searchInput").addEventListener("input", () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    loadCourses();
  }, 250);
});

// Start the application.
async function init() {
  await loadCourses();

  if (savedProfile.email) {
    await loadEnrollments();
  } else {
    renderEnrollments();
  }
}

init();
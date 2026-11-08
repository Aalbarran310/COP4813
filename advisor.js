let data;
const completed = new Set();
const planned = new Set();
const byCode = new Map();

async function load() {
  try {
    const response = await fetch("advisor-data.json");
    if (!response.ok) throw new Error("JSON file not found");
    data = await response.json();
    data.courses.forEach(course => byCode.set(course.code, course));
    setupDropZone();
    renderAll();
  } catch (error) {
    document.getElementById("progress-summary").textContent =
      "Course data could not load. Confirm advisor-data.json is in the same GitHub repository folder as assignment11.html.";
  }
}

function choiceBlocked(course) {
  return !!course.choiceGroup && data.courses.some(other =>
    other.choiceGroup === course.choiceGroup && other.code !== course.code &&
    (completed.has(other.code) || planned.has(other.code)));
}

function prerequisitesMet(course) {
  const rules = course.prerequisites || {};
  const allMet = (rules.allOf || []).every(code => completed.has(code));
  const anyCodes = rules.anyOf || [];
  const anyMet = anyCodes.length === 0 || anyCodes.some(code => completed.has(code));
  return allMet && anyMet;
}

function plannedElectiveCount() {
  return [...planned].filter(code => byCode.get(code)?.category === "Program elective").length;
}

function planLimitReached(course) {
  return course.category === "Program elective" && plannedElectiveCount() >= 3;
}

function canPlan(course) {
  return !completed.has(course.code) && !planned.has(course.code) &&
    !choiceBlocked(course) && prerequisitesMet(course) && !planLimitReached(course);
}

function courseStatus(course) {
  if (completed.has(course.code)) return "Completed";
  if (planned.has(course.code)) return "In your plan";
  if (choiceBlocked(course)) return "Alternative already selected";
  if (!prerequisitesMet(course)) return "Prerequisite needed";
  if (planLimitReached(course)) return "Three-elective limit reached";
  return "Available to plan";
}

function addCourseToPlan(code) {
  const course = byCode.get(code);
  if (!course || !canPlan(course)) return;
  planned.add(code);
  renderAll();
}

function createCourseCard(course, mode) {
  const article = document.createElement("article");
  article.className = "course-card";

  const heading = document.createElement("h3");
  heading.textContent = `${course.code} - ${course.title}`;
  article.append(heading);

  const meta = document.createElement("p");
  meta.className = "course-meta";
  meta.textContent = `${course.credits} credits · ${course.category} · ${courseStatus(course)}`;
  article.append(meta);

  const note = document.createElement("p");
  note.textContent = course.notes || "No additional notes.";
  article.append(note);

  const rules = course.prerequisites || {};
  if (rules.allOf?.length) {
    const line = document.createElement("p");
    line.className = "small-note";
    line.textContent = `Prerequisite (AND): ${rules.allOf.join(" AND ")}`;
    article.append(line);
  }
  if (rules.anyOf?.length) {
    const line = document.createElement("p");
    line.className = "small-note";
    line.textContent = `Prerequisite (OR): ${rules.anyOf.join(" OR ")}`;
    article.append(line);
  }

  const actions = document.createElement("div");
  actions.className = "course-actions";

  if (mode === "completed") {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = completed.has(course.code);
    checkbox.disabled = !!course.choiceGroup && data.courses.some(other =>
      other.choiceGroup === course.choiceGroup && other.code !== course.code &&
      (completed.has(other.code) || planned.has(other.code)));
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        completed.add(course.code);
        planned.delete(course.code);
        if (course.choiceGroup) {
          data.courses.filter(other => other.choiceGroup === course.choiceGroup &&
            other.code !== course.code).forEach(other => planned.delete(other.code));
        }
      } else {
        completed.delete(course.code);
      }
      renderAll();
    });
    label.append(checkbox, document.createTextNode(" Mark completed"));
    actions.append(label);
  } else {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "advisor-btn";
    button.textContent = "Add to plan";
    button.disabled = !canPlan(course);
    button.addEventListener("click", () => addCourseToPlan(course.code));
    actions.append(button);

    if (canPlan(course)) {
      article.draggable = true;
      article.addEventListener("dragstart", event => {
        event.dataTransfer.setData("text/plain", course.code);
        event.dataTransfer.effectAllowed = "copy";
      });
    }
  }

  article.append(actions);
  return article;
}

function renderCompleted() {
  const container = document.getElementById("completed-list");
  container.replaceChildren();
  data.courses.forEach(course => container.append(createCourseCard(course, "completed")));
  const credits = data.courses.filter(course => completed.has(course.code))
    .reduce((sum, course) => sum + course.credits, 0);
  document.getElementById("progress-summary").textContent =
    `${completed.size} course(s) completed · ${credits} completed credit hours`;
}

function renderAvailable() {
  const container = document.getElementById("available-list");
  container.replaceChildren();
  const filter = document.getElementById("category-filter").value;
  let count = 0;

  data.courses.forEach(course => {
    if (filter !== "All" && course.category !== filter) return;
    if (completed.has(course.code) || planned.has(course.code)) return;
    container.append(createCourseCard(course, "available"));
    count++;
  });

  if (!count) {
    const message = document.createElement("p");
    message.textContent = "No courses match this filter right now.";
    container.append(message);
  }
}

function renderPlan() {
  const container = document.getElementById("plan-list");
  container.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = `${document.getElementById("term-select").value} - Selected courses`;
  container.append(heading);

  let credits = 0;
  planned.forEach(code => {
    const course = byCode.get(code);
    if (!course) return;
    credits += course.credits;

    const row = document.createElement("div");
    row.className = "plan-item";
    const name = document.createElement("span");
    name.textContent = `${course.code} - ${course.title} (${course.credits} credits)`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "advisor-btn secondary";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      planned.delete(code);
      renderAll();
    });

    row.append(name, remove);
    container.append(row);
  });

  if (planned.size === 0) {
    const message = document.createElement("p");
    message.className = "small-note";
    message.textContent = "No courses added yet. Drag an eligible course here or use Add to Plan.";
    container.append(message);
  }

  document.getElementById("plan-total").textContent =
    `Planned credits: ${credits} · ${planned.size} course(s) · Program electives selected: ${plannedElectiveCount()} of 3`;
}

function renderOrDemo() {
  const container = document.getElementById("or-demo");
  if (!container) return;
  container.replaceChildren();

  const demo = data.demonstrations.orPrerequisite;
  const met = demo.prerequisites.anyOf.some(code => completed.has(code));

  const status = document.createElement("p");
  status.className = "small-note";
  status.textContent = met
    ? `Eligible: you completed ${demo.prerequisites.anyOf.filter(code => completed.has(code)).join(" or ")}.`
    : `Not eligible yet: complete ${demo.prerequisites.anyOf.join(" OR ")}.`;
  container.append(status);

  const detail = document.createElement("p");
  detail.textContent = `${demo.title} — ${demo.notes}`;
  container.append(detail);
}

function setupDropZone() {
  const dropZone = document.getElementById("plan-list");
  dropZone.addEventListener("dragover", event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", event => {
    if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove("drag-over");
  });
  dropZone.addEventListener("drop", event => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
    const code = event.dataTransfer.getData("text/plain");
    addCourseToPlan(code);
  });
}

function renderAll() {
  renderCompleted();
  renderAvailable();
  renderPlan();
  renderOrDemo();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("category-filter").addEventListener("change", renderAvailable);
  document.getElementById("term-select").addEventListener("change", renderPlan);
  load();
});

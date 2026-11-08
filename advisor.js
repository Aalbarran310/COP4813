let data;
const completed = new Set();
const planned = new Map(); // course code -> term id
const byCode = new Map();
let terms = [
  {id:"term-1", name:"Fall 2026"},
  {id:"term-2", name:"Spring 2027"},
  {id:"term-3", name:"Summer 2027"}
];
let activeTermId = "term-1";

async function load() {
  try {
    const response = await fetch("advisor-data.json");
    if (!response.ok) throw new Error("JSON file not found");
    data = await response.json();
    data.courses.forEach(course => byCode.set(course.code, course));
    renderAll();
  } catch (error) {
    document.getElementById("progress-summary").textContent =
      "Course data could not load. Keep advisor-data.json in the same repository folder as assignment11.html.";
  }
}
function isChoiceBlocked(course) {
  return !!course.choiceGroup && data.courses.some(other =>
    other.choiceGroup === course.choiceGroup && other.code !== course.code &&
    (completed.has(other.code) || planned.has(other.code)));
}
function prerequisitesMet(course) {
  const rules = course.prerequisites || {};
  const allMet = (rules.allOf || []).every(code => completed.has(code));
  const any = rules.anyOf || [];
  return allMet && (!any.length || any.some(code => completed.has(code)));
}
function electiveCount() {
  return [...planned.keys()].filter(code => byCode.get(code)?.category === "Program elective").length;
}
function canPlan(course) {
  return !completed.has(course.code) && !planned.has(course.code) &&
    !isChoiceBlocked(course) && prerequisitesMet(course) &&
    !(course.category === "Program elective" && electiveCount() >= 3);
}
function status(course) {
  if (completed.has(course.code)) return "Completed";
  if (planned.has(course.code)) return "Already planned";
  if (isChoiceBlocked(course)) return "Alternative selected";
  if (!prerequisitesMet(course)) return "Prerequisite needed";
  if (course.category === "Program elective" && electiveCount() >= 3) return "Elective limit reached";
  return "Available";
}
function notify(message) { document.getElementById("planner-message").textContent = message; }
function addCourse(code, termId) {
  const course = byCode.get(code);
  if (!course || !canPlan(course)) return;
  planned.set(code, termId || activeTermId);
  renderAll();
  notify(`${code} added to ${terms.find(t => t.id === (termId || activeTermId))?.name || "your plan"}.`);
}
function makeCourseTile(course, inTerm=false) {
  const tile = document.createElement("article");
  tile.className = inTerm ? "planner-course" : "available-course";
  if (!inTerm && canPlan(course)) {
    tile.draggable = true;
    tile.addEventListener("dragstart", event => {
      event.dataTransfer.setData("text/plain", course.code);
      event.dataTransfer.effectAllowed = "copy";
    });
  }
  const title = document.createElement("strong");
  title.textContent = `${course.code} — ${course.title}`;
  const meta = document.createElement("small");
  meta.textContent = `${course.credits} credits · ${status(course)}`;
  tile.append(title, meta);
  if (inTerm) {
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "btn";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      planned.delete(course.code); renderAll(); notify(`${course.code} removed from the plan.`);
    });
    tile.append(remove);
  } else {
    const note = document.createElement("small");
    note.textContent = course.notes || "";
    tile.append(note);
    const add = document.createElement("button");
    add.type = "button"; add.className = "btn primary";
    add.textContent = "Add to term";
    add.disabled = !canPlan(course);
    add.addEventListener("click", () => addCourse(course.code, activeTermId));
    tile.append(add);
  }
  return tile;
}
function renderTerms() {
  const root = document.getElementById("terms-container");
  root.replaceChildren();
  terms.forEach(term => {
    const section = document.createElement("section");
    section.className = "term-block";
    const head = document.createElement("div"); head.className = "term-heading";
    const title = document.createElement("h2"); title.textContent = term.name;
    const meta = document.createElement("div"); meta.className = "term-meta";
    const count = [...planned.entries()].filter(([,tid]) => tid === term.id).length;
    const credits = [...planned.entries()].filter(([,tid]) => tid === term.id)
      .reduce((sum,[code]) => sum + (byCode.get(code)?.credits || 0),0);
    const active = document.createElement("button");
    active.type = "button"; active.className = "btn " + (activeTermId === term.id ? "green" : "");
    active.textContent = activeTermId === term.id ? "Selected term" : "Select term";
    active.addEventListener("click", () => { activeTermId = term.id; renderTerms(); notify(`${term.name} selected. New courses will be added here.`); });
    const stats = document.createElement("span"); stats.textContent = `${count} course(s) · ${credits} credits`;
    meta.append(active, stats); head.append(title,meta); section.append(head);
    const grid = document.createElement("div"); grid.className = "term-courses"; grid.dataset.termId = term.id;
    grid.addEventListener("dragover", event => { event.preventDefault(); grid.classList.add("drag-over"); });
    grid.addEventListener("dragleave", event => { if (!grid.contains(event.relatedTarget)) grid.classList.remove("drag-over"); });
    grid.addEventListener("drop", event => {
      event.preventDefault(); grid.classList.remove("drag-over");
      const code = event.dataTransfer.getData("text/plain");
      addCourse(code, term.id);
    });
    const items = [...planned.keys()].filter(code => planned.get(code) === term.id);
    if (!items.length) {
      const empty = document.createElement("div"); empty.className = "empty-term";
      empty.textContent = "Drop an eligible course here or select this term and use Add to term.";
      grid.append(empty);
    } else items.forEach(code => { const c=byCode.get(code); if(c) grid.append(makeCourseTile(c,true)); });
    section.append(grid); root.append(section);
  });
}
function renderAvailable() {
  const root = document.getElementById("available-list"); root.replaceChildren();
  const filter = document.getElementById("category-filter").value;
  const courses = data.courses.filter(c => (filter === "All" || c.category === filter) &&
    !completed.has(c.code) && !planned.has(c.code));
  if (!courses.length) { const p=document.createElement("p"); p.textContent="No courses available in this category."; root.append(p); }
  courses.forEach(c => root.append(makeCourseTile(c,false)));
}
function renderCompleted() {
  const root=document.getElementById("completed-list"); root.replaceChildren();
  data.courses.forEach(course => {
    const row=document.createElement("div"); row.className="completed-row";
    const label=document.createElement("label");
    const box=document.createElement("input"); box.type="checkbox"; box.checked=completed.has(course.code);
    box.disabled=!!course.choiceGroup && data.courses.some(other =>
      other.choiceGroup===course.choiceGroup && other.code!==course.code &&
      (completed.has(other.code)||planned.has(other.code)));
    const text=document.createElement("span"); text.textContent=`${course.code} — ${course.title}`;
    box.addEventListener("change",()=>{
      if(box.checked) {
        completed.add(course.code); planned.delete(course.code);
        if(course.choiceGroup) data.courses.filter(x=>x.choiceGroup===course.choiceGroup&&x.code!==course.code)
          .forEach(x=>planned.delete(x.code));
      } else completed.delete(course.code);
      renderAll();
    });
    label.append(box,text); row.append(label); root.append(row);
  });
}
function renderProgress() {
  const completedCredits=data.courses.filter(c=>completed.has(c.code)).reduce((s,c)=>s+c.credits,0);
  const plannedCredits=[...planned.keys()].reduce((s,code)=>s+(byCode.get(code)?.credits||0),0);
  const total=completedCredits+plannedCredits;
  document.getElementById("completed-credits").textContent=completedCredits;
  document.getElementById("planned-credits").textContent=plannedCredits;
  document.getElementById("elective-progress").textContent=`${electiveCount()} / 3`;
  document.getElementById("progress-fill").style.width=Math.min(100,total/60*100)+"%";
  document.getElementById("progress-summary").textContent=
    `${completed.size} completed course(s), ${planned.size} planned course(s). Progress bar shows completed plus planned credits toward a 60-credit reference point; check the catalog for the official program total.`;
}
function renderOrDemo() {
  const root=document.getElementById("or-demo"); root.replaceChildren();
  const demo=data.demonstrations?.orPrerequisite;
  if(!demo)return;
  const heading=document.createElement("strong"); heading.textContent=demo.title;
  const p=document.createElement("p");
  const matched=demo.prerequisites.anyOf.filter(code=>completed.has(code));
  p.textContent=matched.length ? `OR rule satisfied: completed ${matched.join(" or ")}.` :
    `OR rule not yet satisfied: complete ${demo.prerequisites.anyOf.join(" OR ")}.`;
  const note=document.createElement("p"); note.textContent=demo.notes;
  root.append(heading,p,note);
}
function renderAll(){renderTerms();renderAvailable();renderCompleted();renderProgress();renderOrDemo();}
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("category-filter").addEventListener("change",renderAvailable);
  document.getElementById("add-term").addEventListener("click",()=>{
    const n=terms.length+1;
    const name=prompt("Enter a semester name (example: Fall 2027):",`Term ${n}`);
    if(name && name.trim()){const id=`term-${Date.now()}`;terms.push({id,name:name.trim()});activeTermId=id;renderAll();notify(`${name.trim()} added.`);}
  });
  document.getElementById("delete-plan").addEventListener("click",()=>{
    if(confirm("Remove all courses from the semester plan?")){planned.clear();renderAll();notify("Semester plan cleared. Completed courses were not changed.");}
  });
  document.getElementById("move-all").addEventListener("click",()=>{
    let moved=0;
    data.courses.forEach(c=>{if(canPlan(c)){planned.set(c.code,activeTermId);moved++;}});
    renderAll();notify(`${moved} eligible course(s) added to ${terms.find(t=>t.id===activeTermId)?.name}.`);
  });
  document.getElementById("focus-filter").addEventListener("click",()=>document.getElementById("category-filter").focus());
  load();
});
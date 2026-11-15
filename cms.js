document.addEventListener("DOMContentLoaded", loadCMS);

async function loadCMS() {
  const status = document.getElementById("cms-status");
  const table = document.getElementById("cms-table");
  const body = document.getElementById("cms-table-body");

  try {
    const response = await fetch("cms-data.json");
    if (!response.ok) {
      throw new Error("Could not load cms-data.json");
    }

    const data = await response.json();

    data.systems.forEach((cms) => {
      const row = document.createElement("tr");

      addTextCell(row, cms.system, "cms-system");
      addTextCell(row, cms.support);
      addTextCell(row, cms.technology);
      addListCell(row, cms.capabilities);
      addListCell(row, cms.limitations);

      const exampleCell = document.createElement("td");
      const exampleLink = document.createElement("a");
      exampleLink.href = cms.example.url;
      exampleLink.textContent = cms.example.name;
      exampleLink.target = "_blank";
      exampleLink.rel = "noopener noreferrer";
      exampleCell.append(exampleLink);

      const sourceHeading = document.createElement("p");
      sourceHeading.className = "cms-source-list";
      const strong = document.createElement("strong");
      strong.textContent = "Research sources:";
      sourceHeading.append(strong);
      exampleCell.append(sourceHeading);

      cms.sources.forEach((source) => {
        const link = document.createElement("a");
        link.href = source.url;
        link.textContent = source.label;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "cms-source-list";
        exampleCell.append(link);
      });

      row.append(exampleCell);
      body.append(row);
    });

    status.textContent = `Loaded ${data.systems.length} content management systems from cms-data.json.`;
    table.hidden = false;
  } catch (error) {
    status.textContent = "The CMS information could not be loaded. Make sure cms-data.json is in the same folder as assignment12.html and open the page through GitHub Pages or a local web server.";
    console.error(error);
  }
}

function addTextCell(row, value, className = "") {
  const cell = document.createElement("td");
  cell.textContent = value;
  if (className) cell.className = className;
  row.append(cell);
}

function addListCell(row, items) {
  const cell = document.createElement("td");
  const list = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  });
  cell.append(list);
  row.append(cell);
}

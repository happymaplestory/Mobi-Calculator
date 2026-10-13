/*
 * table.html의 위치 기반 입력 테이블 UI
 * 데이터 정의는 data-model.js의 MOBI_DATA_MODEL을 사용합니다.
 */

function setDescriptionColumnWidth() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = '15px Arial, "Noto Sans KR", sans-serif';

  const labels = MOBI_DATA_MODEL.sectionTable.map(section => section.name);
  const width = Math.ceil(Math.max(...labels.map(label => context.measureText(label).width)) + 28);

  document.documentElement.style.setProperty("--description-column-width", width + "px");
}

function createValueInput(section) {
  const input = document.createElement("input");
  input.className = "value-input";
  input.type = "text";
  input.autocomplete = "off";
  input.setAttribute("aria-label", section.name + " 값 입력");
  return input;
}

function createSectionRow(section) {
  const row = document.createElement("div");
  row.className = "input-row";
  row.dataset.sectionId = String(section.id);

  const name = document.createElement("div");
  name.className = "field section-name";
  name.textContent = section.name;

  const application = document.createElement("div");
  application.className = "field application-value";
  application.textContent = "+";
  application.setAttribute("aria-label", "적용 형식");

  row.append(name, application, createValueInput(section));
  return row;
}

function createLocationColumn(location) {
  const column = document.createElement("div");
  column.className = "category-column";
  column.dataset.locationId = String(location.id);

  const card = document.createElement("div");
  card.className = "category-card";
  card.dataset.locationId = String(location.id);

  const group = document.createElement("div");
  group.className = "category-group";
  group.dataset.locationId = String(location.id);

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = location.name;
  group.appendChild(title);

  // ID 7000과 8000의 행 구성은 후속 요구사항에서 정의합니다.
  if (location.id !== 7000 && location.id !== 8000) {
    const sectionRows = MOBI_DATA_MODEL.sectionTable
      .filter(section => location.attributeGroups.includes(section.group))
      .sort((a, b) => a.id - b.id);

    sectionRows.forEach(section => {
      group.appendChild(createSectionRow(section));
    });
  }

  card.appendChild(group);
  column.appendChild(card);
  return column;
}

function initializeTable() {
  setDescriptionColumnWidth();

  const tableArea = document.getElementById("table-area");
  const locations = [...MOBI_DATA_MODEL.locationTable]
    .sort((a, b) => a.id - b.id);

  tableArea.replaceChildren(...locations.map(createLocationColumn));
}

initializeTable();

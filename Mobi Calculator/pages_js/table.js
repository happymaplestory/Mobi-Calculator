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

function createValueInput(label = "값 입력") {
  const input = document.createElement("input");
  input.className = "value-input";
  input.type = "text";
  input.autocomplete = "off";
  input.setAttribute("aria-label", label);
  return input;
}

function createApplicationSelect() {
  const select = document.createElement("select");
  select.className = "field application-value";
  select.setAttribute("aria-label", "적용 형식");

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "선택";
  placeholder.selected = true;
  select.appendChild(placeholder);

  MOBI_DATA_MODEL.applicationTable.forEach(application => {
    const option = document.createElement("option");
    option.value = String(application.id);
    option.textContent = application.name;
    select.appendChild(option);
  });

  return select;
}

function createSectionRow(section, { custom = false } = {}) {
  const row = document.createElement("div");
  row.className = "input-row" + (custom ? " custom-row" : "");
  if (section?.id != null) row.dataset.sectionId = String(section.id);

  let name;
  if (custom) {
    name = document.createElement("input");
    name.type = "text";
    name.className = "field section-name editable-section-name";
    name.placeholder = "구분 입력";
    name.setAttribute("aria-label", "구분 이름");
    name.autocomplete = "off";
  } else {
    name = document.createElement("div");
    name.className = "field section-name";
    name.textContent = section.name;
  }

  let application;
  if (custom) {
    application = createApplicationSelect();
  } else {
    application = document.createElement("div");
    application.className = "field application-value";
    application.textContent = "+";
    application.setAttribute("aria-label", "적용 형식");
  }

  row.append(name, application, createValueInput((custom ? "추가 항목" : section.name) + " 값 입력"));

  if (custom) {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-row-button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", "추가 행 삭제");
    deleteButton.title = "행 삭제";
    deleteButton.addEventListener("click", () => row.remove());
    row.appendChild(deleteButton);
  }

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

  // ID 7000과 8000의 기본 행 구성은 후속 요구사항에서 정의합니다.
  if (location.id !== 7000 && location.id !== 8000) {
    const sectionRows = MOBI_DATA_MODEL.sectionTable
      .filter(section => location.attributeGroups.includes(section.group))
      .sort((a, b) => a.id - b.id);

    sectionRows.forEach(section => {
      group.appendChild(createSectionRow(section));
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-row-button";
    addButton.textContent = "+";
    addButton.setAttribute("aria-label", location.name + " 항목 추가");
    addButton.addEventListener("click", () => {
      const addRow = createSectionRow(null, { custom: true });
      group.insertBefore(addRow, addButton);
      addRow.querySelector(".editable-section-name").focus();
    });
    group.appendChild(addButton);
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

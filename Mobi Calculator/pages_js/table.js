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
  row.draggable = false;
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
    deleteButton.addEventListener("click", () => {
      const valueInput = row.querySelector(".value-input");
      const value = valueInput?.value.trim() || "";

      if (value && !window.confirm("\"" + value + "\" 삭제하시겠습니까?")) {
        return;
      }

      row.remove();
    });
    row.appendChild(deleteButton);
  }

  return row;
}

function enableRowDragging(tableArea) {
  let active = null;
  let placeholder = null;
  let ghost = null;
  let startX = 0;
  let startY = 0;
  let pointerId = null;
  let dragging = false;
  let originalNextSibling = null;

  function getDropGroup(target) {
    const column = target?.closest?.(".category-column");
    const group = column?.querySelector(".category-group");
    return group && group.querySelector(".add-row-button") ? group : null;
  }

  function getRows(group) {
    return [...group.querySelectorAll(":scope > .input-row")];
  }

  function placePlaceholder(group, clientY) {
    const rows = getRows(group).filter(row => row.classList.contains("custom-row") && row !== active);
    const nextRow = rows.find(row => {
      const rect = row.getBoundingClientRect();
      return clientY < rect.top + rect.height / 2;
    });
    const addButton = group.querySelector(".add-row-button");
    const nextSibling = nextRow || addButton;
    if (placeholder.parentElement === group && placeholder.nextElementSibling === nextSibling) return;

    // FLIP: 레이아웃 변경 전후의 행 위치 차이를 애니메이션으로 보정해 주변 행이 부드럽게 밀리도록 합니다.
    const before = new Map();
    getRows(group).filter(row => row !== active).forEach(row => before.set(row, row.getBoundingClientRect()));

    group.insertBefore(placeholder, nextSibling);

    getRows(group).filter(row => row !== active).forEach(row => {
      const oldRect = before.get(row);
      if (!oldRect) return;
      const newRect = row.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (!dx && !dy) return;
      row.style.transition = "none";
      row.style.transform = `translate(${dx}px, ${dy}px)`;
      row.getBoundingClientRect();
      row.style.transition = "transform 180ms ease";
      row.style.transform = "";
      row.addEventListener("transitionend", function clearFlip(event) {
        if (event.propertyName !== "transform") return;
        row.style.removeProperty("transition");
        row.removeEventListener("transitionend", clearFlip);
      });
    });
  }

  function moveGhost(clientX, clientY) {
    if (!ghost) return;
    ghost.style.left = (clientX - ghost.offsetWidth / 2) + "px";
    ghost.style.top = (clientY - ghost.offsetHeight / 2) + "px";
  }

  function cleanup() {
    if (ghost) ghost.remove();
    if (placeholder) placeholder.remove();
    if (active) {
      active.classList.remove("is-dragging");
      active.style.removeProperty("visibility");
      active.style.removeProperty("display");
    }
    tableArea.classList.remove("is-row-dragging");
    active = null;
    placeholder = null;
    ghost = null;
    pointerId = null;
    originalNextSibling = null;
    dragging = false;
  }

  tableArea.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    const row = event.target.closest(".input-row.custom-row");
    if (!row || !tableArea.contains(row)) return;

    active = row;
    originalNextSibling = row.nextSibling;
    startX = event.clientX;
    startY = event.clientY;
    pointerId = event.pointerId;
  });

  document.addEventListener("pointermove", event => {
    if (!active || event.pointerId !== pointerId) return;
    const distance = Math.hypot(event.clientX - startX, event.clientY - startY);

    if (!dragging && distance < 5) return;

    if (!dragging) {
      dragging = true;
      const rect = active.getBoundingClientRect();
      const sourceGroup = active.parentElement;
      placeholder = document.createElement("div");
      placeholder.className = "row-placeholder";
      placeholder.style.height = rect.height + "px";
      placeholder.style.gridColumn = "1 / -1";
      sourceGroup.insertBefore(placeholder, active);
      // 원본 행은 레이아웃에서 제외하고 placeholder만 공간을 차지하게 합니다.
      active.style.display = "none";

      ghost = active.cloneNode(true);
      ghost.classList.add("row-drag-ghost");
      ghost.style.width = rect.width + "px";
      ghost.style.height = rect.height + "px";
      ghost.style.left = rect.left + "px";
      ghost.style.top = rect.top + "px";
      document.body.appendChild(ghost);

      active.classList.add("is-dragging");
      active.style.visibility = "hidden";
      tableArea.classList.add("is-row-dragging");
    }

    event.preventDefault();
    moveGhost(event.clientX, event.clientY);

    const elementUnderPointer = document.elementFromPoint(event.clientX, event.clientY);
    const targetGroup = getDropGroup(elementUnderPointer);
    if (targetGroup) {
      targetGroup.classList.add("is-drop-target");
      tableArea.querySelectorAll(".category-group.is-drop-target").forEach(group => {
        if (group !== targetGroup) group.classList.remove("is-drop-target");
      });
      placePlaceholder(targetGroup, event.clientY);
    } else {
      tableArea.querySelectorAll(".category-group.is-drop-target").forEach(group => {
        group.classList.remove("is-drop-target");
      });
    }
  }, { passive: false });

  document.addEventListener("pointerup", event => {
    if (!active || event.pointerId !== pointerId) return;
    const row = active;
    const sourceGroup = row.parentElement;
    const targetGroup = dragging ? placeholder?.parentElement : sourceGroup;

    if (dragging && targetGroup && targetGroup.classList.contains("category-group")) {
      const sourceLocationId = sourceGroup.dataset.locationId;
      const targetLocationId = targetGroup.dataset.locationId;
      let allowMove = true;

      if (sourceLocationId !== targetLocationId) {
        allowMove = window.confirm("입력 값만 이동됩니다.");
      }

      if (allowMove) {
        if (sourceLocationId !== targetLocationId) {
          row.querySelector(".editable-section-name").value = "";
          row.querySelector(".application-value").value = "";
        }
        targetGroup.insertBefore(row, placeholder);
      } else {
        const restoreBefore = originalNextSibling && originalNextSibling.parentElement === sourceGroup
          ? originalNextSibling
          : sourceGroup.querySelector(".add-row-button");
        sourceGroup.insertBefore(row, restoreBefore || null);
      }
    } else if (dragging) {
      const restoreBefore = originalNextSibling && originalNextSibling.parentElement === sourceGroup
        ? originalNextSibling
        : sourceGroup.querySelector(".add-row-button");
      sourceGroup.insertBefore(row, restoreBefore || null);
    }

    tableArea.querySelectorAll(".category-group.is-drop-target").forEach(group => {
      group.classList.remove("is-drop-target");
    });
    cleanup();
  });

  document.addEventListener("pointercancel", event => {
    if (!active || event.pointerId !== pointerId) return;
    if (dragging && active) {
      const sourceGroup = active.parentElement;
      const restoreBefore = originalNextSibling && originalNextSibling.parentElement === sourceGroup
        ? originalNextSibling
        : sourceGroup.querySelector(".add-row-button");
      sourceGroup.insertBefore(active, restoreBefore || null);
    }
    tableArea.querySelectorAll(".category-group.is-drop-target").forEach(group => {
      group.classList.remove("is-drop-target");
    });
    cleanup();
  });
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

    sectionRows.forEach(section => group.appendChild(createSectionRow(section)));

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
  enableRowDragging(tableArea);
}

initializeTable();

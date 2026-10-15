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

function createSectionRow(section, { custom = false, sectionSelectFromModel = false } = {}) {
  const row = document.createElement("div");
  row.className = "input-row" + (custom ? " custom-row" : "");
  row.draggable = false;
  if (section?.id != null) row.dataset.sectionId = String(section.id);

  let name;
  if (custom && sectionSelectFromModel) {
    name = document.createElement("select");
    name.className = "field section-name editable-section-name";
    name.setAttribute("aria-label", "구분 선택");

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "구분 선택";
    placeholder.selected = true;
    name.appendChild(placeholder);

    MOBI_DATA_MODEL.sectionTable
      .filter(item => item.id > 3000)
      .sort((a, b) => a.id - b.id)
      .forEach(item => {
        const option = document.createElement("option");
        option.value = String(item.id);
        option.textContent = item.name;
        name.appendChild(option);
      });

    name.addEventListener("change", () => {
      const selectedSection = MOBI_DATA_MODEL.sectionTable.find(
        item => String(item.id) === name.value
      );
      if (selectedSection) row.dataset.sectionId = String(selectedSection.id);
      else delete row.dataset.sectionId;
    });
  } else if (custom) {
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

      // 확인된 삭제만 애니메이션 처리합니다. 행이 접히는 동안 아래 행과 + 버튼이 위로 이동합니다.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        row.remove();
        return;
      }

      const rowHeight = row.getBoundingClientRect().height;
      row.style.height = rowHeight + "px";
      row.style.minHeight = "0";
      row.style.overflow = "hidden";
      row.style.opacity = "1";
      row.style.transition = "height 220ms ease, opacity 180ms ease, margin 220ms ease, padding 220ms ease";
      const deleteButton = row.querySelector(".delete-row-button");
      if (deleteButton) {
        deleteButton.style.opacity = "1";
        deleteButton.style.transition = "opacity 180ms ease, transform 180ms ease";
      }
      row.getBoundingClientRect();

      requestAnimationFrame(() => {
        row.style.height = "0px";
        row.style.opacity = "0";
        if (deleteButton) {
          deleteButton.style.opacity = "0";
          deleteButton.style.transform = "translate(4px, -50%) scale(0.92)";
        }
        row.style.marginTop = "0";
        row.style.marginBottom = "0";
        row.style.paddingTop = "0";
        row.style.paddingBottom = "0";
        row.style.borderTopWidth = "0";
        row.style.borderBottomWidth = "0";
      });

      // 행 접힘과 X 버튼 페이드아웃이 모두 끝난 뒤 제거합니다.
      // 행의 height 전환만 기다리면 버튼 전환이 끝나기 전에 DOM에서 제거될 수 있습니다.
      let rowHeightFinished = false;
      let buttonFadeFinished = !deleteButton;
      const finishRemoval = () => {
        if (!rowHeightFinished || !buttonFadeFinished) return;
        row.removeEventListener("transitionend", onRowTransitionEnd);
        deleteButton?.removeEventListener("transitionend", onButtonTransitionEnd);
        row.remove();
      };
      const onRowTransitionEnd = event => {
        if (event.target !== row || event.propertyName !== "height") return;
        rowHeightFinished = true;
        finishRemoval();
      };
      const onButtonTransitionEnd = event => {
        if (event.target !== deleteButton || event.propertyName !== "opacity") return;
        buttonFadeFinished = true;
        finishRemoval();
      };
      row.addEventListener("transitionend", onRowTransitionEnd);
      deleteButton?.addEventListener("transitionend", onButtonTransitionEnd);
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
    return group || null;
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
    const nextSibling = nextRow || addButton || null;
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

  // 전투 스킬 열(ID 7000, 8000)은 기본 행 없이 선택 행 추가 버튼만 표시합니다.
  if (location.id !== 7000 && location.id !== 8000) {
    const sectionRows = MOBI_DATA_MODEL.sectionTable
      .filter(section => location.attributeGroups.includes(section.group))
      .sort((a, b) => a.id - b.id);

    sectionRows.forEach(section => group.appendChild(createSectionRow(section)));
  }

  if (location.id < 3000 || location.id > 6000) {
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-row-button";
    addButton.textContent = "+";
    addButton.setAttribute("aria-label", location.name + " 항목 추가");
    addButton.addEventListener("click", () => {
      const addRow = createSectionRow(null, {
        custom: true,
        sectionSelectFromModel: location.id === 7000 || location.id === 8000
      });
      addRow.classList.add("row-entering");
      group.insertBefore(addRow, addButton);

      // 행 높이와 투명도를 함께 전환해 새 행이 펼쳐지고 + 버튼도 자연스럽게 아래로 이동합니다.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!addRow.isConnected) return;
          addRow.classList.add("row-entered");
        });
      });

      addRow.addEventListener("transitionend", event => {
        if (event.propertyName !== "max-height") return;
        addRow.classList.remove("row-entering", "row-entered");
        addRow.style.removeProperty("max-height");
        addRow.style.removeProperty("opacity");
        addRow.style.removeProperty("overflow");
      }, { once: false });

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
  const columns = locations.map(createLocationColumn);
  const levelColumn = columns.find(column => column.dataset.locationId === "1000");
  const paladinColumn = columns.find(column => column.dataset.locationId === "2000");

  // 레벨과 팔라딘은 하나의 세로 스택으로 묶어, 레벨 열의 높이가 바뀌면
  // 팔라딘 열도 문서 흐름과 행 애니메이션에 맞춰 자연스럽게 이동하도록 합니다.
  const levelPaladinStack = document.createElement("div");
  levelPaladinStack.className = "level-paladin-stack";
  if (levelColumn) levelPaladinStack.appendChild(levelColumn);
  if (paladinColumn) levelPaladinStack.appendChild(paladinColumn);

  const remainingColumns = columns.filter(column =>
    column !== levelColumn && column !== paladinColumn
  );
  const mobileColumns = remainingColumns.filter(column =>
    Number(column.dataset.locationId) >= 3000 && Number(column.dataset.locationId) <= 8000
  );

  const carousel = document.createElement("section");
  carousel.className = "column-carousel";
  carousel.setAttribute("aria-label", "내 정보부터 전투 스킬까지의 입력 열");

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "carousel-arrow carousel-arrow-previous";
  previousButton.setAttribute("aria-label", "이전 열");
  previousButton.innerHTML = '<span aria-hidden="true">‹</span>';

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "carousel-arrow carousel-arrow-next";
  nextButton.setAttribute("aria-label", "다음 열");
  nextButton.innerHTML = '<span aria-hidden="true">›</span>';

  const pagination = document.createElement("nav");
  pagination.className = "column-pagination";
  pagination.setAttribute("aria-label", "입력 열 선택");

  const viewport = document.createElement("div");
  viewport.className = "column-carousel-viewport";
  const track = document.createElement("div");
  track.className = "column-carousel-track";
  mobileColumns.forEach((column, index) => {
    column.classList.add("carousel-column");
    column.dataset.carouselIndex = String(index);
    track.appendChild(column);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "column-pagination-dot";
    dot.setAttribute("aria-label", (index + 1) + "번째 열: " + column.querySelector(".category-title").textContent);
    dot.setAttribute("aria-current", index === 0 ? "true" : "false");
    dot.addEventListener("click", () => moveToColumn(index));
    pagination.appendChild(dot);
  });
  viewport.appendChild(track);
  carousel.append(previousButton, pagination, viewport, nextButton);

  let currentColumnIndex = 0;
  let moveTimer = null;
  const TRANSITION_DURATION = 300;

  function moveToColumn(targetIndex) {
    const boundedIndex = Math.max(0, Math.min(mobileColumns.length - 1, targetIndex));
    if (boundedIndex === currentColumnIndex) return;
    const distance = Math.abs(boundedIndex - currentColumnIndex);
    currentColumnIndex = boundedIndex;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 0 : TRANSITION_DURATION;
    track.style.transitionDuration = duration + "ms";
    // Align by each column actual layout position, independent of viewport padding and gaps.
    const targetColumn = mobileColumns[currentColumnIndex];
    const targetOffset = targetColumn ? targetColumn.offsetLeft : 0;
    track.style.transform = "translateX(" + (-targetOffset) + "px)";
    pagination.querySelectorAll(".column-pagination-dot").forEach((dot, index) => {
      dot.setAttribute("aria-current", index === currentColumnIndex ? "true" : "false");
    });
    updateArrowState();
    // 여러 열 이동도 전체 시간이 일정하도록 이동 거리와 속도를 함께 조절합니다.
    track.style.setProperty("--carousel-travel-distance", distance);
    if (moveTimer) clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      track.style.removeProperty("--carousel-travel-distance");
      moveTimer = null;
    }, duration);
  }

  function updateArrowState() {
    const atFirstColumn = currentColumnIndex === 0;
    const atLastColumn = currentColumnIndex === mobileColumns.length - 1;

    previousButton.hidden = false;
    nextButton.hidden = mobileColumns.length < 2;

    previousButton.classList.toggle("is-boundary", atFirstColumn);
    nextButton.classList.toggle("is-boundary", atLastColumn);
    previousButton.setAttribute("aria-disabled", String(atFirstColumn));
    nextButton.setAttribute("aria-disabled", String(atLastColumn));

    previousButton.querySelector("span").textContent = atFirstColumn ? "‖" : "‹";
    nextButton.querySelector("span").textContent = atLastColumn ? "‖" : "›";
  }

  previousButton.addEventListener("click", () => {
    if (currentColumnIndex > 0) moveToColumn(currentColumnIndex - 1);
  });
  nextButton.addEventListener("click", () => {
    if (currentColumnIndex < mobileColumns.length - 1) moveToColumn(currentColumnIndex + 1);
  });

  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipePointerId = null;
  let swipeEligible = false;
  viewport.addEventListener("pointerdown", event => {
    if (event.target.closest("input, select, textarea, button, option, [contenteditable='true']")) {
      swipeEligible = false;
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) return;
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
    swipePointerId = event.pointerId;
    swipeEligible = true;
  });
  viewport.addEventListener("pointerup", event => {
    if (!swipeEligible || event.pointerId !== swipePointerId) return;
    const dx = event.clientX - swipeStartX;
    const dy = event.clientY - swipeStartY;
    swipeEligible = false;
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
    moveToColumn(currentColumnIndex + (dx < 0 ? 1 : -1));
  });
  viewport.addEventListener("pointercancel", () => { swipeEligible = false; });

  updateArrowState();

  const orderedColumns = levelColumn && paladinColumn
    ? [levelPaladinStack, carousel]
    : columns;

  tableArea.replaceChildren(...orderedColumns);

  // FLIP으로 두 레이아웃 묶음의 위치 변화를 보정해 줄바꿈 시 부드럽게 이동시킵니다.
  if (orderedColumns.length > 1 && "ResizeObserver" in window) {
    let previousRects = null;
    const getLayoutRects = () => new Map(
      orderedColumns.map(item => [item, item.getBoundingClientRect()])
    );

    const animateLayoutChange = () => {
      const currentRects = getLayoutRects();
      if (!previousRects) {
        previousRects = currentRects;
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        previousRects = currentRects;
        return;
      }

      const movingItems = [];
      orderedColumns.forEach(item => {
        const before = previousRects.get(item);
        const after = currentRects.get(item);
        if (!before || !after) return;

        const dx = before.left - after.left;
        const dy = before.top - after.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

        item.style.transition = "none";
        item.style.transform = `translate(${dx}px, ${dy}px)`;
        item.getBoundingClientRect();
        movingItems.push(item);
      });
      previousRects = currentRects;

      requestAnimationFrame(() => {
        movingItems.forEach(item => {
          const clearAnimation = event => {
            if (event.target !== item || event.propertyName !== "transform") return;
            item.style.removeProperty("transition");
            item.style.removeProperty("transform");
            item.removeEventListener("transitionend", clearAnimation);
          };
          item.addEventListener("transitionend", clearAnimation);
          item.style.transition = "transform 360ms cubic-bezier(.22,.72,.22,1)";
          item.style.transform = "translate(0, 0)";
        });
      });
    };

    const layoutObserver = new ResizeObserver(animateLayoutChange);
    layoutObserver.observe(tableArea);
    orderedColumns.forEach(item => layoutObserver.observe(item));
    requestAnimationFrame(() => {
      previousRects = getLayoutRects();
    });
  }

  enableRowDragging(tableArea);
}

initializeTable();

const CALCULATOR_DATA = {
  categories: ["공격력", "공격력 %", "치명타"],

  requiredDescriptions: {
    "공격력": [
      "캐릭터 레벨",
      "레벨업 보너스 카드 (합산)",
      "타이틀 보유 효과",
      "펫 공격력",
      "인챈트 (합산)",
      "목걸이 공격력",
      "목걸이 인장",
      "룬 워드",
      "패션 세트 효과",
      "소울 스트림",
      "소울 스트림(조건부)",
      "팔라딘(정의)",
      "무기 기본 공격력",
      "무기 각인",
      "무기 인장",
      "무기 숙련 연계",
      "엠블럼 공격력 % (인장 포함)",
      "무기 주 스탯 배율",
      "무기 부 스탯 배율"
    ],
    "공격력 %": [
      "아티팩트 %",
      "인챈트 %"
    ],
    "치명타": [
      "기본 스탯",
      "강화 물약",
      "음식"
    ]
  },

  optionalDescriptions: {
    "공격력": [
      "기타"
    ],
    "공격력 %": [
      "기타",
      "룬 %",
      "스킬 %"
    ],
    "치명타": [
      "기타",
      "확률 %",
      "피해 %"
    ]
  }
};

    const groups = new Map();
    let dragState = null;
    let pendingDrag = null;
    function setColumnWidths() {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = '16px Arial, "Noto Sans KR", sans-serif';

      const descriptionTexts = [
        ...Object.values(CALCULATOR_DATA.requiredDescriptions).flat(),
        ...Object.values(CALCULATOR_DATA.optionalDescriptions).flat()
      ];

      const descriptionWidth = Math.ceil(
        Math.max(...descriptionTexts.map(text => context.measureText(text).width)) + 60
      );

      document.documentElement.style.setProperty(
        "--description-column-width",
        descriptionWidth + "px"
      );
    }

    function createGroup(category) {
      const group = document.createElement("div");
      group.className = "category-group";
      group.dataset.category = category;

      const title = document.createElement("h2");
      title.className = "category-title";
      title.textContent = category;
      group.appendChild(title);
      groups.set(category, group);
      document.getElementById("table-area").appendChild(group);
      return group;
    }

    function createSelect(options, selectedValue, onChange) {
      const select = document.createElement("select");
      select.className = "field";

      options.forEach(optionText => {
        const option = document.createElement("option");
        option.value = optionText;
        option.textContent = optionText;
        select.appendChild(option);
      });

      select.value = selectedValue;
      select.addEventListener("change", onChange);
      return select;
    }

    function createValueInput() {
      const input = document.createElement("input");
      input.className = "value-input";
      input.type = "text";
      input.setAttribute("aria-label", "값 입력");
      return input;
    }

    function createRequiredRow(item) {
      const row = document.createElement("div");
      row.className = "input-row";

      const description = document.createElement("div");
      description.className = "field";
      description.textContent = item.description;

      row.append(description, createValueInput(), document.createElement("div"));
      return row;
    }

    function renumberOptionalRows(category) {
      const group = groups.get(category);

      if (!group) {
        return;
      }

      const occurrenceCounts = new Map();
      const rows = group.querySelectorAll(".optional-row");

      rows.forEach(row => {
        const descriptionSelect = row.children[0];
        const baseDescription =
          descriptionSelect.dataset.baseDescription || descriptionSelect.value;

        const occurrence = (occurrenceCounts.get(baseDescription) || 0) + 1;
        occurrenceCounts.set(baseDescription, occurrence);

        Array.from(descriptionSelect.options).forEach(option => {
          option.textContent = option.value;
        });

        const selectedOption = descriptionSelect.options[descriptionSelect.selectedIndex];

        if (selectedOption) {
          selectedOption.textContent =
            `${baseDescription} (${occurrence})`;
        }
      });
    }

    function getOptionalRows(group) {
      return Array.from(group.querySelectorAll(".optional-row:not(.dragging)"));
    }

    function getDragGroup(clientX, clientY) {
      const element = document.elementFromPoint(clientX, clientY);
      return element ? element.closest(".category-group") : null;
    }

    function getDragTarget(group, pointerY) {
      const rows = getOptionalRows(group);

      for (const row of rows) {
        const rect = row.getBoundingClientRect();

        if (pointerY < rect.top + rect.height / 2) {
          return row;
        }
      }

      return null;
    }

    function startOptionalDrag(row, event) {
      if (event.button !== 0 || dragState || pendingDrag) {
        return;
      }

      pendingDrag = {
        row,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY
      };
    }

    function beginOptionalDrag(row, event) {
      if (!pendingDrag || pendingDrag.row !== row || pendingDrag.pointerId !== event.pointerId) {
        return;
      }

      const rect = row.getBoundingClientRect();
      const placeholder = document.createElement("div");
      placeholder.className = "drag-placeholder";
      placeholder.style.height = rect.height + "px";

      row.parentElement.insertBefore(placeholder, row);

      row.classList.add("dragging");
      row.style.width = rect.width + "px";
      row.style.height = rect.height + "px";
      row.style.left = rect.left + "px";
      row.style.top = rect.top + "px";

      dragState = {
        row,
        placeholder,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        originalGroup: row.parentElement,
        originalNextSibling: placeholder.nextElementSibling,
        group: row.parentElement,
        category: row.parentElement.dataset.category,
        pointerId: event.pointerId
      };

      event.preventDefault();
    }

    function updateOptionalDrag(event) {
      if (!dragState && pendingDrag) {
        if (event.pointerId !== pendingDrag.pointerId) {
          return;
        }

        const dx = event.clientX - pendingDrag.startX;
        const dy = event.clientY - pendingDrag.startY;

        if (Math.hypot(dx, dy) >= 6) {
          const row = pendingDrag.row;
          beginOptionalDrag(row, event);
          pendingDrag = null;
        }
      }

      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      const { row, placeholder, offsetX, offsetY } = dragState;

      row.style.left = event.clientX - offsetX + "px";
      row.style.top = event.clientY - offsetY + "px";

      const targetGroup = getDragGroup(event.clientX, event.clientY);

      if (!targetGroup) {
        return;
      }

      if (targetGroup !== dragState.group) {
        dragState.group = targetGroup;
        const addButton = targetGroup.querySelector(".add-button");
        targetGroup.insertBefore(placeholder, addButton);
        return;
      }

      const group = dragState.group;
      const target = getDragTarget(group, event.clientY);

      if (target === placeholder) {
        return;
      }

      const currentNext = placeholder.nextElementSibling;

      if (target === currentNext) {
        return;
      }

      const rows = getOptionalRows(group);
      const positions = new Map(
        rows.map(item => [item, item.getBoundingClientRect().top])
      );

      if (target) {
        group.insertBefore(placeholder, target);
      } else {
        const addButton = group.querySelector(".add-button");
        group.insertBefore(placeholder, addButton);
      }

      rows.forEach(item => {
        const previousTop = positions.get(item);
        const currentTop = item.getBoundingClientRect().top;
        const offset = previousTop - currentTop;

        if (offset === 0) {
          return;
        }

        item.style.transition = "none";
        item.style.transform = `translateY(${offset}px)`;

        requestAnimationFrame(() => {
          item.style.transition = "transform 120ms ease";
          item.style.transform = "";
        });
      });
    }

    function resetOptionalRowCategory(row, category) {
      const availableDescriptions = CALCULATOR_DATA.optionalDescriptions[category];

      if (availableDescriptions.length === 0) {
        return;
      }

      const nextDescription = availableDescriptions[0];
      const newDescriptionSelect = createSelect(
        availableDescriptions,
        nextDescription,
        null
      );

      newDescriptionSelect.dataset.baseDescription = nextDescription;

      newDescriptionSelect.addEventListener("change", () => {
        newDescriptionSelect.dataset.baseDescription = newDescriptionSelect.value;
        renumberOptionalRows(row.parentElement.dataset.category);
      });

      row.children[0].replaceWith(newDescriptionSelect);
      row.dataset.category = category;
    }

    function finishOptionalDrag(event) {
      if (pendingDrag && (!event || event.pointerId === pendingDrag.pointerId)) {
        pendingDrag = null;
      }

      if (!dragState || (event && event.pointerId !== dragState.pointerId)) {
        return;
      }

      const {
        row,
        placeholder,
        originalGroup,
        originalNextSibling,
        group: targetGroup
      } = dragState;

      const crossedCategory = targetGroup !== originalGroup;

      if (crossedCategory) {
        const shouldMove = window.confirm(
          "다른 목차로 이동 시 종류 구분이 초기화됩니다. 진행하시겠습니까?"
        );

        if (!shouldMove) {
          if (originalNextSibling && originalNextSibling.parentElement === originalGroup) {
            originalGroup.insertBefore(placeholder, originalNextSibling);
          } else {
            originalGroup.appendChild(placeholder);
          }

          originalGroup.insertBefore(row, placeholder);
        } else {
          targetGroup.insertBefore(row, placeholder);
          resetOptionalRowCategory(row, targetGroup.dataset.category);
        }
      } else {
        targetGroup.insertBefore(row, placeholder);
      }

      placeholder.remove();

      row.classList.remove("dragging");
      row.style.width = "";
      row.style.height = "";
      row.style.left = "";
      row.style.top = "";
      row.style.transform = "";

      const finalCategory = row.parentElement.dataset.category;
      dragState = null;

      renumberOptionalRows(finalCategory);
      if (crossedCategory && finalCategory !== originalGroup.dataset.category) {
        renumberOptionalRows(originalGroup.dataset.category);
      }
    }

    document.addEventListener("pointermove", updateOptionalDrag);
    document.addEventListener("pointerup", finishOptionalDrag);
    document.addEventListener("pointercancel", finishOptionalDrag);

    function createOptionalRow(category) {
      const row = document.createElement("div");
      row.className = "optional-row";

      const descriptionSelect = createSelect(
        CALCULATOR_DATA.optionalDescriptions[category],
        CALCULATOR_DATA.optionalDescriptions[category][0],
        null
      );

      descriptionSelect.dataset.baseDescription = descriptionSelect.value;

      descriptionSelect.addEventListener("change", () => {
        descriptionSelect.dataset.baseDescription = descriptionSelect.value;
        renumberOptionalRows(row.parentElement.dataset.category);
      });

      const valueInput = createValueInput();

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "action-button delete-button";
      deleteButton.setAttribute("aria-label", "선택 항목 삭제");
      deleteButton.addEventListener("click", () => {
        if (valueInput.value.trim() !== "") {
          const shouldDelete = window.confirm(
            "계산에 적용중인 데이터가 남아 있습니다. 삭제하시겠습니까?"
          );

          if (!shouldDelete) {
            return;
          }
        }

        const category = row.parentElement.dataset.category;
        row.remove();
        renumberOptionalRows(category);
      });

      row.append(descriptionSelect, valueInput, deleteButton);
      row.addEventListener("pointerdown", event => {
        startOptionalDrag(row, event);
      });

      return row;
    }

    function addOptionalRow(category) {
      const availableDescriptions = CALCULATOR_DATA.optionalDescriptions[category];

      if (availableDescriptions.length === 0) {
        return;
      }

      const targetGroup = groups.get(category);
      const addButton = targetGroup.querySelector(".add-button");
      const row = createOptionalRow(category);
      targetGroup.insertBefore(row, addButton);
      renumberOptionalRows(category);
    }

    function createAddButton(category) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action-button add-button";
      button.setAttribute("aria-label", "선택 항목 추가");
      button.addEventListener("click", () => addOptionalRow(category));
      return button;
    }

    function initialize() {
      setColumnWidths();
      CALCULATOR_DATA.categories.forEach(createGroup);

      CALCULATOR_DATA.categories.forEach(category => {
        CALCULATOR_DATA.requiredDescriptions[category].forEach(description => {
          groups.get(category).appendChild(
            createRequiredRow({ category, description })
          );
        });
      });

      CALCULATOR_DATA.categories.forEach(category => {
        groups.get(category).appendChild(createAddButton(category));
      });
    }

    initialize();

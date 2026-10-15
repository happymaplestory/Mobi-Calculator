/*
 * table.html의 저장 및 불러오기 처리
 *
 * 주의:
 * - localStorage는 현재 브라우저의 사이트 출처에 저장되며 서버/기기 간 동기화 기능이 아닙니다.
 * - 자동 저장 및 자동 복원은 수행하지 않습니다.
 * - 데이터 구조 변경 시 DB 버전을, 열 구성/순서 변경 시 웹 버전을 수동으로 올립니다.
 * - 현재 개발 단계에서는 마이그레이션을 수행하지 않습니다.
 */

(() => {
  "use strict";

  const STORAGE_KEY = "mobiCalculatorTableState";
  const CURRENT_WEB_VERSION = 1;
  const CURRENT_DB_VERSION = 1;

  const tableArea = document.getElementById("table-area");
  const saveButton = document.getElementById("save-button");
  const loadButton = document.getElementById("load-button");
  const saveSubmenu = document.getElementById("save-submenu");
  const loadSubmenu = document.getElementById("load-submenu");
  const saveBrowserButton = document.getElementById("save-browser-button");
  const saveFileButton = document.getElementById("save-file-button");
  const loadBrowserButton = document.getElementById("load-browser-button");
  const loadFileButton = document.getElementById("load-file-button");

  if (!tableArea || !saveButton || !loadButton || !saveSubmenu || !loadSubmenu ||
      !saveBrowserButton || !saveFileButton || !loadBrowserButton || !loadFileButton) {
    window.alert(
      "저장 및 불러오기를 초기화하지 못했습니다.\n" +
      "필요한 화면 요소(table-area, save-button, load-button)를 찾을 수 없습니다."
    );
    return;
  }

  function getBooleanControls(container) {
    return [...container.querySelectorAll(
      'input[type="checkbox"], input[type="radio"], [role="switch"], [aria-checked="true"], [aria-checked="false"]'
    )];
  }

  function readBooleanValue(control) {
    if (control.matches('input[type="checkbox"], input[type="radio"]')) {
      return Boolean(control.checked);
    }
    return control.getAttribute("aria-checked") === "true";
  }

  function writeBooleanValue(control, value) {
    if (control.matches('input[type="checkbox"], input[type="radio"]')) {
      control.checked = Boolean(value);
      control.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    control.setAttribute("aria-checked", String(Boolean(value)));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getControlKey(control, index) {
    return control.dataset.persistKey ||
      control.id ||
      control.name ||
      control.getAttribute("aria-label") ||
      "index:" + index;
  }

  function captureBooleanControls(container) {
    return getBooleanControls(container).map((control, index) => ({
      key: getControlKey(control, index),
      index,
      value: readBooleanValue(control)
    }));
  }

  function restoreBooleanControls(container, savedControls) {
    const controls = getBooleanControls(container);
    return savedControls.map(saved => {
      let control = controls.find((candidate, index) =>
        getControlKey(candidate, index) === saved.key
      );

      if (!control && String(saved.key).startsWith("index:")) {
        control = controls[saved.index];
      }

      if (!control) {
        throw new Error("저장된 체크/스위치 항목을 현재 화면에서 찾을 수 없습니다: " + saved.key);
      }

      return { control, value: saved.value };
    });
  }

  function getCurrentColumns() {
    return [...tableArea.querySelectorAll(".category-group[data-location-id]")];
  }

  function captureRow(row, rowPosition, customRowIndex) {
    const isCustom = row.classList.contains("custom-row");
    const nameControl = row.querySelector(".editable-section-name");
    const applicationControl = row.querySelector(".application-value");
    const valueControl = row.querySelector(".value-input");

    const result = {
      type: isCustom ? "optional" : "fixed",
      rowPosition,
      sectionId: row.dataset.sectionId || null,
      nameValue: isCustom && nameControl ? nameControl.value : null,
      nameControlType: isCustom && nameControl ? nameControl.tagName.toLowerCase() : null,
      applicationValue: applicationControl && "value" in applicationControl
        ? applicationControl.value
        : null,
      value: valueControl ? valueControl.value : "",
      booleanControls: captureBooleanControls(row)
    };

    if (isCustom) result.rowIndex = customRowIndex;
    return result;
  }

  function collectCurrentState() {
    const columns = getCurrentColumns().map((group, columnPosition) => {
      const columnId = group.dataset.locationId;
      const rows = [...group.querySelectorAll(":scope > .input-row")];
      let optionalRowIndex = 0;

      return {
        columnId,
        columnPosition,
        rows: rows.map((row, rowPosition) => {
          const customIndex = row.classList.contains("custom-row")
            ? optionalRowIndex++
            : null;
          return captureRow(row, rowPosition, customIndex);
        })
      };
    });

    return {
      format: "mobi-calculator-local-state",
      versions: {
        web: CURRENT_WEB_VERSION,
        db: CURRENT_DB_VERSION
      },
      savedAt: new Date().toISOString(),
      columns,
      booleanOptions: captureBooleanControls({
        querySelectorAll(selector) {
          return [...document.querySelectorAll(selector)].filter(control =>
            !control.closest(".input-row")
          );
        }
      })
    };
  }

  function validateStoredState(data) {
    if (!data || typeof data !== "object" ||
        data.format !== "mobi-calculator-local-state" ||
        !data.versions || !Array.isArray(data.columns)) {
      throw new Error("저장 데이터의 구조가 올바르지 않습니다.");
    }

    if (data.versions.web !== CURRENT_WEB_VERSION) {
      throw new Error(
        "웹 버전이 일치하지 않습니다.\n" +
        "저장된 웹 버전: " + data.versions.web + "\n" +
        "현재 웹 버전: " + CURRENT_WEB_VERSION + "\n" +
        "현재 개발 단계에서는 다른 웹 버전의 데이터를 변환하지 않습니다."
      );
    }

    if (data.versions.db !== CURRENT_DB_VERSION) {
      throw new Error(
        "DB 데이터 형식 버전이 일치하지 않습니다.\n" +
        "저장된 DB 버전: " + data.versions.db + "\n" +
        "현재 DB 버전: " + CURRENT_DB_VERSION + "\n" +
        "현재 개발 단계에서는 다른 DB 버전의 데이터를 변환하지 않습니다."
      );
    }

    const currentColumns = getCurrentColumns();
    const currentColumnIds = currentColumns.map(group => group.dataset.locationId);
    const savedColumnIds = data.columns.map(column => String(column.columnId));

    if (currentColumnIds.length !== savedColumnIds.length ||
        currentColumnIds.some((id, index) => id !== savedColumnIds[index])) {
      throw new Error(
        "현재 웹페이지의 열 구성 또는 순서가 저장 당시와 다릅니다.\n" +
        "열을 추가·삭제·변경한 경우 웹 버전을 올려야 합니다."
      );
    }

    const seenColumnIds = new Set();
    data.columns.forEach(column => {
      const columnId = String(column.columnId);
      if (seenColumnIds.has(columnId)) {
        throw new Error("저장 데이터에 중복된 열 ID가 있습니다: " + columnId);
      }
      seenColumnIds.add(columnId);

      if (!Array.isArray(column.rows)) {
        throw new Error("열 " + columnId + "의 행 데이터가 올바르지 않습니다.");
      }

      const optionalIndexes = new Set();
      column.rows.forEach(row => {
        if (!row || !["fixed", "optional"].includes(row.type)) {
          throw new Error("열 " + columnId + "에 올바르지 않은 행 데이터가 있습니다.");
        }
        if (typeof row.value !== "string") {
          throw new Error("열 " + columnId + "의 입력값 데이터가 올바르지 않습니다.");
        }
        if (row.type === "optional") {
          if (!Number.isInteger(row.rowIndex) || row.rowIndex < 0 ||
              optionalIndexes.has(row.rowIndex)) {
            throw new Error("열 " + columnId + "의 선택행 순서 또는 ID가 올바르지 않습니다.");
          }
          optionalIndexes.add(row.rowIndex);
        }
      });
    });

    if (!Array.isArray(data.booleanOptions)) {
      throw new Error("체크/스위치 옵션 데이터가 올바르지 않습니다.");
    }
  }

  function prepareOptionalRow(columnId, savedRow) {
    const isSkillColumn = columnId === "7000" || columnId === "8000";
    const row = createSectionRow(null, {
      custom: true,
      sectionSelectFromModel: isSkillColumn
    });

    const nameControl = row.querySelector(".editable-section-name");
    const applicationControl = row.querySelector(".application-value");
    const valueControl = row.querySelector(".value-input");

    if (nameControl) {
      const savedNameValue = savedRow.nameValue == null ? "" : String(savedRow.nameValue);
      if (nameControl.tagName === "SELECT" && savedNameValue &&
          ![...nameControl.options].some(option => option.value === savedNameValue)) {
        throw new Error("선택행에서 현재 사용할 수 없는 구분 ID를 발견했습니다: " + savedNameValue);
      }
      nameControl.value = savedNameValue;
      if (nameControl.tagName === "SELECT") {
        if (savedNameValue) row.dataset.sectionId = savedNameValue;
        else delete row.dataset.sectionId;
      }
    }

    if (applicationControl) {
      const savedApplicationValue = savedRow.applicationValue == null
        ? ""
        : String(savedRow.applicationValue);
      if (savedApplicationValue &&
          ![...applicationControl.options].some(option => option.value === savedApplicationValue)) {
        throw new Error("선택행에서 현재 사용할 수 없는 적용 형식 ID를 발견했습니다: " + savedApplicationValue);
      }
      applicationControl.value = savedApplicationValue;
    }

    if (valueControl) valueControl.value = savedRow.value;
    const binaryChanges = restoreBooleanControls(row, savedRow.booleanControls || []);
    binaryChanges.forEach(change => writeBooleanValue(change.control, change.value));

    return row;
  }

  function prepareRestore(data) {
    const preparedColumns = data.columns.map(savedColumn => {
      const columnId = String(savedColumn.columnId);
      const group = getCurrentColumns().find(candidate =>
        candidate.dataset.locationId === columnId
      );
      if (!group) {
        throw new Error("저장된 열을 현재 화면에서 찾을 수 없습니다: " + columnId);
      }

      const fixedRows = new Map(
        [...group.querySelectorAll(":scope > .input-row:not(.custom-row)")]
          .map(row => [row.dataset.sectionId || "", row])
      );
      const preparedOptionalRows = [];

      savedColumn.rows.forEach(savedRow => {
        if (savedRow.type === "fixed") {
          const fixedRow = fixedRows.get(savedRow.sectionId || "");
          if (!fixedRow) {
            throw new Error(
              "현재 화면에서 고정행 ID를 찾을 수 없습니다: " +
              (savedRow.sectionId || "(ID 없음)") + " (열 " + columnId + ")"
            );
          }
          if (savedRow.booleanControls) {
            restoreBooleanControls(fixedRow, savedRow.booleanControls);
          }
          return;
        }

        preparedOptionalRows.push({
          rowIndex: savedRow.rowIndex,
          element: prepareOptionalRow(columnId, savedRow)
        });
      });

      preparedOptionalRows.sort((a, b) => a.rowIndex - b.rowIndex);
      return {
        columnId,
        group,
        fixedRows,
        savedRows: savedColumn.rows,
        optionalRows: preparedOptionalRows
      };
    });

    const globalBooleanChanges = restoreBooleanControls(
      {
        querySelectorAll(selector) {
          return [...document.querySelectorAll(selector)].filter(control =>
            !control.closest(".input-row")
          );
        }
      },
      data.booleanOptions
    );

    return { preparedColumns, globalBooleanChanges };
  }

  function applyRestoredState(prepared) {
    prepared.preparedColumns.forEach(column => {
      column.savedRows.forEach(savedRow => {
        if (savedRow.type !== "fixed") return;
        const row = column.fixedRows.get(savedRow.sectionId || "");
        const valueControl = row.querySelector(".value-input");
        if (valueControl) valueControl.value = savedRow.value;

        const booleanChanges = restoreBooleanControls(row, savedRow.booleanControls || []);
        booleanChanges.forEach(change => writeBooleanValue(change.control, change.value));
      });
    });

    prepared.preparedColumns.forEach(column => {
      column.group.querySelectorAll(":scope > .input-row.custom-row").forEach(row => row.remove());
      const addButton = column.group.querySelector(":scope > .add-row-button");
      column.optionalRows.forEach(item => {
        column.group.insertBefore(item.element, addButton || null);
      });
    });

    prepared.globalBooleanChanges.forEach(change =>
      writeBooleanValue(change.control, change.value)
    );
  }

  function getSerializedCurrentState() {
    return JSON.stringify(collectCurrentState(), null, 2);
  }

  function handleSaveToBrowser() {
    try {
      const serialized = getSerializedCurrentState();
      window.localStorage.setItem(STORAGE_KEY, serialized);
      window.alert("현재 입력 데이터를 이 브라우저에 저장했습니다.");
    } catch (error) {
      const detail = error && error.name === "QuotaExceededError"
        ? "브라우저의 저장 공간이 부족합니다."
        : error && error.name === "SecurityError"
          ? "브라우저 설정으로 인해 로컬 저장소에 접근할 수 없습니다."
          : "브라우저 로컬 저장소에 기록하지 못했습니다.";
      window.alert("저장에 실패했습니다.\n" + detail + "\n오류 내용: " + (error?.message || "알 수 없는 오류"));
    }
  }

  function handleSaveToFile() {
    let objectUrl;
    try {
      const serialized = getSerializedCurrentState();
      const blob = new Blob([serialized], { type: "application/json;charset=utf-8" });
      objectUrl = URL.createObjectURL(blob);

      const now = new Date();
      const twoDigits = value => String(value).padStart(2, "0");
      const filename = "mobi-calculator-" +
        now.getFullYear() +
        twoDigits(now.getMonth() + 1) +
        twoDigits(now.getDate()) + "-" +
        twoDigits(now.getHours()) +
        twoDigits(now.getMinutes()) +
        twoDigits(now.getSeconds()) + ".json";

      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = filename;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      objectUrl = null;
      window.alert("현재 입력 데이터를 JSON 파일로 저장하도록 요청했습니다.");
    } catch (error) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      window.alert(
        "파일 저장에 실패했습니다.\n" +
        "브라우저가 파일 다운로드를 차단했거나 파일을 생성하지 못했습니다.\n" +
        "오류 내용: " + (error?.message || "알 수 없는 오류")
      );
    }
  }

  function restoreFromData(data) {
    validateStoredState(data);

    const confirmed = window.confirm(
      "현재 입력해 둔 데이터는 모두 유실되고, 선택한 저장 기록으로 대체됩니다.\n" +
      "계속 불러오시겠습니까?"
    );
    if (!confirmed) return;

    try {
      const prepared = prepareRestore(data);
      applyRestoredState(prepared);
      window.alert("저장 기록을 불러왔습니다.");
    } catch (error) {
      window.alert(
        "불러오기에 실패했습니다.\n" +
        (error?.message || "저장 데이터를 현재 화면에 적용하는 중 오류가 발생했습니다.") +
        "\n현재 개발 단계에서는 버전 변환이나 마이그레이션을 수행하지 않습니다."
      );
    }
  }

  function handleLoadFromBrowser() {
    let storedText;
    try {
      storedText = window.localStorage.getItem(STORAGE_KEY);
      if (storedText === null) {
        window.alert("불러올 브라우저 저장 기록이 없습니다. 먼저 저장-브라우저를 실행해 주세요.");
        return;
      }
      restoreFromData(JSON.parse(storedText));
    } catch (error) {
      window.alert(
        "브라우저 저장 기록을 불러올 수 없습니다.\n" +
        (error?.message || "저장 데이터를 읽는 중 오류가 발생했습니다.")
      );
    }
  }

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json,application/json";
  fileInput.hidden = true;
  fileInput.setAttribute("aria-label", "불러올 마비노기 모바일 계산기 JSON 파일 선택");
  document.body.appendChild(fileInput);

  function handleLoadFromFile(file) {
    if (!file) return;

    const isJsonFile = file.name.toLowerCase().endsWith(".json") ||
      file.type === "application/json";
    if (!isJsonFile) {
      window.alert("JSON 파일만 불러올 수 있습니다. 저장한 .json 파일을 선택해 주세요.");
      return;
    }

    file.text().then(text => {
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("파일 내용이 올바른 JSON 형식이 아닙니다.");
      }
      restoreFromData(data);
    }).catch(error => {
      window.alert(
        "파일 불러오기에 실패했습니다.\n" +
        (error?.message || "파일을 읽는 중 오류가 발생했습니다.")
      );
    });
  }

  function closeMenu(menu, trigger) {
    if (menu.hidden) {
      trigger.setAttribute("aria-expanded", "false");
      return;
    }

    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");

    const finishClose = event => {
      if (event && (event.target !== menu || event.propertyName !== "opacity")) return;
      if (menu.classList.contains("is-open")) return;
      menu.hidden = true;
      menu.removeEventListener("transitionend", finishClose);
    };
    menu.addEventListener("transitionend", finishClose);
    window.setTimeout(() => finishClose(), 220);
  }

  function openMenu(menu, trigger) {
    menu.hidden = false;
    menu.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(() => {
      if (!menu.hidden) menu.classList.add("is-open");
    });
  }

  function toggleMenu(which) {
    const openingSave = which === "save";
    const targetMenu = openingSave ? saveSubmenu : loadSubmenu;
    const targetButton = openingSave ? saveButton : loadButton;
    const otherMenu = openingSave ? loadSubmenu : saveSubmenu;
    const otherButton = openingSave ? loadButton : saveButton;

    const wasOpen = !targetMenu.hidden && targetMenu.classList.contains("is-open");
    closeMenu(otherMenu, otherButton);

    if (wasOpen) {
      closeMenu(targetMenu, targetButton);
    } else {
      openMenu(targetMenu, targetButton);
    }
  }

  saveButton.addEventListener("click", () => toggleMenu("save"));
  loadButton.addEventListener("click", () => toggleMenu("load"));
  saveBrowserButton.addEventListener("click", () => {
    closeMenu(saveSubmenu, saveButton);
    handleSaveToBrowser();
  });
  saveFileButton.addEventListener("click", () => {
    closeMenu(saveSubmenu, saveButton);
    handleSaveToFile();
  });
  loadBrowserButton.addEventListener("click", () => {
    closeMenu(loadSubmenu, loadButton);
    handleLoadFromBrowser();
  });
  loadFileButton.addEventListener("click", () => {
    closeMenu(loadSubmenu, loadButton);
    fileInput.value = "";
    fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    handleLoadFromFile(file);
  });

  document.addEventListener("click", event => {
    if (event.target.closest(".data-action-buttons")) return;
    closeMenu(saveSubmenu, saveButton);
    closeMenu(loadSubmenu, loadButton);
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    closeMenu(saveSubmenu, saveButton);
    closeMenu(loadSubmenu, loadButton);
  });
})();

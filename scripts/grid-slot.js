(function () {
  "use strict";

  const dateInput    = document.getElementById("bookingDate");
  const wrapper       = document.getElementById("slotGridWrapper");
  const grid           = document.getElementById("slotGrid");
  const summary        = document.getElementById("slotSummary");
  const summaryTimeEl  = summary.querySelector(".slot-summary-time");
  const changeBtn       = summary.querySelector(".slot-summary-change");
  const hiddenTimeInput = document.getElementById("bookingTime");

  function getMockSlots() {
    const slots = [];
    let hour = 9, minute = 0;
    while (hour < 23) {
      const time = String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
      slots.push({ time, isAvailable: Math.random() > 0.5 });
      minute += 30;
      if (minute === 60) { minute = 0; hour += 1; }
    }
    return slots;
  }

  function buildRow(slot) {
    const row = document.createElement("div");
    row.className = "slot-row";
    row.dataset.status = slot.isAvailable ? "available" : "unavailable";
    row.dataset.time = slot.time;

    const timeEl = document.createElement("span");
    timeEl.className = "slot-time";
    timeEl.textContent = slot.time;

    const statusEl = document.createElement("span");
    statusEl.className = "slot-status";

    if (slot.isAvailable) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-select-btn";
      btn.textContent = "انتخاب";
      btn.addEventListener("click", () => selectSlot(slot.time));
      statusEl.appendChild(btn);
    } else {
      const span = document.createElement("span");
      span.className = "slot-status-text";
      span.textContent = "رزرو شده";
      statusEl.appendChild(span);
    }

    row.appendChild(timeEl);
    row.appendChild(statusEl);
    return row;
  }

  function markRuns(rows) {
    rows.forEach((row, i) => {
      const prev = rows[i - 1];
      const next = rows[i + 1];
      const isRunStart = !prev || prev.dataset.status !== row.dataset.status;
      const isRunEnd   = !next || next.dataset.status !== row.dataset.status;
      row.classList.toggle("run-start", isRunStart);
      row.classList.toggle("run-end", isRunEnd);
    });
  }

  function renderInactiveGrid() {
    grid.innerHTML = "";
    const rows = [];
    let hour = 9, minute = 0;
    while (hour < 23) {
      const time = String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
      const row = document.createElement("div");
      row.className = "slot-row";
      row.dataset.status = "inactive";
      row.dataset.time = time;

      const timeEl = document.createElement("span");
      timeEl.className = "slot-time";
      timeEl.textContent = time;

      const statusEl = document.createElement("span");
      statusEl.className = "slot-status";
      statusEl.textContent = "—";

      row.appendChild(timeEl);
      row.appendChild(statusEl);
      grid.appendChild(row);
      rows.push(row);

      minute += 30;
      if (minute === 60) { minute = 0; hour += 1; }
    }
    markRuns(rows);
  }

  function renderActiveGrid() {
    grid.innerHTML = "";
    const slots = getMockSlots();
    const rows = slots.map(buildRow);
    rows.forEach(r => grid.appendChild(r));
    markRuns(rows);
  }

  function handleDateChange() {
    hiddenTimeInput.value = "";
    summary.classList.remove("is-visible");
    
    wrapper.style.display = "block";
    wrapper.style.pointerEvents = "auto";
    wrapper.classList.remove("is-collapsed");

    if (dateInput.value) {
      wrapper.classList.remove("is-disabled");
      renderActiveGrid();
    } else {
      wrapper.classList.add("is-disabled");
      renderInactiveGrid();
    }
  }

  function selectSlot(time) {
    hiddenTimeInput.value = time;
    wrapper.classList.add("is-collapsed");
    wrapper.style.pointerEvents = "none";
    
    setTimeout(() => {
      if (wrapper.classList.contains("is-collapsed")) {
        wrapper.style.display = "none";
      }
    }, 1000);

    summaryTimeEl.textContent = time;
    summary.classList.add("is-visible");
  }

  function handleChangeClick() {
    summary.classList.remove("is-visible");
    hiddenTimeInput.value = "";
    
    wrapper.style.display = "block";
    wrapper.offsetHeight;
    
    wrapper.classList.remove("is-collapsed");
    wrapper.style.pointerEvents = "auto";
    renderActiveGrid();
  }

  dateInput.addEventListener("change", handleDateChange);
  changeBtn.addEventListener("click", handleChangeClick);

  renderInactiveGrid();
})();
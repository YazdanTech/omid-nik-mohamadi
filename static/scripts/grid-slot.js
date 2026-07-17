(function () {
    "use strict";

    // --- State ---
    let currentStep = 1;
    let bookingData = {
        serviceId: null,
        serviceDuration: 0,
        serviceName: "",
        servicePrice: 0,
        date: "",
        time: "",
        note: "",
        bypassCode: ""
    };

    // --- Elements ---
    const modalSteps = document.querySelectorAll(".modal-step");
    const progressSteps = document.querySelectorAll(".progress-step");
    const continueBtn = document.getElementById("continueBtn");
    const backBtn = document.getElementById("backBtn");

    // Step 1 Elements
    const serviceItems = document.querySelectorAll(".service-item");

    // Step 2 Elements
    const dateInput = document.getElementById("bookingDate");
    const noteInput = document.getElementById("bookingNote");
    const hiddenTimeInput = document.getElementById("bookingTime");
    const wrapper = document.getElementById("slotGridWrapper");
    const grid = document.getElementById("slotGrid");
    const summary = document.getElementById("slotSummary");
    const summaryTimeEl = summary.querySelector(".slot-summary-time");
    const changeBtn = summary.querySelector(".slot-summary-change");

    // Step 3 Elements
    const summaryServicesList = document.getElementById("summaryServicesList");
    const summaryDate = document.getElementById("summaryDate");
    const summaryTime = document.getElementById("summaryTime");
    const summaryNote = document.getElementById("summaryNote");
    const bypassInput = document.getElementById("bypassCode");


    // --- Step 1: Service Selection ---
    serviceItems.forEach(item => {
        const input = item.querySelector(".service-select");
        input.addEventListener("change", () => {
            // Since booking expects one primary service slot: uncheck/unselect others
            serviceItems.forEach(other => {
                if (other !== item) {
                    other.querySelector(".service-select").checked = false;
                }
            });

            if (input.checked) {
                bookingData.serviceId = item.dataset.serviceId;
                bookingData.servicePk = item.dataset.servicePk;
                bookingData.serviceDuration = parseInt(item.dataset.duration) || 30;
                bookingData.serviceName = item.dataset.name;
                bookingData.servicePrice = item.dataset.price;
                continueBtn.disabled = false;
            } else {
                bookingData.serviceId = null;
                continueBtn.disabled = true;
            }
        });
    });


    // --- Step 2: Slot Fetch & Grid Population ---
    async function fetchAvailableSlots(date, duration) {
        // 1. Double check your correct path here (with or without /api/)
        const url = `/api/booking/available-slots/?date=${date}&duration=${duration}`;
        console.log("Fetching from URL:", url);

        try {
            const response = await fetch(url);
            console.log("Response status:", response.status);

            if (!response.ok) {
                const errText = await response.text();
                console.error("Backend returned error:", errText);
                throw new Error();
            }

            const data = await response.json();
            console.log("Raw data from backend:", data); // Check if this list is empty!

            return data.available_slots.map(time => time.slice(0, 5));
        } catch (err) {
            console.error("Error in fetchAvailableSlots:", err);
            return [];
        }
    }

    function buildRow(time, isAvailable) {
        const row = document.createElement("div");
        row.className = "slot-row";
        row.dataset.status = isAvailable ? "available" : "unavailable";
        row.dataset.time = time;

        const timeEl = document.createElement("span");
        timeEl.className = "slot-time";
        timeEl.textContent = time;

        const statusEl = document.createElement("span");
        statusEl.className = "slot-status";

        if (isAvailable) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "slot-select-btn";
            btn.textContent = "انتخاب";
            btn.addEventListener("click", () => selectSlot(time));
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
            row.classList.toggle("run-start", !prev || prev.dataset.status !== row.dataset.status);
            row.classList.toggle("run-end", !next || next.dataset.status !== row.dataset.status);
        });
    }

    async function handleDateChange() {
        bookingData.date = dateInput.value;
        bookingData.time = "";
        hiddenTimeInput.value = "";
        continueBtn.disabled = true;

        summary.classList.remove("is-visible");
        wrapper.style.display = "block";
        wrapper.style.pointerEvents = "auto";
        wrapper.classList.remove("is-collapsed");

        if (bookingData.date) {
            wrapper.classList.remove("is-disabled");
            grid.innerHTML = '<div style="text-align:center; padding:20px; color:white;">در حال بارگذاری...</div>';

            const availableStarts = await fetchAvailableSlots(bookingData.date, bookingData.serviceDuration);

            grid.innerHTML = "";
            const rows = [];
            let hour = 9, minute = 0;
            while (hour < 23) {
                const time = String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
                const isAvailable = availableStarts.includes(time);
                const row = buildRow(time, isAvailable);
                grid.appendChild(row);
                rows.push(row);

                minute += 30;
                if (minute === 60) { minute = 0; hour += 1; }
            }
            markRuns(rows);
        } else {
            wrapper.classList.add("is-disabled");
            grid.innerHTML = ""; // Inactive state
        }
    }

    function selectSlot(time) {
        bookingData.time = time;
        hiddenTimeInput.value = time;
        continueBtn.disabled = false;

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

    changeBtn.addEventListener("click", () => {
        bookingData.time = "";
        hiddenTimeInput.value = "";
        continueBtn.disabled = true;
        handleDateChange();
    });

    dateInput.addEventListener("change", handleDateChange);


    // --- Step 3: Populate & Booking Execution ---
    function renderSummary() {
        summaryServicesList.textContent = `${bookingData.serviceName} (${bookingData.serviceDuration} دقیقه)`;
        summaryDate.textContent = bookingData.date;
        summaryTime.textContent = bookingData.time;
        summaryNote.textContent = noteInput.value || "—";
        continueBtn.textContent = "ثبت نوبت و پرداخت";
        continueBtn.disabled = false;
    }

    async function executeBookingSubmit() {
        continueBtn.disabled = true;
        continueBtn.textContent = "در حال ثبت...";

        const payload = {
            service_id: bookingData.servicePk,
            date: bookingData.date,
            start_time: bookingData.time,
            bypass_code: bypassInput.value.trim()
        };

        try {
            // 1. Submit the booking request
            const response = await fetch("/api/booking/create/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.detail || "مشکلی در ثبت رزرو به وجود آمد.");
                return;
            }

            const booking = await response.json();

            // 2. If bypassed, go straight to success page
            if (booking.status === "CONFIRMED") {
                window.location.href = "/booking/success/";
                return;
            }

            // 3. Otherwise, get the ZarinPal payment gateway URL
            if (booking.payment_id) {
                const payResponse = await fetch("/api/payment/request/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCSRFToken()
                    },
                    body: JSON.stringify({ payment_id: booking.payment_id })
                });

                if (!payResponse.ok) {
                    const payData = await payResponse.json();
                    alert(payData.detail || "خطا در اتصال به درگاه پرداخت.");
                    return;
                }

                const payData = await payResponse.json();
                if (payData.payment_url) {
                    // Redirect directly to ZarinPal
                    window.location.href = payData.payment_url;
                } else {
                    alert("آدرس درگاه پرداخت دریافت نشد.");
                }
            } else {
                alert("شناسه پرداخت یافت نشد.");
            }

        } catch (err) {
            console.error(err);
            alert("ارتباط با سرور برقرار نشد.");
        } finally {
            continueBtn.disabled = false;
            continueBtn.textContent = "ثبت نوبت و پرداخت";
        }
    }


    // --- Steps & Navigation Rules ---
    function updateStepUI() {
        modalSteps.forEach(step => {
            step.style.display = parseInt(step.dataset.step) === currentStep ? "block" : "none";
        });

        progressSteps.forEach(p => {
            const stepNum = parseInt(p.dataset.step);
            p.classList.toggle("is-active", stepNum === currentStep);
            p.classList.toggle("is-completed", stepNum < currentStep);
        });

        backBtn.style.visibility = currentStep === 1 ? "hidden" : "visible";
        continueBtn.textContent = "ادامه";

        // Navigation state lock verification
        if (currentStep === 1) {
            continueBtn.disabled = !bookingData.serviceId;
        } else if (currentStep === 2) {
            continueBtn.disabled = !bookingData.time;
        } else if (currentStep === 3) {
            renderSummary();
        }
    }

    continueBtn.addEventListener("click", () => {
        if (currentStep === 3) {
            executeBookingSubmit();
        } else {
            currentStep++;
            updateStepUI();
        }
    });

    backBtn.addEventListener("click", () => {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
        }
    });

    updateStepUI();
})();
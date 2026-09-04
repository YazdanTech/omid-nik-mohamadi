function getCSRFToken() {
    return document.cookie.split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1] || "";
}

"use strict";

// --- State ---
let currentStep = 1;
// WITH THIS:
let bookingData = {
    services: [], // Holds all selected service objects
    totalDuration: 0,
    totalPrice: 0,
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
function updateSelectedServices() {
    bookingData.services = [];
    let totalDuration = 0;
    let totalPrice = 0;

    serviceItems.forEach(item => {
        const input = item.querySelector(".service-select");
        if (input.checked) {
            const duration = parseInt(item.dataset.duration) || 30;
            const price = parseFloat(item.dataset.price) || 0;

            bookingData.services.push({
                id: item.dataset.serviceId,
                pk: item.dataset.servicePk,
                name: item.dataset.name,
                duration: duration,
                price: price
            });

            totalDuration += duration;
            totalPrice += price;
        }
    });

    bookingData.totalDuration = totalDuration;
    bookingData.totalPrice = totalPrice;
    continueBtn.disabled = bookingData.services.length === 0;
}

serviceItems.forEach(item => {
    const input = item.querySelector(".service-select");
    input.addEventListener("change", updateSelectedServices);
});


// --- Step 2: Slot Fetch & Grid Population ---
async function fetchAvailableSlots(date, duration) {
    const url = `/api/booking/available-slots/?date=${date}&duration=${duration}`;
    console.log("Fetching from URL:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Backend error status:", response.status);
            return [];
        }

        const data = await response.json();
        console.log("Raw data from backend:", data);

        if (!data || !Array.isArray(data.available_slots)) {
            console.error("Expected 'available_slots' array but got:", data);
            return [];
        }

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

        try {
            // Safe date formatting check
            let gregorianDate = bookingData.date.replaceAll("/", "-");
            if (typeof moment !== "undefined") {
                gregorianDate = moment(bookingData.date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
            }

            const availableStarts = await fetchAvailableSlots(gregorianDate, bookingData.totalDuration);

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
        } catch (err) {
            console.error("Error rendering slots:", err);
            grid.innerHTML = '<div style="text-align:center; padding:20px; color:#ff6b6b;">خطا در دریافت زمان‌های خالی</div>';
        }
    } else {
        wrapper.classList.add("is-disabled");
        grid.innerHTML = "";
    }
}

function selectSlot(time) {
    bookingData.time = time;
    hiddenTimeInput.value = time;
    continueBtn.disabled = false;

    wrapper.classList.add("is-collapsed");
    wrapper.style.pointerEvents = "none";
    if (wrapper.classList.contains("is-collapsed")) {
        wrapper.style.display = "none";
    }

    summaryTimeEl.textContent = time;
    summary.classList.add("is-visible");
}

changeBtn.addEventListener("click", () => {
    bookingData.time = "";
    hiddenTimeInput.value = "";
    continueBtn.disabled = true;
    handleDateChange();
});

// Initialize jalalidatepicker
jalaliDatepicker.startWatch();

// Listen for date selection (this library fires native "change" events)
dateInput.addEventListener("change", function () {
    bookingData.date = dateInput.value; // Format is YYYY/MM/DD
    handleDateChange();
});


// --- Step 3: Populate & Booking Execution ---
function renderSummary() {
    const serviceNames = bookingData.services.map(s => s.name).join(" + ");
    summaryServicesList.textContent = `${serviceNames} (${bookingData.totalDuration} دقیقه)`;
    summaryDate.textContent = bookingData.date;
    summaryTime.textContent = bookingData.time;
    summaryNote.textContent = noteInput.value || "—";
    continueBtn.textContent = "ثبت نوبت و پرداخت";
    continueBtn.disabled = false;
}

export async function executeBookingSubmit() {
    continueBtn.disabled = true;
    continueBtn.textContent = "در حال ثبت...";

    const payload = {
        service_ids: bookingData.services.map(s => s.pk), // Send array of selected service PKs
        date: moment(bookingData.date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD'),
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
const TOTAL_STEPS = 3;
const TIME_MIN = '09:00';
const TIME_MAX = '23:00';

let currentStep = 1;

document.addEventListener('DOMContentLoaded', init);

function init() {
  setDateBoundary();
  bindTriggers();
  bindExclusivity();
  bindClose();
  bindNavigation();
  bindStepValidation();
  goToStep(1);
}

function setDateBoundary() {
  const dateInput = document.getElementById('bookingDate');
  if (!dateInput) return;
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 180);
  dateInput.min = formatDate(today);
  dateInput.max = formatDate(maxDate);
}

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function bindTriggers() {
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-open-booking]');
    if (!trigger) return;
    const serviceId = trigger.getAttribute('data-service-id');
    openModal(serviceId);
  });
}

function openModal(serviceId) {
  const overlay = document.getElementById('bookingModalOverlay');
  overlay.classList.add('is-open');
  if (serviceId) preselectService(serviceId);
  goToStep(1);
}

function closeModal() {
  const overlay = document.getElementById('bookingModalOverlay');
  overlay.classList.remove('is-open');
}

function bindClose() {
  const closeBtn = document.getElementById('modalCloseBtn');
  const overlay = document.getElementById('bookingModalOverlay');
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
}

function preselectService(serviceId) {
  const target = document.querySelector(`.service-item[data-service-id="${serviceId}"]`);
  if (!target) return;
  const input = target.querySelector('.service-select');
  if (!input) return;
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function bindExclusivity() {
  const normalList = document.getElementById('normalServiceList');
  const groomingList = document.getElementById('groomingServiceList');
  if (!normalList || !groomingList) return;

  normalList.addEventListener('change', function (e) {
    if (!e.target.classList.contains('service-select')) return;
    if (e.target.checked) {
      clearCategory(groomingList);
    }
    updateContinueState();
  });

  groomingList.addEventListener('change', function (e) {
    if (!e.target.classList.contains('service-select')) return;
    if (e.target.checked) {
      clearCategory(normalList);
    }
    updateContinueState();
  });
}

function clearCategory(listEl) {
  listEl.querySelectorAll('.service-select').forEach(function (input) {
    input.checked = false;
  });
}

function bindStepValidation() {
  const dateInput = document.getElementById('bookingDate');
  const timeInput = document.getElementById('bookingTime');
  if (dateInput) dateInput.addEventListener('input', updateContinueState);
  if (timeInput) timeInput.addEventListener('input', updateContinueState);
}

function bindNavigation() {
  const backBtn = document.getElementById('backBtn');
  const continueBtn = document.getElementById('continueBtn');

  backBtn.addEventListener('click', function () {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  continueBtn.addEventListener('click', function () {
    if (currentStep === TOTAL_STEPS) {
      submitBooking();
      return;
    }
    if (!isStepValid(currentStep)) return;
    if (currentStep === 2) populateSummary();
    goToStep(currentStep + 1);
  });
}

function goToStep(step) {
  currentStep = step;

  document.querySelectorAll('.modal-step').forEach(function (section) {
    const isActive = Number(section.getAttribute('data-step')) === step;
    section.classList.toggle('is-active', isActive);
    section.setAttribute('aria-hidden', String(!isActive));
  });

  document.querySelectorAll('.progress-step').forEach(function (el) {
    const idx = Number(el.getAttribute('data-step'));
    el.classList.toggle('is-active', idx === step);
    el.classList.toggle('is-complete', idx < step);
    if (idx === step) {
      el.setAttribute('aria-current', 'step');
    } else {
      el.removeAttribute('aria-current');
    }
  });

  document.getElementById('backBtn').disabled = step === 1;
  document.getElementById('continueBtn').textContent = step === TOTAL_STEPS ? 'پرداخت بیعانه' : 'ادامه';

  updateContinueState();
}

function isStepValid(step) {
  if (step === 1) {
    return !!document.querySelector('.service-select:checked');
  }
  if (step === 2) {
    const dateInput = document.getElementById('bookingDate');
    const timeInput = document.getElementById('bookingTime');
    if (!dateInput.value || !timeInput.value) return false;
    return isTimeInRange(timeInput.value);
  }
  return true;
}

function isTimeInRange(value) {
  return value >= TIME_MIN && value <= TIME_MAX;
}

function updateContinueState() {
  const isValid = isStepValid(currentStep);
  document.getElementById('continueBtn').disabled = !isValid;

  if (currentStep === 2) {
    const timeInput = document.getElementById('bookingTime');
    const timeError = document.getElementById('timeErrorMsg');
    
    if (timeInput && timeInput.value) {
      const isInvalidTime = !isTimeInRange(timeInput.value);
      
      timeInput.classList.toggle('is-invalid', isInvalidTime);
      if (timeError) {
        timeError.classList.toggle('is-visible', isInvalidTime);
      }
    } else {
      if (timeInput) timeInput.classList.remove('is-invalid');
      if (timeError) timeError.classList.remove('is-visible');
    }
  }
}

function populateSummary() {
  const servicesList = document.getElementById('summaryServicesList');
  const dateEl = document.getElementById('summaryDate');
  const timeEl = document.getElementById('summaryTime');
  const noteEl = document.getElementById('summaryNote');

  servicesList.innerHTML = '';
  document.querySelectorAll('.service-select:checked').forEach(function (input) {
    const item = input.closest('.service-item');
    const name = item.querySelector('.service-name').textContent;
    const price = item.querySelector('.service-price').textContent;

    const row = document.createElement('div');
    row.className = 'summary-service-item';

    const nameEl = document.createElement('span');
    nameEl.className = 'name';
    nameEl.textContent = name;

    const priceEl = document.createElement('span');
    priceEl.className = 'price';
    priceEl.textContent = price;

    row.appendChild(nameEl);
    row.appendChild(priceEl);
    servicesList.appendChild(row);
  });

  const dateInput = document.getElementById('bookingDate');
  const timeInput = document.getElementById('bookingTime');
  const noteInput = document.getElementById('bookingNote');

  dateEl.textContent = dateInput.value || '—';
  timeEl.textContent = timeInput.value || '—';
  noteEl.textContent = noteInput.value.trim() || '—';
}

function submitBooking() {
  const overlay = document.getElementById('bookingModalOverlay');
  overlay.dispatchEvent(new CustomEvent('booking:pay', { bubbles: true }));
}
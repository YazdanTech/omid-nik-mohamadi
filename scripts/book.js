const IS_AUTHENTICATED = true;

document.addEventListener('DOMContentLoaded', init);

function init() {
  setAuthState();
  setDateBoundary();
  bindTriggers();
  bindExclusivity();
  bindClose();
}

function setAuthState() {
  const unauth = document.getElementById('authStateUnauth');
  const auth = document.getElementById('authStateAuth');
  if (IS_AUTHENTICATED) {
    unauth.classList.remove('is-visible');
    auth.classList.add('is-visible');
  } else {
    auth.classList.remove('is-visible');
    unauth.classList.add('is-visible');
  }
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
  if (!input || input.disabled) return;
  input.checked = true;
  input.focus();
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
      setCategoryLock(groomingList, true);
    } else if (!normalList.querySelector('.service-select:checked')) {
      setCategoryLock(groomingList, false);
    }
  });

  groomingList.addEventListener('change', function (e) {
    if (!e.target.classList.contains('service-select')) return;
    if (e.target.checked) {
      clearCategory(normalList);
      setCategoryLock(normalList, true);
    } else {
      setCategoryLock(normalList, false);
    }
  });
}

function clearCategory(listEl) {
  listEl.querySelectorAll('.service-select').forEach(function (input) {
    input.checked = false;
  });
}

function setCategoryLock(listEl, locked) {
  listEl.querySelectorAll('.service-select').forEach(function (input) {
    input.disabled = locked;
  });
  listEl.classList.toggle('is-locked', locked);
}


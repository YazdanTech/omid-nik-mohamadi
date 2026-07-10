const overlay = document.getElementById('checkoutOverlay');
const checkoutModal = document.getElementById('checkoutModal');
const modalClose = document.getElementById('modalClose');
const stateUnauth = document.getElementById('stateUnauth');
const stateAuth = document.getElementById('stateAuth');
const summaryImg = document.getElementById('summaryImg');
const summaryName = document.getElementById('summaryName');
const summaryPrice = document.getElementById('summaryPrice');
const shippingForm = document.getElementById('shippingForm');

function openModal(product) {
  // Read auth status dynamically from AuthModule window namespace
  const authenticated = window.AuthModule ? window.AuthModule.isAuthenticated : false;

  if (!authenticated) {
    closeModal();
    if (window.AuthModule && typeof window.AuthModule.open === 'function') {
      window.AuthModule.open();
    } else {
      console.error("AuthModule.open is not available.");
    }
    return;
  }

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    if (checkoutModal) {
      checkoutModal.style.animation = '10s border-shine infinite alternate-reverse';
    }
  }, 1000);

  if (stateAuth) stateAuth.classList.add('active');
  if (stateUnauth) stateUnauth.classList.remove('active');
  if (summaryImg) {
    summaryImg.src = product.img;
    summaryImg.alt = product.name;
  }
  if (summaryName) summaryName.textContent = product.name;
  if (summaryPrice) summaryPrice.textContent = product.price;
}

function closeModal() {
  if (!overlay) return;
  overlay.classList.remove('active');
  setTimeout(() => {
    if (checkoutModal) {
      checkoutModal.style.animation = 'modalIn 1s ease';
      checkoutModal.style.animationDirection = 'linear';
    }
  }, 1000);
  document.body.style.overflow = '';
}

document.querySelectorAll('.btn-buy').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card');
    if (!card) return;
    const product = {
      id: card.dataset.id,
      name: card.dataset.name,
      price: card.dataset.price,
      img: card.dataset.img
    };
    openModal(product);
  });
});

if (modalClose) modalClose.addEventListener('click', closeModal);

if (overlay) {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) closeModal();
});

if (shippingForm) {
  shippingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('proceed to payment');
  });
}
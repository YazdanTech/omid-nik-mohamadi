const isUserAuthenticated = true;

const overlay = document.getElementById('checkoutOverlay');
const checkoutModal = document.getElementById('checkoutModal');
const modalClose = document.getElementById('modalClose');
const stateUnauth = document.getElementById('stateUnauth');
const stateAuth = document.getElementById('stateAuth');
const summaryImg = document.getElementById('summaryImg');
const summaryName = document.getElementById('summaryName');
const summaryPrice = document.getElementById('summaryPrice');
const shippingForm = document.getElementById('shippingForm');

// function formatToman(value) {
//   return Number(value).toLocaleString('fa-IR') + ' تومان';
// }

function openModal(product) {
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';;

  setTimeout(() => {
    checkoutModal.style.animation = '10s border-shine infinite alternate-reverse';
  }, 1000)

  if (isUserAuthenticated) {
    stateAuth.classList.add('active');
    stateUnauth.classList.remove('active');
    summaryImg.src = product.img;
    summaryImg.alt = product.name;
    summaryName.textContent = product.name;
    summaryPrice.textContent = product.price;
  } else {
    stateUnauth.classList.add('active');
    stateAuth.classList.remove('active');
  }
}

function closeModal() {
  overlay.classList.remove('active');
  setTimeout(() => {
    checkoutModal.style.animation = 'modalIn 1s ease';
    checkoutModal.style.animationDirection = 'linear';
  }, 1000)
  document.body.style.overflow = '';
}

document.querySelectorAll('.btn-buy').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card');
    const product = {
      id: card.dataset.id,
      name: card.dataset.name,
      price: card.dataset.price,
      img: card.dataset.img
    };
    openModal(product);
  });
});

modalClose.addEventListener('click', closeModal);

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
});

shippingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('proceed to payment');
});


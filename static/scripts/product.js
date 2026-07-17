const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutModal = document.getElementById('checkoutModal');
const checkoutModalClose = document.getElementById('modalClose');
const stateUnauth = document.getElementById('stateUnauth');
const stateAuth = document.getElementById('stateAuth');
const summaryImg = document.getElementById('summaryImg');
const summaryName = document.getElementById('summaryName');
const summaryPrice = document.getElementById('summaryPrice');
const shippingForm = document.getElementById('shippingForm');

// Keep track of the currently selected product
let activeProduct = null;

// Helper to get CSRF token for Django requests
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function openCheckoutModal(product) {
  // Read auth status dynamically from AuthModule window namespace
  const authenticated = window.AuthModule ? window.AuthModule.isAuthenticated : false;

  if (!authenticated) {
    closeCheckoutModal();
    if (window.AuthModule && typeof window.AuthModule.open === 'function') {
      window.AuthModule.open();
    } else {
      console.error("AuthModule.open is not available.");
    }
    return;
  }

  // Store the active product data globally in this scope
  activeProduct = product;

  if (checkoutOverlay) {
    checkoutOverlay.classList.add('active');
  }
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

function closeCheckoutModal() {
  if (!checkoutOverlay) return;
  checkoutOverlay.classList.remove('active');
  setTimeout(() => {
    if (checkoutModal) {
      checkoutModal.style.animation = 'modalIn 1s ease';
      checkoutModal.style.animationDirection = 'linear';
    }
  }, 1000);
  document.body.style.overflow = '';
  activeProduct = null;
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
    openCheckoutModal(product);
  });
});

if (checkoutModalClose) {
  checkoutModalClose.addEventListener('click', closeCheckoutModal);
}

if (checkoutOverlay) {
  checkoutOverlay.addEventListener('click', (e) => {
    if (e.target === checkoutOverlay) closeCheckoutModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && checkoutOverlay && checkoutOverlay.classList.contains('active')) {
    closeCheckoutModal();
  }
});

// Handle Shipping Form Submit & Gateway Redirection
if (shippingForm) {
  shippingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!activeProduct) {
      alert("خطایی رخ داده است. لطفا مجددا تلاش کنید.");
      return;
    }

    const submitBtn = shippingForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "پرداخت";

    // Show loading state & disable button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "در حال انتقال به درگاه پرداخت...";
    }

    const formData = new FormData(shippingForm);
    const orderData = {
      product_id: activeProduct.id,
      address: formData.get('address'),
      postal_code: formData.get('postal_code'),
      // Add other relevant checkout fields here
    };

    try {
      const csrfToken = getCookie('csrftoken');

      // Step 1: Create the Booking/Order to get a payment ID from your Django backend
      // (Adjust '/api/bookings/' to your specific order/booking creation endpoint)
      const orderResponse = await fetch('/api/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        throw new Error("خطا در ایجاد سفارش");
      }

      const orderResult = await orderResponse.json();
      const paymentId = orderResult.payment_id; // Your endpoint must return this ID

      // Step 2: Request the ZarinPal payment URL using the retrieved payment_id
      const paymentResponse = await fetch('/api/payment/request/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ payment_id: paymentId })
      });

      const paymentResult = await paymentResponse.json();

      if (paymentResponse.ok && paymentResult.payment_url) {
        // Step 3: Redirect the browser directly to the ZarinPal payment gateway
        window.location.href = paymentResult.payment_url;
      } else {
        throw new Error(paymentResult.detail || "خطا در اتصال به درگاه پرداخت");
      }

    } catch (error) {
      console.error(error);
      alert(error.message || "بروز خطا در برقراری ارتباط با سرور");
      
      // Restore button state on failure
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
}
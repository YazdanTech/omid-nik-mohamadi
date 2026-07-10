const isUserAuthenticated = false;

const overlay = document.getElementById('checkoutOverlay');
const checkoutModal = document.getElementById('checkoutModal');
const modalClose = document.getElementById('modalClose');
const stateUnauth = document.getElementById('stateUnauth');
const stateAuth = document.getElementById('stateAuth');
const summaryImg = document.getElementById('summaryImg');
const summaryName = document.getElementById('summaryName');
const summaryPrice = document.getElementById('summaryPrice');
const shippingForm = document.getElementById('shippingForm');
const createAccountBtn = document.getElementById('createAccountBtn');
const signInAccountBtn = document.getElementById('signInAccountBtn');
const signInFormContainer = document.getElementById('signInFormContainer');
const signUpFormContainer = document.getElementById('signUpFormContainer');

function switchForm(formToHide, formToShow) {
  // Set transition speed (0.5s out + 0.5s in = 1s total)
  formToHide.style.transition = 'opacity 0.5s ease';
  formToShow.style.transition = 'opacity 0.5s ease';

  // 1. Fade out the current form
  formToHide.style.opacity = '0';

  setTimeout(() => {
    // 2. Swap display states after fade-out finishes
    formToHide.style.display = 'none';
    formToShow.style.display = 'block';
    formToShow.style.opacity = '0';

    // Trigger a browser reflow to register the display change
    formToShow.offsetHeight;

    // 3. Fade in the new form
    formToShow.style.opacity = '1';
  }, 500);
}

function signUp() {
  switchForm(signInFormContainer, signUpFormContainer);
}

function signIn() {
  switchForm(signUpFormContainer, signInFormContainer);
}

createAccountBtn.addEventListener('click', signUp);
signInAccountBtn.addEventListener('click', signIn);
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























(function () {
    'use strict';


    document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var targetId = btn.getAttribute('data-toggle-password');
            var input = document.getElementById(targetId);
            if (!input) return;
            var isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            btn.classList.toggle('is-active', isHidden);
            btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
        });
    });

    var authTabs = document.querySelectorAll('.auth__tab');
    if (authTabs.length) {
        authTabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                authTabs.forEach(function (t) {
                    t.classList.remove('auth__tab--active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('auth__tab--active');
                tab.setAttribute('aria-selected', 'true');

                var target = tab.getAttribute('data-tab-target');
                document.querySelectorAll('.auth__field[data-field]').forEach(function (field) {
                    var matches = field.getAttribute('data-field') === target;
                    field.style.display = matches ? '' : 'none';
                    var input = field.querySelector('.auth__input');
                    if (input) {
                        input.required = matches;
                    }
                });
            });
        });
    }

    var signInForm = document.getElementById('signInForm');
    if (signInForm) {
        signInForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var errorEl = document.getElementById('signInError');
            var visibleField = signInForm.querySelector('.auth__field:not([style*="display: none"]) .auth__input');
            if (visibleField && !visibleField.value.trim()) {
                if (errorEl) {
                    errorEl.textContent = visibleField.type === 'email'
                        ? 'Please enter your email address.'
                        : 'Please enter your mobile number.';
                }
                return;
            }
            var passwordField = document.getElementById('signInPassword');
            if (passwordField && !passwordField.value.trim()) {
                if (errorEl) errorEl.textContent = 'Please enter your password.';
                return;
            }
            if (errorEl) errorEl.textContent = '';
            var submitButton = signInForm.querySelector('.auth__button--primary');
            if (submitButton) submitButton.textContent = 'Signed in';
        });
    }

    var signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        var stages = Array.prototype.slice.call(signUpForm.querySelectorAll('.auth__stage'));
        var steps = Array.prototype.slice.call(document.querySelectorAll('.auth__step'));
        var currentStage = 1;

        function showStage(stageNumber) {
            stages.forEach(function (stage) {
                var isMatch = parseInt(stage.getAttribute('data-stage'), 10) === stageNumber;
                stage.style.display = isMatch ? '' : 'none';
                stage.classList.toggle('auth__stage--current', isMatch);
            });
            steps.forEach(function (step) {
                var stepNumber = parseInt(step.getAttribute('data-step'), 10);
                step.classList.toggle('auth__step--active', stepNumber === stageNumber);
                step.classList.toggle('auth__step--complete', stepNumber < stageNumber);
                step.style.display = stepNumber <= stageNumber ? '' : 'flex';
            });
            currentStage = stageNumber;
            var activeStage = stages[stageNumber - 1];
            var firstInput = activeStage ? activeStage.querySelector('input') : null;
            if (firstInput) {
                firstInput.focus();
            }
        }

        function validateStage(stageNumber) {
            var stage = stages[stageNumber - 1];
            var requiredInputs = stage.querySelectorAll('input[required]');
            for (var i = 0; i < requiredInputs.length; i++) {
                if (!requiredInputs[i].value.trim()) {
                    return false;
                }
            }
            return true;
        }

        signUpForm.addEventListener('click', function (e) {
            var action = e.target.closest('[data-action]');
            if (!action) return;
            var type = action.getAttribute('data-action');
            var errorEl = document.getElementById('signUpError');

            if (type === 'next') {
                if (!validateStage(currentStage)) {
                    if (errorEl) errorEl.textContent = 'Please complete all required fields before continuing.';
                    return;
                }
                if (errorEl) errorEl.textContent = '';
                showStage(Math.min(currentStage + 1, stages.length));
            }

            if (type === 'back') {
                if (errorEl) errorEl.textContent = '';
                showStage(Math.max(currentStage - 1, 1));
            }

            if (type === 'resend') {
                action.disabled = true;
                var originalText = action.textContent;
                action.textContent = 'Code sent';
                setTimeout(function () {
                    action.disabled = false;
                    action.textContent = originalText;
                }, 4000);
            }
        });

        signUpForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateStage(currentStage)) {
                var errorEl = document.getElementById('signUpError');
                if (errorEl) errorEl.textContent = 'Please enter the full verification code.';
                return;
            }
            var button = signUpForm.querySelector('.auth__stage--current .auth__button--primary');
            if (button) button.textContent = 'Account created';
        });

        var otpInputs = Array.prototype.slice.call(signUpForm.querySelectorAll('.auth__otp-input'));
        otpInputs.forEach(function (input, index) {
            input.addEventListener('input', function () {
                input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);
                if (input.value && otpInputs[index + 1]) {
                    otpInputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && !input.value && otpInputs[index - 1]) {
                    otpInputs[index - 1].focus();
                }
            });
            input.addEventListener('paste', function (e) {
                var clipboard = e.clipboardData || window.clipboardData;
                var pasted = clipboard.getData('text').replace(/[^0-9]/g, '');
                if (!pasted) return;
                e.preventDefault();
                pasted.split('').forEach(function (char, i) {
                    if (otpInputs[i]) {
                        otpInputs[i].value = char;
                    }
                });
                var nextIndex = Math.min(pasted.length, otpInputs.length - 1);
                if (otpInputs[nextIndex]) {
                    otpInputs[nextIndex].focus();
                }
            });
        });

        showStage(1);
    }
})();
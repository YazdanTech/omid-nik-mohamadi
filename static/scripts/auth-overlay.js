function getCSRFToken() {
    return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '';
}

(function () {
    'use strict';

    const authGlobalOverlay = document.getElementById('authGlobalOverlay');
    const authGlobalClose = document.getElementById('authGlobalClose');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const signInAccountBtn = document.getElementById('signInAccountBtn');
    const signInFormContainer = document.getElementById('signInFormContainer');
    const signUpFormContainer = document.getElementById('signUpFormContainer');

    let isUserAuthenticated = false;

    // --- Overlay UI Controls ---
    function openAuthOverlay() {
        if (!authGlobalOverlay) return;
        authGlobalOverlay.style.display = 'flex';
        authGlobalOverlay.offsetHeight; // Force reflow
        authGlobalOverlay.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
    }

    function closeAuthOverlay() {
        if (!authGlobalOverlay) return;
        authGlobalOverlay.classList.remove('is-visible');
        document.body.style.overflow = '';

        setTimeout(() => {
            if (!authGlobalOverlay.classList.contains('is-visible')) {
                authGlobalOverlay.style.display = 'none';
            }
        }, 1000);
    }

    if (authGlobalClose) authGlobalClose.addEventListener('click', closeAuthOverlay);

    if (authGlobalOverlay) {
        authGlobalOverlay.addEventListener('click', (e) => {
            if (e.target === authGlobalOverlay) closeAuthOverlay();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authGlobalOverlay && authGlobalOverlay.classList.contains('is-visible')) {
            closeAuthOverlay();
        }
    });

    // --- Form Toggling Rules ---
    function switchForm(formToHide, formToShow) {
        formToHide.style.transition = 'opacity 0.5s ease';
        formToShow.style.transition = 'opacity 0.5s ease';
        formToHide.style.opacity = '0';

        setTimeout(() => {
            formToHide.style.display = 'none';
            formToShow.style.display = 'block';
            formToShow.style.opacity = '0';
            formToShow.offsetHeight;
            formToShow.style.opacity = '1';
        }, 500);
    }

    if (createAccountBtn) createAccountBtn.addEventListener('click', () => switchForm(signInFormContainer, signUpFormContainer));
    if (signInAccountBtn) signInAccountBtn.addEventListener('click', () => switchForm(signUpFormContainer, signInFormContainer));

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
                    if (input) input.required = matches;
                });
            });
        });
    }

    // --- Async Sign In Pipeline ---
    var signInForm = document.getElementById('signInForm');
    if (signInForm) {
        let loginOtpRequested = false;
        var signInOtpInput = signInForm.querySelector('.auth__otp-input');
        var signInPhoneInput = signInForm.querySelector('[name="phone_number"]');
        var signInOtpContainer = signInOtpInput ? signInOtpInput.closest('.auth__field') : null;

        // Hide OTP input row by default until requested successfully
        if (signInOtpContainer) {
            signInOtpContainer.style.display = 'none';
        }

        async function submitSignInOTP() {
            var errorEl = document.getElementById('signInError');
            var submitButton = signInForm.querySelector('.auth__button--primary');
            var code = signInOtpInput ? signInOtpInput.value.trim().replace(/[^0-9]/g, '') : '';
            var phone = signInPhoneInput ? signInPhoneInput.value.trim() : '';

            if (code.length !== 6) return;

            if (submitButton) submitButton.disabled = true;
            if (errorEl) errorEl.textContent = '';

            try {
                let res = await fetch('/api/auth/verify-otp/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                    body: JSON.stringify({ phone_number: phone, code: code })
                });

                if (res.ok) {
                    window.location.reload();
                } else {
                    let data = await res.json();
                    if (errorEl) errorEl.textContent = data.non_field_errors || Object.values(data)[0];
                }
            } catch (err) {
                if (errorEl) errorEl.textContent = 'Network error.';
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        }

        signInForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var errorEl = document.getElementById('signInError');
            var submitButton = signInForm.querySelector('.auth__button--primary');
            var phone = signInPhoneInput ? signInPhoneInput.value.trim() : '';

            if (!phone) {
                if (errorEl) errorEl.textContent = 'لطفا شماره موبایل خود را وارد کنید';
                return;
            }

            // Fallback explicitly processing execution on standard submit click after generation
            if (loginOtpRequested) {
                submitSignInOTP();
                return;
            }

            if (submitButton) submitButton.disabled = true;
            if (errorEl) errorEl.textContent = '';

            try {
                let res = await fetch('/api/auth/login-request-otp/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                    body: JSON.stringify({ phone_number: phone })
                });

                if (res.ok) {
                    if (errorEl) errorEl.textContent = 'ککد تایید ارسال شد.';
                    loginOtpRequested = true;

                    if (signInOtpContainer) {
                        signInOtpContainer.style.display = 'block';
                    }
                    if (signInPhoneInput) {
                        signInPhoneInput.disabled = true;
                    }
                    if (signInOtpInput) {
                        signInOtpInput.required = true;
                        signInOtpInput.focus();
                    }
                    if (submitButton) {
                        submitButton.textContent = 'تایید و ورود';
                    }
                } else {
                    let data = await res.json();
                    if (errorEl) errorEl.textContent = data.non_field_errors || Object.values(data)[0];
                }
            } catch (err) {
                if (errorEl) errorEl.textContent = 'Network error.';
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });

        // Watch inputs on the singular Sign-In input to capture completion quickly
        if (signInOtpInput) {
            signInOtpInput.addEventListener('input', function () {
                signInOtpInput.value = signInOtpInput.value.replace(/[^0-9]/g, '').slice(0, 6);
                if (signInOtpInput.value.length === 6) {
                    submitSignInOTP();
                }
            });

            signInOtpInput.addEventListener('paste', function (e) {
                var clipboard = e.clipboardData || window.clipboardData;
                var pasted = clipboard.getData('text').replace(/[^0-9]/g, '');
                signInOtpInput.value = pasted.slice(0, 6);
                e.preventDefault();
                if (signInOtpInput.value.length === 6) {
                    submitSignInOTP();
                }
            });
        }
    }

    // --- Async Multi-Stage Registration Pipeline ---
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
            if (firstInput) firstInput.focus();
        }

        function validateStage(stageNumber) {
            var stage = stages[stageNumber - 1];
            if (!stage) return false;
            var requiredInputs = stage.querySelectorAll('input[required]');
            for (var i = 0; i < requiredInputs.length; i++) {
                if (!requiredInputs[i].value.trim()) return false;
            }
            return true;
        }

        // Extracted OTP calculation engine for a single input
        function getVerificationCode() {
            var otpInput = signUpForm.querySelector('.auth__otp-input');
            return otpInput ? otpInput.value.trim().replace(/[^0-9]/g, '') : '';
        }

        async function submitOTP() {
            var errorEl = document.getElementById('signUpError');
            var code = getVerificationCode();

            if (code.length !== 6) {
                if (errorEl) errorEl.textContent = 'لطفا کد تایید ۶ رقمی را به طور کامل وارد کنید.';
                return;
            }

            var phone = new FormData(signUpForm).get('phone_number');
            var button = signUpForm.querySelector('.auth__stage--current .auth__button--primary');

            if (button) button.disabled = true;
            if (errorEl) errorEl.textContent = '';

            try {
                let res = await fetch('/api/auth/verify-otp/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                    body: JSON.stringify({ phone_number: phone, code: code })
                });

                if (res.ok) {
                    window.location.reload();
                } else {
                    let data = await res.json();
                    if (errorEl) errorEl.textContent = data.non_field_errors || Object.values(data)[0];
                }
            } catch (err) {
                if (errorEl) errorEl.textContent = 'Network error.';
            } finally {
                if (button) button.disabled = false;
            }
        }

        signUpForm.addEventListener('click', function (e) {
            var action = e.target.closest('[data-action]');
            if (!action) return;
            var type = action.getAttribute('data-action');
            var errorEl = document.getElementById('signUpError');

            if (type === 'next') {
                if (!validateStage(currentStage)) {
                    if (errorEl) errorEl.textContent = 'لطفا تمام کادر های اجباری را پر کنید.';
                    return;
                }

                if (currentStage === 1) {
                    if (errorEl) errorEl.textContent = '';
                    showStage(2);
                    return;
                }

                if (currentStage === 2) {
                    var payload = Object.fromEntries(new FormData(signUpForm).entries());
                    action.disabled = true;

                    fetch('/api/auth/signup/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                        body: JSON.stringify(payload)
                    }).then(async res => {
                        if (res.ok) {
                            if (errorEl) errorEl.textContent = '';
                            showStage(3);
                        } else {
                            let data = await res.json();
                            if (errorEl) errorEl.textContent = Object.values(data)[0] || 'مشکل در ساخت اکانت';
                        }
                    }).catch(() => {
                        if (errorEl) errorEl.textContent = 'Network error.';
                    }).finally(() => {
                        action.disabled = false;
                    });
                }
            }

            if (type === 'back') {
                if (errorEl) errorEl.textContent = '';
                showStage(Math.max(currentStage - 1, 1));
            }

            if (type === 'resend') {
                action.disabled = true;
                var originalText = action.textContent;
                var phone = new FormData(signUpForm).get('phone_number');

                if (!phone) {
                    if (errorEl) errorEl.textContent = 'شماره تلفن یافت نشد.';
                    action.disabled = false;
                    return;
                }

                fetch('/api/auth/login-request-otp/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                    body: JSON.stringify({ phone_number: phone })
                }).then(res => {
                    action.textContent = res.ok ? 'کد ارسال شد' : 'خطا در ارسال';
                    setTimeout(function () {
                        action.disabled = false;
                        action.textContent = originalText;
                    }, 5000);
                }).catch(() => {
                    action.disabled = false;
                    action.textContent = originalText;
                });
            }
        });

        signUpForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (currentStage !== 3) return;
            submitOTP();
        });

        // Cleaned single OTP field event binding for Auto-Submit
        var singleOtpInput = signUpForm.querySelector('.auth__otp-input');
        if (singleOtpInput) {
            singleOtpInput.addEventListener('input', function () {
                singleOtpInput.value = singleOtpInput.value.replace(/[^0-9]/g, '').slice(0, 6);
                if (singleOtpInput.value.length === 6) {
                    submitOTP();
                }
            });

            singleOtpInput.addEventListener('paste', function (e) {
                var clipboard = e.clipboardData || window.clipboardData;
                var pasted = clipboard.getData('text').replace(/[^0-9]/g, '');
                singleOtpInput.value = pasted.slice(0, 6);
                e.preventDefault();
                if (singleOtpInput.value.length === 6) {
                    submitOTP();
                }
            });
        }

        showStage(1);
    }
    // --- Public Module Interface API Hooks ---
    window.AuthModule = {
        open: openAuthOverlay,
        close: closeAuthOverlay,
        get isAuthenticated() { return isUserAuthenticated; }
    };

})();
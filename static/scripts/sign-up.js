function getCSRFToken() {
    return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '';
}

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
        signInForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var errorEl = document.getElementById('signInError');
            var submitButton = signInForm.querySelector('.auth__button--primary');
            var payload = Object.fromEntries(new FormData(signInForm).entries());

            if (!payload.phone_number) {
                if (errorEl) errorEl.textContent = 'لطفا شماره موبایل خود را وارد کنید';
                return;
            }

            submitButton.disabled = true;
            if (errorEl) errorEl.textContent = '';

            try {
                let res = await fetch('/api/auth/login-request-otp/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                    body: JSON.stringify({ phone_number: payload.phone_number })
                });

                if (res.ok) {
                    if (errorEl) errorEl.textContent = 'کد تایید ارسال شد.';
                } else {
                    let data = await res.json();
                    if (errorEl) errorEl.textContent = data.non_field_errors || Object.values(data)[0];
                }
            } catch (err) {
                if (errorEl) errorEl.textContent = 'Network error.';
            } finally {
                submitButton.disabled = false;
            }
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
            if (!stage) return false;
            var requiredInputs = stage.querySelectorAll('input[required]');
            for (var i = 0; i < requiredInputs.length; i++) {
                if (!requiredInputs[i].value.trim()) {
                    return false;
                }
            }
            return true;
        }

        async function submitOTP() {
            var errorEl = document.getElementById('signUpError');
            var otpInput = signUpForm.querySelector('.auth__otp-input');
            if (!otpInput) return;

            var code = otpInput.value.trim().replace(/[^0-9]/g, '');
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
                    alert('شماره تلفن یافت نشد.');
                    action.disabled = false;
                    return;
                }

                fetch('/api/auth/login-request-otp/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                    body: JSON.stringify({ phone_number: phone })
                }).then(res => {
                    if (res.ok) {
                        action.textContent = 'کد ارسال شد';
                    } else {
                        action.textContent = 'خطا در ارسال';
                    }
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

        var otpInput = signUpForm.querySelector('.auth__otp-input');
        if (otpInput) {
            otpInput.addEventListener('input', function () {
                otpInput.value = otpInput.value.replace(/[^0-9]/g, '').slice(0, 6);
                if (otpInput.value.length === 6) {
                    submitOTP();
                }
            });
        }

        showStage(1);
    }
})();
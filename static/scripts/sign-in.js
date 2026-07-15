function getCSRFToken() {
    return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '';
}

(function () {
    'use strict';

    // ۱. مدیریت نمایش رمز عبور
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

    // ۲. مدیریت تب‌های ورود
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
        var stages = Array.prototype.slice.call(signInForm.querySelectorAll('.auth__stage'));
        var currentStage = 1;

        function showStage(stageNumber) {
            stages.forEach(function (stage) {
                var isMatch = parseInt(stage.getAttribute('data-stage'), 10) === stageNumber;
                stage.style.display = isMatch ? '' : 'none';
                stage.classList.toggle('auth__stage--current', isMatch);
            });
            currentStage = stageNumber;
            var activeStage = stages[stageNumber - 1];
            var firstInput = activeStage ? activeStage.querySelector('input') : null;
            if (firstInput) {
                firstInput.focus();
            }
        }

        async function sendOTP() {
            var errorEl = document.getElementById('signInError');
            var phoneInput = signInForm.querySelector('#signInMobile');
            var phone = phoneInput ? phoneInput.value.trim() : '';

            if (!phone) {
                if (errorEl) errorEl.textContent = 'لطفا شماره موبایل خود را وارد کنید';
                return;
            }

            var button = signInForm.querySelector('[data-action="send-otp"]');
            if (button) button.disabled = true;
            if (errorEl) errorEl.textContent = '';

            try {
                let res = await fetch('/api/login-request-otp/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                    body: JSON.stringify({ phone_number: phone })
                });

                if (res.ok) {
                    showStage(2);
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

        async function submitOTP() {
            var errorEl = document.getElementById('signInError');
            var otpInput = signInForm.querySelector('.auth__otp-input');
            if (!otpInput) return;

            var code = otpInput.value.trim().replace(/[^0-9]/g, '');
            if (code.length !== 6) {
                if (errorEl) errorEl.textContent = 'لطفا کد تایید ۶ رقمی را به طور کامل وارد کنید.';
                return;
            }

            var phone = new FormData(signInForm).get('phone_number');
            var button = signInForm.querySelector('.auth__stage--current .auth__button--primary');
            if (button) button.disabled = true;
            if (errorEl) errorEl.textContent = '';

            try {
                let res = await fetch('/api/verify-otp/', {
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

        signInForm.addEventListener('click', function (e) {
            var action = e.target.closest('[data-action]');
            if (!action) return;
            var type = action.getAttribute('data-action');
            var errorEl = document.getElementById('signInError');

            if (type === 'send-otp') {
                sendOTP();
            }

            if (type === 'back') {
                if (errorEl) errorEl.textContent = '';
                showStage(1);
            }

            if (type === 'resend') {
                action.disabled = true;
                var originalText = action.textContent;
                var phone = new FormData(signInForm).get('phone_number');

                if (!phone) {
                    alert('شماره تلفن یافت نشد.');
                    action.disabled = false;
                    return;
                }

                fetch('/api/login-request-otp/', {
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

        signInForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (currentStage === 1) {
                sendOTP();
            } else if (currentStage === 2) {
                submitOTP();
            }
        });

        var otpInput = signInForm.querySelector('.auth__otp-input');
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
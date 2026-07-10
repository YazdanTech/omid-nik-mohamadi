(function () {
    'use strict';

    const authGlobalOverlay = document.getElementById('authGlobalOverlay');
    const authGlobalClose = document.getElementById('authGlobalClose');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const signInAccountBtn = document.getElementById('signInAccountBtn');
    const signInFormContainer = document.getElementById('signInFormContainer');
    const signUpFormContainer = document.getElementById('signUpFormContainer');
    
    // Auth status flag accessible to other modules
    let isUserAuthenticated = false;

    function openAuthOverlay() {
        console.log('open auth overlay');
        if (!authGlobalOverlay) return;
        authGlobalOverlay.style.display = 'flex';
        authGlobalOverlay.offsetHeight;
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
            if (e.target === authGlobalOverlay) {
                closeAuthOverlay();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authGlobalOverlay && authGlobalOverlay.classList.contains('is-visible')) {
            closeAuthOverlay();
        }
    });

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

    function signUp() {
        switchForm(signInFormContainer, signUpFormContainer);
    }

    function signIn() {
        switchForm(signUpFormContainer, signInFormContainer);
    }

    if (createAccountBtn) createAccountBtn.addEventListener('click', signUp);
    if (signInAccountBtn) signInAccountBtn.addEventListener('click', signIn);

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
            if (submitButton) {
                submitButton.textContent = 'Signed in';
                isUserAuthenticated = true; // Update internal auth state
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
            if (button) {
                button.textContent = 'Account created';
                isUserAuthenticated = true; // Update internal auth state
            }
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

    window.AuthModule = {
        open: openAuthOverlay,
        close: closeAuthOverlay,
        get isAuthenticated() { return isUserAuthenticated; }
    };

})();
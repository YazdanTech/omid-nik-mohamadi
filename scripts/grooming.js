document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initInfiniteGallery();
    initBookingModal();
    initMultiStepWizard();
});

/**
 * Scroll Mechanics: Threshold Visibility Reveals
 */
function initScrollAnimations() {
    const items = document.querySelectorAll('.scroll-reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    items.forEach(item => observer.observe(item));
}

/**
 * 3-Row Dynamic Micro-Scrolling Showcase Architecture
 */
function initInfiniteGallery() {
    const tracks = document.querySelectorAll('.grooming-gallery__track');
    
    tracks.forEach(track => {
        const strip = track.querySelector('.grooming-gallery__strip');
        // Duplicate structural nodes to handle visual stitching seamlessly
        const duplicate = strip.cloneNode(true);
        track.appendChild(duplicate);

        let speed = 0.8;
        let currentX = 0;
        const isLeft = track.classList.contains('grooming-gallery__track--left');
        
        function renderTimeline() {
            if (isLeft) {
                currentX -= speed;
                if (Math.abs(currentX) >= strip.offsetWidth) {
                    currentX = 0;
                }
            } else {
                currentX += speed;
                if (currentX >= 0) {
                    currentX = -strip.offsetWidth;
                }
            }
            
            track.style.transform = `translateX(${currentX}px)`;
            requestAnimationFrame(renderTimeline);
        }
        
        if (!isLeft) {
            // Set initial layout position for right-moving tracks
            currentX = -strip.offsetWidth;
        }
        
        renderTimeline();
    });
}

/**
 * Modal Framework Interception Setup
 */
function initBookingModal() {
    const modal = document.getElementById('authModal');
    const triggers = document.querySelectorAll('.js-trigger-booking');
    const closeElements = document.querySelectorAll('.js-close-modal');

    triggers.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.classList.add('no-scroll');
        });
    });

    closeElements.forEach(el => {
        el.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    });

    // Handle structural tab updates between logic models
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const formSignIn = document.getElementById('formSignIn');
    const wizardSignUp = document.getElementById('wizardSignUp');

    tabSignIn.addEventListener('click', () => {
        tabSignIn.classList.add('active');
        tabSignUp.classList.remove('active');
        formSignIn.classList.remove('hidden');
        wizardSignUp.classList.add('hidden');
    });

    tabSignUp.addEventListener('click', () => {
        tabSignUp.classList.add('active');
        tabSignIn.classList.remove('active');
        wizardSignUp.classList.remove('hidden');
        formSignIn.classList.add('hidden');
    });
}

/**
 * Progressive Multi-Stage Setup System Logic
 */
function initMultiStepWizard() {
    let activeStep = 1;
    const totalSteps = 3;
    
    const wizard = document.getElementById('wizardSignUp');
    const nextButtons = wizard.querySelectorAll('.js-wizard-next');
    const prevButtons = wizard.querySelectorAll('.js-wizard-prev');
    const progressBar = wizard.querySelector('.wizard-progress__bar');
    const stepNumberDisplay = document.getElementById('currentStepNum');

    function syncWizardView() {
        const steps = wizard.querySelectorAll('.wizard-step');
        steps.forEach(step => {
            if (parseInt(step.dataset.step) === activeStep) {
                step.classList.remove('hidden');
            } else {
                step.classList.add('hidden');
            }
        });

        // Compute fluid structural bar alignment properties
        const percentage = (activeStep / totalSteps) * 100;
        progressBar.style.setProperty('--wizard-progress', `${percentage}%`);
        stepNumberDisplay.textContent = activeStep;
    }

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStepEl = wizard.querySelector(`.wizard-step[data-step="${activeStep}"]`);
            const inputs = currentStepEl.querySelectorAll('input');
            
            // Validate data constraints prior to moving forward
            let valid = true;
            inputs.forEach(input => {
                if (!input.checkValidity()) {
                    input.reportValidity();
                    valid = false;
                }
            });

            if (valid && activeStep < totalSteps) {
                activeStep++;
                syncWizardView();
            }
        });
    });

    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (activeStep > 1) {
                activeStep--;
                syncWizardView();
            }
        });
    });

    // Step 3 submission event hook
    const activationBtn = wizard.querySelector('.id-activation-trigger');
    activationBtn.addEventListener('click', (e) => {
        const otpInput = document.getElementById('regOTP');
        if (otpInput.checkValidity()) {
            e.preventDefault();
            activationBtn.textContent = "Verifying Client Access...";
            setTimeout(() => {
                alert("Client profile validated. Welcome to the Atelier.");
                document.getElementById('authModal').classList.remove('active');
                document.body.classList.remove('no-scroll');
                activationBtn.textContent = "Complete Activation";
            }, 1500);
        } else {
            otpInput.reportValidity();
        }
    });
}
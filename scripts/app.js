(function () {
    'use strict';

    // ==========================================
    // 1. DOM Elements Selection
    // ==========================================
    var header = document.getElementById('siteHeader');
    var themeToggle = document.getElementById('themeToggle');
    var sideNav = document.getElementById('sideNav');
    var menuToggle = document.getElementById('menuToggle');
    var sideNavOverlay = document.getElementById('sideNavOverlay');
    var sideNavClose = document.getElementById('sideNavClose');
    var navLinks = document.querySelectorAll('[data-nav-link]');
    
    var heroTextInner = document.querySelector('.hero-text-inner');
    var heroTextFirst = document.getElementById('heroTextFirst');
    var heroTextSecond = document.getElementById('heroTextSecond');
    var heroTextMeta = document.getElementById('heroTextMeta');
    var heroTextMetaInner = document.querySelector('.hero-text-meta-inner');
    var heroScrollCue = document.getElementById('heroScrollCue');
    var heroScrollSequence = document.querySelector('.hero-scroll-sequence');
    var portraitPanels = document.querySelectorAll('.portrait-panel');
    
    var videoOverlay = document.getElementById('videoOverlay');
    var craftCards = document.querySelectorAll('.craft-card');

    // ==========================================
    // 2. Global State & Timers
    // ==========================================
    var swapTimer = null;
    var activeCollapse = null;
    let currentPortraitIndex = -1;

    if (heroTextInner) {
        heroTextInner.dataset.current = heroTextInner.textContent.trim();
    }

    // ==========================================
    // 3. Header State Functionality
    // ==========================================
    function updateHeaderState() {
        if (window.scrollY > 40) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }
    window.addEventListener('scroll', updateHeaderState, { passive: true });
    updateHeaderState();

    // ==========================================
    // 4. Theme Toggle Functionality
    // ==========================================
    var storedTheme = null;
    try {
        storedTheme = localStorage.getItem('omid-theme');
    } catch (err) {
        storedTheme = null;
    }
    if (storedTheme === 'light') {
        document.body.setAttribute('data-theme', 'light');
    }
    themeToggle.addEventListener('click', function () {
        var isLight = document.body.getAttribute('data-theme') === 'light';
        if (isLight) {
            document.body.removeAttribute('data-theme');
            try { localStorage.setItem('omid-theme', 'dark'); } catch (err) {}
        } else {
            document.body.setAttribute('data-theme', 'light');
            try { localStorage.setItem('omid-theme', 'light'); } catch (err) {}
        }
    });

    // ==========================================
    // 5. Side Navigation Functionality
    // ==========================================
    function openNav() {
        sideNav.classList.add('active');
        menuToggle.classList.add('is-active');
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('no-scroll');
    }

    function closeNav() {
        sideNav.classList.remove('active');
        menuToggle.classList.remove('is-active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
    }

    menuToggle.addEventListener('click', function () {
        if (sideNav.classList.contains('active')) {
            closeNav();
        } else {
            openNav();
        }
    });
    sideNavOverlay.addEventListener('click', closeNav);
    sideNavClose.addEventListener('click', closeNav);
    navLinks.forEach(function (link) {
        link.addEventListener('click', closeNav);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sideNav.classList.contains('active')) {
            closeNav();
        }
    });

    // ==========================================
    // 6. Hero Text Animations & Intersection Logic
    // ==========================================
    function setHeroText(newText) {
        if (!heroTextInner || heroTextInner.dataset.current === newText) {
            return;
        }
        clearTimeout(swapTimer);
        heroTextInner.classList.add('is-swapping');
        swapTimer = setTimeout(function () {
            heroTextInner.textContent = newText;
            heroTextInner.dataset.current = newText;
            heroTextInner.classList.remove('is-swapping');
        }, 400);
    }

    function updateHeroText(portraitIndex) {
        if (currentPortraitIndex === portraitIndex) return;

        currentPortraitIndex = portraitIndex;
        const panel = portraitPanels[portraitIndex];
        const metaText = panel?.dataset.portraitText || '';

        // Fade out current text
        if (heroTextFirst) heroTextFirst.classList.add('is-hidden');
        if (heroTextSecond) heroTextSecond.classList.remove('is-visible');
        if (heroScrollCue) heroScrollCue.classList.add('is-hidden');
        if (heroTextMetaInner) heroTextMetaInner.classList.remove('is-visible');

        // Transition after fade out
        setTimeout(() => {
            if (portraitIndex === 0) {
                if (heroTextFirst) heroTextFirst.classList.remove('is-hidden');
                if (heroTextSecond) heroTextSecond.classList.remove('is-visible');
            } else {
                if (heroTextFirst) heroTextFirst.classList.add('is-hidden');
                if (heroTextSecond) heroTextSecond.classList.add('is-visible');
            }

            // Update meta text
            if (metaText && heroTextMetaInner) {
                heroTextMetaInner.textContent = metaText;
                heroTextMetaInner.classList.add('is-visible');
            } else if (heroTextMetaInner) {
                heroTextMetaInner.classList.remove('is-visible');
            }
        }, 600);
    }

    function handleScroll() {
        if (!heroScrollSequence) return;
        const scrollProgress = window.scrollY;
        const viewportHeight = window.innerHeight;

        // Hide scroll cue after some scrolling
        if (heroScrollCue) {
            if (scrollProgress > viewportHeight * 0.3) {
                heroScrollCue.classList.add('is-hidden');
            } else {
                heroScrollCue.classList.remove('is-hidden');
            }
        }

        // Fallback checks which portrait panel is in view
        portraitPanels.forEach((panel, index) => {
            const panelRect = panel.getBoundingClientRect();
            const panelCenter = panelRect.top + panelRect.height / 2;
            const viewportCenter = viewportHeight / 2;

            if (Math.abs(panelCenter - viewportCenter) < viewportHeight * 0.2) {
                updateHeroText(index);
            }
        });
    }

    // Set up Unified Intersection Observer for Portraits
    if ('IntersectionObserver' in window && portraitPanels.length) {
        var mobileMargin = '-130% 0px 20% 0px'; 
        var desktopMargin = '-20% 0px -80% 0px'; 

        var defaultHeroText = heroTextInner ? (heroTextInner.dataset.initial || heroTextInner.textContent.trim()) : '';
        if (heroTextInner && !heroTextInner.dataset.initial) {
            heroTextInner.dataset.initial = defaultHeroText;
        }

        var isDesktop = window.innerWidth >= 1100;
        var chosenMargin = isDesktop ? desktopMargin : mobileMargin;

        var heroObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.target.offsetWidth === 0) return;

                const index = Array.from(portraitPanels).indexOf(entry.target);

                if (entry.isIntersecting) {
                    // Triggers the base dynamic inner text change
                    setHeroText(entry.target.dataset.portraitText);
                    // Triggers the advanced layout transitions (First/Second state swaps)
                    if (index !== -1) {
                        updateHeroText(index);
                    }
                } else {
                    // Handle scroll-up text reversion for both devices cleanly
                    if (isDesktop) {
                        var desktopTriggerLine = window.innerHeight * 0.2;
                        if (entry.boundingClientRect.top > desktopTriggerLine) {
                            setHeroText(defaultHeroText);
                        }
                    } else {
                        var mobileTriggerLine = window.innerHeight * 1.3;
                        if (entry.boundingClientRect.top > mobileTriggerLine) {
                            setHeroText(defaultHeroText);
                        }
                    }
                }
            });
        }, {
            root: null,
            rootMargin: chosenMargin,
            threshold: [0, 0.5] // Combines thresholds from both original systems
        });

        portraitPanels.forEach(function (panel) {
            heroObserver.observe(panel);
        });
    }

    // Fallback scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial state setup
    if (portraitPanels.length > 0) {
        updateHeroText(0);
    }
    
    // ==========================================
    // 7. Video Overlay & Craft Cards Functionality
    // ==========================================
    craftCards.forEach(function (card) {
        var video = card.querySelector('.craft-video');
        var closeBtn = document.createElement('button');
        closeBtn.className = 'craft-card-close';
        closeBtn.setAttribute('aria-label', 'Close video');
        closeBtn.innerHTML = '&times;';
        card.appendChild(closeBtn);

        function expand() {
            if (activeCollapse) {
                return;
            }
            card.classList.add('is-expanded');
            videoOverlay.classList.add('active');
            document.body.classList.add('no-scroll');
            video.muted = false;
            try {
                video.currentTime = 0;
            } catch (err) {}
            var playPromise = video.play();
            if (playPromise && playPromise.catch) {
                playPromise.catch(function () {});
            }
            activeCollapse = collapse;
        }

        function collapse() {
            card.classList.remove('is-expanded');
            videoOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
            video.muted = true;
            video.pause();
            activeCollapse = null;
        }

        card.addEventListener('click', function (e) {
            if (e.target === closeBtn) {
                return;
            }
            if (!card.classList.contains('is-expanded')) {
                expand();
            }
        });

        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            collapse();
        });

        videoOverlay.addEventListener('click', function () {
            if (card.classList.contains('is-expanded')) {
                collapse();
            }
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && activeCollapse) {
            activeCollapse();
        }
    });
})();
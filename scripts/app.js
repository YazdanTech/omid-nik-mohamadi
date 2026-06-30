(function () {
    'use strict';

    var header = document.getElementById('siteHeader');
    function updateHeaderState() {
        if (window.scrollY > 40) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }
    window.addEventListener('scroll', updateHeaderState, { passive: true });
    updateHeaderState();

    var themeToggle = document.getElementById('themeToggle');
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

    var sideNav = document.getElementById('sideNav');
    var menuToggle = document.getElementById('menuToggle');
    var sideNavOverlay = document.getElementById('sideNavOverlay');
    var sideNavClose = document.getElementById('sideNavClose');
    var navLinks = document.querySelectorAll('[data-nav-link]');

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

    var heroTextInner = document.querySelector('.hero-text-inner');
    var portraitPanels = document.querySelectorAll('.portrait-panel');
    var swapTimer = null;

    if (heroTextInner) {
        heroTextInner.dataset.current = heroTextInner.textContent.trim();
    }

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
        }, 10);
    }

    if ('IntersectionObserver' in window && portraitPanels.length) {
        var heroObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    setHeroText(entry.target.dataset.portraitText);
                }
            });
        }, {
            root: null,
            rootMargin: '-130% 0px 20% 0px',
            threshold: 0
        });
        portraitPanels.forEach(function (panel) {
            heroObserver.observe(panel);
        });
    }

    var videoOverlay = document.getElementById('videoOverlay');
    var craftCards = document.querySelectorAll('.craft-card');
    var activeCollapse = null;

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

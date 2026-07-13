    var header = document.getElementById('siteHeader');
    var themeToggle = document.getElementById('themeToggle');
    var sideNav = document.getElementById('sideNav');
    var menuToggle = document.getElementById('menuToggle');
    var sideNavOverlay = document.getElementById('sideNavOverlay');
    var sideNavClose = document.getElementById('sideNavClose');
    var navLinks = document.querySelectorAll('[data-nav-link]');


    function updateHeaderState() {
        if (window.scrollY > 40) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }
    window.addEventListener('scroll', updateHeaderState, { passive: true });
    updateHeaderState();


    // 4. Theme Toggle Functionality

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


    // 5. Side Navigation Functionality

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


window.addEventListener('resize', function () {
  if (window.innerWidth >= 992) {
    const sideNav = document.getElementById('sideNav');
    if (sideNav && sideNav.classList.contains('is-open')) {
      closeModal(); 
    }
  }
});
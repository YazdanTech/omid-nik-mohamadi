
    const sideNav = document.getElementById("sideNav");

    const menuToggle = document.querySelector(".menu-toggle");

    const sideNavClose = document.getElementById("sideNavClose");

    const sideNavOverlay = document.getElementById("sideNavOverlay");


    // Open Nav
    menuToggle.addEventListener("click", () => {

        sideNav.classList.add("active");

        document.body.style.overflow = "hidden";

    });


    // Close Nav Function
    function closeSideNav() {

        sideNav.classList.remove("active");

        document.body.style.overflow = "auto";

    }


    // Close Events
    sideNavClose.addEventListener("click", closeSideNav);

    sideNavOverlay.addEventListener("click", closeSideNav);

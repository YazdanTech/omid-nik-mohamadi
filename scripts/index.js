document.addEventListener("DOMContentLoaded", () => {
    
    // 1. SCROLL-REVEAL TEXT LOGIC
    const textElement = document.getElementById('dynamic-hero-text');
    const portraitSections = document.querySelectorAll('.portrait-section');

    // Observer to detect which image is currently in the center of the viewport
    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -40% 0px', // Triggers when item is strictly in the middle 20% of screen
        threshold: 0
    };

    const textObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Fade out current text
                textElement.classList.remove('visible');
                
                // Wait for fade out, then swap text and fade in
                setTimeout(() => {
                    textElement.textContent = entry.target.getAttribute('data-scroll-text');
                    textElement.classList.add('visible');
                }, 200); // Matches CSS transition duration roughly
            }
        });
    }, observerOptions);

    portraitSections.forEach(section => textObserver.observe(section));


    // 2. INTERACTIVE VIDEO GALLERY LOGIC
    const videoCards = document.querySelectorAll('.video-card');
    const overlay = document.querySelector('.video-expansion-overlay');
    let currentlyExpanded = null;

    function closeVideo() {
        if (!currentlyExpanded) return;
        
        const video = currentlyExpanded.querySelector('video');
        video.pause();
        video.muted = true; // Remute for safety
        
        currentlyExpanded.classList.remove('expanded');
        overlay.classList.remove('active');
        currentlyExpanded = null;
    }

    videoCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // If clicking an already expanded video, ignore (or pause it)
            if (this.classList.contains('expanded')) return;

            // Close any currently open video first
            closeVideo();

            // Expand the clicked card
            this.classList.add('expanded');
            overlay.classList.add('active');
            currentlyExpanded = this;

            // Play logic
            const video = this.querySelector('video');
            video.currentTime = 0; // Restart
            video.muted = false;   // Unmute
            video.play().catch(err => console.log("Autoplay prevented:", err));
        });
    });

    // Clicking the blurred background closes the video
    overlay.addEventListener('click', closeVideo);


    // 3. THEME TOGGLE UTILITY
    // Call this function from an onclick event on any button you create
    window.toggleTheme = function() {
        const body = document.body;
        if (body.getAttribute('data-theme') === 'light') {
            body.removeAttribute('data-theme');
        } else {
            body.setAttribute('data-theme', 'light');
        }
    }
});
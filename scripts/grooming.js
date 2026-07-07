(function () {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && revealEls.length) {
        var revealObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealEls.forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        revealEls.forEach(function (el) {
            el.classList.add('is-visible');
        });
    }

    var video = document.getElementById('groomingVideo');
    var videoToggle = document.getElementById('groomingVideoToggle');
    if (video && videoToggle) {
        var playIcon = videoToggle.querySelector('.grooming-video__icon--play');
        var pauseIcon = videoToggle.querySelector('.grooming-video__icon--pause');

        videoToggle.addEventListener('click', function () {
            if (video.paused) {
                video.muted = false;
                var playPromise = video.play();
                if (playPromise && playPromise.catch) {
                    playPromise.catch(function () {});
                }
            } else {
                video.pause();
            }
        });

        video.addEventListener('play', function () {
            playIcon.hidden = true;
            pauseIcon.hidden = false;
            videoToggle.setAttribute('aria-label', 'Pause package guide video');
        });

        video.addEventListener('pause', function () {
            playIcon.hidden = false;
            pauseIcon.hidden = true;
            videoToggle.setAttribute('aria-label', 'Play package guide video');
        });
    }

    var rows = document.querySelectorAll('.grooming-gallery__row');
    rows.forEach(function (row) {
        var track = row.querySelector('[data-track]');
        if (!track) {
            return;
        }

        var direction = row.getAttribute('data-direction') === 'right' ? 1 : -1;
        var speed = 0.4;
        var isPaused = false;
        var isDragging = false;
        var dragStartX = 0;
        var dragStartScroll = 0;
        var halfWidth = track.scrollWidth / 2;

        if (direction === -1) {
            track.scrollLeft = halfWidth;
        } else {
            track.scrollLeft = 0;
        }

        function normalizeScroll() {
            if (track.scrollLeft >= halfWidth * 2 - 1) {
                track.scrollLeft = track.scrollLeft - halfWidth;
            } else if (track.scrollLeft <= 0) {
                track.scrollLeft = track.scrollLeft + halfWidth;
            }
        }

        function step() {
            if (!isPaused && !isDragging && !prefersReducedMotion) {
                track.scrollLeft += speed * direction;
                normalizeScroll();
            }
            requestAnimationFrame(step);
        }

        row.addEventListener('mouseenter', function () {
            isPaused = true;
        });

        row.addEventListener('mouseleave', function () {
            isPaused = false;
        });

        track.addEventListener('pointerdown', function (e) {
            isDragging = true;
            isPaused = true;
            dragStartX = e.clientX;
            dragStartScroll = track.scrollLeft;
            track.setPointerCapture(e.pointerId);
        });

        track.addEventListener('pointermove', function (e) {
            if (!isDragging) {
                return;
            }
            var delta = e.clientX - dragStartX;
            track.scrollLeft = dragStartScroll - delta;
        });

        function endDrag() {
            if (!isDragging) {
                return;
            }
            isDragging = false;
            normalizeScroll();
            setTimeout(function () {
                isPaused = false;
            }, 1200);
        }

        track.addEventListener('pointerup', endDrag);
        track.addEventListener('pointercancel', endDrag);

        track.addEventListener('scroll', function () {
            if (!isDragging) {
                return;
            }
            halfWidth = track.scrollWidth / 2;
        });

        requestAnimationFrame(step);
    });

    document.querySelectorAll('.grooming-package-card__cta').forEach(function (button) {
        button.addEventListener('click', function () {
            var packageName = button.getAttribute('data-package') || 'this package';
            button.textContent = 'Reserved';
            button.classList.add('grooming-package-card__cta--confirmed');
            button.disabled = true;
            window.setTimeout(function () {
                button.textContent = 'Reserve';
                button.classList.remove('grooming-package-card__cta--confirmed');
                button.disabled = false;
            }, 2600);
        });
    });
})();
document.addEventListener("DOMContentLoaded", () => {
    const rows = document.querySelectorAll(".services-grid");

    const duplicateServices = (row, repeats = 2) => {
        const originalCards = Array.from(row.querySelectorAll(".service-card"));

        for (let i = 0; i < repeats; i++) {
            originalCards.forEach((card) => {
                const clone = card.cloneNode(true);

                clone.setAttribute("aria-hidden", "true");

                const link = clone.querySelector("a");
                if (link) {
                    link.setAttribute("tabindex", "-1");
                    link.setAttribute("aria-hidden", "true");
                }

                row.appendChild(clone);
            });
        }
    };

    rows.forEach((row) => {
        duplicateServices(row, 1); // 3 originals -> 9 total
        // duplicateServices(row, 1); // 3 originals -> 6 total
    });
});
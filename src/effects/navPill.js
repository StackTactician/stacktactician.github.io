// ============================================
// Shared Layout Nav Pill
// ============================================
export function initNavPill() {
    const navLinks = document.querySelector('.nav-links');
    const pill = document.querySelector('.nav-pill');
    if (!navLinks || !pill) return;

    const links = navLinks.querySelectorAll('.nav-link');
    let leaveTimeout = null;

    const movePillTo = (link) => {
        const containerRect = navLinks.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();

        const paddingX = 14;
        const x = linkRect.left - containerRect.left - paddingX;
        const w = linkRect.width + paddingX * 2;

        pill.style.width = `${w}px`;
        // translateY(-50%) is set in CSS; here we only offset X
        pill.style.transform = `translate(${x}px, -50%)`;
        pill.classList.add('active');
    };

    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            clearTimeout(leaveTimeout);
            movePillTo(link);
        });
    });

    navLinks.addEventListener('mouseleave', () => {
        leaveTimeout = setTimeout(() => {
            pill.classList.remove('active');
        }, 120);
    });
}

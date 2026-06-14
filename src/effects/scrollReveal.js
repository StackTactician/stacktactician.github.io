// ============================================
// Scroll-Triggered Section Entrances
// ============================================
export function initScrollReveal() {
    // Targets to animate on scroll
    const targets = [
        '.work-item-wrapper',
        '.experience-item',
        '.section-number',
        '.section-title',
        '.section-text',
        '.subsection',
        '.contact-links',
        '.contact-info'
    ];

    const elements = document.querySelectorAll(targets.join(', '));
    elements.forEach(el => el.classList.add('scroll-reveal'));

    // Stagger siblings within list containers
    const groups = document.querySelectorAll('.work-list, .experience-list');
    groups.forEach(group => group.classList.add('scroll-reveal-group'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Once animated in, stop observing to save resources
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

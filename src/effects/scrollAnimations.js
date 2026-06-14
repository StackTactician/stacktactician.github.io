// ============================================
// Scroll Animations
// ============================================
export function initScrollAnimations() {
    const sections = document.querySelectorAll('section:not(.hero)');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        section.style.opacity = '0';

        // Use a larger offset for the project details card to give it a distinct "slide up" feel
        const yOffset = section.classList.contains('project-details') ? '100px' : '40px';
        section.style.transform = `translateY(${yOffset})`;

        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(section);
    });

    initWorkAnimations();
}

function initWorkAnimations() {
    const workItems = document.querySelectorAll('.work-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const item = entry.target;
                const index = Array.from(workItems).indexOf(item);

                // Increased delay for more noticeable sequential effect
                setTimeout(() => {
                    item.classList.add('visible');
                }, 100 + index * 200); // 100ms base + 200ms stagger

                observer.unobserve(item);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before it's fully in view? No, slightly after enters viewport.
    });

    workItems.forEach(item => observer.observe(item));
}

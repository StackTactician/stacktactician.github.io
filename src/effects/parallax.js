// ============================================
// Parallax Scroll Effect (Phase 4)
// ============================================
export function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroTitle = document.querySelector('.hero-title');
    const heroCta = document.querySelector('.hero-cta');

    const parallaxElements = [];

    // Select elements that want parallax
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const title = section.querySelector('.section-title');
        if (title) {
            parallaxElements.push({
                element: title,
                section: section,
                speed: 0.08, // Subtle displacement speed (deeper background feel)
                sectionTop: 0,
                sectionHeight: 0
            });
        }
        
        const photoDeck = section.querySelector('.photo-deck');
        if (photoDeck) {
            parallaxElements.push({
                element: photoDeck,
                section: section,
                speed: -0.06, // Subtle foreground speed (pops closer)
                sectionTop: 0,
                sectionHeight: 0
            });
        }
    });

    const updateOffsets = () => {
        parallaxElements.forEach(item => {
            const rect = item.section.getBoundingClientRect();
            item.sectionTop = rect.top + window.scrollY;
            item.sectionHeight = rect.height;
        });
    };

    // Cache offsets initially and on window resize to prevent layout thrashing
    updateOffsets();
    window.addEventListener('resize', updateOffsets);

    // Smooth scroll interpolation variables
    let currentScrollY = window.scrollY;
    let targetScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY;
    }, { passive: true });

    function animateParallax() {
        const diff = targetScrollY - currentScrollY;
        
        if (Math.abs(diff) > 0.05) {
            // Smooth lerping with a slightly faster coefficient (0.12) to feel highly responsive yet buttery
            currentScrollY += diff * 0.12;
            
            // 1. Hero elements parallax (only run when visible)
            if (currentScrollY < window.innerHeight * 1.5) {
                const s = currentScrollY;
                if (heroSubtitle) {
                    heroSubtitle.style.transform = `translateY(${s * 0.18}px) translateZ(0)`;
                }
                if (heroTitle) {
                    heroTitle.style.transform = `translateY(${s * 0.08}px) translateZ(0)`;
                }
                if (heroCta) {
                    heroCta.style.transform = `translateY(${s * 0.12}px) translateZ(0)`;
                }
            }

            // 2. Sections parallax (titles & photo deck) using cached dimensions
            const viewportBottom = currentScrollY + window.innerHeight;
            parallaxElements.forEach(item => {
                if (viewportBottom > item.sectionTop && currentScrollY < item.sectionTop + item.sectionHeight) {
                    const scrolledOffset = currentScrollY - item.sectionTop;
                    const val = scrolledOffset * item.speed;
                    item.element.style.transform = `translateY(${val}px) translateZ(0)`;
                }
            });
        } else if (currentScrollY !== targetScrollY) {
            currentScrollY = targetScrollY;
            
            // Final snap position
            if (currentScrollY < window.innerHeight * 1.5) {
                const s = currentScrollY;
                if (heroSubtitle) heroSubtitle.style.transform = `translateY(${s * 0.18}px) translateZ(0)`;
                if (heroTitle) heroTitle.style.transform = `translateY(${s * 0.08}px) translateZ(0)`;
                if (heroCta) heroCta.style.transform = `translateY(${s * 0.12}px) translateZ(0)`;
            }
            
            const viewportBottom = currentScrollY + window.innerHeight;
            parallaxElements.forEach(item => {
                if (viewportBottom > item.sectionTop && currentScrollY < item.sectionTop + item.sectionHeight) {
                    const scrolledOffset = currentScrollY - item.sectionTop;
                    const val = scrolledOffset * item.speed;
                    item.element.style.transform = `translateY(${val}px) translateZ(0)`;
                }
            });
        }
        
        requestAnimationFrame(animateParallax);
    }

    animateParallax();
}

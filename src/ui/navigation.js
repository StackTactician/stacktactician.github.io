// ============================================
// Navigation Scroll Behavior
// ============================================
export function initNavigationScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    let isAtTop = true;
    let isHovering = false;

    function updateNav() {
        if (isAtTop || isHovering) {
            nav.classList.remove('nav-hidden');
        } else {
            nav.classList.add('nav-hidden');
        }
    }

    window.addEventListener('scroll', () => {
        isAtTop = window.scrollY < 50;
        updateNav();
    });

    document.addEventListener('mousemove', (e) => {
        // Show if mouse is near top (within 100px)
        isHovering = e.clientY < 100;
        updateNav();
    });

    // Logo click to scroll to top
    const navLogo = document.querySelector('.nav-logo');
    if (navLogo) {
        navLogo.style.cursor = 'pointer';
        navLogo.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

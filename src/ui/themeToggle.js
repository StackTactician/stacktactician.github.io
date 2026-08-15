// ============================================
// Theme Toggle
// ============================================

export function initThemeToggle({ getScene = () => null } = {}) {
    const toggleBtn = document.getElementById('themeToggle');
    const mobileToggleBtn = document.getElementById('mobileThemeToggle');

    // Helper to update UI
    const updateUI = (isLight) => {
        const icon = isLight ? '☾' : '☀';
        const transform = isLight ? 'rotate(360deg)' : 'rotate(0deg)';

        if (toggleBtn) {
            const i = toggleBtn.querySelector('.theme-icon');
            if (i) { i.textContent = icon; i.style.transform = transform; }
        }
        if (mobileToggleBtn) {
            const i = mobileToggleBtn.querySelector('.theme-icon');
            if (i) { i.textContent = icon; i.style.transform = transform; }
        }
    };

    // Check initial state
    let isLightMode = document.body.classList.contains('light-mode') || localStorage.getItem('theme') === 'light';
    if (isLightMode) {
        document.body.classList.add('light-mode');
        updateUI(true);
        const scene = getScene();
        if (scene) scene.setLightMode(true);
    }

    const handleToggle = () => {
        const changeTheme = () => {
            isLightMode = !isLightMode;
            document.body.classList.toggle('light-mode', isLightMode);
            localStorage.setItem('theme', isLightMode ? 'light' : 'dark');

            updateUI(isLightMode);
            const scene = getScene();
            if (scene) scene.setLightMode(isLightMode);
        };

        // Fallback for browsers without View Transition support or if user prefers reduced motion
        if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            changeTheme();
            return;
        }

        // Mubarak's special goof: transition from a random coordinates each time
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;

        // Calculate distance to the furthest corner to guarantee coverage
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(changeTheme);

        transition.ready.then(() => {
            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`
                    ]
                },
                {
                    duration: 450, // Snappy responsive speed
                    easing: 'ease-in-out',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        });
    };

    if (toggleBtn) toggleBtn.addEventListener('click', handleToggle);
    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', handleToggle);
}

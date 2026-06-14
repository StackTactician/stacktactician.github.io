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
        isLightMode = !isLightMode;
        document.body.classList.toggle('light-mode', isLightMode);
        localStorage.setItem('theme', isLightMode ? 'light' : 'dark');

        updateUI(isLightMode);
        const scene = getScene();
        if (scene) scene.setLightMode(isLightMode);
    };

    if (toggleBtn) toggleBtn.addEventListener('click', handleToggle);
    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', handleToggle);
}

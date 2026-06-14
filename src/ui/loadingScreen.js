// ============================================
// Loading Screen
// ============================================
export function simulateLoading(callback) {
    const loadingScreen = document.getElementById('loadingScreen');
    const container = document.getElementById('loadingLogoContainer');

    if (!container || !loadingScreen) {
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (callback) callback();
        return;
    }

    const fallback = () => {
        loadingScreen.classList.add('hidden');
        if (callback) callback();
    };

    fetch('assets/profile.svg')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load logo SVG');
            return response.text();
        })
        .then(svgText => {
            container.innerHTML = svgText;
            const svg = container.querySelector('svg');
            const path = container.querySelector('path');

            if (!svg || !path) {
                throw new Error('SVG or path element not found');
            }

            // Strip the outer square path of the SVG to leave only the negative space logo
            const originalD = path.getAttribute('d');
            if (originalD) {
                const secondMIndex = originalD.indexOf(' M');
                if (secondMIndex !== -1) {
                    path.setAttribute('d', originalD.substring(secondMIndex).trim());
                }
            }

            // Remove inline styling attributes to let CSS control them
            path.removeAttribute('fill');
            path.removeAttribute('stroke');
            path.removeAttribute('style');
            path.classList.add('loading-logo-path');

            // Force SVG to scale nicely inside container
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.classList.add('loading-logo-svg');

            // Inject the shimmer overlay element
            const shimmer = document.createElement('div');
            shimmer.className = 'shimmer-overlay';
            container.appendChild(shimmer);

            // Force layout reflow
            svg.getBoundingClientRect();

            // Step 1: Fade in and focus logo
            setTimeout(() => {
                loadingScreen.classList.add('active');
            }, 50);

            // Step 2: Trigger shimmer sweep after logo is fully focused
            setTimeout(() => {
                loadingScreen.classList.add('shimmering');
            }, 1300);

            // Step 3: Fade out preloader and initialize the page scripts
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                if (callback) callback();
            }, 2500);
        })
        .catch(err => {
            console.warn('SVG Preloader Error:', err);
            fallback();
        });
}

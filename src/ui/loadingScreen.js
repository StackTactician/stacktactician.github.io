// ============================================
// Loading Screen with Radial Progress Ring
// ============================================
export function simulateLoading(callback) {
    const loadingScreen = document.getElementById('loadingScreen');
    const container = document.getElementById('loadingLogoContainer');
    const ring = document.getElementById('loadingProgressRing');

    if (!container || !loadingScreen || !ring) {
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (callback) callback();
        return;
    }

    const fallback = () => {
        loadingScreen.classList.add('hidden');
        if (callback) callback();
    };

    // Calculate progress circumference dynamically (r=77)
    const R = 77;
    const CIRC = 2 * Math.PI * R;
    ring.style.strokeDasharray = CIRC;
    ring.style.strokeDashoffset = CIRC;

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

            // Step 2: Trigger radial progress fill (ease-in-out requestAnimationFrame)
            let current = 0;
            let startT = null;
            const target = 100;
            const dur = 1800; // 1.8s progress duration

            function ease(t) {
                // Cubic ease-in-out ease function
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }

            function frame(ts) {
                if (!startT) startT = ts;
                const p = Math.min((ts - startT) / dur, 1);
                const e = ease(p);
                current = target * e;

                const offset = CIRC - (current / 100) * CIRC;
                ring.style.strokeDashoffset = offset.toFixed(2);

                if (p < 1) {
                    requestAnimationFrame(frame);
                } else {
                    // Animation complete:
                    // Step 3: Trigger shimmer sweep
                    loadingScreen.classList.add('shimmering');

                    // Step 4: Fade out preloader and initialize the page scripts
                    setTimeout(() => {
                        loadingScreen.classList.add('hidden');
                        if (callback) callback();
                    }, 1000); // 1000ms shimmer visibility & fade duration
                }
            }

            // Start progress animation shortly after logo starts fading in
            setTimeout(() => {
                requestAnimationFrame(frame);
            }, 400);
        })
        .catch(err => {
            console.warn('SVG Preloader Error:', err);
            fallback();
        });
}

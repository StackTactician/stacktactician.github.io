// ============================================
// Magnetic Hover Effect
// ============================================
export function initMagneticElements() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    const selectors = [
        '.social-link-large',
        '.btn',
        '.btn-outline',
        '.btn-submit',
        '.theme-toggle',
        '.terminal-minimize',
        '.back-to-top',
        '.nav-logo'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    const threshold = 100; // 100px activation radius
    const magneticData = [];

    // Cache stable layout center coordinates of each element on the page
    function cacheCoordinates() {
        elements.forEach((el, index) => {
            let data = magneticData[index];
            if (!data) {
                data = {
                    element: el,
                    pageX: 0,
                    pageY: 0,
                    x: 0,
                    y: 0,
                    vx: 0,
                    vy: 0,
                    targetX: 0,
                    targetY: 0,
                    animating: false
                };
                magneticData[index] = data;
            }

            // Only reset style if the element is currently displaced by animation
            const isOffset = data.x !== 0 || data.y !== 0;
            let prevTransform, prevTransition;
            
            if (isOffset) {
                prevTransform = el.style.transform;
                prevTransition = el.style.transition;
                el.style.transform = 'none';
                el.style.transition = 'none';
            }
            
            const rect = el.getBoundingClientRect();
            data.pageX = rect.left + window.scrollX + rect.width / 2;
            data.pageY = rect.top + window.scrollY + rect.height / 2;
            
            if (isOffset) {
                el.style.transform = prevTransform;
                el.style.transition = prevTransition;
            }
        });
    }

    cacheCoordinates();
    window.addEventListener('resize', cacheCoordinates);
    window.addEventListener('scroll', cacheCoordinates, { passive: true });

    // Spring solver parameters
    const stiffness = 120;
    const damping = 8;
    const mass = 0.8;

    let isLoopActive = false;
    let lastTime = performance.now();

    function updateSprings(now) {
        let dt = (now - lastTime) / 1000;
        lastTime = now;

        // Clamp dt to prevent layout jumps in background tabs
        if (dt > 0.1) dt = 0.1;
        if (dt < 0.001) dt = 0.001;

        let activeCount = 0;

        magneticData.forEach(data => {
            if (!data.animating) return;

            // Euler-Cromer integration for spring mass solver
            const ax = (-stiffness * (data.x - data.targetX) - damping * data.vx) / mass;
            const ay = (-stiffness * (data.y - data.targetY) - damping * data.vy) / mass;

            data.vx += ax * dt;
            data.vy += ay * dt;

            data.x += data.vx * dt;
            data.y += data.vy * dt;

            // Apply displacement using GPU composited translate3d
            data.element.style.transform = `translate3d(${data.x.toFixed(2)}px, ${data.y.toFixed(2)}px, 0)`;

            // Check if element has settled
            const isSettlingX = Math.abs(data.vx) < 0.05 && Math.abs(data.x - data.targetX) < 0.05;
            const isSettlingY = Math.abs(data.vy) < 0.05 && Math.abs(data.y - data.targetY) < 0.05;

            if (isSettlingX && isSettlingY) {
                data.x = data.targetX;
                data.y = data.targetY;
                data.vx = 0;
                data.vy = 0;
                
                if (data.targetX === 0 && data.targetY === 0) {
                    data.element.style.transform = '';
                } else {
                    data.element.style.transform = `translate3d(${data.targetX.toFixed(2)}px, ${data.targetY.toFixed(2)}px, 0)`;
                }
                data.element.style.transition = ''; // Restore default CSS transitions
                data.animating = false;
            } else {
                activeCount++;
            }
        });

        if (activeCount > 0) {
            requestAnimationFrame(updateSprings);
        } else {
            isLoopActive = false;
        }
    }

    document.addEventListener('mousemove', (e) => {
        const mx = e.clientX;
        const my = e.clientY;
        let needsActivation = false;

        magneticData.forEach(data => {
            const cx = data.pageX - window.scrollX;
            const cy = data.pageY - window.scrollY;

            const dx = mx - cx;
            const dy = my - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < threshold) {
                const pullPower = (threshold - dist) / threshold; // 0 to 1
                data.targetX = dx * 0.35 * pullPower;
                data.targetY = dy * 0.35 * pullPower;
            } else {
                data.targetX = 0;
                data.targetY = 0;
            }

            // If coordinates change, activate physics updates
            if (data.targetX !== data.x || data.targetY !== data.y) {
                data.animating = true;
                data.element.style.transition = 'none'; // Temporarily bypass CSS transitions
                needsActivation = true;
            }
        });

        if (needsActivation && !isLoopActive) {
            isLoopActive = true;
            lastTime = performance.now();
            requestAnimationFrame(updateSprings);
        }
    });
}

class Spring {
    constructor(val, stiffness = 240, damping = 9) {
        this.val = val;
        this.target = val;
        this.vel = 0;
        this.stiffness = stiffness;
        this.damping = damping;
    }
    update(dt) {
        const fSpring = -this.stiffness * (this.val - this.target);
        const fDamper = -this.damping * this.vel;
        const acc = fSpring + fDamper;
        this.vel += acc * dt;
        this.val += this.vel * dt;
    }
}

export function initCustomCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let isVisible = false;
    let isMousePointer = false;

    // Springs for the bobble hover effect
    const springX = new Spring(0, 240, 9);
    const springY = new Spring(0, 240, 9);
    const springRotate = new Spring(0, 240, 9);
    const springScaleX = new Spring(1, 240, 9);
    const springScaleY = new Spring(1, 240, 9);

    let activeLink = null;
    let linkCenterX = 0;
    let linkCenterY = 0;

    // Track real-time mouse velocity
    let lastTime = performance.now();
    let mouseVX = 0;
    let mouseVY = 0;

    window.addEventListener('pointermove', (e) => {
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        if (dt > 0) {
            mouseVX = (e.clientX - mouseX) / dt;
            mouseVY = (e.clientY - mouseY) / dt;
        }
        mouseX = e.clientX;
        mouseY = e.clientY;
        lastTime = now;

        if (e.pointerType === 'mouse') {
            isMousePointer = true;
            document.body.classList.add('custom-cursor-active');
            if (!isVisible) {
                cursor.style.opacity = '1';
                isVisible = true;
            }
        } else {
            isMousePointer = false;
            document.body.classList.remove('custom-cursor-active');
            cursor.style.opacity = '0';
            isVisible = false;
        }
    });

    document.addEventListener('pointerleave', () => {
        cursor.style.opacity = '0';
        isVisible = false;
    });

    // Handle entering and leaving nav links in the header
    const interactives = 'a, button, .clickable, .tools-folder, .skill, .work-toggle';
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    let leaveTimeout = null;

    navLinks.forEach(link => {
        link.addEventListener('pointerenter', () => {
            clearTimeout(leaveTimeout);
            
            const isNewLink = activeLink !== link;
            activeLink = link;
            cursor.classList.add('cursor-pill');

            // Measure link bounds
            const rect = link.getBoundingClientRect();
            linkCenterX = rect.left + rect.width / 2;
            linkCenterY = rect.top + rect.height / 2;

            // Set cursor size dynamically to act as the pill
            const paddingX = 14;
            const paddingY = 6;
            cursor.style.width = `${rect.width + paddingX * 2}px`;
            cursor.style.height = `${rect.height + paddingY * 2}px`;

            // Trigger spring physics impulse based on mouse speed
            if (isNewLink) {
                const maxSpeed = 4000;
                const speed = Math.min(Math.hypot(mouseVX, mouseVY), maxSpeed);
                const scaleFactor = 0.0001;
                const stretchFactor = 0.00015;
                const offsetFactor = 0.08;
                const rotateFactor = 0.004;

                const scaleChange = speed * scaleFactor;
                const stretch = (Math.abs(mouseVX) - Math.abs(mouseVY)) * stretchFactor;

                springX.vel = mouseVX * offsetFactor;
                springY.vel = mouseVY * offsetFactor;
                springRotate.vel = mouseVX * rotateFactor;
                springScaleX.vel = scaleChange + stretch;
                springScaleY.vel = scaleChange - stretch;
            }
        });

        link.addEventListener('pointerleave', () => {
            leaveTimeout = setTimeout(() => {
                if (activeLink === link) {
                    activeLink = null;
                    cursor.classList.remove('cursor-pill');
                    cursor.style.width = '';
                    cursor.style.height = '';
                }
            }, 20); // 20ms debounce allows entering another link without a visual glitch
        });
    });

    // Handle hover scaling for other interactive elements on the page
    document.addEventListener('pointerover', (e) => {
        if (!isMousePointer) return;
        
        // Skip header links as they have custom enter/leave logic
        if (e.target.closest('.nav-links .nav-link')) return;

        if (e.target.closest(interactives)) {
            cursor.classList.add('cursor-hover');
        }
    });

    document.addEventListener('pointerout', (e) => {
        if (e.target.closest(interactives) && !e.target.closest('.nav-links .nav-link')) {
            cursor.classList.remove('cursor-hover');
        }
    });

    let lastLoopTime = performance.now();

    function tick(currentTime) {
        const dt = (currentTime - lastLoopTime) / 1000;
        lastLoopTime = currentTime;

        const clampedDt = Math.min(dt, 0.1);

        let targetX = mouseX;
        let targetY = mouseY;

        if (activeLink) {
            // Re-calculate center to keep it accurate even on resize/scroll
            const rect = activeLink.getBoundingClientRect();
            linkCenterX = rect.left + rect.width / 2;
            linkCenterY = rect.top + rect.height / 2;

            targetX = linkCenterX;
            targetY = linkCenterY;

            // Target positions are relative to the link center
            const dx = mouseX - linkCenterX;
            const dy = mouseY - linkCenterY;
            springX.target = dx * 0.15; // drag factor
            springY.target = dy * 0.15;

            // Update active springs
            springX.update(clampedDt);
            springY.update(clampedDt);
            springRotate.update(clampedDt);
            springScaleX.update(clampedDt);
            springScaleY.update(clampedDt);
        } else {
            // Decay springs back to rest
            springX.target = 0;
            springY.target = 0;
            springRotate.target = 0;
            springScaleX.target = 1;
            springScaleY.target = 1;

            springX.update(clampedDt);
            springY.update(clampedDt);
            springRotate.update(clampedDt);
            springScaleX.update(clampedDt);
            springScaleY.update(clampedDt);
        }

        // Smooth base position interpolation (lerp)
        const ease = 0.16;
        cursorX += (targetX - cursorX) * ease;
        cursorY += (targetY - cursorY) * ease;

        // Apply smooth coordinates and spring-physics transforms
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        cursor.style.transform = `translate3d(-50%, -50%, 0) translate3d(${springX.val}px, ${springY.val}px, 0) rotate(${springRotate.val}deg) scale(${springScaleX.val}, ${springScaleY.val})`;

        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

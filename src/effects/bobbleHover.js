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

class BobbleItem {
    constructor(element, options) {
        this.element = element;
        this.options = options;

        this.x = new Spring(0, options.stiffness, options.damping);
        this.y = new Spring(0, options.stiffness, options.damping);
        this.rotate = new Spring(0, options.stiffness, options.damping);
        this.scaleX = new Spring(1, options.stiffness, options.damping);
        this.scaleY = new Spring(1, options.stiffness, options.damping);

        this.originX = 0.5;
        this.originY = 0.5;

        // Set transform-origin initially
        this.element.style.transformOrigin = '50% 50%';

        this.element.addEventListener('pointerenter', (e) => {
            this.handleEnter(mouseVX, mouseVY);
        });
    }

    handleEnter(vx, vy) {
        const maxSpeed = this.options.maxSpeed;
        const clampedVX = Math.max(-maxSpeed, Math.min(maxSpeed, vx));
        const clampedVY = Math.max(-maxSpeed, Math.min(maxSpeed, vy));
        const speed = Math.min(Math.hypot(clampedVX, clampedVY), maxSpeed);

        // Displace transform origin away from entering velocity direction
        if (speed > 10) {
            this.originX = 0.5 + (0.5 * clampedVX) / maxSpeed;
            this.originY = 0.5 + (0.5 * clampedVY) / maxSpeed;
        } else {
            this.originX = 0.5;
            this.originY = 0.5;
        }

        const scaleChange = speed * this.options.scaleFactor;
        const stretch = (Math.abs(clampedVX) - Math.abs(clampedVY)) * this.options.stretchFactor;

        // Apply velocity impulse directly to the springs
        this.x.vel = clampedVX * this.options.offsetFactor;
        this.y.vel = clampedVY * this.options.offsetFactor;
        this.rotate.vel = clampedVX * this.options.rotateFactor;
        this.scaleX.vel = scaleChange + stretch;
        this.scaleY.vel = scaleChange - stretch;
    }

    update(dt) {
        this.x.update(dt);
        this.y.update(dt);
        this.rotate.update(dt);
        this.scaleX.update(dt);
        this.scaleY.update(dt);

        this.element.style.transformOrigin = `${this.originX * 100}% ${this.originY * 100}%`;
        this.element.style.transform = `translate3d(${this.x.val}px, ${this.y.val}px, 0) rotate(${this.rotate.val}deg) scale(${this.scaleX.val}, ${this.scaleY.val})`;
    }
}

// Global mouse velocity tracking
let mouseX = 0;
let mouseY = 0;
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
});

const items = [];
let lastLoopTime = performance.now();

function loop(currentTime) {
    const dt = (currentTime - lastLoopTime) / 1000;
    lastLoopTime = currentTime;

    const clampedDt = Math.min(dt, 0.1);

    items.forEach(item => {
        item.update(clampedDt);
    });

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

export function initBobbleHover(selector, customOptions = {}) {
    const options = {
        stiffness: 240,
        damping: 9,
        offsetFactor: 0.08,
        scaleFactor: 0.0001,
        stretchFactor: 0.00015,
        rotateFactor: 0.004,
        maxSpeed: 4000,
        ...customOptions
    };

    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        const item = new BobbleItem(element, options);
        items.push(item);
    });
}

/**
 * Portfolio - Three.js Scene with Momentum Controls
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

console.log('Script loaded successfully');

// ============================================
// CONFIGURATION
// ============================================
const CAMERA_DISTANCE = 5;

// ============================================
// Three.js Scene
// ============================================
class Scene3D {
    constructor(onReady) {
        this.canvas = document.getElementById('three-canvas');
        this.model = null;
        this.onReady = onReady;

        // Rotation state with momentum
        this.rotationY = 0;
        this.velocity = 0;
        this.friction = 0.92;
        this.sensitivity = 0.0008;

        // Mouse tracking
        this.lastMouseX = window.innerWidth / 2;

        // Raycaster for hover/click detection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Hover state
        this.hoveredFace = -1;
        this.hoverIntensity = [0, 0, 0, 0, 0, 0];
        this.hoverSpeed = 0.15;
        this.normalMaterials = [];

        // Light mode state
        this.isLightMode = false;
        this.globalInvert = 0;
        this.globalInvertSpeed = 0.15;
        this.darkBgColor = new THREE.Color(0x0a0a0a);
        this.lightBgColor = new THREE.Color(0xf4f4f5);

        // Face to section mapping
        this.faceToSection = {
            0: '#work',
            1: '#about',
            2: '#work',
            3: '#work',
            4: '#work',
            5: '#contact'
        };

        this.init();
    }

    createParticles() {
        const particleCount = 60; // Few and small as requested
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
            sizes[i] = Math.random() * 0.05; // Very small
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupLighting();
        this.setupRenderer();
        this.createPlaceholder();
        this.createParticles();
        this.bindEvents();
        this.animate();
        if (this.onReady) this.onReady();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
    }

    setLightMode(isLight) {
        this.isLightMode = isLight;
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.updateCameraPosition();
        this.camera.lookAt(0, -0.2, 0);
    }

    updateCameraPosition() {
        // User requested cube size to be consistent everywhere (removed mobile check)
        this.camera.position.set(0, 1.2, CAMERA_DISTANCE);
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(5, 5, 5);
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 3, 0);
        this.scene.add(fillLight);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    createPlaceholder() {
        // Face config: type can be 'text' or 'image'
        const faceConfigs = [
            { type: 'image', image: 'assets/linkedin.svg', url: 'https://www.linkedin.com/in/mubarak-mustapha-75b4b6300/' },
            { type: 'image', image: 'assets/github.svg', url: 'https://github.com/StackTactician' },
            { type: 'image', image: 'assets/discord.svg', url: 'https://discord.com/users/1116656832220504104' },
            { type: 'image', image: 'assets/mail.svg', url: 'mailto:mmmoyosore09@gmail.com' },
            { type: 'image', image: 'assets/x.svg', url: 'https://x.com/notyet_him' },
            { type: 'image', image: 'assets/whatsapp.svg', url: 'https://wa.me/2347036944371' }
        ];

        this.faceConfigs = faceConfigs;
        this.normalMaterials = faceConfigs.map(config => {
            if (config.type === 'image') {
                return this.createImageMaterial(config.image);
            } else {
                return this.createTextMaterial(config.text);
            }
        });

        // SMALLER cube
        const geometry = new THREE.BoxGeometry(1.3, 1.3, 1.3);
        this.model = new THREE.Mesh(geometry, [...this.normalMaterials]);

        // Wireframe
        // Wireframe
        const edges = new THREE.EdgesGeometry(geometry);
        this.wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        const wireframe = new THREE.LineSegments(edges, this.wireframeMaterial);
        this.model.add(wireframe);

        // --- INVISIBLE HIT BOX (Larger Click Area) ---
        // Generous size (1.7 vs 1.3) to make clicking easier
        const hitGeometry = new THREE.BoxGeometry(1.7, 1.7, 1.7);
        const hitMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        // Use array to ensure face index mapping works like the main cube
        const hitMaterials = Array(6).fill(hitMaterial);
        this.hitBox = new THREE.Mesh(hitGeometry, hitMaterials);
        this.model.add(this.hitBox);

        this.scene.add(this.model);
    }

    createImageMaterial(url) {
        const texture = new THREE.TextureLoader().load(url);
        // texture.minFilter = THREE.LinearFilter;

        return new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                invertAmount: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D map;
                uniform float invertAmount;
                varying vec2 vUv;
                
                void main() {
                    // 1. Background (Dark Gray/Black)
                    vec3 bgColor = vec3(0.04);
                    
                    // 2. Border (White)
                    float borderWidth = 0.05;
                    float border = step(vUv.x, borderWidth) + step(1.0 - borderWidth, vUv.x) + 
                                   step(vUv.y, borderWidth) + step(1.0 - borderWidth, vUv.y);
                    vec3 color = mix(bgColor, vec3(1.0), min(border, 1.0));
                    
                    // 3. Logo (Texture)
                    // Scale down slightly to fit inside border
                    vec2 center = vec2(0.5);
                    vec2 scaledUv = (vUv - center) * 1.5 + center; // 1.5x zoom out (make smaller)
                    
                    // Check bounds to prevent repeating/clamping artifiacts if using unclamped texture
                    if (scaledUv.x >= 0.0 && scaledUv.x <= 1.0 && scaledUv.y >= 0.0 && scaledUv.y <= 1.0) {
                        vec4 tex = texture2D(map, scaledUv);
                        // Mix based on alpha
                        color = mix(color, tex.rgb, tex.a);
                    }

                    // 4. Invert Logic
                    vec3 inverted = vec3(1.0) - color;
                    vec3 final = mix(color, inverted, invertAmount);
                    
                    gl_FragColor = vec4(final, 1.0);
                }
            `
        });
    }

    // Old createFaceMaterial removed in favor of simpler createImageMaterial and createTextMaterial
    // Keeping createTextMaterial below
    createFaceMaterial(config) {
        // Deprecated
        return this.createTextMaterial(config.text || '?');
    }

    createTextMaterial(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;

        // Black background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Modern font: Inter (loaded via Google Fonts in HTML)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Shader for smooth inversion
        const material = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                invertAmount: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D map;
                uniform float invertAmount;
                varying vec2 vUv;
                void main() {
                    vec4 texColor = texture2D(map, vUv);
                    vec3 inverted = vec3(1.0) - texColor.rgb;
                    vec3 finalColor = mix(texColor.rgb, inverted, invertAmount);
                    gl_FragColor = vec4(finalColor, texColor.a);
                }
            `
        });

        return material;
    }

    bindEvents() {
        document.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: true });
        document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });
        document.addEventListener('wheel', (e) => this.onWheel(e), { passive: true });
        window.addEventListener('resize', () => this.onResize());
        document.addEventListener('click', (e) => this.onClick(e));
    }

    onClick(e) {
        // Only block if clicking an INTERACTIVE element. 
        // Allow clicking through the hero container or text if it's not a link/button.
        if (e.target.closest('a, button, .nav, .work-item, .contact-email, .social-link')) return;

        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.hitBox) {
            // Raycast against the larger hitBox instead of the visual model
            const intersects = this.raycaster.intersectObject(this.hitBox, false);
            if (intersects.length > 0) {
                const faceIndex = intersects[0].face.materialIndex;
                const faceConfig = this.faceConfigs[faceIndex];

                // If it's an icon with a URL, open it
                if (faceConfig && faceConfig.url) {
                    window.open(faceConfig.url, '_blank');
                    return;
                }

                // Otherwise scroll to section
                const section = this.faceToSection[faceIndex];
                if (section) {
                    const target = document.querySelector(section);
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    }

    onMouseMove(e) {
        const delta = e.clientX - this.lastMouseX;
        this.rotationY += delta * 0.002;
        this.velocity += delta * this.sensitivity;
        this.lastMouseX = e.clientX;
        this.updateHover(e);
    }

    updateHover(e) {
        if (!this.hitBox) return;

        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Raycast against the larger hitBox
        const intersects = this.raycaster.intersectObject(this.hitBox, false);
        if (intersects.length > 0 && intersects[0].face) {
            this.hoveredFace = intersects[0].face.materialIndex;
            document.body.style.cursor = 'pointer';
        } else {
            this.hoveredFace = -1;
            document.body.style.cursor = 'default';
        }
    }

    onTouchMove(e) {
        const delta = e.touches[0].clientX - this.lastMouseX;
        this.velocity += delta * this.sensitivity;
        this.lastMouseX = e.touches[0].clientX;
    }

    onWheel(e) {
        this.velocity += e.deltaY * 0.001;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.updateCameraPosition();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Idle rotation
        this.rotationY += 0.005; /* Increased speed from 0.001 */
        this.rotationY += this.velocity;
        this.velocity *= this.friction;
        if (Math.abs(this.velocity) < 0.0001) this.velocity = 0;

        // Scroll interaction
        const scrollOffset = window.scrollY * 0.002; // Increased sensitivity slightly

        if (this.model) {
            // Y rotation is driven by mouse/momentum/idle only
            this.model.rotation.y = this.rotationY;

            // X rotation is driven by scroll (vertical rotation) + default tilt
            this.model.rotation.x = scrollOffset + 0.07;
        }

        // Particle animation
        if (this.particles) {
            this.particles.rotation.y = scrollOffset * 0.1;
            this.particles.rotation.x = scrollOffset * 0.2; // Match main cube axis
        }

        // Light mode transition
        const targetInvert = this.isLightMode ? 1 : 0;
        this.globalInvert += (targetInvert - this.globalInvert) * this.globalInvertSpeed;
        this.scene.background.lerpColors(this.darkBgColor, this.lightBgColor, this.globalInvert);

        if (this.wireframeMaterial) {
            const wireColor = 1 - this.globalInvert;
            this.wireframeMaterial.color.setRGB(wireColor, wireColor, wireColor);
        }

        if (this.particles) {
            const particleColor = 1 - this.globalInvert;
            this.particles.material.color.setRGB(particleColor, particleColor, particleColor);
        }

        this.updateHoverTransitions();
        this.renderer.render(this.scene, this.camera);
    }

    updateHoverTransitions() {
        if (!this.model || this.normalMaterials.length === 0) return;

        for (let i = 0; i < 6; i++) {
            const target = (i === this.hoveredFace) ? 1 : 0;
            this.hoverIntensity[i] += (target - this.hoverIntensity[i]) * this.hoverSpeed;

            const material = this.model.material[i];
            if (material && material.uniforms && material.uniforms.invertAmount) {
                const combinedInvert = Math.abs(this.globalInvert - this.hoverIntensity[i]);
                material.uniforms.invertAmount.value = combinedInvert;
            }
        }
    }
}

// ============================================
// Smooth Scroll
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// ============================================
// Scroll Animations
// ============================================
function initScrollAnimations() {
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
        section.style.transform = 'translateY(40px)';
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

// ============================================
// Navigation Scroll Behavior
// ============================================
function initNavigationScroll() {
    const nav = document.querySelector('.nav');
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
}

// ============================================
// Theme Toggle
// ============================================
let scene3DInstance = null;

function initThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    const themeIcon = toggleBtn?.querySelector('.theme-icon');
    if (!toggleBtn) return;

    let isLightMode = false;
    toggleBtn.addEventListener('click', () => {
        isLightMode = !isLightMode;
        document.body.classList.toggle('light-mode', isLightMode);
        if (themeIcon) {
            themeIcon.textContent = isLightMode ? '☾' : '☀';
            themeIcon.style.transform = isLightMode ? 'rotate(360deg)' : 'rotate(0deg)';
        }
        if (scene3DInstance) scene3DInstance.setLightMode(isLightMode);
    });
}

// ============================================
// Loading Screen
// ============================================
function simulateLoading(callback) {
    const loadingScreen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('loadingProgress');

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        if (progressBar) progressBar.style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                if (loadingScreen) loadingScreen.classList.add('hidden');
                if (callback) callback();
            }, 300);
        }
    }, 100);
}

// ============================================
// Back to Top functionality
// ============================================
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    simulateLoading(() => {
        scene3DInstance = new Scene3D();
    });
    initSmoothScroll();
    initScrollAnimations();
    initNavigationScroll();
    initBackToTop();
    initThemeToggle();
});

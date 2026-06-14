/**
 * Portfolio - Three.js Scene with Momentum Controls
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// ============================================
// CONFIGURATION
// ============================================
const CAMERA_DISTANCE = 5;

// ============================================
// Three.js Scene
// ============================================
export class Scene3D {
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

        // Initialize smooth variables
        this.currentScrollY = 0;
        this.targetCameraZ = CAMERA_DISTANCE;

        // Store initial dimensions for mobile stability
        this.lockedWidth = null;
        this.lockedHeight = null;

        // Background Logos for Light Mode
        this.bgLogos = [];
        this.bgLogoGroup = new THREE.Group();

        this.init();
    }

    createParticles() {
        const particleCount = 120; // Increased from 60
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        this.particleVelocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
            sizes[i] = Math.random() * 0.05; // Very small

            // Slow drift velocity
            this.particleVelocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.008,
                (Math.random() - 0.5) * 0.008,
                (Math.random() - 0.5) * 0.008
            ));
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

        // --- Create Constellation Lines ---
        const maxConnections = particleCount * 4; // Max connections capacity
        const lineGeometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array(maxConnections * 2 * 3); // 2 points per line, 3 coords per point
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        this.lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.07, // Very faint, subtle neural network lines
            depthWrite: false
        });

        this.constellationLines = new THREE.LineSegments(lineGeometry, this.lineMaterial);
        this.scene.add(this.constellationLines);
    }

    createBackgroundLogos() {
        // Assets available: python, sql, django, fastapi, linux
        const logoUrls = [
            'assets/python.svg',
            'assets/sql.svg',
            'assets/django.svg',
            'assets/fastapi.svg',
            'assets/linux.svg'
        ];

        const loader = new THREE.TextureLoader();
        const logoCount = logoUrls.length; // Exactly 5 logos
        const placedLogos = [];

        for (let i = 0; i < logoCount; i++) {
            const url = logoUrls[i]; // One unique logo each

            loader.load(url, (texture) => {
                // Determine aspect ratio if possible, or just assume square/contain
                // For simple SVGs, square logic is usually fine or we scale slightly

                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0, // Start invisible, controlled by light mode
                    color: 0xaaaaaa, // Tint gray so they aren't stark black/white
                    side: THREE.DoubleSide
                });

                const size = 3.0 + Math.random() * 2.0; // Larger size 3.0 - 5.0
                const radius = size / 2;
                const geometry = new THREE.PlaneGeometry(size, size);
                const mesh = new THREE.Mesh(geometry, material);

                // Collision-checked placement: 3 Left, 2 Right
                let x, y;
                let overlap = true;
                let attempts = 0;
                const isLeft = i < 3;

                while (overlap && attempts < 200) {
                    x = isLeft ? (-4 - Math.random() * 21) : (4 + Math.random() * 21);
                    y = (Math.random() - 0.5) * 30;
                    overlap = false;
                    for (const p of placedLogos) {
                        if (Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2) < radius + p.r + 5) {
                            overlap = true;
                            break;
                        }
                    }
                    attempts++;
                }
                if (overlap) return; // Skip if couldn't place

                mesh.position.x = x;
                mesh.position.y = y;
                mesh.position.z = -5 - Math.random() * 5;

                // Static Rotation
                mesh.rotation.z = (Math.random() - 0.5) * 0.5;
                mesh.rotation.x = 0;
                mesh.rotation.y = 0;

                placedLogos.push({ x, y, r: radius });

                // (No animation props - logos are static)

                this.bgLogoGroup.add(mesh);
                this.bgLogos.push(mesh);
            });
        }
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupLighting();
        this.setupRenderer();
        this.createPlaceholder();
        this.createParticles();
        this.createBackgroundLogos();
        this.bindEvents();
        this.animate();
        if (this.onReady) this.onReady();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.add(this.bgLogoGroup);
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
        // Fixed camera distance - never changes
        this.targetCameraZ = CAMERA_DISTANCE;
        if (this.camera) {
            this.camera.position.z = CAMERA_DISTANCE;
        }
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
            { type: 'image', image: 'assets/linkedin.svg', url: 'https://www.linkedin.com/in/mubarak-mustapha-75b4b6300/', isBlackIcon: true },
            { type: 'image', image: 'assets/github.svg', url: 'https://github.com/StackTactician' },
            { type: 'image', image: 'assets/lazyhooks.svg', url: 'https://pypi.org/project/lazyhooks/', isBlackIcon: true },
            { type: 'image', image: 'assets/mail.svg', url: 'mailto:mmmoyosore09@gmail.com' },
            { type: 'image', image: 'assets/x.svg', url: 'https://x.com/notyet_him' },
            { type: 'image', image: 'assets/whatsapp.svg', url: 'https://wa.me/2347036944371' }
        ];

        this.faceConfigs = faceConfigs;
        this.normalMaterials = faceConfigs.map(config => {
            if (config.type === 'image') {
                return this.createImageMaterial(config.image, config.isBlackIcon);
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

    createImageMaterial(url, isBlackIcon = false) {
        const texture = new THREE.TextureLoader().load(url);
        // texture.minFilter = THREE.LinearFilter;

        return new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                invertAmount: { value: 0.0 },
                isBlackIcon: { value: isBlackIcon ? 1.0 : 0.0 }
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
                uniform float isBlackIcon;
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
                    vec2 scaledUv = (vUv - center) * 1.2 + center; // 1.2x zoom out (make slightly smaller than full)
                    
                    // Check bounds to prevent repeating/clamping artifiacts if using unclamped texture
                    if (scaledUv.x >= 0.0 && scaledUv.x <= 1.0 && scaledUv.y >= 0.0 && scaledUv.y <= 1.0) {
                        vec4 tex = texture2D(map, scaledUv);
                        vec3 texColor = tex.rgb;
                        
                        // If it's a black icon, invert the texture color to make it white (for dark mode base)
                        if (isBlackIcon > 0.5) {
                            texColor = vec3(1.0) - texColor;
                        }
                        
                        // Mix based on alpha
                        color = mix(color, texColor, tex.a);
                    }

                    // 4. Invert Logic
                    // This inverts the FINAL composed color (Bg + Border + Logo)
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
        // Only block if clicking an INTERACTIVE or OVERLAY element. 
        // Allow clicking through the hero container or text if it's not a link/button.
        if (e.target.closest('a, button, input, textarea, .nav, .work-item, .contact-email, .social-link, .section-content, .terminal, .mobile-menu')) return;

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
                    window.open(faceConfig.url, '_blank', 'noopener,noreferrer');
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
        const isMobile = window.innerWidth < 768;
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        // On mobile, lock dimensions after first load.
        // Only resize if width changes (orientation change).
        // This prevents the address bar toggle from affecting cube size.
        if (isMobile) {
            if (this.lockedWidth === null) {
                // First load: store initial dimensions
                this.lockedWidth = newWidth;
                this.lockedHeight = newHeight;
            } else if (newWidth !== this.lockedWidth) {
                // Width changed (orientation change) - update lock
                this.lockedWidth = newWidth;
                this.lockedHeight = newHeight;
            } else {
                // Only height changed (address bar) - ignore
                return;
            }
        }

        // Apply resize
        const w = isMobile ? this.lockedWidth : newWidth;
        const h = isMobile ? this.lockedHeight : newHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.updateCameraPosition();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Smooth Scroll Logic
        this.currentScrollY += (window.scrollY - this.currentScrollY) * 0.1;

        // Smooth Camera Z
        if (this.camera) {
            this.camera.position.z += (this.targetCameraZ - this.camera.position.z) * 0.05;
        }

        // Idle rotation
        this.rotationY += 0.005; /* Increased speed from 0.001 */
        this.rotationY += this.velocity;
        this.velocity *= this.friction;
        if (Math.abs(this.velocity) < 0.0001) this.velocity = 0;

        // Scroll interaction
        const scrollOffset = this.currentScrollY * 0.002;

        if (this.model) {
            // Y rotation is driven by mouse/momentum/idle only
            this.model.rotation.y = this.rotationY;

            // X rotation is driven by scroll (vertical rotation) + default tilt
            this.model.rotation.x = scrollOffset + 0.6;
        }

        // Particle animation
        if (this.particles) {
            // Constant background movement + scroll influence
            this.particles.rotation.y += 0.002;
            this.particles.rotation.x = scrollOffset * 0.2; // Match main cube axis
            this.updateParticlesAndLines();
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

        if (this.lineMaterial) {
            const lineColor = 1 - this.globalInvert;
            this.lineMaterial.color.setRGB(lineColor, lineColor, lineColor);
            this.lineMaterial.opacity = 0.07 * (1 - this.globalInvert) + 0.04 * this.globalInvert;
        }

        // Background Logos Animation
        if (this.bgLogos && this.bgLogos.length > 0) {
            const targetLogoOpacity = this.globalInvert * 0.05; // Max opacity 0.05 when in light mode

            this.bgLogos.forEach(logo => {
                // Fade opacity
                logo.material.opacity += (targetLogoOpacity - logo.material.opacity) * 0.1;
            });
        }

        this.updateHoverTransitions();
        this.renderer.render(this.scene, this.camera);
    }

    updateParticlesAndLines() {
        if (!this.particles || !this.particles.geometry) return;
        const positions = this.particles.geometry.attributes.position.array;
        const particleCount = positions.length / 3;

        // Project mouse coordinates to 3D z = 0 plane
        if (this.camera && this.mouse) {
            const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
            vector.unproject(this.camera);
            const dir = vector.sub(this.camera.position).normalize();
            // Project onto z = 0 plane
            const distance = -this.camera.position.z / dir.z;
            this.mouse3D = this.camera.position.clone().add(dir.multiplyScalar(distance));
        }

        // 1. Update positions by velocity
        for (let i = 0; i < particleCount; i++) {
            // Apply mouse gravity (pull towards the projected mouse 3D position)
            if (this.mouse3D) {
                const px = positions[i * 3];
                const py = positions[i * 3 + 1];
                const pz = positions[i * 3 + 2];

                const dx = this.mouse3D.x - px;
                const dy = this.mouse3D.y - py;
                const dz = this.mouse3D.z - pz; // pull towards z = 0 plane of the mouse projection

                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < 4.5 && dist > 1.0) {
                    // Pull force: much gentler (multiplier 0.00008 instead of 0.0003)
                    const force = (4.5 - dist) * 0.00008;
                    this.particleVelocities[i].x += (dx / dist) * force;
                    this.particleVelocities[i].y += (dy / dist) * force;
                    this.particleVelocities[i].z += (dz / dist) * force;
                } else if (dist <= 1.0 && dist > 0.1) {
                    // Repel force if too close (under 1.0 units) to prevent crowding directly on cursor
                    const force = (1.0 - dist) * 0.002;
                    this.particleVelocities[i].x -= (dx / dist) * force;
                    this.particleVelocities[i].y -= (dy / dist) * force;
                    this.particleVelocities[i].z -= (dz / dist) * force;
                }
            }

            // Apply friction/damping to prevent velocity buildup (damping 0.92 is slightly stronger than 0.95)
            this.particleVelocities[i].multiplyScalar(0.92);

            // Add a tiny bit of random jitter so they keep drifting naturally
            this.particleVelocities[i].x += (Math.random() - 0.5) * 0.0008;
            this.particleVelocities[i].y += (Math.random() - 0.5) * 0.0008;
            this.particleVelocities[i].z += (Math.random() - 0.5) * 0.0008;

            // Clamp velocity to a reasonable speed range (max speed 0.025 instead of 0.04)
            const speed = this.particleVelocities[i].length();
            const maxSpeed = 0.025;
            const minSpeed = 0.0015;
            if (speed > maxSpeed) {
                this.particleVelocities[i].setLength(maxSpeed);
            } else if (speed < minSpeed) {
                this.particleVelocities[i].setLength(minSpeed);
            }

            positions[i * 3] += this.particleVelocities[i].x;
            positions[i * 3 + 1] += this.particleVelocities[i].y;
            positions[i * 3 + 2] += this.particleVelocities[i].z;

            // Boundary checks: wrap around a box of size 20 (from -10 to 10)
            const limit = 10;
            if (positions[i * 3] > limit) {
                positions[i * 3] = -limit;
            } else if (positions[i * 3] < -limit) {
                positions[i * 3] = limit;
            }

            if (positions[i * 3 + 1] > limit) {
                positions[i * 3 + 1] = -limit;
            } else if (positions[i * 3 + 1] < -limit) {
                positions[i * 3 + 1] = limit;
            }

            if (positions[i * 3 + 2] > limit) {
                positions[i * 3 + 2] = -limit;
            } else if (positions[i * 3 + 2] < -limit) {
                positions[i * 3 + 2] = limit;
            }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;

        // 2. Build lines between particles close to each other
        if (this.constellationLines) {
            const linePositions = this.constellationLines.geometry.attributes.position.array;
            let lineIndex = 0;
            const maxConnections = linePositions.length / 3; // Max vertices
            const maxDistance = 3.0; // Distance threshold for drawing a line

            for (let i = 0; i < particleCount; i++) {
                const px = positions[i * 3];
                const py = positions[i * 3 + 1];
                const pz = positions[i * 3 + 2];

                for (let j = i + 1; j < particleCount; j++) {
                    const qx = positions[j * 3];
                    const qy = positions[j * 3 + 1];
                    const qz = positions[j * 3 + 2];

                    // Quick bounding box check first for performance
                    const dx = px - qx;
                    const dy = py - qy;
                    const dz = pz - qz;

                    if (Math.abs(dx) < maxDistance && Math.abs(dy) < maxDistance && Math.abs(dz) < maxDistance) {
                        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                        if (dist < maxDistance) {
                            if (lineIndex + 6 <= maxConnections) {
                                // Add segment endpoints (particle i and particle j)
                                linePositions[lineIndex++] = px;
                                linePositions[lineIndex++] = py;
                                linePositions[lineIndex++] = pz;

                                linePositions[lineIndex++] = qx;
                                linePositions[lineIndex++] = qy;
                                linePositions[lineIndex++] = qz;
                            } else {
                                break;
                            }
                        }
                    }
                }
            }

            this.constellationLines.geometry.attributes.position.needsUpdate = true;
            this.constellationLines.geometry.setDrawRange(0, lineIndex / 3);
        }
    }

    updateHoverTransitions() {
        if (!this.model || this.normalMaterials.length === 0) return;

        for (let i = 0; i < 6; i++) {
            const target = (i === this.hoveredFace) ? 1 : 0;
            this.hoverIntensity[i] += (target - this.hoverIntensity[i]) * this.hoverSpeed;

            const material = this.model.material[i];
            if (material && material.uniforms && material.uniforms.invertAmount) {
                let combinedInvert = Math.abs(this.globalInvert - this.hoverIntensity[i]);
                material.uniforms.invertAmount.value = combinedInvert;
            }
        }
    }
}

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

        // Use a larger offset for the project details card to give it a distinct "slide up" feel
        const yOffset = section.classList.contains('project-details') ? '100px' : '40px';
        section.style.transform = `translateY(${yOffset})`;

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

// ============================================
// Theme Toggle
// ============================================
let scene3DInstance = null;

function initThemeToggle() {
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
        if (scene3DInstance) scene3DInstance.setLightMode(true);
    }

    const handleToggle = () => {
        isLightMode = !isLightMode;
        document.body.classList.toggle('light-mode', isLightMode);
        localStorage.setItem('theme', isLightMode ? 'light' : 'dark');

        updateUI(isLightMode);
        if (scene3DInstance) scene3DInstance.setLightMode(isLightMode);
    };

    if (toggleBtn) toggleBtn.addEventListener('click', handleToggle);
    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', handleToggle);
}

// ============================================
// Loading Screen
// ============================================
function simulateLoading(callback) {
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

// ============================================
// Back to Top functionality
// ============================================
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    const progressCircle = backToTopBtn.querySelector('.progress-ring-circle');
    const circumference = 2 * Math.PI * 22; // 138.23

    window.addEventListener('scroll', () => {
        // Toggle visibility class
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }

        // Calculate scroll progress percentage
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        if (docHeight > 0 && progressCircle) {
            const scrollPercent = Math.min(Math.max(scrollTop / docHeight, 0), 1);
            const offset = circumference - (scrollPercent * circumference);
            progressCircle.style.strokeDashoffset = offset.toFixed(2);
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
// Mobile Menu
// ============================================
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const menu = document.querySelector('.mobile-menu');
    const closeBtn = document.querySelector('.mobile-menu-close');
    const links = document.querySelectorAll('.mobile-nav-link');

    const toggleMenu = () => {
        const isActive = menu.classList.contains('active');
        if (isActive) {
            menu.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            menu.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
    if (closeBtn) closeBtn.addEventListener('click', toggleMenu);

    links.forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// ============================================
// Interactive Terminal
// ============================================
function initTerminal() {
    const input = document.getElementById('terminalInput');
    const output = document.getElementById('terminalOutput');
    if (!input || !output) return;

    const commands = {
        help: () => {
            return `Available commands:
  <span class="terminal-cmd">help</span>          - Show this help message
  <span class="terminal-cmd">download --resume</span> - Download my resume
  <span class="terminal-cmd">about</span>         - Learn about me
  <span class="terminal-cmd">skills</span>        - List my skills
  <span class="terminal-cmd">contact</span>       - Get my contact info
  <span class="terminal-cmd">clear</span>         - Clear the terminal`;
        },
        'download --resume': () => {
            // Trigger download
            const link = document.createElement('a');
            link.href = 'assets/resume.pdf';
            link.download = 'Mubarak_Mustapha_Resume.pdf';
            link.click();
            return 'Downloading resume...';
        },
        about: () => {
            document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
            return 'Scrolling to About section...';
        },
        skills: () => {
            return `My skills:
  • Scripting
  • Python
  • Django / FastAPI
  • SQL
  • Basic Linux`;
        },
        contact: () => {
            return `Contact me:
  Email: mmmoyosore09@gmail.com
  GitHub: github.com/StackTactician
  LinkedIn: linkedin.com/in/mubarak-mustapha-75b4b6300`;
        },
        clear: () => {
            output.innerHTML = '';
            return null; // No output
        }
    };

    const addLine = (text, isCommand = false) => {
        if (text === null) return;
        const line = document.createElement('div');
        line.className = 'terminal-line';

        if (isCommand) {
            const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            line.innerHTML = `<span class="terminal-prompt">$</span> ${escaped}`;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
        } else {
            // Typing animation for output
            output.appendChild(line); // Append empty line first

            let i = 0;
            // Preserving HTML tags during typing is tricky, so for simplicity we'll 
            // set innerHTML immediately but hide it, then reveal chars? 
            // Actually, simplest consistent way for this scale is to just type plain text 
            // or render HTML immediately if it contains tags to avoid breaking markup.

            if (text.includes('<')) {
                // If contains HTML (like the help command), render immediately for safety
                line.innerHTML = text.replace(/\n/g, '<br>');
                output.scrollTop = output.scrollHeight;
            } else {
                // Plain text - type it out
                const typeChar = () => {
                    if (i < text.length) {
                        line.textContent += text.charAt(i);
                        i++;
                        output.scrollTop = output.scrollHeight;
                        setTimeout(typeChar, 10); // 10ms speed
                    }
                };
                typeChar();
            }
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.trim().toLowerCase();
            if (!cmd) return;

            addLine(input.value, true);
            input.value = '';

            const handler = commands[cmd];
            if (handler) {
                const result = handler();
                addLine(result);
            } else {
                addLine(`Command not found: ${cmd}. Type <span class="terminal-cmd">help</span> for available commands.`);
            }
        }
    });

    // Minimize/restore toggle
    const terminal = document.getElementById('terminal');
    const minimizeBtn = document.getElementById('terminalMinimize');
    const header = document.getElementById('terminalHeader');

    let ignoreNextClick = false;

    if (minimizeBtn && terminal) {
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop click from bubbling up to the terminal container
            if (ignoreNextClick) {
                ignoreNextClick = false;
                return;
            }
            terminal.classList.toggle('minimized');
            minimizeBtn.innerHTML = terminal.classList.contains('minimized') ? '&gt;_' : '−';
        });
    }

    // Focus terminal when clicking on it, or restore if minimized
    terminal?.addEventListener('click', (e) => {
        if (ignoreNextClick) {
            ignoreNextClick = false;
            return;
        }
        if (terminal.classList.contains('minimized')) {
            terminal.classList.remove('minimized');
            if (minimizeBtn) minimizeBtn.innerHTML = '−';
            setTimeout(() => input.focus(), 150);
        } else {
            if (e.target.closest('.terminal-minimize')) return;
            input.focus();
        }
    });

    // Make terminal draggable via header
    if (terminal && header) {
        let isDragging = false;
        let startX, startY;
        let initialLeft, initialTop;
        let terminalWidth, terminalHeight;
        let hasMoved = false;

        const onStart = (e) => {
            if (e.type === 'mousedown' && e.button !== 0) return;

            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

            // Don't drag if clicking minimize button unless minimized
            if (!terminal.classList.contains('minimized') && e.target.closest('.terminal-minimize')) {
                return;
            }

            isDragging = true;
            hasMoved = false;
            startX = clientX;
            startY = clientY;

            const rect = terminal.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            terminalWidth = rect.width;
            terminalHeight = rect.height;

            terminal.style.bottom = 'auto';
            terminal.style.right = 'auto';
            terminal.style.left = `${initialLeft}px`;
            terminal.style.top = `${initialTop}px`;
            terminal.classList.add('dragging');

            if (e.type === 'mousedown') {
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onEnd);
            } else {
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend', onEnd);
            }
        };

        const onMove = (e) => {
            if (!isDragging) return;
            if (e.type === 'touchmove') e.preventDefault();

            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                hasMoved = true;
            }

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            const minLeft = 0;
            const maxLeft = window.innerWidth - terminalWidth;
            const minTop = 0;
            const maxTop = window.innerHeight - terminalHeight;

            newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
            newTop = Math.max(minTop, Math.min(newTop, maxTop));

            terminal.style.left = `${newLeft}px`;
            terminal.style.top = `${newTop}px`;
        };

        const onEnd = () => {
            isDragging = false;
            terminal.classList.remove('dragging');

            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);

            if (hasMoved) {
                ignoreNextClick = true;
                setTimeout(() => {
                    ignoreNextClick = false;
                }, 50);
            }
        };

        header.addEventListener('mousedown', onStart);
        header.addEventListener('touchstart', onStart, { passive: true });
    }
}

// ============================================
// Contact Form Handling (Formspree)
// ============================================
function initContactForm() {
    const form = document.getElementById('contactForm');

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn = form.querySelector('.btn-submit');
            const btnText = btn.querySelector('.btn-text');
            const originalText = btnText.textContent;

            // Check custom validity
            const nameInput = form.querySelector('#name');
            const emailInput = form.querySelector('#email');
            const messageInput = form.querySelector('#message');

            let errorMsg = '';
            if (!nameInput || !nameInput.value.trim()) {
                errorMsg = 'PLEASE ENTER YOUR NAME';
            } else if (!emailInput || !emailInput.value.trim()) {
                errorMsg = 'PLEASE ENTER YOUR EMAIL';
            } else if (emailInput && !emailInput.checkValidity()) {
                errorMsg = 'PLEASE ENTER A VALID EMAIL';
            } else if (!messageInput || !messageInput.value.trim()) {
                errorMsg = 'PLEASE ENTER YOUR MESSAGE';
            }

            if (errorMsg) {
                // Shake and show error text
                btnText.textContent = errorMsg;
                btn.classList.add('error');

                setTimeout(() => {
                    btnText.textContent = originalText;
                    btn.classList.remove('error');
                }, 3000);
                return;
            }

            // Set loading state
            btnText.textContent = 'SENDING...';
            btn.classList.add('loading');

            const data = new FormData(form);
            const action = form.action;

            try {
                const response = await fetch(action, {
                    method: 'POST',
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Success
                    btnText.textContent = 'MESSAGE SENT!';
                    btn.classList.add('success');
                    form.reset();

                    // Reset button after 3 seconds
                    setTimeout(() => {
                        btnText.textContent = originalText;
                        btn.classList.remove('loading', 'success');
                    }, 3000);
                } else {
                    // Error
                    btnText.textContent = 'SEND FAILED!';
                    btn.classList.add('error');

                    setTimeout(() => {
                        btnText.textContent = originalText;
                        btn.classList.remove('loading', 'error');
                    }, 3000);
                }
            } catch (error) {
                btnText.textContent = 'NETWORK ERROR!';
                btn.classList.add('error');
                setTimeout(() => {
                    btnText.textContent = originalText;
                    btn.classList.remove('loading', 'error');
                }, 3000);
            }
        });
    }
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    simulateLoading(() => {
        scene3DInstance = new Scene3D();
        initSmoothScroll();
        initScrollAnimations();
        initNavigationScroll();
        initBackToTop();
        initMobileMenu();
        initTerminal();
        initContactForm();
        initSpotlightGlow();
        initMagneticElements();
        initNavPill();
        initScrollReveal();
        initCopyButtons();
        initPhotoDeck();
        initParallax();
        initTextScramble();
    });
});

// ============================================
// Work Item Accordion Toggle
// ============================================
function toggleWorkItem(headerElement) {
    const wrapper = headerElement.closest('.work-item-wrapper');
    if (wrapper) {
        wrapper.classList.toggle('expanded');
    }
}

// Make it globally accessible
window.toggleWorkItem = toggleWorkItem;

// ============================================
// Radial Spotlight Glow Effect
// ============================================
function initSpotlightGlow() {
    const cards = document.querySelectorAll('.work-item-wrapper');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// ============================================
// Fan-Out Photo Deck Interactions
// ============================================
function initPhotoDeck() {
    const deck = document.querySelector('.photo-deck');
    if (!deck) return;

    const cards = deck.querySelectorAll('.photo-card');
    const captions = document.querySelectorAll('.photo-caption');

    const setActiveCard = (card) => {
        cards.forEach(c => c.classList.remove('active'));
        captions.forEach(cap => cap.classList.remove('active'));

        if (card) {
            card.classList.add('active');
            deck.classList.add('fanned');
            
            // Activate corresponding caption
            const index = Array.from(cards).indexOf(card);
            const caption = document.getElementById(`caption-card-${index + 1}`);
            if (caption) {
                caption.classList.add('active');
            }
        } else {
            deck.classList.remove('fanned');
        }
    };

    // Toggle fan state on clicking the deck container if it's not fanned yet
    deck.addEventListener('click', (e) => {
        const isFanned = deck.classList.contains('fanned');
        if (!isFanned) {
            deck.classList.add('fanned');
            e.stopPropagation();
        }
    });

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const isFanned = deck.classList.contains('fanned');
            const isActive = card.classList.contains('active');
            
            if (!isFanned) {
                setActiveCard(card);
            } else {
                if (isActive) {
                    setActiveCard(null);
                } else {
                    setActiveCard(card);
                }
            }
        });
    });

    // Tap/Click outside to collapse and unfocus
    document.addEventListener('click', (e) => {
        if (!deck.contains(e.target)) {
            setActiveCard(null);
        }
    });
}

// ============================================
// Magnetic Hover Effect
// ============================================
function initMagneticElements() {
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

// ============================================
// Shared Layout Nav Pill
// ============================================
function initNavPill() {
    const navLinks = document.querySelector('.nav-links');
    const pill = document.querySelector('.nav-pill');
    if (!navLinks || !pill) return;

    const links = navLinks.querySelectorAll('.nav-link');
    let leaveTimeout = null;

    const movePillTo = (link) => {
        const containerRect = navLinks.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();

        const paddingX = 14;
        const x = linkRect.left - containerRect.left - paddingX;
        const w = linkRect.width + paddingX * 2;

        pill.style.width = `${w}px`;
        // translateY(-50%) is set in CSS; here we only offset X
        pill.style.transform = `translate(${x}px, -50%)`;
        pill.classList.add('active');
    };

    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            clearTimeout(leaveTimeout);
            movePillTo(link);
        });
    });

    navLinks.addEventListener('mouseleave', () => {
        leaveTimeout = setTimeout(() => {
            pill.classList.remove('active');
        }, 120);
    });
}

// ============================================
// Scroll-Triggered Section Entrances
// ============================================
function initScrollReveal() {
    // Targets to animate on scroll
    const targets = [
        '.work-item-wrapper',
        '.experience-item',
        '.section-number',
        '.section-title',
        '.section-text',
        '.subsection',
        '.contact-links',
        '.contact-info'
    ];

    const elements = document.querySelectorAll(targets.join(', '));
    elements.forEach(el => el.classList.add('scroll-reveal'));

    // Stagger siblings within list containers
    const groups = document.querySelectorAll('.work-list, .experience-list');
    groups.forEach(group => group.classList.add('scroll-reveal-group'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Once animated in, stop observing to save resources
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

// ============================================
// Copy Social Links to Clipboard (Phase 3)
// ============================================
function initCopyButtons() {
    const buttons = document.querySelectorAll('.copy-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const textToCopy = btn.getAttribute('data-copy');
            if (!textToCopy) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                
                // Trigger checkmark path-draw animation
                btn.classList.add('copied');
                
                setTimeout(() => {
                    btn.classList.remove('copied');
                }, 3000);
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }
        });
    });
}

// ============================================
// Parallax Scroll Effect (Phase 4)
// ============================================
function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroTitle = document.querySelector('.hero-title');
    const heroCta = document.querySelector('.hero-cta');

    const parallaxElements = [];

    // Select elements that want parallax
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const title = section.querySelector('.section-title');
        if (title) {
            parallaxElements.push({
                element: title,
                section: section,
                speed: 0.08, // Subtle displacement speed (deeper background feel)
                sectionTop: 0,
                sectionHeight: 0
            });
        }
        
        const photoDeck = section.querySelector('.photo-deck');
        if (photoDeck) {
            parallaxElements.push({
                element: photoDeck,
                section: section,
                speed: -0.06, // Subtle foreground speed (pops closer)
                sectionTop: 0,
                sectionHeight: 0
            });
        }
    });

    const updateOffsets = () => {
        parallaxElements.forEach(item => {
            const rect = item.section.getBoundingClientRect();
            item.sectionTop = rect.top + window.scrollY;
            item.sectionHeight = rect.height;
        });
    };

    // Cache offsets initially and on window resize to prevent layout thrashing
    updateOffsets();
    window.addEventListener('resize', updateOffsets);

    // Smooth scroll interpolation variables
    let currentScrollY = window.scrollY;
    let targetScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY;
    }, { passive: true });

    function animateParallax() {
        const diff = targetScrollY - currentScrollY;
        
        if (Math.abs(diff) > 0.05) {
            // Smooth lerping with a slightly faster coefficient (0.12) to feel highly responsive yet buttery
            currentScrollY += diff * 0.12;
            
            // 1. Hero elements parallax (only run when visible)
            if (currentScrollY < window.innerHeight * 1.5) {
                const s = currentScrollY;
                if (heroSubtitle) {
                    heroSubtitle.style.transform = `translateY(${s * 0.18}px) translateZ(0)`;
                }
                if (heroTitle) {
                    heroTitle.style.transform = `translateY(${s * 0.08}px) translateZ(0)`;
                }
                if (heroCta) {
                    heroCta.style.transform = `translateY(${s * 0.12}px) translateZ(0)`;
                }
            }

            // 2. Sections parallax (titles & photo deck) using cached dimensions
            const viewportBottom = currentScrollY + window.innerHeight;
            parallaxElements.forEach(item => {
                if (viewportBottom > item.sectionTop && currentScrollY < item.sectionTop + item.sectionHeight) {
                    const scrolledOffset = currentScrollY - item.sectionTop;
                    const val = scrolledOffset * item.speed;
                    item.element.style.transform = `translateY(${val}px) translateZ(0)`;
                }
            });
        } else if (currentScrollY !== targetScrollY) {
            currentScrollY = targetScrollY;
            
            // Final snap position
            if (currentScrollY < window.innerHeight * 1.5) {
                const s = currentScrollY;
                if (heroSubtitle) heroSubtitle.style.transform = `translateY(${s * 0.18}px) translateZ(0)`;
                if (heroTitle) heroTitle.style.transform = `translateY(${s * 0.08}px) translateZ(0)`;
                if (heroCta) heroCta.style.transform = `translateY(${s * 0.12}px) translateZ(0)`;
            }
            
            const viewportBottom = currentScrollY + window.innerHeight;
            parallaxElements.forEach(item => {
                if (viewportBottom > item.sectionTop && currentScrollY < item.sectionTop + item.sectionHeight) {
                    const scrolledOffset = currentScrollY - item.sectionTop;
                    const val = scrolledOffset * item.speed;
                    item.element.style.transform = `translateY(${val}px) translateZ(0)`;
                }
            });
        }
        
        requestAnimationFrame(animateParallax);
    }

    animateParallax();
}

// ============================================
// Scramble Text on Hover (Phase 5)
// ============================================
class TextScrambler {
    constructor(element, triggerElement = null) {
        this.element = element;
        this.triggerElement = triggerElement || element;
        this.originalText = element.textContent;
        this.chars = '!@#$01_x*?[]{}<>-+=';
        this.isAnimating = false;
        this.frameRequest = null;

        this.triggerElement.addEventListener('mouseenter', () => this.scramble());
    }

    scramble() {
        if (this.isAnimating) {
            cancelAnimationFrame(this.frameRequest);
        }

        this.isAnimating = true;
        let frame = 0;
        const totalFrames = 25; // Speed of resolving
        const textLength = this.originalText.length;

        const tick = () => {
            let output = '';
            let completeCount = 0;

            for (let i = 0; i < textLength; i++) {
                const threshold = (frame / totalFrames) * textLength;

                if (this.originalText[i] === ' ') {
                    output += ' ';
                    if (i < threshold) completeCount++;
                } else if (i < threshold) {
                    output += this.originalText[i];
                    completeCount++;
                } else if (i < threshold + 3) {
                    output += this.chars[Math.floor(Math.random() * this.chars.length)];
                } else {
                    output += this.chars[Math.floor(Math.random() * this.chars.length)];
                }
            }

            this.element.textContent = output;

            if (completeCount < textLength) {
                frame++;
                this.frameRequest = requestAnimationFrame(tick);
            } else {
                this.isAnimating = false;
                this.element.textContent = this.originalText;
            }
        };

        this.frameRequest = requestAnimationFrame(tick);
    }
}

function initTextScramble() {
    // Hero Title Spans
    const heroSpans = document.querySelectorAll('.hero-title span');
    heroSpans.forEach(span => new TextScrambler(span));

    // Section Titles
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => new TextScrambler(title));

    // Work Item Names
    const workItems = document.querySelectorAll('.work-item');
    workItems.forEach(item => {
        const name = item.querySelector('.work-name');
        if (name) {
            new TextScrambler(name, item);
        }
    });

    // Buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => new TextScrambler(btn));
}

// Camera controls for the mesh viewer - Using Three.js OrbitControls
class CameraControls {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.controls = null;
        this.autoRotateSpeed = 3.0; // Degrees per second
        this.lastTime = undefined; // For deltaTime calculation
        
        this.initOrbitControls();
    }

    initOrbitControls() {
        // Check if OrbitControls is available
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.setupControls();
        } else {
            console.warn('OrbitControls not found, loading from CDN...');
            this.loadOrbitControls().then(() => {
                this.setupControls();
            }).catch(() => {
                console.error('Failed to load OrbitControls');
                this.setupFallbackControls();
            });
        }
    }

    async loadOrbitControls() {
        const cdnUrls = [
            'https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
            'https://threejs.org/examples/js/controls/OrbitControls.js'
        ];

        for (const url of cdnUrls) {
            try {
                await this.loadScriptFromUrl(url);
                console.log('OrbitControls loaded successfully from:', url);
                return;
            } catch (error) {
                console.warn('Failed to load OrbitControls from:', url);
            }
        }
        
        throw new Error('Failed to load OrbitControls from all CDN sources');
    }

    loadScriptFromUrl(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script from ${url}`));
            document.head.appendChild(script);
        });
    }

    setupControls() {
        if (!THREE.OrbitControls) {
            this.setupFallbackControls();
            return;
        }

        // Create OrbitControls instance
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        // Configure OrbitControls for optimal mesh viewing
        this.controls.enableDamping = true; // Smooth movement
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI; // Allow full rotation
        
        // Touch settings - crucial for mobile support
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,    // One finger = rotate
            TWO: THREE.TOUCH.DOLLY_PAN  // Two fingers = zoom and pan
        };
        
        // Mouse settings
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,   // Left click = rotate
            MIDDLE: THREE.MOUSE.DOLLY,  // Middle click = zoom
            RIGHT: THREE.MOUSE.PAN      // Right click = pan
        };

        // Auto-rotation settings
        this.controls.autoRotate = false; // Start disabled
        this.controls.autoRotateSpeed = this.autoRotateSpeed;
        
        // Apply saved auto-rotation setting
        if (window.settings && window.settings.autoRotate) {
            this.controls.autoRotate = true;
        }
        
        console.log('OrbitControls initialized successfully');
        
        // Start the update loop
        this.animate();
    }

    setupFallbackControls() {
        console.warn('Using fallback custom controls - touch support may be limited');
        
        // Minimal fallback implementation
        this.isMouseDown = false;
        this.mouseButton = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.targetDistance = 10;
        this.currentDistance = 10;
        this.fallbackLastTime = undefined; // Separate deltaTime tracking for fallback
        
        this.setupFallbackEventListeners();
        this.updateFallbackCamera();
    }

    setupFallbackEventListeners() {
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
        this.renderer.domElement.addEventListener('wheel', (e) => this.onWheel(e));
        this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // OrbitControls update loop - handles both controls and auto-rotation with deltaTime
    animate() {
        if (this.controls) {
            // Calculate deltaTime for framerate-independent rotation
            const currentTime = performance.now();
            if (this.lastTime === undefined) {
                this.lastTime = currentTime;
            }
            const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
            this.lastTime = currentTime;
            
            // Handle auto-rotation through OrbitControls built-in feature
            this.controls.autoRotate = window.settings ? window.settings.autoRotate : false;
            
            // Update with deltaTime for consistent rotation speed
            this.controls.update(deltaTime);
            requestAnimationFrame(() => this.animate());
        }
    }

    // Method to toggle auto-rotation
    setAutoRotate(enabled) {
        if (this.controls) {
            this.controls.autoRotate = enabled;
        }
        
        // Update settings
        if (window.settings) {
            window.settings.autoRotate = enabled;
        }
    }

    // Method to set auto-rotation speed
    setAutoRotateSpeed(speed) {
        this.autoRotateSpeed = speed;
        if (this.controls) {
            this.controls.autoRotateSpeed = speed;
        }
    }

    // Method to reset camera position
    resetCamera() {
        if (this.controls) {
            this.controls.reset();
        } else {
            // Reset fallback camera
            this.targetX = 0;
            this.targetY = 0;
            this.targetDistance = 10;
            this.camera.position.set(5, 5, 5);
            this.camera.lookAt(0, 0, 0);
        }
    }

    // Method to focus on mesh with proper distance
    focusOnMesh(mesh) {
        if (!mesh || !this.controls) return;
        
        // Calculate bounding sphere
        const box = new THREE.Box3().setFromObject(mesh);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        
        // Set appropriate distance based on mesh size
        const distance = sphere.radius * 2.5;
        this.controls.minDistance = sphere.radius * 0.1;
        this.controls.maxDistance = sphere.radius * 10;
        
        // Update target to mesh center
        this.controls.target.copy(sphere.center);
        
        // Position camera at appropriate distance
        const direction = new THREE.Vector3();
        direction.subVectors(this.camera.position, sphere.center).normalize();
        this.camera.position.copy(sphere.center).add(direction.multiplyScalar(distance));
        
        this.controls.update();
    }

    // Enable/disable controls (useful for UI interactions)
    setEnabled(enabled) {
        if (this.controls) {
            this.controls.enabled = enabled;
        }
    }

    // Get current auto-rotation state
    getAutoRotate() {
        return this.controls ? this.controls.autoRotate : false;
    }

    // Fallback mouse event handlers
    onMouseDown(e) {
        if (this.controls) return; // Skip if using OrbitControls
        
        this.isMouseDown = true;
        this.mouseButton = e.button;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        e.preventDefault();
    }

    onMouseMove(e) {
        if (this.controls || !this.isMouseDown) return;
        
        const deltaX = e.clientX - this.mouseX;
        const deltaY = e.clientY - this.mouseY;
        
        if (this.mouseButton === 0) {
            this.targetX += deltaY * 0.01;
            this.targetY += deltaX * 0.01;
            this.targetX = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.targetX));
        } else if (this.mouseButton === 2) {
            const panSpeed = 0.01 * this.currentDistance;
            this.camera.position.x -= deltaX * panSpeed;
            this.camera.position.y += deltaY * panSpeed;
        }
        
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    onMouseUp() {
        if (this.controls) return;
        this.isMouseDown = false;
    }

    onWheel(e) {
        if (this.controls) return;
        
        this.targetDistance += e.deltaY * 0.01;
        this.targetDistance = Math.max(1, Math.min(50, this.targetDistance));
        e.preventDefault();
    }

    updateFallbackCamera() {
        if (this.controls) return;
        
        // Calculate deltaTime for fallback mode as well
        const currentTime = performance.now();
        if (this.fallbackLastTime === undefined) {
            this.fallbackLastTime = currentTime;
        }
        const deltaTime = (currentTime - this.fallbackLastTime) / 1000;
        this.fallbackLastTime = currentTime;
        
        // Handle auto-rotation for fallback mode with deltaTime
        if (window.settings && window.settings.autoRotate) {
            // Convert autoRotateSpeed from degrees per second to radians per frame
            const rotationSpeed = (this.autoRotateSpeed * Math.PI / 180) * deltaTime;
            this.targetY += rotationSpeed;
        }
        
        this.currentDistance += (this.targetDistance - this.currentDistance) * 0.1;
        
        this.camera.position.x = Math.cos(this.targetY) * Math.cos(this.targetX) * this.currentDistance;
        this.camera.position.y = Math.sin(this.targetX) * this.currentDistance;
        this.camera.position.z = Math.sin(this.targetY) * Math.cos(this.targetX) * this.currentDistance;
        this.camera.lookAt(0, 0, 0);
        
        requestAnimationFrame(() => this.updateFallbackCamera());
    }

    // Dispose method for cleanup
    dispose() {
        if (this.controls) {
            this.controls.dispose();
        }
    }
}

// Global controls instance (will be initialized after scene setup)
window.cameraControls = null;
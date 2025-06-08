// Three.js scene management - Updated for OrbitControls compatibility
class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isAnimating = false;
    }

    // Initialize Three.js scene
    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        // Detect color scheme and adjust scene background
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            this.scene.background = new THREE.Color(0xf5f6fa);
        }
        
        // Listen for color scheme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
                if (e.matches) {
                    this.scene.background = new THREE.Color(0xf5f6fa);
                } else {
                    this.scene.background = new THREE.Color(0x1a1a2e);
                }
            });
        }
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Lighting
        this.setupLighting();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start render loop (OrbitControls handles its own updates)
        this.animate();
    }

    // Setup scene lighting
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-10, -10, -5);
        this.scene.add(pointLight);
    }

    // Animation loop - simplified since OrbitControls handles camera updates
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Note: Auto-rotation is now handled by OrbitControls in the CameraControls class
        // We removed the manual mesh rotation from here to avoid conflicts
        
        this.renderer.render(this.scene, this.camera);
    }

    // Handle window resize
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Add mesh to scene
    addMesh(mesh) {
        this.scene.add(mesh);
    }

    // Remove mesh from scene
    removeMesh(mesh) {
        this.scene.remove(mesh);
    }
}

// Global scene manager instance
window.sceneManager = new SceneManager();
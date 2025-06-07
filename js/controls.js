// Camera controls for the mesh viewer
class CameraControls {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        
        this.isMouseDown = false;
        this.mouseButton = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.targetDistance = 10;
        this.currentDistance = 10;
        
        this.setupEventListeners();
        this.updateCamera();
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
        this.renderer.domElement.addEventListener('wheel', (e) => this.onWheel(e));
        this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onMouseDown(e) {
        this.isMouseDown = true;
        this.mouseButton = e.button;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        e.preventDefault();
    }

    onMouseMove(e) {
        if (!this.isMouseDown) return;
        
        const deltaX = e.clientX - this.mouseX;
        const deltaY = e.clientY - this.mouseY;
        
        if (this.mouseButton === 0) { // Left click - rotate
            this.targetX += deltaY * 0.01;
            this.targetY += deltaX * 0.01;
            this.targetX = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.targetX));
        } else if (this.mouseButton === 2) { // Right click - pan
            const panSpeed = 0.01 * this.currentDistance;
            this.camera.position.x -= deltaX * panSpeed;
            this.camera.position.y += deltaY * panSpeed;
        }
        
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    onMouseUp() {
        this.isMouseDown = false;
    }

    onWheel(e) {
        this.targetDistance += e.deltaY * 0.01;
        this.targetDistance = Math.max(1, Math.min(50, this.targetDistance));
        e.preventDefault();
    }

    // Update camera position
    updateCamera() {
        this.currentDistance += (this.targetDistance - this.currentDistance) * 0.1;
        
        this.camera.position.x = Math.cos(this.targetY) * Math.cos(this.targetX) * this.currentDistance;
        this.camera.position.y = Math.sin(this.targetX) * this.currentDistance;
        this.camera.position.z = Math.sin(this.targetY) * Math.cos(this.targetX) * this.currentDistance;
        this.camera.lookAt(0, 0, 0);
        
        requestAnimationFrame(() => this.updateCamera());
    }
}

// Global controls instance (will be initialized after scene setup)
window.cameraControls = null;
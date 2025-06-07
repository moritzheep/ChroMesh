// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Three.js scene
    window.sceneManager.init();
    
    // Initialize camera controls
    window.cameraControls = new CameraControls(
        window.sceneManager.camera, 
        window.sceneManager.renderer
    );
    
    // Load saved settings
    window.settings.load();
    
    // Initialize UI controls
    window.uiControls = new UIControls();
    
    console.log('Mesh Viewer initialized successfully');
});
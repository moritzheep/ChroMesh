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
    
    // Handle any pending file from PWA file association
    if (window.pendingFile) {
        console.log('Handling pending file:', window.pendingFile.name);
        window.uiControls.handleFile(window.pendingFile);
        window.pendingFile = null;
    }
    
    // Check URL parameters for file type hints
    const urlParams = new URLSearchParams(window.location.search);
    const fileType = urlParams.get('type');
    if (fileType) {
        console.log('App opened with file type hint:', fileType);
        // Could customize UI based on expected file type
    }
    
    console.log('Mesh Viewer PWA initialized successfully');
});
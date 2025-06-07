// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Initialize Three.js scene
    window.sceneManager.init();
    console.log('Scene manager initialized');
    
    // Initialize camera controls
    window.cameraControls = new CameraControls(
        window.sceneManager.camera, 
        window.sceneManager.renderer
    );
    console.log('Camera controls initialized');
    
    // Load saved settings
    window.settings.load();
    console.log('Settings loaded');
    
    // Initialize UI controls
    window.uiControls = new UIControls();
    console.log('UI controls initialized');
    
    // Handle any pending file from PWA file association
    if (window.pendingFile) {
        console.log('Handling pending file:', window.pendingFile.name);
        setTimeout(() => {
            window.uiControls.handleFile(window.pendingFile);
            window.pendingFile = null;
        }, 100); // Small delay to ensure everything is ready
    }
    
    // Check URL parameters for file type hints
    const urlParams = new URLSearchParams(window.location.search);
    const fileType = urlParams.get('type');
    if (fileType) {
        console.log('App opened with file type hint:', fileType);
    }
    
    // Debug launch queue status
    if ('launchQueue' in window) {
        console.log('Launch Queue API is available');
    } else {
        console.log('Launch Queue API is NOT available');
    }
    
    console.log('Mesh Viewer PWA initialized successfully');
});
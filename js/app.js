// Main application initialization - Updated for unified file handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing ChroMesh...');
    
    // Initialize core systems first
    initializeCoreSystem();
    
    // Then initialize file handling
    initializeFileHandling();
    
    console.log('ChroMesh initialized successfully');
});

function initializeCoreSystem() {
    // Initialize Three.js scene
    window.sceneManager.init();
    console.log('✓ Scene manager initialized');
    
    // Initialize camera controls
    window.cameraControls = new CameraControls(
        window.sceneManager.camera, 
        window.sceneManager.renderer
    );
    console.log('✓ Camera controls initialized');
    
    // Load saved settings
    window.settings.load();
    console.log('✓ Settings loaded');
    
    // Initialize UI controls
    window.uiControls = new UIControls();
    console.log('✓ UI controls initialized');
}

function initializeFileHandling() {
    // File handler should already be initialized from its script
    if (!window.fileHandler) {
        console.error('File handler not available');
        return;
    }
    
    console.log('✓ File handler ready');
    
    // Process any pending file handles from PWA launch
    if (window.pwaManager && window.pwaManager.pendingFileHandle) {
        console.log('Processing pending file handle from PWA launch...');
        window.pwaManager.processPendingFileHandle();
    }
    
    // Handle legacy pending file (backwards compatibility)
    if (window.pendingFile) {
        console.log('Processing legacy pending file...');
        setTimeout(async () => {
            try {
                await window.fileHandler.loadFile(window.pendingFile, 'legacy-pending');
                window.pendingFile = null;
            } catch (error) {
                console.error('Error processing legacy pending file:', error);
            }
        }, 100);
    }
    
    // Check URL parameters for file type hints
    checkURLParameters();
    
    // Debug file handling capabilities
    if (window.pwaManager) {
        window.pwaManager.checkFileHandlingSupport();
    }
}

function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileType = urlParams.get('type');
    const fileName = urlParams.get('file');
    
    if (fileType || fileName) {
        console.log('App opened with URL parameters:', { fileType, fileName });
        
        // Could show a hint in the UI about expected file type
        if (fileType) {
            const dropZone = document.getElementById('drop-zone');
            const hint = dropZone.querySelector('.drop-hint');
            if (hint) {
                hint.textContent = `Ready to open ${fileType.toUpperCase()} files`;
            }
        }
    }
}

// Global error handler for unhandled file operations
window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('fileHandler')) {
        console.error('File handler error:', event.error);
        if (window.fileHandler) {
            window.fileHandler.showError('An unexpected error occurred while handling the file');
        }
    }
});

// Handle unhandled promise rejections related to file operations
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('file')) {
        console.error('Unhandled file operation rejection:', event.reason);
        if (window.fileHandler) {
            window.fileHandler.showError('File operation failed: ' + event.reason.message);
        }
        event.preventDefault(); // Prevent console spam
    }
});

// Debug utilities for development
window.debugChroMesh = {
    // Test file loading with a mock file
    testFileHandler: async function(filename = 'test.obj', content = 'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3') {
        const mockFile = new File([content], filename, { type: 'text/plain' });
        return await window.fileHandler.loadFile(mockFile, 'debug-test');
    },
    
    // Get current system status
    getStatus: function() {
        return {
            sceneManager: !!window.sceneManager,
            cameraControls: !!window.cameraControls,
            meshManager: !!window.meshManager,
            uiControls: !!window.uiControls,
            fileHandler: !!window.fileHandler,
            pwaManager: !!window.pwaManager,
            settings: !!window.settings,
            currentMesh: !!window.meshManager?.currentMesh,
            isLoading: window.fileHandler?.isLoading || false
        };
    },
    
    // Debug path information
    debugPaths: function() {
        return {
            currentURL: window.location.href,
            pathname: window.location.pathname,
            baseURL: window.location.origin,
            expectedSWPath: './sw.js',
            manifestPath: './manifest.json',
            isLocalhost: window.location.hostname === 'localhost',
            port: window.location.port
        };
    },
    
    // Test service worker path
    testSWPath: async function() {
        const paths = [
            './sw.js',
            '/ChroMesh/sw.js',
            'sw.js',
            '/sw.js'
        ];
        
        const results = {};
        
        for (const path of paths) {
            try {
                const response = await fetch(path, { method: 'HEAD' });
                results[path] = {
                    status: response.status,
                    ok: response.ok,
                    url: response.url
                };
            } catch (error) {
                results[path] = {
                    error: error.message
                };
            }
        }
        
        console.table(results);
        return results;
    },
    
    // Test file input directly
    testFileInput: function() {
        const fileInput = document.getElementById('file-input');
        fileInput.click();
    },
    
    // Simulate file input event with a test file
    simulateFileInput: async function() {
        // Create a test file
        const testContent = 'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3';
        const testFile = new File([testContent], 'test.obj', { type: 'text/plain' });
        
        console.log('🧪 Testing with simulated file:', testFile.name);
        
        // Test direct file loading
        const result = await window.fileHandler.loadFile(testFile, 'debug-simulation');
        console.log('🧪 Simulation result:', result);
        return result;
    },
    
    // Force reload all settings
    reloadSettings: function() {
        window.settings.load();
        console.log('Settings reloaded');
    },
    
    // Clear all data and reset to initial state
    reset: function() {
        if (window.meshManager?.currentMesh) {
            window.sceneManager.removeMesh(window.meshManager.currentMesh);
            window.meshManager.currentMesh = null;
            window.meshManager.originalGeometry = null;
        }
        
        // Hide all panels and show drop zone
        document.getElementById('drop-zone').classList.remove('hidden');
        document.getElementById('controls').classList.remove('visible');
        document.getElementById('toggle-panel').classList.remove('visible');
        document.getElementById('axis-panel').classList.remove('visible');
        document.getElementById('rotation-panel').classList.remove('visible');
        document.getElementById('info-panel').classList.remove('visible');
        
        console.log('ChroMesh reset to initial state');
    }
};

// Make debug utilities available in console
if (typeof window !== 'undefined') {
    window.chromesh = window.debugChroMesh;
}
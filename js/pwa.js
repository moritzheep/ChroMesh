// PWA functionality and file handling
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    init() {
        // Register service worker
        this.registerServiceWorker();
        
        // Setup install prompt
        this.setupInstallPrompt();
        
        // Handle file associations
        this.handleFileAssociations();
        
        // Listen for messages from service worker
        this.setupMessageListener();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/ChroMesh/sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content available, show update prompt
                            this.showUpdatePrompt();
                        }
                    });
                });
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    setupInstallPrompt() {
        const installPrompt = document.getElementById('install-prompt');
        const installButton = document.getElementById('install-button');
        const dismissButton = document.getElementById('dismiss-install');

        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Show install prompt if not already installed
            if (!window.matchMedia('(display-mode: standalone)').matches) {
                installPrompt.classList.remove('hidden');
            }
        });

        // Handle install button click
        installButton.addEventListener('click', async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                console.log(`Install prompt outcome: ${outcome}`);
                this.deferredPrompt = null;
            }
            installPrompt.classList.add('hidden');
        });

        // Handle dismiss button
        dismissButton.addEventListener('click', () => {
            installPrompt.classList.add('hidden');
            this.deferredPrompt = null;
        });

        // Hide install prompt if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            installPrompt.classList.add('hidden');
        }
    }

    handleFileAssociations() {
        // Handle files opened from ChromeOS file manager
        if ('launchQueue' in window) {
            window.launchQueue.setConsumer(async (launchParams) => {
                console.log('Launch queue triggered with params:', launchParams);
                
                if (launchParams.files && launchParams.files.length > 0) {
                    const fileHandle = launchParams.files[0];
                    try {
                        const file = await fileHandle.getFile();
                        console.log('Opening file from ChromeOS:', file.name, file.type, file.size);
                        
                        // Wait for UI to be ready, then handle the file
                        this.handleLaunchedFile(file);
                        
                    } catch (error) {
                        console.error('Error handling file from launch queue:', error);
                    }
                } else {
                    console.log('No files in launch params');
                }
            });
        }

        // Also handle URL parameters (fallback method)
        this.handleURLParams();

        // Handle drag and drop from file system
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0 && window.uiControls) {
                window.uiControls.handleFile(files[0]);
            }
        });
    }

    async handleLaunchedFile(file) {
        // Wait for UI to be ready
        const maxWait = 5000; // 5 seconds
        const checkInterval = 100; // 100ms
        let waited = 0;

        const waitForUI = () => {
            return new Promise((resolve) => {
                const check = () => {
                    if (window.uiControls && window.meshManager) {
                        console.log('UI ready, loading file:', file.name);
                        resolve(true);
                    } else if (waited < maxWait) {
                        waited += checkInterval;
                        setTimeout(check, checkInterval);
                    } else {
                        console.warn('UI not ready after timeout, storing file as pending');
                        window.pendingFile = file;
                        resolve(false);
                    }
                };
                check();
            });
        };

        const uiReady = await waitForUI();
        if (uiReady) {
            window.uiControls.handleFile(file);
        }
    }

    handleURLParams() {
        // Check for file information in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const fileName = urlParams.get('file');
        const fileType = urlParams.get('type');
        
        if (fileName) {
            console.log('File info from URL:', fileName, fileType);
            // Could show a message or prepare UI for expected file type
        }
    }

    setupMessageListener() {
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'FILE_HANDLER') {
                if (window.uiControls) {
                    window.uiControls.handleFile(event.data.file);
                }
            }
        });
    }

    showUpdatePrompt() {
        // Create and show update notification
        const updatePrompt = document.createElement('div');
        updatePrompt.className = 'update-prompt';
        updatePrompt.innerHTML = `
            <div class="update-content">
                <p>A new version is available!</p>
                <button id="update-button">Update</button>
                <button id="dismiss-update">Later</button>
            </div>
        `;
        document.body.appendChild(updatePrompt);

        // Handle update button
        document.getElementById('update-button').addEventListener('click', () => {
            window.location.reload();
        });

        // Handle dismiss button
        document.getElementById('dismiss-update').addEventListener('click', () => {
            updatePrompt.remove();
        });
    }

    // Check if app is installed
    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    // Share functionality (if supported)
    async shareFile(file) {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Mesh File',
                    text: 'Check out this 3D mesh file!'
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        }
    }
}

// Global PWA manager instance
window.pwaManager = new PWAManager();
// PWA functionality and file handling - Updated to use unified file handler
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.pendingFileHandle = null;
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
                console.log('Attempting to register service worker at: ./sw.js');
                
                const registration = await navigator.serviceWorker.register('./sw.js', {
                    scope: './'
                });
                
                console.log('Service Worker registered successfully:', registration);
                console.log('Service Worker scope:', registration.scope);
                
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
                console.error('Service Worker registration failed:', error);
                console.warn('PWA features will be limited');
            }
        } else {
            console.warn('Service Workers not supported - PWA features will be limited');
        }
    }

    setupInstallPrompt() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('Install prompt available');
            e.preventDefault(); // Prevent automatic prompt
            this.deferredPrompt = e;
            
            // Show custom install prompt if not already installed
            if (!window.matchMedia('(display-mode: standalone)').matches) {
                this.showCustomInstallPrompt();
            }
        });

        // Handle app installed event
        window.addEventListener('appinstalled', () => {
            console.log('ChroMesh was installed successfully');
            this.deferredPrompt = null;
            this.hideCustomInstallPrompt();
        });

        // Hide install prompt if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is running in standalone mode');
        }
    }

    showCustomInstallPrompt() {
        // Create a subtle install prompt
        const installBanner = document.createElement('div');
        installBanner.id = 'install-banner';
        installBanner.className = 'install-banner';
        installBanner.innerHTML = `
            <div class="install-banner-content">
                <span class="install-icon">📱</span>
                <span class="install-text">Install ChroMesh for a better experience</span>
                <button id="install-app-btn" class="install-btn">Install</button>
                <button id="dismiss-install-btn" class="dismiss-btn">×</button>
            </div>
        `;
        
        document.body.appendChild(installBanner);

        // Handle install button click
        document.getElementById('install-app-btn').addEventListener('click', async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                console.log(`Install prompt outcome: ${outcome}`);
                
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                
                this.deferredPrompt = null;
            }
            this.hideCustomInstallPrompt();
        });

        // Handle dismiss button
        document.getElementById('dismiss-install-btn').addEventListener('click', () => {
            this.hideCustomInstallPrompt();
            this.deferredPrompt = null;
        });

        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideCustomInstallPrompt();
        }, 10000);
    }

    hideCustomInstallPrompt() {
        const banner = document.getElementById('install-banner');
        if (banner) {
            banner.remove();
        }
    }

    handleFileAssociations() {
        // Handle files opened from ChromeOS file manager using Launch Queue API
        if ('launchQueue' in window) {
            console.log('Launch Queue API available - setting up file association handler');
            
            window.launchQueue.setConsumer(async (launchParams) => {
                console.log('Launch queue triggered with params:', launchParams);
                
                if (launchParams.files && launchParams.files.length > 0) {
                    const fileHandle = launchParams.files[0];
                    console.log('File handle received from launch queue:', fileHandle);
                    
                    // Store the file handle if file handler isn't ready yet
                    if (!window.fileHandler) {
                        console.log('File handler not ready, storing file handle as pending');
                        this.pendingFileHandle = fileHandle;
                        return;
                    }
                    
                    // Load the file using unified file handler
                    try {
                        const success = await window.fileHandler.loadFromFileHandle(fileHandle);
                        if (success) {
                            console.log('Successfully loaded file from launch queue');
                        } else {
                            console.error('Failed to load file from launch queue');
                        }
                    } catch (error) {
                        console.error('Error loading file from launch queue:', error);
                    }
                } else {
                    console.log('No files in launch params');
                }
            });
        } else {
            console.log('Launch Queue API not available');
        }

        // Also handle URL parameters (fallback method)
        this.handleURLParams();

        // Enhanced drag and drop from file system
        this.setupGlobalDragAndDrop();
    }

    setupGlobalDragAndDrop() {
        // Global drag and drop handler (catches drops anywhere on the page)
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        document.addEventListener('drop', async (e) => {
            e.preventDefault();
            
            // Only handle if the drop didn't occur on the drop zone
            // (drop zone has its own handler)
            if (!e.target.closest('#drop-zone')) {
                if (window.fileHandler) {
                    await window.fileHandler.loadFromDragDrop(e);
                }
            }
        });
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
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', async (event) => {
                console.log('Message from service worker:', event.data);
                
                if (event.data.type === 'FILE_HANDLER') {
                    if (window.fileHandler && event.data.file) {
                        await window.fileHandler.loadFromPWALaunch(event.data.file);
                    }
                }
            });
        }
    }

    // Handle any pending file handle when file handler becomes available
    async processPendingFileHandle() {
        if (this.pendingFileHandle && window.fileHandler) {
            console.log('Processing pending file handle');
            try {
                const success = await window.fileHandler.loadFromFileHandle(this.pendingFileHandle);
                if (success) {
                    console.log('Successfully processed pending file handle');
                } else {
                    console.error('Failed to process pending file handle');
                }
            } catch (error) {
                console.error('Error processing pending file handle:', error);
            } finally {
                this.pendingFileHandle = null;
            }
        }
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

    // Debug method to check file handling capabilities
    checkFileHandlingSupport() {
        const support = {
            launchQueue: 'launchQueue' in window,
            fileSystemAccess: 'showOpenFilePicker' in window,
            dragAndDrop: true, // Always supported
            webShare: 'share' in navigator,
            serviceWorker: 'serviceWorker' in navigator
        };
        
        console.log('File handling support:', support);
        return support;
    }
}

// Global PWA manager instance
window.pwaManager = new PWAManager();
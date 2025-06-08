// Unified file handling system for ChroMesh
class FileHandler {
    constructor() {
        this.supportedExtensions = ['.obj', '.stl', '.ply'];
        this.supportedMimeTypes = ['model/obj', 'model/stl', 'model/ply', 'application/octet-stream'];
        this.isLoading = false;
        this.loadingCallbacks = [];
    }

    // Main entry point for all file loading
    async loadFile(file, source = 'unknown') {
        if (!file) {
            console.warn('No file provided to loadFile');
            return false;
        }

        console.log(`Loading file "${file.name}" from source: ${source}`);

        // Prevent multiple simultaneous loads
        if (this.isLoading) {
            console.warn('File loading already in progress, ignoring new request');
            return false;
        }

        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            this.showError(`Invalid file: ${validation.error}`);
            return false;
        }

        try {
            this.setLoadingState(true);
            const success = await this.processFile(file);
            
            if (success) {
                console.log(`Successfully loaded file: ${file.name}`);
            } else {
                console.error(`Failed to load file: ${file.name}`);
            }
            
            return success;
        } catch (error) {
            console.error('Error loading file:', error);
            this.showError(`Error loading file: ${error.message}`);
            return false;
        } finally {
            this.setLoadingState(false);
        }
    }

    // Validate file type and size
    validateFile(file) {
        // Check file extension
        const extension = this.getFileExtension(file.name);
        if (!this.supportedExtensions.includes(extension)) {
            return {
                valid: false,
                error: `Unsupported file type: ${extension}. Supported formats: ${this.supportedExtensions.join(', ')}`
            };
        }

        // Check file size (100MB limit)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: 100MB`
            };
        }

        // Check if file is empty
        if (file.size === 0) {
            return {
                valid: false,
                error: 'File is empty'
            };
        }

        return { valid: true };
    }

    // Process the file and create mesh
    async processFile(file) {
        const extension = this.getFileExtension(file.name);
        
        try {
            let content;
            
            // Read file based on format
            if (extension === '.stl') {
                // STL files might be binary, read as ArrayBuffer
                content = await this.readFileAsArrayBuffer(file);
            } else {
                // OBJ and PLY are text-based
                content = await this.readFileAsText(file);
            }

            // Parse the mesh
            const geometry = MeshParsers.parse(content, file.name);
            
            // Display the mesh
            window.meshManager.displayMesh(geometry, file.name);
            
            return true;
        } catch (error) {
            throw new Error(`Failed to process ${extension} file: ${error.message}`);
        }
    }

    // Helper methods for file reading
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file as ArrayBuffer'));
            reader.readAsArrayBuffer(file);
        });
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file as text'));
            reader.readAsText(file);
        });
    }

    // Get file extension in lowercase
    getFileExtension(filename) {
        return '.' + filename.split('.').pop().toLowerCase();
    }

    // Loading state management
    setLoadingState(loading) {
        this.isLoading = loading;
        this.showLoading(loading);
        
        // Notify callbacks
        this.loadingCallbacks.forEach(callback => {
            try {
                callback(loading);
            } catch (error) {
                console.warn('Error in loading callback:', error);
            }
        });
    }

    // Add loading state callback
    onLoadingStateChange(callback) {
        this.loadingCallbacks.push(callback);
    }

    // Show/hide loading indicator
    showLoading(show) {
        let loading = document.querySelector('.loading');
        if (show && !loading) {
            loading = document.createElement('div');
            loading.className = 'loading';
            loading.innerHTML = '<div class="spinner"></div>Loading mesh...';
            document.getElementById('container').appendChild(loading);
        } else if (!show && loading) {
            loading.remove();
        }
    }

    // Show error message
    showError(message) {
        console.error(message);
        
        // Create error popup
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-popup';
        errorDiv.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <div class="error-message">${message}</div>
                <button class="error-close">OK</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds or on click
        const removeError = () => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        };
        
        errorDiv.querySelector('.error-close').addEventListener('click', removeError);
        setTimeout(removeError, 5000);
    }

    // Static method to get file from various input types
    static extractFileFromInput(input) {
        console.log('Extracting file from input:', input);
        
        // Handle File object directly
        if (input instanceof File) {
            console.log('Direct File object:', input.name);
            return input;
        }
        
        // Handle FileList
        if (input instanceof FileList && input.length > 0) {
            console.log('FileList with', input.length, 'files:', input[0].name);
            return input[0];
        }
        
        // Handle DataTransfer (drag and drop)
        if (input instanceof DataTransfer && input.files.length > 0) {
            console.log('DataTransfer with', input.files.length, 'files:', input.files[0].name);
            return input.files[0];
        }
        
        // Handle Event with files
        if (input instanceof Event) {
            console.log('Event type:', input.type);
            
            // Drag and drop events
            if (input.dataTransfer && input.dataTransfer.files.length > 0) {
                console.log('Event dataTransfer files:', input.dataTransfer.files[0].name);
                return input.dataTransfer.files[0];
            }
            
            // File input change events
            if (input.target && input.target.files && input.target.files.length > 0) {
                console.log('Event target files:', input.target.files[0].name);
                return input.target.files[0];
            }
            
            // Sometimes the event might have a currentTarget instead
            if (input.currentTarget && input.currentTarget.files && input.currentTarget.files.length > 0) {
                console.log('Event currentTarget files:', input.currentTarget.files[0].name);
                return input.currentTarget.files[0];
            }
        }
        
        // Handle objects with a files property
        if (input && input.files && input.files.length > 0) {
            console.log('Object with files property:', input.files[0].name);
            return input.files[0];
        }
        
        console.warn('Could not extract file from input:', input);
        return null;
    }

    // Public API methods for different loading sources
    async loadFromDragDrop(event) {
        event.preventDefault();
        const file = FileHandler.extractFileFromInput(event.dataTransfer);
        return await this.loadFile(file, 'drag-and-drop');
    }

    async loadFromFileInput(event) {
        console.log('loadFromFileInput called with:', event);
        console.log('Event type:', event?.type);
        console.log('Event target:', event?.target);
        console.log('Target files:', event?.target?.files);
        console.log('Files length:', event?.target?.files?.length);
        
        // Try multiple approaches to get the file
        let file = null;
        
        // Approach 1: Direct from event.target.files
        if (event && event.target && event.target.files && event.target.files.length > 0) {
            file = event.target.files[0];
            console.log('✓ Got file from event.target.files[0]:', file.name);
        }
        
        // Approach 2: Use the extraction method as fallback
        if (!file) {
            file = FileHandler.extractFileFromInput(event);
            if (file) {
                console.log('✓ Got file from extractFileFromInput:', file.name);
            }
        }
        
        // Approach 3: Try to extract from currentTarget
        if (!file && event && event.currentTarget && event.currentTarget.files && event.currentTarget.files.length > 0) {
            file = event.currentTarget.files[0];
            console.log('✓ Got file from event.currentTarget.files[0]:', file.name);
        }
        
        if (!file) {
            console.error('❌ Failed to extract file from file input event');
            console.error('Event object:', event);
            console.error('Event target:', event?.target);
            console.error('Event currentTarget:', event?.currentTarget);
            this.showError('No file selected. Please try selecting a file again.');
            return false;
        }
        
        console.log('✅ Successfully extracted file from file input:', file.name, file.size, file.type);
        return await this.loadFile(file, 'file-dialog');
    }

    async loadFromFileHandle(fileHandle) {
        try {
            const file = await fileHandle.getFile();
            return await this.loadFile(file, 'file-association');
        } catch (error) {
            console.error('Error getting file from handle:', error);
            this.showError('Failed to access file from system');
            return false;
        }
    }

    async loadFromPWALaunch(file) {
        return await this.loadFile(file, 'pwa-launch');
    }
}

// Global file handler instance
window.fileHandler = new FileHandler();
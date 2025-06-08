// UI management and mesh manipulation - Updated to use unified file handler and OrbitControls
class MeshManager {
    constructor() {
        this.currentMesh = null;
        this.originalGeometry = null;
    }

    // Display mesh in scene with improved auto-scaling
    displayMesh(geometry, filename) {
        // Remove existing mesh
        if (this.currentMesh) {
            window.sceneManager.removeMesh(this.currentMesh);
        }
        
        // Store original geometry for axis inversions
        this.originalGeometry = geometry.clone();
        
        // Create material
        const material = new THREE.MeshPhongMaterial({
            color: 0x4CAF50,
            side: THREE.DoubleSide,
            wireframe: false
        });
        
        // Create mesh
        this.currentMesh = new THREE.Mesh(geometry, material);
        
        // Center and scale mesh properly
        this.centerAndScaleMesh(geometry);
        
        // Position mesh at world origin
        this.currentMesh.position.set(0, 0, 0);
        
        window.sceneManager.addMesh(this.currentMesh);
        
        // Update UI
        this.showMeshControls(filename, geometry);
        
        // Apply saved settings to the new mesh
        window.settings.applyToMesh(this.currentMesh);
        
        // Focus camera on the new mesh if using OrbitControls
        if (window.cameraControls && window.cameraControls.focusOnMesh) {
            window.cameraControls.focusOnMesh(this.currentMesh);
        }
    }

    centerAndScaleMesh(geometry) {
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Center the geometry itself
        geometry.translate(-center.x, -center.y, -center.z);
        this.originalGeometry.translate(-center.x, -center.y, -center.z);
        
        // Improved auto-scaling logic
        if (maxDim > 0) {
            // Calculate desired size based on camera FOV and distance
            const fov = window.sceneManager.camera.fov * Math.PI / 180; // Convert to radians
            const distance = window.sceneManager.camera.position.length(); // Current camera distance from origin
            
            // Calculate the visible height at the mesh position
            const visibleHeight = 2 * Math.tan(fov / 2) * distance;
            const visibleWidth = visibleHeight * window.sceneManager.camera.aspect;
            
            // Use 60% of the smaller viewport dimension to ensure good visibility
            const targetSize = Math.min(visibleWidth, visibleHeight) * 0.6;
            const scaleFactor = targetSize / maxDim;
            
            this.currentMesh.scale.setScalar(scaleFactor);
        }
    }

    showMeshControls(filename, geometry) {
        // Hide drop zone and show controls
        document.getElementById('drop-zone').classList.add('hidden');
        document.getElementById('controls').classList.add('visible');
        document.getElementById('toggle-panel').classList.add('visible');
        document.getElementById('axis-panel').classList.add('visible');
        document.getElementById('rotation-panel').classList.add('visible');
        
        // Update info panel
        const triangleCount = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
        const vertexCount = geometry.attributes.position.count;
        
        document.getElementById('mesh-info').innerHTML = `
            <strong>${filename}</strong><br>
            Vertices: ${vertexCount.toLocaleString()}<br>
            Triangles: ${Math.floor(triangleCount).toLocaleString()}
        `;
        document.getElementById('info-panel').classList.add('visible');
    }

    // Apply axis inversions to geometry
    applyAxisInversions(geometry) {
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            if (window.settings.axisInversions.x) positions[i] *= -1;     // X coordinate
            if (window.settings.axisInversions.y) positions[i + 1] *= -1; // Y coordinate  
            if (window.settings.axisInversions.z) positions[i + 2] *= -1; // Z coordinate
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        return geometry;
    }

    // Update mesh with current axis inversions
    updateMeshWithInversions() {
        if (!this.currentMesh || !this.originalGeometry) return;
        
        // Clone the original geometry
        const newGeometry = this.originalGeometry.clone();
        
        // Apply current axis inversions
        this.applyAxisInversions(newGeometry);
        
        // Update the mesh geometry
        this.currentMesh.geometry.dispose(); // Clean up old geometry
        this.currentMesh.geometry = newGeometry;
        
        // Update wireframe if it exists
        if (this.currentMesh.wireframeHelper) {
            this.currentMesh.remove(this.currentMesh.wireframeHelper);
            const wireframeGeometry = new THREE.WireframeGeometry(newGeometry);
            const wireframeMaterial = new THREE.LineBasicMaterial({ 
                color: document.getElementById('wireframe-color').value, 
                opacity: 0.3, 
                transparent: true 
            });
            this.currentMesh.wireframeHelper = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
            this.currentMesh.add(this.currentMesh.wireframeHelper);
            this.currentMesh.wireframeHelper.visible = document.getElementById('wireframe-toggle').classList.contains('active');
        }
    }
}

// UI Controls class for handling all UI interactions - Updated for unified file handling and OrbitControls
class UIControls {
    constructor() {
        this.setupDragAndDrop();
        this.setupFileInput();
        this.setupToggleControls();
        this.setupFileHandlerIntegration();
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });
        
        // Handle dropped files using unified file handler
        dropZone.addEventListener('drop', async (e) => {
            await window.fileHandler.loadFromDragDrop(e);
        });
    }

    setupFileInput() {
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', async (e) => {
            console.log('📁 File input change event triggered');
            console.log('Event:', e);
            console.log('Target:', e.target);
            console.log('Files:', e.target.files);
            console.log('File count:', e.target.files?.length);
            
            // Check if we have files
            if (!e.target.files || e.target.files.length === 0) {
                console.warn('❌ No files selected in file input');
                return;
            }
            
            const file = e.target.files[0];
            console.log('📄 Selected file:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            });
            
            // Use the unified file handler
            try {
                console.log('🔄 Calling fileHandler.loadFromFileInput...');
                const success = await window.fileHandler.loadFromFileInput(e);
                console.log('📁 File input result:', success);
            } catch (error) {
                console.error('❌ FileHandler.loadFromFileInput failed:', error);
                // Fallback: load file directly
                console.log('🔄 Trying direct file load as fallback...');
                try {
                    const success = await window.fileHandler.loadFile(file, 'file-dialog-fallback');
                    console.log('📁 Direct file load result:', success);
                } catch (fallbackError) {
                    console.error('❌ Direct file load also failed:', fallbackError);
                }
            }
            
            // Clear the input so the same file can be selected again
            e.target.value = '';
            console.log('🧹 File input cleared');
        });
    }

    setupFileHandlerIntegration() {
        // Listen for loading state changes to update UI accordingly
        window.fileHandler.onLoadingStateChange((isLoading) => {
            // Update UI based on loading state
            const dropZone = document.getElementById('drop-zone');
            if (isLoading) {
                dropZone.style.pointerEvents = 'none';
                dropZone.style.opacity = '0.5';
            } else {
                dropZone.style.pointerEvents = '';
                dropZone.style.opacity = '';
            }
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Legacy method for backwards compatibility - now delegates to unified handler
    async handleFile(file) {
        console.warn('UIControls.handleFile() is deprecated, use window.fileHandler.loadFile() instead');
        return await window.fileHandler.loadFile(file, 'legacy');
    }

    // Setup toggle functionality
    setupToggleControls() {
        // Get all elements
        const shadingToggle = document.getElementById('shading-toggle');
        const wireframeToggle = document.getElementById('wireframe-toggle');
        const surfaceColorPicker = document.getElementById('surface-color');
        const wireframeColorPicker = document.getElementById('wireframe-color');
        
        const smoothIcon = document.getElementById('smooth-icon');
        const flatIcon = document.getElementById('flat-icon');
        const solidIcon = document.getElementById('solid-icon');
        const wireframeIcon = document.getElementById('wireframe-icon');
        
        const invertXToggle = document.getElementById('invert-x-toggle');
        const invertYToggle = document.getElementById('invert-y-toggle');
        const invertZToggle = document.getElementById('invert-z-toggle');
        
        const autoRotateToggle = document.getElementById('auto-rotate-toggle');
        const rotationIcon = document.getElementById('rotation-icon');
        
        // Update icon states - moved to global scope for loadSettings
        window.updateShadingIcons = function(isSmooth) {
            if (isSmooth) {
                smoothIcon.classList.add('active');
                flatIcon.classList.remove('active');
            } else {
                smoothIcon.classList.remove('active');
                flatIcon.classList.add('active');
            }
        };
        
        window.updateWireframeIcons = function(isWireframe) {
            if (isWireframe) {
                solidIcon.classList.remove('active');
                wireframeIcon.classList.add('active');
            } else {
                solidIcon.classList.add('active');
                wireframeIcon.classList.remove('active');
            }
        };
        
        // Setup all event listeners
        this.setupShadingToggle(shadingToggle);
        this.setupWireframeToggle(wireframeToggle);
        this.setupColorPickers(surfaceColorPicker, wireframeColorPicker);
        this.setupAxisToggles(invertXToggle, invertYToggle, invertZToggle);
        this.setupRotationToggle(autoRotateToggle, rotationIcon);
    }

    setupShadingToggle(shadingToggle) {
        shadingToggle.addEventListener('click', () => {
            if (!window.meshManager.currentMesh) return;
            
            shadingToggle.classList.toggle('active');
            const isSmooth = shadingToggle.classList.contains('active');
            
            // Update icons
            window.updateShadingIcons(isSmooth);
            
            // Set flat shading property on material
            window.meshManager.currentMesh.material.flatShading = !isSmooth;
            
            if (isSmooth) {
                // Smooth shading - ensure vertex normals are computed
                window.meshManager.currentMesh.geometry.computeVertexNormals();
            } else {
                // Flat shading - remove vertex normals to force face normals
                window.meshManager.currentMesh.geometry.deleteAttribute('normal');
            }
            
            // Force material to update
            window.meshManager.currentMesh.material.needsUpdate = true;
            
            // Save settings
            window.settings.save();
        });
    }

    setupWireframeToggle(wireframeToggle) {
        wireframeToggle.addEventListener('click', () => {
            if (!window.meshManager.currentMesh) return;
            
            wireframeToggle.classList.toggle('active');
            const isWireframe = wireframeToggle.classList.contains('active');
            
            // Update icons
            window.updateWireframeIcons(isWireframe);
            
            if (isWireframe) {
                // Create wireframe overlay
                if (!window.meshManager.currentMesh.wireframeHelper) {
                    const wireframeGeometry = new THREE.WireframeGeometry(window.meshManager.currentMesh.geometry);
                    const wireframeMaterial = new THREE.LineBasicMaterial({ 
                        color: document.getElementById('wireframe-color').value, 
                        opacity: 0.3, 
                        transparent: true 
                    });
                    window.meshManager.currentMesh.wireframeHelper = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
                    window.meshManager.currentMesh.add(window.meshManager.currentMesh.wireframeHelper);
                }
                window.meshManager.currentMesh.wireframeHelper.visible = true;
            } else {
                // Hide wireframe overlay
                if (window.meshManager.currentMesh.wireframeHelper) {
                    window.meshManager.currentMesh.wireframeHelper.visible = false;
                }
            }
            
            // Save settings
            window.settings.save();
        });
    }

    setupColorPickers(surfaceColorPicker, wireframeColorPicker) {
        // Surface color picker
        surfaceColorPicker.addEventListener('input', (e) => {
            if (!window.meshManager.currentMesh) return;
            window.meshManager.currentMesh.material.color.setHex(parseInt(e.target.value.replace('#', '0x')));
            window.settings.save();
        });
        
        // Wireframe color picker
        wireframeColorPicker.addEventListener('input', (e) => {
            if (!window.meshManager.currentMesh || !window.meshManager.currentMesh.wireframeHelper) return;
            window.meshManager.currentMesh.wireframeHelper.material.color.setHex(parseInt(e.target.value.replace('#', '0x')));
            window.settings.save();
        });
    }

    setupAxisToggles(invertXToggle, invertYToggle, invertZToggle) {
        // X-axis inversion
        invertXToggle.addEventListener('click', () => {
            if (!window.meshManager.currentMesh) return;
            
            invertXToggle.classList.toggle('active');
            window.settings.axisInversions.x = invertXToggle.classList.contains('active');
            window.meshManager.updateMeshWithInversions();
            window.settings.save();
        });
        
        // Y-axis inversion
        invertYToggle.addEventListener('click', () => {
            if (!window.meshManager.currentMesh) return;
            
            invertYToggle.classList.toggle('active');
            window.settings.axisInversions.y = invertYToggle.classList.contains('active');
            window.meshManager.updateMeshWithInversions();
            window.settings.save();
        });
        
        // Z-axis inversion
        invertZToggle.addEventListener('click', () => {
            if (!window.meshManager.currentMesh) return;
            
            invertZToggle.classList.toggle('active');
            window.settings.axisInversions.z = invertZToggle.classList.contains('active');
            window.meshManager.updateMeshWithInversions();
            window.settings.save();
        });
    }

    setupRotationToggle(autoRotateToggle, rotationIcon) {
        autoRotateToggle.addEventListener('click', () => {
            autoRotateToggle.classList.toggle('active');
            const isActive = autoRotateToggle.classList.contains('active');
            
            // Update settings
            window.settings.autoRotate = isActive;
            
            // Update camera controls auto-rotation
            if (window.cameraControls) {
                window.cameraControls.setAutoRotate(isActive);
            }
            
            // Update icon state
            if (isActive) {
                rotationIcon.classList.add('active');
            } else {
                rotationIcon.classList.remove('active');
            }
            
            // Save settings
            window.settings.save();
        });
    }
}

// Global instances
window.meshManager = new MeshManager();
window.uiControls = null; // Will be initialized after DOM is loaded
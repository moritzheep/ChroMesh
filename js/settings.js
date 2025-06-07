// Settings management for the mesh viewer
class Settings {
    constructor() {
        this.axisInversions = { x: false, y: false, z: false };
        this.autoRotate = false;
    }

    // Save current settings to localStorage
    save() {
        const settings = {
            axisInversions: this.axisInversions,
            autoRotate: this.autoRotate,
            shadingSmooth: document.getElementById('shading-toggle').classList.contains('active'),
            wireframeActive: document.getElementById('wireframe-toggle').classList.contains('active'),
            surfaceColor: document.getElementById('surface-color').value,
            wireframeColor: document.getElementById('wireframe-color').value
        };
        localStorage.setItem('meshViewerSettings', JSON.stringify(settings));
    }

    // Load settings from localStorage and apply them
    load() {
        const saved = localStorage.getItem('meshViewerSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                
                // Apply axis inversions
                if (settings.axisInversions) {
                    this.axisInversions = settings.axisInversions;
                    document.getElementById('invert-x-toggle').classList.toggle('active', this.axisInversions.x);
                    document.getElementById('invert-y-toggle').classList.toggle('active', this.axisInversions.y);
                    document.getElementById('invert-z-toggle').classList.toggle('active', this.axisInversions.z);
                }
                
                // Apply auto rotation
                if (settings.autoRotate !== undefined) {
                    this.autoRotate = settings.autoRotate;
                    document.getElementById('auto-rotate-toggle').classList.toggle('active', this.autoRotate);
                    document.getElementById('rotation-icon').classList.toggle('active', this.autoRotate);
                }
                
                // Apply shading setting
                if (settings.shadingSmooth !== undefined) {
                    const shadingToggle = document.getElementById('shading-toggle');
                    shadingToggle.classList.toggle('active', settings.shadingSmooth);
                    // Update icons when elements are available
                    setTimeout(() => {
                        if (window.updateShadingIcons) {
                            window.updateShadingIcons(settings.shadingSmooth);
                        }
                    }, 0);
                }
                
                // Apply wireframe setting
                if (settings.wireframeActive !== undefined) {
                    const wireframeToggle = document.getElementById('wireframe-toggle');
                    wireframeToggle.classList.toggle('active', settings.wireframeActive);
                    // Update icons when elements are available
                    setTimeout(() => {
                        if (window.updateWireframeIcons) {
                            window.updateWireframeIcons(settings.wireframeActive);
                        }
                    }, 0);
                }
                
                // Apply colors
                if (settings.surfaceColor) {
                    document.getElementById('surface-color').value = settings.surfaceColor;
                }
                if (settings.wireframeColor) {
                    document.getElementById('wireframe-color').value = settings.wireframeColor;
                }
            } catch (e) {
                console.log('Could not load saved settings:', e);
            }
        }
    }

    // Apply saved settings to the current mesh
    applyToMesh(mesh) {
        if (!mesh) return;
        
        // Apply axis inversions
        if (this.axisInversions.x || this.axisInversions.y || this.axisInversions.z) {
            if (window.meshManager) {
                window.meshManager.updateMeshWithInversions();
            }
        }
        
        // Apply shading setting
        const isSmooth = document.getElementById('shading-toggle').classList.contains('active');
        mesh.material.flatShading = !isSmooth;
        if (isSmooth) {
            mesh.geometry.computeVertexNormals();
        } else {
            mesh.geometry.deleteAttribute('normal');
        }
        mesh.material.needsUpdate = true;
        
        // Apply surface color
        const surfaceColor = document.getElementById('surface-color').value;
        mesh.material.color.setHex(parseInt(surfaceColor.replace('#', '0x')));
        
        // Apply wireframe setting
        const isWireframe = document.getElementById('wireframe-toggle').classList.contains('active');
        if (isWireframe) {
            if (!mesh.wireframeHelper) {
                const wireframeGeometry = new THREE.WireframeGeometry(mesh.geometry);
                const wireframeMaterial = new THREE.LineBasicMaterial({ 
                    color: document.getElementById('wireframe-color').value, 
                    opacity: 0.3, 
                    transparent: true 
                });
                mesh.wireframeHelper = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
                mesh.add(mesh.wireframeHelper);
            }
            mesh.wireframeHelper.visible = true;
        }
    }
}

// Global settings instance
window.settings = new Settings();
// Mesh file parsers for OBJ, STL, and PLY formats
class MeshParsers {
    // Simple OBJ parser
    static parseOBJ(content) {
        const vertices = [];
        const faces = [];
        const lines = content.split('\n');
        
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('v ')) {
                const coords = line.split(/\s+/).slice(1).map(parseFloat);
                vertices.push(coords[0], coords[1], coords[2]);
            } else if (line.startsWith('f ')) {
                const indices = line.split(/\s+/).slice(1).map(face => {
                    return parseInt(face.split('/')[0]) - 1;
                });
                
                // Convert to triangles if needed
                for (let i = 1; i < indices.length - 1; i++) {
                    faces.push(indices[0], indices[i], indices[i + 1]);
                }
            }
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(faces);
        geometry.computeVertexNormals();
        
        return geometry;
    }

    // Simple STL parser (supports both ASCII and Binary)
    static parseSTL(content) {
        const vertices = [];
        
        if (typeof content === 'string') {
            // ASCII STL
            const lines = content.split('\n');
            for (let line of lines) {
                line = line.trim();
                if (line.startsWith('vertex ')) {
                    const coords = line.split(/\s+/).slice(1).map(parseFloat);
                    vertices.push(coords[0], coords[1], coords[2]);
                }
            }
        } else {
            // Binary STL
            const dataView = new DataView(content);
            const triangleCount = dataView.getUint32(80, true);
            let offset = 84;
            
            for (let i = 0; i < triangleCount; i++) {
                offset += 12; // Skip normal vector
                
                for (let j = 0; j < 3; j++) {
                    vertices.push(
                        dataView.getFloat32(offset, true),
                        dataView.getFloat32(offset + 4, true),
                        dataView.getFloat32(offset + 8, true)
                    );
                    offset += 12;
                }
                offset += 2; // Skip attribute byte count
            }
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        
        return geometry;
    }

    // Simple PLY parser (ASCII only)
    static parsePLY(content) {
        const lines = content.split('\n');
        let vertexCount = 0;
        let faceCount = 0;
        let inHeader = true;
        let vertices = [];
        let faces = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (inHeader) {
                if (line.startsWith('element vertex ')) {
                    vertexCount = parseInt(line.split(' ')[2]);
                } else if (line.startsWith('element face ')) {
                    faceCount = parseInt(line.split(' ')[2]);
                } else if (line === 'end_header') {
                    inHeader = false;
                    
                    // Read vertices
                    for (let j = 0; j < vertexCount; j++) {
                        const coords = lines[i + 1 + j].trim().split(/\s+/).map(parseFloat);
                        vertices.push(coords[0], coords[1], coords[2]);
                    }
                    
                    // Read faces
                    for (let j = 0; j < faceCount; j++) {
                        const faceData = lines[i + 1 + vertexCount + j].trim().split(/\s+/).map(parseInt);
                        const numVertices = faceData[0];
                        const indices = faceData.slice(1, numVertices + 1);
                        
                        // Convert to triangles
                        for (let k = 1; k < indices.length - 1; k++) {
                            faces.push(indices[0], indices[k], indices[k + 1]);
                        }
                    }
                    break;
                }
            }
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(faces);
        geometry.computeVertexNormals();
        
        return geometry;
    }

    // Main parser function that determines format and calls appropriate parser
    static parse(content, filename) {
        const extension = filename.split('.').pop().toLowerCase();
        
        switch(extension) {
            case 'obj':
                return this.parseOBJ(content);
            case 'stl':
                return this.parseSTL(content);
            case 'ply':
                return this.parsePLY(content);
            default:
                throw new Error('Unsupported file format: ' + extension);
        }
    }
}
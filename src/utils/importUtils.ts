import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { initVertexColors } from './geometryUtils';

/**
 * Extracts a unified sculptable BufferGeometry from an imported file.
 */
export async function loadGeometryFromFile(file: File): Promise<THREE.BufferGeometry> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'obj') {
    const text = await file.text();
    const loader = new OBJLoader();
    const obj = loader.parse(text);
    return extractGeometryFromObject(obj);
  } else if (extension === 'stl') {
    const buffer = await file.arrayBuffer();
    const loader = new STLLoader();
    const geometry = loader.parse(buffer);
    initVertexColors(geometry);
    geometry.computeVertexNormals();
    geometry.center();
    return geometry;
  } else if (extension === 'gltf' || extension === 'glb') {
    const buffer = await file.arrayBuffer();
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.parse(
        buffer,
        '',
        (gltf) => {
          try {
            const geom = extractGeometryFromObject(gltf.scene);
            resolve(geom);
          } catch (err) {
            reject(err);
          }
        },
        (err) => reject(err)
      );
    });
  } else {
    throw new Error(`Unsupported file format: .${extension}. Supported: .obj, .gltf, .glb, .stl`);
  }
}

function extractGeometryFromObject(root: THREE.Object3D): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        geometries.push(mesh.geometry.clone());
      }
    }
  });

  if (geometries.length === 0) {
    throw new Error('No 3D meshes found in file.');
  }

  // Use the primary geometry, or if multiple, return the largest one
  let primary = geometries[0];
  let maxVerts = primary.attributes.position ? primary.attributes.position.count : 0;
  for (let i = 1; i < geometries.length; i++) {
    const vCount = geometries[i].attributes.position ? geometries[i].attributes.position.count : 0;
    if (vCount > maxVerts) {
      maxVerts = vCount;
      primary = geometries[i];
    }
  }

  // Ensure non-indexed or indexed format with vertex colors
  initVertexColors(primary);
  primary.computeVertexNormals();
  primary.center();

  // Scale to standard view size (around 2-3 units max dimension)
  primary.computeBoundingBox();
  const box = primary.boundingBox!;
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  if (maxDim > 0) {
    const scale = 2.5 / maxDim;
    primary.scale(scale, scale, scale);
    primary.computeVertexNormals();
    primary.computeBoundingBox();
    primary.computeBoundingSphere();
  }

  return primary;
}

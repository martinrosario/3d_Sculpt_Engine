import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { ExportFormat, GameEnginePreset } from '../types';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function exportMesh(
  mesh: THREE.Mesh,
  format: ExportFormat,
  filenameBase: string = 'sculpt_game_asset'
): Promise<{ success: boolean; filename: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    // Clone mesh with baked vertex colors into exportable material
    const exportGeometry = mesh.geometry.clone();
    
    // Create standard PBR material that preserves vertex colors
    const exportMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.5,
      metalness: 0.1,
      name: `${filenameBase}_mat`,
    });

    const exportMeshObj = new THREE.Mesh(exportGeometry, exportMaterial);
    exportMeshObj.name = filenameBase;

    try {
      if (format === 'glb' || format === 'gltf') {
        const isBinary = format === 'glb';
        const exporter = new GLTFExporter();

        exporter.parse(
          exportMeshObj,
          (result) => {
            let blob: Blob;
            const finalFilename = `${filenameBase}.${format}`;

            if (result instanceof ArrayBuffer) {
              blob = new Blob([result], { type: 'application/octet-stream' });
            } else {
              const output = JSON.stringify(result, null, 2);
              blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
            }

            downloadBlob(blob, finalFilename);
            exportGeometry.dispose();
            exportMaterial.dispose();
            resolve({
              success: true,
              filename: finalFilename,
              sizeBytes: blob.size,
            });
          },
          (error) => {
            exportGeometry.dispose();
            exportMaterial.dispose();
            reject(error);
          },
          {
            binary: isBinary,
            embedImages: true,
            includeCustomExtensions: true,
          }
        );
      } else if (format === 'obj') {
        const exporter = new OBJExporter();
        const output = exporter.parse(exportMeshObj);
        const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
        const finalFilename = `${filenameBase}.obj`;

        downloadBlob(blob, finalFilename);
        exportGeometry.dispose();
        exportMaterial.dispose();
        resolve({
          success: true,
          filename: finalFilename,
          sizeBytes: blob.size,
        });
      } else if (format === 'stl') {
        const exporter = new STLExporter();
        const result = exporter.parse(exportMeshObj, { binary: true });
        const blob = new Blob([result as unknown as BlobPart], { type: 'application/octet-stream' });
        const finalFilename = `${filenameBase}.stl`;

        downloadBlob(blob, finalFilename);
        exportGeometry.dispose();
        exportMaterial.dispose();
        resolve({
          success: true,
          filename: finalFilename,
          sizeBytes: blob.size,
        });
      }
    } catch (err) {
      exportGeometry.dispose();
      exportMaterial.dispose();
      reject(err);
    }
  });
}

export interface EngineGuide {
  name: string;
  recommendedFormat: ExportFormat;
  pipelineInfo: string;
  instructions: string[];
}

export const GAME_ENGINE_GUIDES: Record<GameEnginePreset, EngineGuide> = {
  godot: {
    name: 'Godot Engine 4.x',
    recommendedFormat: 'glb',
    pipelineInfo: 'Fastest pipeline. GLB supports vertex colors, fast PBR material imports, and auto collision generation.',
    instructions: [
      'Export as .glb file from Game Sculpt 3D.',
      'Drag and drop the .glb into your Godot project FileSystem dock.',
      'Godot 4 will automatically import it as a 3D PackedScene.',
      'In the MeshInstance3D inspector, enable "Use as Albedo" under Vertex Color if you painted vertex colors.',
      'To add collisions, click Mesh > Create Trimesh Static Body in the top 3D view toolbar.',
    ],
  },
  unity: {
    name: 'Unity 6 / 2022+ (URP & HDRP)',
    recommendedFormat: 'glb',
    pipelineInfo: 'Use GLB or OBJ. Universal Render Pipeline (URP) natively maps vertex colors and normals.',
    instructions: [
      'Export as .glb (or .obj) and drag into your Unity Assets/Models folder.',
      'Select the imported asset in the Project tab and set Normals to "Import" and Tangents to "Calculate".',
      'For URP Lit Material: In the Material inspector, check "Vertex Colors" or use a Shader Graph that reads the Vertex Color node.',
      'Attach a MeshCollider or BoxCollider component for physics interaction.',
    ],
  },
  unreal: {
    name: 'Unreal Engine 5.x',
    recommendedFormat: 'glb',
    pipelineInfo: 'Full Nanite virtualized geometry compatibility. Can also use high-poly or decimated LOD meshes.',
    instructions: [
      'Drag the exported .glb or .obj into your UE5 Content Browser.',
      'In the FBX/glTF Import Options dialog, check "Import Mesh LODs" and "Vertex Color Import Option: Replace".',
      'Optionally right click the Static Mesh and select "Enable Nanite" for cinematic geometry virtualization without frame drops.',
      'Assign an Unreal Material that plugs the "Vertex Color" node into the Base Color input.',
    ],
  },
  threejs: {
    name: 'Three.js / WebGL / React Three Fiber',
    recommendedFormat: 'glb',
    pipelineInfo: 'Native web 3D format. Directly loadable with GLTFLoader or gltfjsx in React Three Fiber.',
    instructions: [
      'Place the .glb in your public/ models folder.',
      'Load with GLTFLoader: new GLTFLoader().load("/model.glb", (gltf) => scene.add(gltf.scene));',
      'Or run "npx gltfjsx model.glb" to generate an optimized React Three Fiber component with TypeScript types.',
    ],
  },
  blender: {
    name: 'Blender 4.x',
    recommendedFormat: 'obj',
    pipelineInfo: 'Ideal for further retopology, UV unwrapping, rigging, and armature bone weighting.',
    instructions: [
      'In Blender, go to File > Import > Wavefront (.obj) or glTF 2.0 (.glb/.gltf).',
      'In the 3D Viewport, press Z and switch to "Material Preview" or "Solid" with Color set to "Vertex".',
      'You can apply Blender Modifier > Remesh (Voxel) or Multiresolution to continue refining.',
    ],
  },
  '3dprint': {
    name: '3D Printing (Slicers: Cura, PrusaSlicer, Bambu Studio)',
    recommendedFormat: 'stl',
    pipelineInfo: 'Binary STL standard for slicer software, CNC milling, and physical prototyping.',
    instructions: [
      'Export as .stl from Game Sculpt 3D.',
      'Open your slicer software (UltiMaker Cura, PrusaSlicer, Bambu Studio, OrcaSlicer).',
      'Import the .stl and scale to target physical dimensions (mm).',
      'Mesh is watertight and ready for slicing without inverted normal warnings.',
    ],
  },
};

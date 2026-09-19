export type SculptTool = 
  | 'clay' 
  | 'smooth' 
  | 'inflate' 
  | 'flatten' 
  | 'pinch' 
  | 'grab' 
  | 'paint';

export type FalloffType = 'smooth' | 'sharp' | 'sphere' | 'flat';

export type ShadingMode = 'matcap' | 'pbr' | 'normal' | 'wireframe' | 'flat';

export type MatCapType = 'redwax' | 'clay' | 'bronze' | 'obsidian' | 'chrome' | 'toon';

export type MeshPrimitive = 
  | 'sphere' 
  | 'cube' 
  | 'cylinder' 
  | 'torus' 
  | 'capsule' 
  | 'terrain' 
  | 'character_head' 
  | 'fantasy_dagger';

export type ExportFormat = 'glb' | 'gltf' | 'obj' | 'stl';

export type GameEnginePreset = 'godot' | 'unity' | 'unreal' | 'threejs' | 'blender' | '3dprint';

export interface BrushSettings {
  tool: SculptTool;
  radius: number;
  strength: number;
  invert: boolean;
  falloff: FalloffType;
  symmetryX: boolean;
  symmetryY: boolean;
  symmetryZ: boolean;
  paintColor: string;
  paintRoughness: number;
  wireframe: boolean;
  shadingMode: ShadingMode;
  matcap: MatCapType;
  showGrid: boolean;
  showSymmetryPlane: boolean;
  showStats: boolean;
  flatShading: boolean;
  metalness: number;
  roughness: number;
  baseColor: string;
}

export interface MeshStats {
  vertices: number;
  triangles: number;
  bounds: {
    width: number;
    height: number;
    depth: number;
  };
  lodTier: 'Mobile / Web' | 'Indie PC' | 'Console / AAA' | 'High-Poly Sculpt';
  lodBadgeColor: string;
}

export interface HistorySnapshot {
  positions: Float32Array;
  colors?: Float32Array;
  indices?: Uint32Array | Uint16Array;
}

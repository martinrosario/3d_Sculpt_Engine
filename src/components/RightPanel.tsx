import React, { useRef, useState } from 'react';
import { 
  Box, 
  Upload, 
  Layers, 
  Sparkles, 
  Cpu, 
  Download, 
  Wand2, 
  Palette, 
  Sliders, 
  Check, 
  Info,
  ChevronRight,
  Shield,
  User,
  Zap,
  Rotate3D
} from 'lucide-react';
import { BrushSettings, MatCapType, MeshPrimitive, MeshStats, ShadingMode } from '../types';

interface RightPanelProps {
  settings: BrushSettings;
  setSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  meshStats: MeshStats;
  currentPrimitive: MeshPrimitive;
  onChangePrimitive: (primitive: MeshPrimitive) => void;
  onSubdivide: () => void;
  onDecimate: (ratio: number) => void;
  onRecalculateNormals: (flat: boolean) => void;
  onCenterMesh: () => void;
  onImportFile: (file: File) => void;
  onQuickExport: (format: 'glb' | 'obj' | 'stl') => void;
  onOpenExportModal: () => void;
}

const PRIMITIVES: { id: MeshPrimitive; label: string; icon: React.ReactNode }[] = [
  { id: 'sphere', label: 'Sphere', icon: <div className="w-3.5 h-3.5 rounded-full border border-current" /> },
  { id: 'cube', label: 'Cube', icon: <Box className="w-3.5 h-3.5" /> },
  { id: 'cylinder', label: 'Cylinder', icon: <div className="w-3.5 h-4 border border-current rounded-sm" /> },
  { id: 'capsule', label: 'Capsule', icon: <div className="w-3.5 h-4 border border-current rounded-full" /> },
  { id: 'torus', label: 'Torus', icon: <div className="w-3.5 h-3.5 rounded-full border-2 border-current" /> },
  { id: 'terrain', label: 'Terrain', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'character_head', label: 'Head Base', icon: <User className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'fantasy_dagger', label: 'Dagger Base', icon: <Shield className="w-3.5 h-3.5 text-cyan-400" /> },
];

const MATCAPS: { id: MatCapType; label: string; previewColor: string }[] = [
  { id: 'redwax', label: 'Red Wax (ZBrush)', previewColor: 'bg-gradient-to-tr from-red-900 to-rose-400' },
  { id: 'clay', label: 'Sculptor Clay', previewColor: 'bg-gradient-to-tr from-zinc-700 to-zinc-300' },
  { id: 'bronze', label: 'Antique Bronze', previewColor: 'bg-gradient-to-tr from-amber-900 to-amber-300' },
  { id: 'obsidian', label: 'Obsidian Jade', previewColor: 'bg-gradient-to-tr from-emerald-950 to-emerald-400' },
  { id: 'chrome', label: 'Mirror Chrome', previewColor: 'bg-gradient-to-tr from-slate-800 via-slate-200 to-slate-600' },
  { id: 'toon', label: 'Cel Toon / Anime', previewColor: 'bg-gradient-to-tr from-indigo-950 via-slate-400 to-white' },
];

export const RightPanel: React.FC<RightPanelProps> = ({
  settings,
  setSettings,
  meshStats,
  currentPrimitive,
  onChangePrimitive,
  onSubdivide,
  onDecimate,
  onRecalculateNormals,
  onCenterMesh,
  onImportFile,
  onQuickExport,
  onOpenExportModal,
}) => {
  const [activeTab, setActiveTab] = useState<'mesh' | 'topology' | 'material' | 'export'>('mesh');
  const [decimateRatio, setDecimateRatio] = useState<number>(0.5);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = '';
    }
  };

  const handleSubdivideClick = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onSubdivide();
      setIsProcessing(false);
    }, 50);
  };

  const handleDecimateClick = (ratio: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      onDecimate(ratio);
      setIsProcessing(false);
    }, 50);
  };

  return (
    <aside className="w-80 bg-zinc-950/95 border-l border-zinc-800/80 flex flex-col h-full select-none z-20 shrink-0 text-xs text-zinc-300">
      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-800/80 bg-zinc-900/50 p-1 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('mesh')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-center transition-all ${
            activeTab === 'mesh'
              ? 'bg-zinc-800 text-amber-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Base
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('topology')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-center transition-all ${
            activeTab === 'topology'
              ? 'bg-zinc-800 text-amber-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          LOD & Mesh
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('material')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-center transition-all ${
            activeTab === 'material'
              ? 'bg-zinc-800 text-amber-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Material
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-center transition-all ${
            activeTab === 'export'
              ? 'bg-zinc-800 text-amber-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Export
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4">
        {/* TAB 1: BASE MESHES & PRESETS */}
        {activeTab === 'mesh' && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-zinc-200">Sculpting Primitives</span>
                <span className="text-[11px] text-zinc-500">Uniform topology</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRIMITIVES.map((p) => (
                  <button
                    key={p.id}
                    id={`primitive-btn-${p.id}`}
                    type="button"
                    onClick={() => onChangePrimitive(p.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                      currentPrimitive === p.id
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-medium'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {p.icon}
                    <span className="text-xs">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom 3D File Importer */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
              <span className="font-semibold text-zinc-200">Import Game Asset</span>
              <p className="text-[11px] text-zinc-400">
                Load an existing mesh (.obj, .gltf, .glb, .stl) to sculpt, modify, and optimize.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".obj,.gltf,.glb,.stl"
                className="hidden"
              />
              <button
                id="import-3d-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-700 hover:border-amber-400/60 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload 3D Model</span>
              </button>
            </div>

            {/* Mesh Transform Utils */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
              <span className="font-semibold text-zinc-200">Placement & Pivot</span>
              <button
                type="button"
                onClick={onCenterMesh}
                className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center justify-center gap-2 transition-colors"
              >
                <Rotate3D className="w-3.5 h-3.5 text-zinc-400" />
                <span>Center & Ground to Origin</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: TOPOLOGY & GAME LOD OPTIMIZER */}
        {activeTab === 'topology' && (
          <div className="flex flex-col gap-4">
            {/* Mesh Polycount & Game Readiness Badge */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-medium">Triangle Budget</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${meshStats.lodBadgeColor}`}>
                  {meshStats.lodTier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-zinc-200">
                <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/70">
                  <div className="text-[10px] text-zinc-500">Triangles</div>
                  <div className="font-mono text-base font-bold text-amber-400">
                    {meshStats.triangles.toLocaleString()}
                  </div>
                </div>
                <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/70">
                  <div className="text-[10px] text-zinc-500">Vertices</div>
                  <div className="font-mono text-base font-bold text-zinc-200">
                    {meshStats.vertices.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/60">
                <span>Bounding Box:</span>
                <span className="font-mono text-zinc-300">
                  {meshStats.bounds.width}m × {meshStats.bounds.height}m × {meshStats.bounds.depth}m
                </span>
              </div>
            </div>

            {/* Game LOD Optimization & Decimation */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-zinc-200">Game Engine LOD Decimator</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Reduce polygons using vertex clustering to create lightweight game LODs while preserving silhouette and vertex colors.
              </p>

              {/* 1-Click Game Presets */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecimateClick(0.25)}
                  className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-center transition-colors disabled:opacity-50"
                  title="Aggressive reduction for mobile games & VR"
                >
                  <div className="font-semibold text-emerald-400 text-[11px]">Mobile LOD</div>
                  <div className="text-[9px] text-zinc-500">-75% Tris</div>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecimateClick(0.5)}
                  className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-center transition-colors disabled:opacity-50"
                  title="Balanced reduction for PC & Godot/Unity"
                >
                  <div className="font-semibold text-cyan-400 text-[11px]">Indie PC</div>
                  <div className="text-[9px] text-zinc-500">-50% Tris</div>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecimateClick(0.75)}
                  className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-center transition-colors disabled:opacity-50"
                  title="Subtle reduction for high-end rendering"
                >
                  <div className="font-semibold text-amber-400 text-[11px]">AAA LOD</div>
                  <div className="text-[9px] text-zinc-500">-25% Tris</div>
                </button>
              </div>

              {/* Custom Decimation Slider */}
              <div className="bg-zinc-900/70 border border-zinc-800 p-2.5 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Custom Target Retain Ratio</span>
                  <span className="font-mono text-zinc-200 font-semibold">{Math.round(decimateRatio * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.85}
                  step={0.05}
                  value={decimateRatio}
                  onChange={(e) => setDecimateRatio(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <button
                  id="decimate-run-btn"
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecimateClick(decimateRatio)}
                  className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Decimate Mesh</span>
                </button>
              </div>
            </div>

            {/* Subdivide for High-Poly Sculpting */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
              <span className="font-semibold text-zinc-200">Subdivision / Detail Up</span>
              <p className="text-[11px] text-zinc-400">
                Multiplies triangle count (4x) for finer sculpt brush fidelity and smooth organic details.
              </p>
              <button
                id="subdivide-btn"
                type="button"
                disabled={isProcessing || meshStats.triangles > 80000}
                onClick={handleSubdivideClick}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Subdivide (+4x Faces)</span>
              </button>
              {meshStats.triangles > 80000 && (
                <span className="text-[10px] text-amber-400">Mesh already at maximum sculpt resolution.</span>
              )}
            </div>

            {/* Normal Smoothing */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
              <span className="font-semibold text-zinc-200">Normals Shading</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onRecalculateNormals(false)}
                  className={`py-2 px-2.5 rounded-lg border text-center transition-colors ${
                    !settings.flatShading
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  Smooth Normals
                </button>
                <button
                  type="button"
                  onClick={() => onRecalculateNormals(true)}
                  className={`py-2 px-2.5 rounded-lg border text-center transition-colors ${
                    settings.flatShading
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  Flat / Low-Poly
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MATERIALS & SHADING */}
        {activeTab === 'material' && (
          <div className="flex flex-col gap-4">
            {/* Shading Mode */}
            <div>
              <span className="font-semibold text-zinc-200 block mb-2">Viewport Shading</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'matcap', label: 'MatCap Studio' },
                    { id: 'pbr', label: 'PBR Game Lit' },
                    { id: 'normal', label: 'Normal Map' },
                    { id: 'wireframe', label: 'Wireframe Only' },
                  ] as { id: ShadingMode; label: string }[]
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, shadingMode: mode.id }))}
                    className={`py-2 px-2 rounded-lg border text-center transition-colors ${
                      settings.shadingMode === mode.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MatCap Presets */}
            {settings.shadingMode === 'matcap' && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-zinc-200">MatCap Sculpting Reflection</span>
                <div className="grid grid-cols-2 gap-2">
                  {MATCAPS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, matcap: m.id }))}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all ${
                        settings.matcap === m.id
                          ? 'bg-zinc-800 border-amber-500/60 text-zinc-100 font-medium shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${m.previewColor} shadow-inner shrink-0`} />
                      <span className="text-[11px] truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PBR Parameters */}
            {settings.shadingMode === 'pbr' && (
              <div className="flex flex-col gap-3 bg-zinc-900/70 border border-zinc-800 p-3 rounded-xl">
                <span className="font-semibold text-zinc-200">PBR Material Properties</span>

                {/* Roughness */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                    <span>Roughness</span>
                    <span className="font-mono text-zinc-200">{settings.roughness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={settings.roughness}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, roughness: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Metalness */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                    <span>Metallic</span>
                    <span className="font-mono text-zinc-200">{settings.metalness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={settings.metalness}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, metalness: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Base Tint */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[11px]">
                  <span className="text-zinc-400">Surface Base Tint</span>
                  <input
                    type="color"
                    value={settings.baseColor}
                    onChange={(e) => setSettings((prev) => ({ ...prev, baseColor: e.target.value }))}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GAME EXPORT HUB */}
        {activeTab === 'export' && (
          <div className="flex flex-col gap-4">
            <div>
              <span className="font-semibold text-zinc-200 block mb-1">Quick Export Game Ready</span>
              <p className="text-[11px] text-zinc-400 mb-3">
                Export 3D model with embedded vertex colors and optimized surface normals.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  id="export-glb-btn"
                  type="button"
                  onClick={() => onQuickExport('glb')}
                  className="w-full p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center justify-between shadow-lg shadow-amber-500/15 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>Download .GLB (Binary glTF)</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-950/20 text-zinc-950 font-mono">
                    Godot / Unity / UE5
                  </span>
                </button>

                <button
                  id="export-obj-btn"
                  type="button"
                  onClick={() => onQuickExport('obj')}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-zinc-400" />
                    <span>Download .OBJ (Wavefront)</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Blender / Maya</span>
                </button>

                <button
                  id="export-stl-btn"
                  type="button"
                  onClick={() => onQuickExport('stl')}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-zinc-400" />
                    <span>Download .STL</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">3D Print / Slicers</span>
                </button>
              </div>
            </div>

            {/* Game Engine Integration Guide Button */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2">
              <span className="font-semibold text-zinc-200">Engine Integration Guides</span>
              <p className="text-[11px] text-zinc-400">
                View instructions and setup tips for Godot 4, Unity URP, Unreal Nanite, and Blender.
              </p>
              <button
                type="button"
                onClick={onOpenExportModal}
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Open Export & Engine Guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Technical Credits Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/90 shrink-0 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="font-mono text-zinc-400 font-medium">3D Sculpt Engine</span>
        <span className="text-zinc-400">
          Created By: <strong className="text-amber-300 font-semibold">Martin Rosario</strong>
        </span>
      </div>
    </aside>
  );
};

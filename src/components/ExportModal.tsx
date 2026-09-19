import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Check, 
  Box, 
  Layers, 
  Sparkles, 
  HelpCircle, 
  FileCode, 
  ArrowRight,
  ShieldCheck,
  Gamepad2
} from 'lucide-react';
import { ExportFormat, GameEnginePreset, MeshStats } from '../types';
import { GAME_ENGINE_GUIDES } from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meshStats: MeshStats;
  onExport: (format: ExportFormat, filename: string) => Promise<{ success: boolean; filename: string; sizeBytes: number }>;
  onDecimate: (ratio: number) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  meshStats,
  onExport,
  onDecimate,
}) => {
  const [filename, setFilename] = useState<string>('vertexforge_asset');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('glb');
  const [selectedEngine, setSelectedEngine] = useState<GameEnginePreset>('godot');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    setDownloadSuccess(null);
    try {
      const cleanName = filename.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'vertexforge_asset';
      const result = await onExport(selectedFormat, cleanName);
      setDownloadSuccess(`Successfully exported ${result.filename} (${(result.sizeBytes / 1024).toFixed(1)} KB)`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const currentGuide = GAME_ENGINE_GUIDES[selectedEngine];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Export 3D Asset</h2>
              <p className="text-xs text-zinc-400">Production-ready formats with baked vertex colors & normals</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs text-zinc-300">
          {/* Filename Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-filename" className="font-semibold text-zinc-200">Asset File Name</label>
            <div className="flex items-center gap-2">
              <input
                id="export-filename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="game_sculpt_asset"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-amber-400 font-mono"
              />
              <span className="font-mono text-zinc-500 text-xs px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                .{selectedFormat}
              </span>
            </div>
          </div>

          {/* Format Selection Cards */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-200">Export Format</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'glb', title: 'GLB (Binary)', badge: 'Recommended', desc: 'Godot, Unity, Unreal 5' },
                  { id: 'gltf', title: 'glTF 2.0', badge: 'Web / JSON', desc: 'Three.js & Babylon' },
                  { id: 'obj', title: 'OBJ / Wavefront', badge: 'Universal', desc: 'Blender, Maya, 3ds Max' },
                  { id: 'stl', title: 'STL', badge: '3D Print', desc: 'Cura, Prusa, Bambu' },
                ] as { id: ExportFormat; title: string; badge: string; desc: string }[]
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  id={`export-fmt-${fmt.id}`}
                  type="button"
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedFormat === fmt.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-zinc-100 text-xs">{fmt.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{fmt.desc}</div>
                  </div>
                  <div className="mt-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 w-fit">
                    {fmt.badge}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Geometry Budget & LOD Overview */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Mesh Budget Check
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${meshStats.lodBadgeColor}`}>
                {meshStats.lodTier}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-zinc-300">
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
                <div className="text-[10px] text-zinc-500">Triangles</div>
                <div className="font-mono text-sm font-bold text-amber-400">
                  {meshStats.triangles.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
                <div className="text-[10px] text-zinc-500">Vertices</div>
                <div className="font-mono text-sm font-bold text-zinc-200">
                  {meshStats.vertices.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
                <div className="text-[10px] text-zinc-500">Dimensions</div>
                <div className="font-mono text-xs text-zinc-300 pt-0.5">
                  {meshStats.bounds.width}×{meshStats.bounds.height}×{meshStats.bounds.depth}m
                </div>
              </div>
            </div>

            {meshStats.triangles > 30000 && (
              <div className="mt-1 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-amber-300">
                <span>Polycount is high for mobile or web games. Want to optimize?</span>
                <button
                  type="button"
                  onClick={() => onDecimate(0.35)}
                  className="px-2 py-1 rounded bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-colors"
                >
                  Decimate to Game LOD
                </button>
              </div>
            )}
          </div>

          {/* Game Engine Import Instructions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-zinc-200">Engine Integration Instructions</span>
            </div>

            {/* Engine Tabs */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1 overflow-x-auto">
              {(
                [
                  { id: 'godot', label: 'Godot 4' },
                  { id: 'unity', label: 'Unity 6' },
                  { id: 'unreal', label: 'Unreal Engine 5' },
                  { id: 'threejs', label: 'Three.js / Web' },
                  { id: 'blender', label: 'Blender 4' },
                  { id: '3dprint', label: '3D Print' },
                ] as { id: GameEnginePreset; label: string }[]
              ).map((eng) => (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => setSelectedEngine(eng.id)}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
                    selectedEngine === eng.id
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {eng.label}
                </button>
              ))}
            </div>

            {/* Engine Guide Box */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between font-semibold text-zinc-200">
                <span>{currentGuide.name} Pipeline</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 font-mono text-amber-400">
                  Target: .{currentGuide.recommendedFormat.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">{currentGuide.pipelineInfo}</p>
              <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px] pt-1 border-t border-zinc-800/80">
                {currentGuide.instructions.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Success Banner */}
          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span>3D Sculpt Engine</span>
            <span className="text-zinc-600">•</span>
            <span>Created By: <strong className="text-amber-300 font-medium">Martin Rosario</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              id="modal-confirm-export-btn"
              type="button"
              disabled={isExporting}
              onClick={handleDownload}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : `Download .${selectedFormat.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

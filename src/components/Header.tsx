import React from 'react';
import { 
  Undo2, 
  Redo2, 
  Download, 
  HelpCircle, 
  RotateCcw, 
  Grid3X3, 
  Layers, 
  MousePointer, 
  Sparkles,
  Eye
} from 'lucide-react';
import { BrushSettings, MeshStats } from '../types';

interface HeaderProps {
  settings: BrushSettings;
  setSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  meshStats: MeshStats;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetView: () => void;
  onOpenExportModal: () => void;
  onOpenShortcutsModal: () => void;
  navigationMode: boolean;
  setNavigationMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  setSettings,
  meshStats,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetView,
  onOpenExportModal,
  onOpenShortcutsModal,
  navigationMode,
  setNavigationMode,
}) => {
  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800/80 px-4 flex items-center justify-between select-none z-20 shrink-0">
      {/* Brand & Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 text-zinc-950 font-black text-sm">
            <Sparkles className="w-4 h-4 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
              3d Sculpt Engine <span className="text-amber-400 font-mono text-xs px-1.5 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">3D</span>
            </h1>
            <div className="text-[10px] text-zinc-400 leading-none mt-0.5">
              Created By: <span className="text-amber-300 font-medium">Martin Rosario</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Sculpt vs Orbit switch */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          <button
            id="mode-sculpt-btn"
            type="button"
            onClick={() => setNavigationMode(false)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              !navigationMode
                ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Sculpt Mode (Left-click sculpts, Right-click orbits)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Sculpt
          </button>
          <button
            id="mode-camera-btn"
            type="button"
            onClick={() => setNavigationMode(true)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              navigationMode
                ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Camera Orbit Mode (Left-click orbits, Space toggles)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            Orbit
          </button>
        </div>
      </div>

      {/* Center Controls: Undo, Redo, Display Toggles */}
      <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-1">
        <button
          id="undo-btn"
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-md text-xs transition-colors ${
            canUndo
              ? 'text-zinc-300 hover:text-white hover:bg-zinc-800 active:bg-zinc-700'
              : 'text-zinc-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          id="redo-btn"
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-md text-xs transition-colors ${
            canRedo
              ? 'text-zinc-300 hover:text-white hover:bg-zinc-800 active:bg-zinc-700'
              : 'text-zinc-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-0.5" />

        {/* Wireframe Toggle */}
        <button
          id="wireframe-toggle-btn"
          type="button"
          onClick={() => setSettings((prev) => ({ ...prev, wireframe: !prev.wireframe }))}
          className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
            settings.wireframe
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          title="Toggle Wireframe (Z)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Wireframe</span>
        </button>

        {/* Grid Toggle */}
        <button
          id="grid-toggle-btn"
          type="button"
          onClick={() => setSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
          className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
            settings.showGrid
              ? 'bg-zinc-800 text-zinc-200'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle Floor Grid"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Grid</span>
        </button>

        {/* Reset Camera */}
        <button
          id="reset-cam-btn"
          type="button"
          onClick={onResetView}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Right Stats & Export Action */}
      <div className="flex items-center gap-3">
        {/* Game Engine LOD & Triangles Badge */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs">
          <div className="text-zinc-400 flex items-center gap-1">
            <span className="text-zinc-500">Tris:</span>
            <span className="font-mono text-zinc-200 font-semibold">{meshStats.triangles.toLocaleString()}</span>
          </div>
          <div className="h-3 w-px bg-zinc-800" />
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${meshStats.lodBadgeColor}`}>
            {meshStats.lodTier}
          </span>
        </div>

        {/* Shortcuts Help */}
        <button
          id="shortcuts-btn"
          type="button"
          onClick={onOpenShortcutsModal}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-lg transition-colors"
          title="Keyboard Shortcuts & Gestures"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Export Button */}
        <button
          id="open-export-btn"
          type="button"
          onClick={onOpenExportModal}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          Export Asset
        </button>
      </div>
    </header>
  );
};

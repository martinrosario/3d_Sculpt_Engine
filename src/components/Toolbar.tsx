import React from 'react';
import { 
  Paintbrush, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Move, 
  Palette, 
  Layers, 
  SplitSquareVertical, 
  CircleDot, 
  Minus,
  Plus
} from 'lucide-react';
import { BrushSettings, FalloffType, SculptTool } from '../types';

interface ToolbarProps {
  settings: BrushSettings;
  setSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  navigationMode: boolean;
  setNavigationMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const TOOLS: { id: SculptTool; label: string; icon: React.ReactNode; shortcut: string; desc: string }[] = [
  { id: 'clay', label: 'Clay', icon: <Layers className="w-4 h-4" />, shortcut: '1', desc: 'Builds up or carves geometry with smooth surface buildup' },
  { id: 'smooth', label: 'Smooth', icon: <Sparkles className="w-4 h-4" />, shortcut: '2 / Shift', desc: 'Relaxes mesh topology and polishes sharp creases' },
  { id: 'inflate', label: 'Inflate', icon: <Maximize2 className="w-4 h-4" />, shortcut: '3', desc: 'Expands or deflates volume along surface normals' },
  { id: 'flatten', label: 'Flatten', icon: <Minus className="w-4 h-4" />, shortcut: '4', desc: 'Projects vertices onto planar tangent surface' },
  { id: 'pinch', label: 'Pinch', icon: <Minimize2 className="w-4 h-4" />, shortcut: '5', desc: 'Pulls vertices inward to sharpen seams and creases' },
  { id: 'grab', label: 'Grab', icon: <Move className="w-4 h-4" />, shortcut: '6', desc: 'Pulls and poses silhouettes along camera plane' },
  { id: 'paint', label: 'Paint', icon: <Palette className="w-4 h-4" />, shortcut: '7', desc: 'Bakes vertex colors directly onto mesh geometry' },
];

const GAME_PALETTE = [
  { name: 'Clay Light', hex: '#ebe7df' },
  { name: 'Skin Fair', hex: '#fcd5b5' },
  { name: 'Skin Olive', hex: '#c68642' },
  { name: 'Armor Steel', hex: '#94a3b8' },
  { name: 'Bronze Gold', hex: '#d97706' },
  { name: 'Dungeon Stone', hex: '#475569' },
  { name: 'Forest Moss', hex: '#16a34a' },
  { name: 'Dragon Blood', hex: '#dc2626' },
  { name: 'Mana Blue', hex: '#0284c7' },
  { name: 'Obsidian Dark', hex: '#1e293b' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  settings,
  setSettings,
  navigationMode,
  setNavigationMode,
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none select-none">
      {/* Main Tool Selector Stack */}
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 pointer-events-auto w-12 items-center">
        {TOOLS.map((t) => {
          const isActive = settings.tool === t.id && !navigationMode;
          return (
            <button
              key={t.id}
              id={`tool-btn-${t.id}`}
              type="button"
              onClick={() => {
                setSettings((prev) => ({ ...prev, tool: t.id }));
                setNavigationMode(false);
              }}
              className={`relative group w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold scale-105'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
              title={`${t.label} Tool (${t.shortcut})\n${t.desc}`}
            >
              {t.icon}
              {/* Shortcut badge */}
              <span
                className={`absolute bottom-0.5 right-1 text-[9px] font-mono leading-none ${
                  isActive ? 'text-zinc-950 font-bold' : 'text-zinc-500'
                }`}
              >
                {t.shortcut.charAt(0)}
              </span>

              {/* Tooltip flyout on hover */}
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl text-xs text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                  {t.label}
                  <span className="text-[10px] text-amber-400 font-mono bg-zinc-800 px-1 rounded">
                    {t.shortcut}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 max-w-48 text-wrap mt-0.5">{t.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating Brush Property Sliders Card */}
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 rounded-xl p-3 shadow-2xl pointer-events-auto w-56 flex flex-col gap-2.5 text-xs">
        {/* Active Tool Label & Invert Switch */}
        <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
          <span className="font-bold text-zinc-200 capitalize flex items-center gap-1">
            <span className="text-amber-400 font-mono text-[11px]">•</span>
            {settings.tool} Brush
          </span>

          {settings.tool !== 'smooth' && settings.tool !== 'paint' && (
            <button
              id="brush-invert-btn"
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, invert: !prev.invert }))}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border transition-colors flex items-center gap-1 ${
                settings.invert
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
              title="Hold Alt key or click to invert brush (Carve vs Add)"
            >
              {settings.invert ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {settings.invert ? 'Sub (Alt)' : 'Add'}
            </button>
          )}
        </div>

        {/* Radius Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-zinc-400 text-[11px]">
            <span>Radius ([ / ])</span>
            <span className="font-mono text-zinc-200">{settings.radius.toFixed(2)}</span>
          </div>
          <input
            id="brush-radius-slider"
            type="range"
            min={0.05}
            max={1.5}
            step={0.02}
            value={settings.radius}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, radius: parseFloat(e.target.value) }))
            }
            className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Strength Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-zinc-400 text-[11px]">
            <span>Strength</span>
            <span className="font-mono text-zinc-200">{Math.round(settings.strength * 100)}%</span>
          </div>
          <input
            id="brush-strength-slider"
            type="range"
            min={0.05}
            max={1.0}
            step={0.05}
            value={settings.strength}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, strength: parseFloat(e.target.value) }))
            }
            className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Falloff Curve Selector */}
        <div className="flex flex-col gap-1 pt-1 border-t border-zinc-800/60">
          <span className="text-zinc-400 text-[11px]">Falloff Profile</span>
          <div className="grid grid-cols-4 gap-1">
            {(['smooth', 'sharp', 'sphere', 'flat'] as FalloffType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, falloff: f }))}
                className={`py-1 text-[10px] font-medium rounded capitalize transition-colors ${
                  settings.falloff === f
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Symmetry Toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
            <SplitSquareVertical className="w-3.5 h-3.5 text-amber-400" />
            <span>Symmetry (X)</span>
          </div>
          <button
            id="symmetry-toggle-btn"
            type="button"
            onClick={() => setSettings((prev) => ({ ...prev, symmetryX: !prev.symmetryX }))}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
              settings.symmetryX
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
            title="Mirror sculpting across X axis (Hotkey S)"
          >
            {settings.symmetryX ? 'ON (S)' : 'OFF (S)'}
          </button>
        </div>

        {/* Vertex Paint Controls when Paint tool is active */}
        {settings.tool === 'paint' && (
          <div className="flex flex-col gap-1.5 pt-1.5 border-t border-zinc-800/60">
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span className="flex items-center gap-1">
                <Palette className="w-3 h-3 text-amber-400" />
                Paint Color
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={settings.paintColor}
                  onChange={(e) => setSettings((prev) => ({ ...prev, paintColor: e.target.value }))}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-[10px] text-zinc-400 uppercase">
                  {settings.paintColor}
                </span>
              </div>
            </div>

            {/* Quick Palette Swatches */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {GAME_PALETTE.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, paintColor: p.hex }))}
                  className={`w-full h-5 rounded border transition-all ${
                    settings.paintColor.toLowerCase() === p.hex.toLowerCase()
                      ? 'border-white scale-110 shadow-sm'
                      : 'border-zinc-800 hover:border-zinc-500'
                  }`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

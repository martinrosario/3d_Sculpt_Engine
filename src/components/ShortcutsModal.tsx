import React from 'react';
import { X, Keyboard, Mouse, Sparkles } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: '1 - 7', desc: 'Select Sculpt Tool (Clay, Smooth, Inflate, Flatten, Pinch, Grab, Paint)' },
    { key: 'Shift (Hold)', desc: 'Instantly switches active brush to Smooth tool' },
    { key: 'Alt (Hold)', desc: 'Inverts brush direction (Carve/Subtract instead of Add/Extrude)' },
    { key: '[ / ]', desc: 'Decrease / Increase brush radius' },
    { key: 'S', desc: 'Toggle X-Axis mirror symmetry' },
    { key: 'Z', desc: 'Toggle wireframe overlay' },
    { key: 'Space', desc: 'Toggle between Sculpt Mode and Camera Orbit Mode' },
    { key: 'Ctrl + Z', desc: 'Undo last sculpt stroke' },
    { key: 'Ctrl + Y', desc: 'Redo previously undone stroke' },
  ];

  const MOUSE_ACTIONS = [
    { action: 'Left Click + Drag (on mesh)', desc: 'Apply current sculpting brush or paint onto geometry' },
    { action: 'Right Click + Drag (or Space+Drag)', desc: 'Rotate / Orbit 3D viewport around the model' },
    { action: 'Middle Click + Drag (or Shift+Right Click)', desc: 'Pan camera across 3D viewport' },
    { action: 'Mouse Wheel / Pinch Trackpad', desc: 'Zoom camera in and out' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-zinc-100">Controls & Shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] flex flex-col gap-4 text-xs text-zinc-300">
          {/* Mouse Gestures */}
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-zinc-200 mb-2">
              <Mouse className="w-3.5 h-3.5 text-amber-400" />
              <span>Mouse & Viewport Navigation</span>
            </div>
            <div className="flex flex-col gap-1.5 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
              {MOUSE_ACTIONS.map((m, idx) => (
                <div key={idx} className="flex justify-between items-start gap-3 py-1 border-b border-zinc-800/50 last:border-0">
                  <span className="font-semibold text-zinc-200 shrink-0">{m.action}</span>
                  <span className="text-zinc-400 text-right">{m.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard Hotkeys */}
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-zinc-200 mb-2">
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="flex flex-col gap-1.5 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
              {SHORTCUTS.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-zinc-800/50 last:border-0">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-amber-300 text-[11px] font-bold">
                    {s.key}
                  </span>
                  <span className="text-zinc-400">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400">
            3D Sculpt Engine • Created By: <span className="text-amber-300 font-semibold">Martin Rosario</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

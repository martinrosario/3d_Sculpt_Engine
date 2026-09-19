import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  BrushSettings, 
  ExportFormat, 
  MeshPrimitive, 
  MeshStats 
} from './types';
import { 
  captureSnapshot, 
  createBasePrimitive, 
  decimateGeometry, 
  getMeshStats, 
  restoreSnapshot, 
  subdivideGeometry 
} from './utils/geometryUtils';
import { exportMesh } from './utils/exportUtils';
import { loadGeometryFromFile } from './utils/importUtils';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { Viewport3D } from './components/Viewport3D';
import { RightPanel } from './components/RightPanel';
import { ExportModal } from './components/ExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';

const MAX_HISTORY = 20;

export default function App() {
  // Geometry State
  const [currentPrimitive, setCurrentPrimitive] = useState<MeshPrimitive>('sphere');
  const [geometry, setGeometry] = useState<THREE.BufferGeometry>(() => createBasePrimitive('sphere'));
  const [meshStats, setMeshStats] = useState<MeshStats>(() => getMeshStats(geometry));

  // Brush and Shading Settings
  const [settings, setSettings] = useState<BrushSettings>({
    tool: 'clay',
    radius: 0.35,
    strength: 0.45,
    invert: false,
    falloff: 'smooth',
    symmetryX: true,
    symmetryY: false,
    symmetryZ: false,
    paintColor: '#c68642',
    paintRoughness: 0.5,
    wireframe: false,
    shadingMode: 'matcap',
    matcap: 'redwax',
    showGrid: true,
    showSymmetryPlane: true,
    showStats: true,
    flatShading: false,
    metalness: 0.1,
    roughness: 0.5,
    baseColor: '#ffffff',
  });

  const [navigationMode, setNavigationMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Undo / Redo History Stack
  const historyRef = useRef<{ positions: Float32Array; colors: Float32Array }[]>([captureSnapshot(geometry)]);
  const historyIndexRef = useRef<number>(0);
  const [historyVersion, setHistoryVersion] = useState<number>(0);

  // Active Three.js Mesh Reference for Exporting
  const activeMeshRef = useRef<THREE.Mesh | null>(null);
  const resetCameraFnRef = useRef<(() => void) | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Update stats whenever geometry changes
  const updateStats = useCallback(() => {
    setMeshStats(getMeshStats(geometry));
  }, [geometry]);

  // Stroke lifecycle handlers
  const handleStrokeStart = useCallback(() => {
    // Save snapshot before stroke modifies geometry
    const snapshot = captureSnapshot(geometry);
    // Truncate history past current index
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
    setHistoryVersion((v) => v + 1);
  }, [geometry]);

  const handleStrokeEnd = useCallback(() => {
    updateStats();
  }, [updateStats]);

  const handleMeshModified = useCallback(() => {
    updateStats();
  }, [updateStats]);

  // Undo / Redo execution
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const snapshot = historyRef.current[historyIndexRef.current];
      restoreSnapshot(geometry, snapshot);
      updateStats();
      setHistoryVersion((v) => v + 1);
      showNotification('Undone sculpt stroke', 'info');
    }
  }, [geometry, updateStats]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const snapshot = historyRef.current[historyIndexRef.current];
      restoreSnapshot(geometry, snapshot);
      updateStats();
      setHistoryVersion((v) => v + 1);
      showNotification('Redone sculpt stroke', 'info');
    }
  }, [geometry, updateStats]);

  // Switch Primitive Base Mesh
  const handleChangePrimitive = useCallback((primitive: MeshPrimitive) => {
    geometry.dispose();
    const newGeom = createBasePrimitive(primitive);
    setGeometry(newGeom);
    setCurrentPrimitive(primitive);
    setMeshStats(getMeshStats(newGeom));
    historyRef.current = [captureSnapshot(newGeom)];
    historyIndexRef.current = 0;
    setHistoryVersion((v) => v + 1);
    showNotification(`Loaded ${primitive.replace('_', ' ')} base mesh`, 'success');
  }, [geometry]);

  // Subdivide Mesh (+4x detail)
  const handleSubdivide = useCallback(() => {
    const newGeom = subdivideGeometry(geometry);
    geometry.dispose();
    setGeometry(newGeom);
    setMeshStats(getMeshStats(newGeom));
    historyRef.current = [captureSnapshot(newGeom)];
    historyIndexRef.current = 0;
    setHistoryVersion((v) => v + 1);
    showNotification('Subdivided mesh topology (+4x faces)', 'success');
  }, [geometry]);

  // Decimate Mesh (Game LOD Optimization)
  const handleDecimate = useCallback((ratio: number) => {
    const initialTris = meshStats.triangles;
    const newGeom = decimateGeometry(geometry, ratio);
    geometry.dispose();
    setGeometry(newGeom);
    const newStats = getMeshStats(newGeom);
    setMeshStats(newStats);
    historyRef.current = [captureSnapshot(newGeom)];
    historyIndexRef.current = 0;
    setHistoryVersion((v) => v + 1);
    showNotification(`Optimized for gaming: reduced from ${initialTris.toLocaleString()} to ${newStats.triangles.toLocaleString()} tris`, 'success');
  }, [geometry, meshStats.triangles]);

  // Recalculate Normals (Smooth vs Flat/Faceted)
  const handleRecalculateNormals = useCallback((flat: boolean) => {
    setSettings((prev) => ({ ...prev, flatShading: flat }));
    geometry.computeVertexNormals();
    if (geometry.attributes.normal) geometry.attributes.normal.needsUpdate = true;
    showNotification(flat ? 'Set to Flat / Faceted shading' : 'Set to Smooth normals', 'info');
  }, [geometry]);

  // Center Mesh to Origin
  const handleCenterMesh = useCallback(() => {
    geometry.center();
    // Ground to y=0 bottom
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (box) {
      geometry.translate(0, -box.min.y - 1.0, 0);
    }
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    if (geometry.attributes.position) geometry.attributes.position.needsUpdate = true;
    updateStats();
    showNotification('Centered & grounded mesh to 3D origin', 'info');
  }, [geometry, updateStats]);

  // Import 3D File (.obj, .gltf, .glb, .stl)
  const handleImportFile = useCallback(async (file: File) => {
    try {
      showNotification(`Importing ${file.name}...`, 'info');
      const newGeom = await loadGeometryFromFile(file);
      geometry.dispose();
      setGeometry(newGeom);
      setMeshStats(getMeshStats(newGeom));
      historyRef.current = [captureSnapshot(newGeom)];
      historyIndexRef.current = 0;
      setHistoryVersion((v) => v + 1);
      showNotification(`Successfully imported ${file.name}`, 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to import 3D file';
      showNotification(errorMsg, 'error');
    }
  }, [geometry]);

  // Quick Export Function
  const handleQuickExport = useCallback(async (format: ExportFormat) => {
    if (!activeMeshRef.current) return;
    try {
      const filename = `vertexforge_${currentPrimitive}_asset`;
      const result = await exportMesh(activeMeshRef.current, format, filename);
      showNotification(`Downloaded ${result.filename} (${(result.sizeBytes / 1024).toFixed(1)} KB)`, 'success');
    } catch (err) {
      console.error(err);
      showNotification('Export failed. Please check mesh geometry.', 'error');
    }
  }, [currentPrimitive]);

  // Modal Export Function
  const handleModalExport = useCallback(async (format: ExportFormat, filename: string) => {
    if (!activeMeshRef.current) throw new Error('No active mesh to export');
    return exportMesh(activeMeshRef.current, format, filename);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Number keys 1-7 for tools
      if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        const toolMap: Record<string, BrushSettings['tool']> = {
          '1': 'clay',
          '2': 'smooth',
          '3': 'inflate',
          '4': 'flatten',
          '5': 'pinch',
          '6': 'grab',
          '7': 'paint',
        };
        const selectedTool = toolMap[e.key];
        if (selectedTool) {
          setSettings((prev) => ({ ...prev, tool: selectedTool }));
          setNavigationMode(false);
          showNotification(`Tool: ${selectedTool.toUpperCase()}`, 'info');
        }
        return;
      }

      // Wireframe: Z
      if (e.key.toLowerCase() === 'z') {
        setSettings((prev) => ({ ...prev, wireframe: !prev.wireframe }));
        return;
      }

      // Symmetry: S
      if (e.key.toLowerCase() === 's') {
        setSettings((prev) => {
          const next = !prev.symmetryX;
          showNotification(`X-Symmetry: ${next ? 'ON' : 'OFF'}`, 'info');
          return { ...prev, symmetryX: next };
        });
        return;
      }

      // Radius: [ / ]
      if (e.key === '[') {
        setSettings((prev) => ({ ...prev, radius: Math.max(0.05, prev.radius - 0.05) }));
        return;
      }
      if (e.key === ']') {
        setSettings((prev) => ({ ...prev, radius: Math.min(1.5, prev.radius + 0.05) }));
        return;
      }

      // Space: Toggle Orbit navigation mode
      if (e.code === 'Space') {
        e.preventDefault();
        setNavigationMode((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-950 font-sans antialiased">
      {/* Top Header */}
      <Header
        settings={settings}
        setSettings={setSettings}
        meshStats={meshStats}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetView={() => resetCameraFnRef.current?.()}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        navigationMode={navigationMode}
        setNavigationMode={setNavigationMode}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Floating Sculpt Brushes Toolbar */}
        <Toolbar
          settings={settings}
          setSettings={setSettings}
          navigationMode={navigationMode}
          setNavigationMode={setNavigationMode}
        />

        {/* Center 3D Sculpting Viewport */}
        <main className="flex-1 h-full relative overflow-hidden">
          <Viewport3D
            geometry={geometry}
            settings={settings}
            navigationMode={navigationMode}
            onStrokeStart={handleStrokeStart}
            onStrokeEnd={handleStrokeEnd}
            onMeshModified={handleMeshModified}
            onRegisterResetCamera={(fn) => {
              resetCameraFnRef.current = fn;
            }}
            activeMeshRef={activeMeshRef}
          />

          {/* Floating Toast Notification */}
          {notification && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div
                className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-md border ${
                  notification.type === 'success'
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                    : notification.type === 'error'
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                    : 'bg-zinc-900/90 text-zinc-200 border-zinc-700/80'
                }`}
              >
                {notification.message}
              </div>
            </div>
          )}
        </main>

        {/* Right Inspector & LOD Decimation Sidebar */}
        <RightPanel
          settings={settings}
          setSettings={setSettings}
          meshStats={meshStats}
          currentPrimitive={currentPrimitive}
          onChangePrimitive={handleChangePrimitive}
          onSubdivide={handleSubdivide}
          onDecimate={handleDecimate}
          onRecalculateNormals={handleRecalculateNormals}
          onCenterMesh={handleCenterMesh}
          onImportFile={handleImportFile}
          onQuickExport={handleQuickExport}
          onOpenExportModal={() => setIsExportModalOpen(true)}
        />
      </div>

      {/* Export Asset Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        meshStats={meshStats}
        onExport={handleModalExport}
        onDecimate={handleDecimate}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}

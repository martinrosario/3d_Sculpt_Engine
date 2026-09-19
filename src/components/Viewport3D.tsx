import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BrushSettings, MeshStats } from '../types';
import { applySculptBrush, captureSnapshot } from '../utils/geometryUtils';
import { getMatcapTexture } from '../utils/matcaps';
import { Compass, Maximize, RotateCcw, Video } from 'lucide-react';

interface Viewport3DProps {
  geometry: THREE.BufferGeometry;
  settings: BrushSettings;
  navigationMode: boolean;
  onStrokeStart: () => void;
  onStrokeEnd: () => void;
  onMeshModified: () => void;
  onRegisterResetCamera: (fn: () => void) => void;
  activeMeshRef: React.MutableRefObject<THREE.Mesh | null>;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  geometry,
  settings,
  navigationMode,
  onStrokeStart,
  onStrokeEnd,
  onMeshModified,
  onRegisterResetCamera,
  activeMeshRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.Mesh | null>(null);

  // Brush cursor helpers
  const brushRingRef = useRef<THREE.LineLoop | null>(null);
  const symmRingRef = useRef<THREE.LineLoop | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const symmPlaneRef = useRef<THREE.Mesh | null>(null);

  // Drag tracking for Grab tool
  const isSculptingRef = useRef<boolean>(false);
  const lastHitPointRef = useRef<THREE.Vector3 | null>(null);
  const lastMousePosRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const spacePressedRef = useRef<boolean>(false);

  // Current view label
  const [viewAngleLabel, setViewAngleLabel] = useState<string>('Perspective');

  // Initialize Scene, Camera, Renderer, Controls
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0d12);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 4.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 25;
    controls.minDistance = 0.5;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfffaed, 1.6);
    dirLight1.position.set(4, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa5c4f2, 0.8);
    dirLight2.position.set(-5, -2, -4);
    scene.add(dirLight2);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    // Floor Grid
    const grid = new THREE.GridHelper(10, 20, 0x3f3f46, 0x27272a);
    grid.position.y = -1.6;
    scene.add(grid);
    gridHelperRef.current = grid;

    // Symmetry Plane (translucent X=0 plane)
    const symmGeom = new THREE.PlaneGeometry(4, 4);
    symmGeom.rotateY(Math.PI / 2);
    const symmMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const symmPlane = new THREE.Mesh(symmGeom, symmMat);
    scene.add(symmPlane);
    symmPlaneRef.current = symmPlane;

    // Brush Indicator Rings
    const ringGeom = new THREE.BufferGeometry();
    const ringSegments = 48;
    const ringPositions = new Float32Array((ringSegments + 1) * 3);
    for (let i = 0; i <= ringSegments; i++) {
      const theta = (i / ringSegments) * Math.PI * 2;
      ringPositions[i * 3] = Math.cos(theta);
      ringPositions[i * 3 + 1] = Math.sin(theta);
      ringPositions[i * 3 + 2] = 0;
    }
    ringGeom.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));

    const ringMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    });

    const brushRing = new THREE.LineLoop(ringGeom, ringMat);
    brushRing.visible = false;
    scene.add(brushRing);
    brushRingRef.current = brushRing;

    const symmRingMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      linewidth: 2,
    });
    const symmRing = new THREE.LineLoop(ringGeom.clone(), symmRingMat);
    symmRing.visible = false;
    scene.add(symmRing);
    symmRingRef.current = symmRing;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW === 0 || newH === 0) return;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    });
    resizeObserver.observe(container);

    // Register reset camera
    const resetCamera = () => {
      camera.position.set(0, 1.2, 4.2);
      controls.target.set(0, 0, 0);
      controls.update();
      setViewAngleLabel('Perspective');
    };
    onRegisterResetCamera(resetCamera);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Mesh & Materials when geometry or settings change
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove old mesh & wireframe
    if (meshRef.current) {
      scene.remove(meshRef.current);
      if (meshRef.current.material instanceof THREE.Material) {
        meshRef.current.material.dispose();
      }
    }
    if (wireframeMeshRef.current) {
      scene.remove(wireframeMeshRef.current);
      if (wireframeMeshRef.current.material instanceof THREE.Material) {
        wireframeMeshRef.current.material.dispose();
      }
    }

    // Determine material according to shadingMode
    let material: THREE.Material;

    switch (settings.shadingMode) {
      case 'matcap': {
        const matcapTex = getMatcapTexture(settings.matcap);
        material = new THREE.MeshMatcapMaterial({
          matcap: matcapTex,
          flatShading: settings.flatShading,
        });
        break;
      }
      case 'pbr': {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(settings.baseColor),
          roughness: settings.roughness,
          metalness: settings.metalness,
          flatShading: settings.flatShading,
          vertexColors: true,
        });
        break;
      }
      case 'normal': {
        material = new THREE.MeshNormalMaterial({
          flatShading: settings.flatShading,
        });
        break;
      }
      case 'wireframe': {
        material = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          wireframe: true,
        });
        break;
      }
      default:
        material = new THREE.MeshMatcapMaterial({
          matcap: getMatcapTexture('clay'),
          flatShading: settings.flatShading,
        });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;
    activeMeshRef.current = mesh;

    // Overlay wireframe if wireframe toggle is active
    if (settings.wireframe && settings.shadingMode !== 'wireframe') {
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
        depthTest: true,
      });
      const wireMesh = new THREE.Mesh(geometry, wireMat);
      scene.add(wireMesh);
      wireframeMeshRef.current = wireMesh;
    }
  }, [geometry, settings.shadingMode, settings.matcap, settings.wireframe, settings.flatShading, settings.roughness, settings.metalness, settings.baseColor]);

  // Update Grid and Symmetry Plane Visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = settings.showGrid;
    }
    if (symmPlaneRef.current) {
      symmPlaneRef.current.visible = settings.symmetryX;
    }
  }, [settings.showGrid, settings.symmetryX]);

  // View Angles Camera Positioning
  const setCameraView = (view: 'front' | 'back' | 'top' | 'right' | 'perspective') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    switch (view) {
      case 'front':
        cam.position.set(0, 0, 4.2);
        setViewAngleLabel('Front (Z+)');
        break;
      case 'back':
        cam.position.set(0, 0, -4.2);
        setViewAngleLabel('Back (Z-)');
        break;
      case 'top':
        cam.position.set(0, 4.2, 0.001);
        setViewAngleLabel('Top (Y+)');
        break;
      case 'right':
        cam.position.set(4.2, 0, 0);
        setViewAngleLabel('Right (X+)');
        break;
      case 'perspective':
        cam.position.set(2.5, 2.0, 3.2);
        setViewAngleLabel('Perspective 3/4');
        break;
    }
    ctrl.target.set(0, 0, 0);
    ctrl.update();
  };

  // Keyboard modifiers (Shift, Alt, Space, [ / ])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Raycasting and Brush Cursor Alignment
  const updateBrushCursor = (hitPoint: THREE.Vector3, hitNormal: THREE.Vector3) => {
    if (!brushRingRef.current) return;
    const ring = brushRingRef.current;
    ring.visible = true;
    ring.position.copy(hitPoint).addScaledVector(hitNormal, 0.005);
    ring.scale.set(settings.radius, settings.radius, settings.radius);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hitNormal);

    if (symmRingRef.current && settings.symmetryX) {
      const symmRing = symmRingRef.current;
      symmRing.visible = true;
      const symmPoint = new THREE.Vector3(-hitPoint.x, hitPoint.y, hitPoint.z);
      const symmNormal = new THREE.Vector3(-hitNormal.x, hitNormal.y, hitNormal.z);
      symmRing.position.copy(symmPoint).addScaledVector(symmNormal, 0.005);
      symmRing.scale.set(settings.radius, settings.radius, settings.radius);
      symmRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), symmNormal);
    } else if (symmRingRef.current) {
      symmRingRef.current.visible = false;
    }
  };

  const hideBrushCursor = () => {
    if (brushRingRef.current) brushRingRef.current.visible = false;
    if (symmRingRef.current) symmRingRef.current.visible = false;
  };

  // Pointer Handlers for Interactive Sculpting
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !meshRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseRef.current.set(x, y);

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(meshRef.current, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 0, 1);
      updateBrushCursor(hit.point, hitNormal);

      // Continuous Sculpting while holding left click
      if (isSculptingRef.current && !navigationMode && !spacePressedRef.current && e.buttons === 1) {
        let dragVector: THREE.Vector3 | undefined;
        if (settings.tool === 'grab' && lastHitPointRef.current) {
          dragVector = hit.point.clone().sub(lastHitPointRef.current);
        }

        const effectiveTool = e.shiftKey ? 'smooth' : settings.tool;
        const effectiveInvert = e.altKey ? !settings.invert : settings.invert;

        // Primary brush pass
        applySculptBrush(
          geometry,
          effectiveTool,
          hit.point,
          hitNormal,
          settings.radius,
          settings.strength,
          settings.falloff,
          effectiveInvert,
          settings.paintColor,
          dragVector
        );

        // Symmetry brush pass
        if (settings.symmetryX) {
          const symmHitPoint = new THREE.Vector3(-hit.point.x, hit.point.y, hit.point.z);
          const symmHitNormal = new THREE.Vector3(-hitNormal.x, hitNormal.y, hitNormal.z);
          const symmDrag = dragVector ? new THREE.Vector3(-dragVector.x, dragVector.y, dragVector.z) : undefined;
          applySculptBrush(
            geometry,
            effectiveTool,
            symmHitPoint,
            symmHitNormal,
            settings.radius,
            settings.strength,
            settings.falloff,
            effectiveInvert,
            settings.paintColor,
            symmDrag
          );
        }

        lastHitPointRef.current = hit.point.clone();
      }
    } else {
      hideBrushCursor();
    }

    lastMousePosRef.current.set(e.clientX, e.clientY);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle Primary Left Click (button === 0) for sculpting
    if (e.button !== 0) return;

    // If in Orbit navigation mode or user holds Space, let OrbitControls handle it
    if (navigationMode || spacePressedRef.current) return;

    if (!containerRef.current || !cameraRef.current || !meshRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseRef.current.set(x, y);

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(meshRef.current, false);

    if (intersects.length > 0) {
      // User clicked on the mesh: Disable OrbitControls to sculpt smoothly
      if (controlsRef.current) controlsRef.current.enabled = false;
      isSculptingRef.current = true;
      onStrokeStart();

      const hit = intersects[0];
      const hitNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 0, 1);
      lastHitPointRef.current = hit.point.clone();

      const effectiveTool = e.shiftKey ? 'smooth' : settings.tool;
      const effectiveInvert = e.altKey ? !settings.invert : settings.invert;

      // Apply initial sculpt stroke step
      applySculptBrush(
        geometry,
        effectiveTool,
        hit.point,
        hitNormal,
        settings.radius,
        settings.strength,
        settings.falloff,
        effectiveInvert,
        settings.paintColor
      );

      if (settings.symmetryX) {
        const symmHitPoint = new THREE.Vector3(-hit.point.x, hit.point.y, hit.point.z);
        const symmHitNormal = new THREE.Vector3(-hitNormal.x, hitNormal.y, hitNormal.z);
        applySculptBrush(
          geometry,
          effectiveTool,
          symmHitPoint,
          symmHitNormal,
          settings.radius,
          settings.strength,
          settings.falloff,
          effectiveInvert,
          settings.paintColor
        );
      }
    } else {
      // Clicked outside the mesh in empty space: allow camera orbit even in sculpt mode!
      if (controlsRef.current) controlsRef.current.enabled = true;
    }
  };

  const handlePointerUp = () => {
    if (isSculptingRef.current) {
      isSculptingRef.current = false;
      lastHitPointRef.current = null;
      onStrokeEnd();
      onMeshModified();
    }
    // Re-enable OrbitControls
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  const handlePointerLeave = () => {
    hideBrushCursor();
    if (isSculptingRef.current) {
      isSculptingRef.current = false;
      lastHitPointRef.current = null;
      onStrokeEnd();
      onMeshModified();
    }
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu so Right Click orbits smoothly
      className="relative w-full h-full overflow-hidden bg-zinc-950 cursor-crosshair select-none"
    >
      {/* 3D View Angle & Orientation Widget (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
        <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-300 pointer-events-auto shadow-lg flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>{viewAngleLabel}</span>
        </div>

        {/* Quick View Axis Buttons */}
        <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 p-1 rounded-lg pointer-events-auto flex items-center gap-1 shadow-lg text-[10px] font-semibold text-zinc-400">
          <button
            type="button"
            onClick={() => setCameraView('front')}
            className="px-1.5 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
            title="Front View (Z+)"
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setCameraView('right')}
            className="px-1.5 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
            title="Right Side View (X+)"
          >
            Right
          </button>
          <button
            type="button"
            onClick={() => setCameraView('top')}
            className="px-1.5 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
            title="Top View (Y+)"
          >
            Top
          </button>
          <button
            type="button"
            onClick={() => setCameraView('perspective')}
            className="px-1.5 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
            title="Perspective View"
          >
            3/4
          </button>
        </div>
      </div>

      {/* Bottom Floating Navigation Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-zinc-950/70 backdrop-blur-sm border border-zinc-800/80 px-3 py-1 rounded-full text-[11px] text-zinc-400 flex items-center gap-3 shadow-xl">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <strong className="text-zinc-200 font-medium">L-Click:</strong> Sculpt
          </span>
          <span className="text-zinc-700">|</span>
          <span>
            <strong className="text-zinc-200 font-medium">R-Click:</strong> Orbit
          </span>
          <span className="text-zinc-700">|</span>
          <span>
            <strong className="text-zinc-200 font-medium">Mid-Click:</strong> Pan
          </span>
          <span className="text-zinc-700">|</span>
          <span>
            <strong className="text-zinc-200 font-medium">Shift:</strong> Smooth
          </span>
          <span className="text-zinc-700">|</span>
          <span>
            <strong className="text-zinc-200 font-medium">Alt:</strong> Carve
          </span>
        </div>
      </div>
    </div>
  );
};

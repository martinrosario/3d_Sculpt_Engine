import * as THREE from 'three';
import { FalloffType, MeshPrimitive, MeshStats, SculptTool } from '../types';

/**
 * Creates sculptable base primitives with uniform topology.
 */
export function createBasePrimitive(type: MeshPrimitive): THREE.BufferGeometry {
  let geometry: THREE.BufferGeometry;

  switch (type) {
    case 'sphere':
      // Icosahedron with 4 subdivisions gives uniform triangular faces
      geometry = new THREE.IcosahedronGeometry(1.5, 4);
      break;

    case 'cube': {
      // Subdivided box
      geometry = new THREE.BoxGeometry(2.2, 2.2, 2.2, 22, 22, 22);
      break;
    }

    case 'cylinder':
      geometry = new THREE.CylinderGeometry(1.0, 1.0, 2.6, 32, 24);
      break;

    case 'torus':
      geometry = new THREE.TorusGeometry(1.2, 0.45, 24, 48);
      break;

    case 'capsule':
      geometry = new THREE.CapsuleGeometry(0.8, 1.4, 24, 32);
      break;

    case 'terrain': {
      geometry = new THREE.PlaneGeometry(4, 4, 38, 38);
      geometry.rotateX(-Math.PI / 2);
      break;
    }

    case 'character_head': {
      // Stylized game character mannequin head
      const headGeom = new THREE.IcosahedronGeometry(1.3, 4);
      const pos = headGeom.attributes.position;
      // Deform sphere into cranial skull and jaw shape
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Elongate jaw
        if (y < 0) {
          x *= 0.82;
          z *= 0.9;
          y *= 1.25;
          // Chin forward
          if (y < -0.6) {
            z += 0.22;
          }
        } else {
          // Cranium wider at back
          if (z < 0) {
            x *= 1.08;
            y *= 1.05;
          }
        }
        // Eye sockets indentation
        if (y > -0.1 && y < 0.35 && z > 0.6 && Math.abs(x) > 0.25 && Math.abs(x) < 0.75) {
          z *= 0.88;
        }

        pos.setXYZ(i, x, y, z);
      }
      geometry = headGeom;
      break;
    }

    case 'fantasy_dagger': {
      // Stylized game prop dagger
      const bladeGeom = new THREE.BoxGeometry(0.4, 3.0, 0.15, 6, 28, 4);
      const pos = bladeGeom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Blade taper to tip
        if (y > 0) {
          const t = y / 1.5;
          x *= (1 - t * 0.75);
          z *= (1 - t * 0.6);
        } else {
          // Handle
          x *= 0.6;
          z *= 0.8;
        }
        pos.setXYZ(i, x, y, z);
      }
      geometry = bladeGeom;
      break;
    }

    default:
      geometry = new THREE.IcosahedronGeometry(1.5, 4);
  }

  // Ensure index exists
  if (!geometry.index) {
    const nonIndexed = geometry.toNonIndexed();
    geometry.dispose();
    geometry = nonIndexed;
  }

  // Ensure vertex colors exist
  initVertexColors(geometry);

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Initializes white/clay vertex colors if not already present.
 */
export function initVertexColors(geometry: THREE.BufferGeometry) {
  const count = geometry.attributes.position.count;
  if (!geometry.attributes.color || geometry.attributes.color.count !== count) {
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      colors[i] = 0.92; // warm neutral light
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
}

/**
 * Calculate falloff factor based on distance from brush center.
 */
export function calculateFalloff(dist: number, radius: number, type: FalloffType): number {
  if (dist >= radius) return 0;
  const t = dist / radius; // 0 at center, 1 at boundary

  switch (type) {
    case 'smooth':
      // Cosine smooth falloff
      return 0.5 * (1 + Math.cos(Math.PI * t));
    case 'sharp':
      // Quadratic sharp drop
      return Math.pow(1 - t, 2);
    case 'sphere':
      // Spherical dome falloff
      return Math.sqrt(Math.max(0, 1 - t * t));
    case 'flat':
      return 1.0;
    default:
      return 0.5 * (1 + Math.cos(Math.PI * t));
  }
}

/**
 * Performs sculpt displacement or vertex painting on a geometry.
 */
export function applySculptBrush(
  geometry: THREE.BufferGeometry,
  tool: SculptTool,
  hitPoint: THREE.Vector3,
  hitNormal: THREE.Vector3,
  brushRadius: number,
  brushStrength: number,
  falloffType: FalloffType,
  invert: boolean,
  paintColorHex: string,
  dragVector?: THREE.Vector3
): boolean {
  const posAttr = geometry.attributes.position;
  const normAttr = geometry.attributes.normal;
  const colorAttr = geometry.attributes.color;

  if (!posAttr) return false;

  const count = posAttr.count;
  const radiusSq = brushRadius * brushRadius;
  let modified = false;

  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  // For Flatten brush: Plane defined by hitPoint and hitNormal
  const plane = new THREE.Plane();
  plane.setFromNormalAndCoplanarPoint(hitNormal, hitPoint);

  // For Paint brush
  const targetColor = new THREE.Color(paintColorHex);

  // For Smooth brush: calculate local centroid of affected vertices
  let centroid = new THREE.Vector3();
  let affectedCount = 0;
  if (tool === 'smooth') {
    for (let i = 0; i < count; i++) {
      v.fromBufferAttribute(posAttr, i);
      if (v.distanceToSquared(hitPoint) <= radiusSq) {
        centroid.add(v);
        affectedCount++;
      }
    }
    if (affectedCount > 0) {
      centroid.divideScalar(affectedCount);
    }
  }

  const sign = invert ? -1 : 1;
  const effectiveStrength = brushStrength * sign;

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(posAttr, i);
    const distSq = v.distanceToSquared(hitPoint);

    if (distSq > radiusSq) continue;

    const dist = Math.sqrt(distSq);
    const factor = calculateFalloff(dist, brushRadius, falloffType);
    if (factor <= 0) continue;

    modified = true;

    if (normAttr) {
      n.fromBufferAttribute(normAttr, i);
    } else {
      n.copy(hitNormal);
    }

    switch (tool) {
      case 'clay': {
        // Clay / Push-Pull along hit normal
        const displacement = hitNormal.clone().multiplyScalar(factor * effectiveStrength * 0.15 * brushRadius);
        v.add(displacement);
        posAttr.setXYZ(i, v.x, v.y, v.z);
        break;
      }

      case 'inflate': {
        // Inflate / Deflate along vertex normal
        const displacement = n.clone().multiplyScalar(factor * effectiveStrength * 0.12 * brushRadius);
        v.add(displacement);
        posAttr.setXYZ(i, v.x, v.y, v.z);
        break;
      }

      case 'smooth': {
        // Laplacian relaxation towards neighbor centroid
        if (affectedCount > 0) {
          const lerpFactor = factor * brushStrength * 0.45;
          v.lerp(centroid, lerpFactor);
          posAttr.setXYZ(i, v.x, v.y, v.z);
        }
        break;
      }

      case 'flatten': {
        // Project onto tangent plane
        const distToPlane = plane.distanceToPoint(v);
        const lerpFactor = factor * brushStrength * 0.5;
        // Move towards projected point
        const projected = v.clone().sub(hitNormal.clone().multiplyScalar(distToPlane));
        v.lerp(projected, lerpFactor);
        posAttr.setXYZ(i, v.x, v.y, v.z);
        break;
      }

      case 'pinch': {
        // Pull inwards towards hit point (or push away if inverted)
        const toCenter = hitPoint.clone().sub(v);
        const pinchMove = toCenter.multiplyScalar(factor * effectiveStrength * 0.25);
        v.add(pinchMove);
        posAttr.setXYZ(i, v.x, v.y, v.z);
        break;
      }

      case 'grab': {
        // Displace along drag vector
        if (dragVector && dragVector.lengthSq() > 0) {
          const move = dragVector.clone().multiplyScalar(factor * brushStrength);
          v.add(move);
          posAttr.setXYZ(i, v.x, v.y, v.z);
        }
        break;
      }

      case 'paint': {
        // Vertex coloring
        if (colorAttr) {
          const curR = colorAttr.getX(i);
          const curG = colorAttr.getY(i);
          const curB = colorAttr.getZ(i);

          const blend = factor * brushStrength * 0.4;
          const newR = curR + (targetColor.r - curR) * blend;
          const newG = curG + (targetColor.g - curG) * blend;
          const newB = curB + (targetColor.b - curB) * blend;

          colorAttr.setXYZ(i, newR, newG, newB);
        }
        break;
      }
    }
  }

  if (modified) {
    if (tool === 'paint') {
      if (colorAttr) colorAttr.needsUpdate = true;
    } else {
      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();
      if (normAttr) normAttr.needsUpdate = true;
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }
  }

  return modified;
}

/**
 * Computes polygon and triangle stats and categorizes LOD readiness for gaming engines.
 */
export function getMeshStats(geometry: THREE.BufferGeometry): MeshStats {
  const vertices = geometry.attributes.position ? geometry.attributes.position.count : 0;
  let triangles = 0;

  if (geometry.index) {
    triangles = Math.floor(geometry.index.count / 3);
  } else if (geometry.attributes.position) {
    triangles = Math.floor(geometry.attributes.position.count / 3);
  }

  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }

  const box = geometry.boundingBox || new THREE.Box3();
  const size = new THREE.Vector3();
  box.getSize(size);

  let lodTier: MeshStats['lodTier'] = 'Mobile / Web';
  let lodBadgeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';

  if (triangles <= 3000) {
    lodTier = 'Mobile / Web';
    lodBadgeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
  } else if (triangles <= 15000) {
    lodTier = 'Indie PC';
    lodBadgeColor = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';
  } else if (triangles <= 50000) {
    lodTier = 'Console / AAA';
    lodBadgeColor = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
  } else {
    lodTier = 'High-Poly Sculpt';
    lodBadgeColor = 'text-rose-400 bg-rose-950/40 border-rose-500/30';
  }

  return {
    vertices,
    triangles,
    bounds: {
      width: Number(size.x.toFixed(2)),
      height: Number(size.y.toFixed(2)),
      depth: Number(size.z.toFixed(2)),
    },
    lodTier,
    lodBadgeColor,
  };
}

/**
 * Subdivides geometry (each triangle into 4) to increase sculpt resolution.
 */
export function subdivideGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const nonIndexed = geometry.toNonIndexed();
  const posAttr = nonIndexed.attributes.position;
  const colAttr = nonIndexed.attributes.color;
  const count = posAttr.count;

  // For each triangle (3 vertices), produce 4 sub-triangles (12 vertices)
  const newCount = count * 4;
  const newPositions = new Float32Array(newCount * 3);
  const newColors = new Float32Array(newCount * 3);

  let outIdx = 0;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const bc = new THREE.Vector3();
  const ca = new THREE.Vector3();

  const caColor = new THREE.Color();
  const cbColor = new THREE.Color();
  const ccColor = new THREE.Color();
  const cabColor = new THREE.Color();
  const cbcColor = new THREE.Color();
  const ccaColor = new THREE.Color();

  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(posAttr, i);
    b.fromBufferAttribute(posAttr, i + 1);
    c.fromBufferAttribute(posAttr, i + 2);

    ab.addVectors(a, b).multiplyScalar(0.5);
    bc.addVectors(b, c).multiplyScalar(0.5);
    ca.addVectors(c, a).multiplyScalar(0.5);

    if (colAttr) {
      caColor.fromBufferAttribute(colAttr, i);
      cbColor.fromBufferAttribute(colAttr, i + 1);
      ccColor.fromBufferAttribute(colAttr, i + 2);

      cabColor.copy(caColor).lerp(cbColor, 0.5);
      cbcColor.copy(cbColor).lerp(ccColor, 0.5);
      ccaColor.copy(ccColor).lerp(caColor, 0.5);
    } else {
      caColor.set(0.92, 0.92, 0.92);
      cbColor.set(0.92, 0.92, 0.92);
      ccColor.set(0.92, 0.92, 0.92);
      cabColor.set(0.92, 0.92, 0.92);
      cbcColor.set(0.92, 0.92, 0.92);
      ccaColor.set(0.92, 0.92, 0.92);
    }

    // 4 triangles:
    // 1: a, ab, ca
    // 2: ab, b, bc
    // 3: bc, c, ca
    // 4: ab, bc, ca

    const subTris = [
      [a, ab, ca, caColor, cabColor, ccaColor],
      [ab, b, bc, cabColor, cbColor, cbcColor],
      [bc, c, ca, cbcColor, ccColor, ccaColor],
      [ab, bc, ca, cabColor, cbcColor, ccaColor],
    ];

    for (const tri of subTris) {
      for (let j = 0; j < 3; j++) {
        const p = tri[j] as THREE.Vector3;
        const clr = tri[j + 3] as THREE.Color;

        newPositions[outIdx * 3] = p.x;
        newPositions[outIdx * 3 + 1] = p.y;
        newPositions[outIdx * 3 + 2] = p.z;

        newColors[outIdx * 3] = clr.r;
        newColors[outIdx * 3 + 1] = clr.g;
        newColors[outIdx * 3 + 2] = clr.b;

        outIdx++;
      }
    }
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
  result.setAttribute('color', new THREE.BufferAttribute(newColors, 3));
  result.computeVertexNormals();
  result.computeBoundingBox();
  result.computeBoundingSphere();

  nonIndexed.dispose();
  return result;
}

/**
 * Decimates/Optimizes mesh for game engines using spatial vertex clustering.
 * Target ratio: 0.1 to 0.9 (e.g. 0.5 reduces poly count by ~50%).
 */
export function decimateGeometry(geometry: THREE.BufferGeometry, targetRatio: number): THREE.BufferGeometry {
  const nonIndexed = geometry.toNonIndexed();
  const posAttr = nonIndexed.attributes.position;
  const colAttr = nonIndexed.attributes.color;
  const count = posAttr.count;

  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const box = geometry.boundingBox || new THREE.Box3();
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 0.1);

  // Cell size inversely proportional to target ratio and triangle count
  // Ratio 0.25 -> coarser grid, Ratio 0.75 -> finer grid
  const initialTriangles = count / 3;
  const targetTris = Math.max(100, Math.floor(initialTriangles * targetRatio));
  const estimatedClusterDim = Math.cbrt(targetTris * 1.8);
  const cellSize = Math.max(0.015, maxDim / estimatedClusterDim);

  const clusterMap = new Map<string, {
    index: number;
    posSum: THREE.Vector3;
    colSum: THREE.Vector3;
    count: number;
  }>();

  const vertexClusterIndices = new Int32Array(count);
  const clusterVertices: THREE.Vector3[] = [];
  const clusterColors: THREE.Vector3[] = [];

  const v = new THREE.Vector3();
  const c = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(posAttr, i);
    if (colAttr) {
      c.fromBufferAttribute(colAttr, i);
    } else {
      c.set(0.92, 0.92, 0.92);
    }

    const gx = Math.floor(v.x / cellSize);
    const gy = Math.floor(v.y / cellSize);
    const gz = Math.floor(v.z / cellSize);
    const key = `${gx},${gy},${gz}`;

    let cluster = clusterMap.get(key);
    if (!cluster) {
      const newIdx = clusterVertices.length;
      cluster = {
        index: newIdx,
        posSum: new THREE.Vector3(),
        colSum: new THREE.Vector3(),
        count: 0,
      };
      clusterMap.set(key, cluster);
      clusterVertices.push(new THREE.Vector3());
      clusterColors.push(new THREE.Vector3());
    }

    cluster.posSum.add(v);
    cluster.colSum.add(c);
    cluster.count++;
    vertexClusterIndices[i] = cluster.index;
  }

  // Calculate cluster centers
  clusterMap.forEach((cluster) => {
    const avgPos = cluster.posSum.divideScalar(cluster.count);
    const avgCol = cluster.colSum.divideScalar(cluster.count);
    clusterVertices[cluster.index].copy(avgPos);
    clusterColors[cluster.index].copy(avgCol);
  });

  // Rebuild triangles without degenerates
  const indices: number[] = [];
  for (let i = 0; i < count; i += 3) {
    const i0 = vertexClusterIndices[i];
    const i1 = vertexClusterIndices[i + 1];
    const i2 = vertexClusterIndices[i + 2];

    // Discard collapsed triangles where 2 or more vertices share the same cluster
    if (i0 !== i1 && i1 !== i2 && i2 !== i0) {
      indices.push(i0, i1, i2);
    }
  }

  // If over-collapsed, fallback to nonIndexed
  if (indices.length < 30) {
    nonIndexed.dispose();
    return geometry.clone();
  }

  // Build packed indexed buffer
  const outPositions = new Float32Array(clusterVertices.length * 3);
  const outColors = new Float32Array(clusterColors.length * 3);

  for (let i = 0; i < clusterVertices.length; i++) {
    outPositions[i * 3] = clusterVertices[i].x;
    outPositions[i * 3 + 1] = clusterVertices[i].y;
    outPositions[i * 3 + 2] = clusterVertices[i].z;

    outColors[i * 3] = clusterColors[i].x;
    outColors[i * 3 + 1] = clusterColors[i].y;
    outColors[i * 3 + 2] = clusterColors[i].z;
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.BufferAttribute(outPositions, 3));
  result.setAttribute('color', new THREE.BufferAttribute(outColors, 3));
  result.setIndex(indices);
  result.computeVertexNormals();
  result.computeBoundingBox();
  result.computeBoundingSphere();

  nonIndexed.dispose();
  return result;
}

/**
 * Creates deep snapshot of geometry for Undo/Redo.
 */
export function captureSnapshot(geometry: THREE.BufferGeometry): { positions: Float32Array; colors: Float32Array } {
  const pos = geometry.attributes.position.array as Float32Array;
  const col = geometry.attributes.color ? (geometry.attributes.color.array as Float32Array) : new Float32Array(pos.length);
  return {
    positions: new Float32Array(pos),
    colors: new Float32Array(col),
  };
}

/**
 * Restores geometry from snapshot.
 */
export function restoreSnapshot(geometry: THREE.BufferGeometry, snapshot: { positions: Float32Array; colors: Float32Array }) {
  const posAttr = geometry.attributes.position;
  const colAttr = geometry.attributes.color;

  if (posAttr && posAttr.array.length === snapshot.positions.length) {
    (posAttr.array as Float32Array).set(snapshot.positions);
    posAttr.needsUpdate = true;
  }

  if (colAttr && colAttr.array.length === snapshot.colors.length) {
    (colAttr.array as Float32Array).set(snapshot.colors);
    colAttr.needsUpdate = true;
  }

  geometry.computeVertexNormals();
  if (geometry.attributes.normal) geometry.attributes.normal.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

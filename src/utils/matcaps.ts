import * as THREE from 'three';
import { MatCapType } from '../types';

// Cache generated textures so they only render once per type
const matcapCache = new Map<MatCapType, THREE.CanvasTexture>();

export function getMatcapTexture(type: MatCapType): THREE.CanvasTexture {
  if (matcapCache.has(type)) {
    return matcapCache.get(type)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;
  const r = 124;

  // Background
  ctx.fillStyle = '#111115';
  ctx.fillRect(0, 0, 256, 256);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  switch (type) {
    case 'redwax': {
      // Classic ZBrush Red Wax
      const grad = ctx.createRadialGradient(cx - 35, cy - 35, 10, cx, cy, r);
      grad.addColorStop(0, '#f29580');
      grad.addColorStop(0.25, '#d4563f');
      grad.addColorStop(0.65, '#852119');
      grad.addColorStop(0.9, '#420d0b');
      grad.addColorStop(1.0, '#240605');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Rim light highlight
      const rim = ctx.createRadialGradient(cx, cy + 50, 40, cx, cy, r);
      rim.addColorStop(0, 'rgba(0,0,0,0)');
      rim.addColorStop(0.85, 'rgba(255, 170, 150, 0.25)');
      rim.addColorStop(1, 'rgba(255, 210, 190, 0.45)');
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, 256, 256);

      // Specular shine
      const spec = ctx.createRadialGradient(cx - 45, cy - 45, 0, cx - 45, cy - 45, 30);
      spec.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      spec.addColorStop(0.3, 'rgba(255, 230, 220, 0.4)');
      spec.addColorStop(1, 'rgba(255, 200, 180, 0)');
      ctx.fillStyle = spec;
      ctx.fillRect(0, 0, 256, 256);
      break;
    }

    case 'clay': {
      // Sculptor Clay Neutral Gray
      const grad = ctx.createRadialGradient(cx - 30, cy - 30, 15, cx, cy, r);
      grad.addColorStop(0, '#dadbdd');
      grad.addColorStop(0.4, '#a2a5a9');
      grad.addColorStop(0.75, '#5c6066');
      grad.addColorStop(1, '#2c2e33');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Soft top spec
      const spec = ctx.createRadialGradient(cx - 40, cy - 40, 2, cx - 40, cy - 40, 45);
      spec.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      spec.addColorStop(0.5, 'rgba(230, 235, 240, 0.2)');
      spec.addColorStop(1, 'rgba(200, 205, 210, 0)');
      ctx.fillStyle = spec;
      ctx.fillRect(0, 0, 256, 256);
      break;
    }

    case 'bronze': {
      // Sculptor Antique Bronze
      const grad = ctx.createRadialGradient(cx - 35, cy - 35, 10, cx, cy, r);
      grad.addColorStop(0, '#fde68a');
      grad.addColorStop(0.3, '#d97706');
      grad.addColorStop(0.7, '#78350f');
      grad.addColorStop(1, '#261204');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Metallic rim
      const rim = ctx.createRadialGradient(cx + 20, cy + 20, 50, cx, cy, r);
      rim.addColorStop(0, 'rgba(0,0,0,0)');
      rim.addColorStop(0.85, 'rgba(253, 230, 138, 0.3)');
      rim.addColorStop(1, 'rgba(254, 243, 199, 0.6)');
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, 256, 256);

      // Hot specular
      const spec = ctx.createRadialGradient(cx - 45, cy - 45, 0, cx - 45, cy - 45, 25);
      spec.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      spec.addColorStop(0.4, 'rgba(254, 240, 138, 0.5)');
      spec.addColorStop(1, 'rgba(217, 119, 6, 0)');
      ctx.fillStyle = spec;
      ctx.fillRect(0, 0, 256, 256);
      break;
    }

    case 'obsidian': {
      // Sleek Obsidian / Emerald Tech Dark
      const grad = ctx.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, r);
      grad.addColorStop(0, '#34d399');
      grad.addColorStop(0.2, '#059669');
      grad.addColorStop(0.6, '#064e3b');
      grad.addColorStop(0.9, '#022c22');
      grad.addColorStop(1, '#01130e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      const spec = ctx.createRadialGradient(cx - 40, cy - 40, 2, cx - 40, cy - 40, 30);
      spec.addColorStop(0, 'rgba(209, 250, 229, 0.9)');
      spec.addColorStop(0.4, 'rgba(110, 231, 183, 0.3)');
      spec.addColorStop(1, 'rgba(5, 150, 105, 0)');
      ctx.fillStyle = spec;
      ctx.fillRect(0, 0, 256, 256);
      break;
    }

    case 'chrome': {
      // High-Gloss Polished Chrome
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.4, '#94a3b8');
      grad.addColorStop(0.48, '#334155');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(0.52, '#64748b');
      grad.addColorStop(0.8, '#cbd5e1');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Bright Horizon reflection
      const horizon = ctx.createLinearGradient(0, 110, 0, 140);
      horizon.addColorStop(0, 'rgba(255,255,255,0)');
      horizon.addColorStop(0.5, 'rgba(255,255,255,0.75)');
      horizon.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = horizon;
      ctx.fillRect(0, 100, 256, 50);
      break;
    }

    case 'toon': {
      // Cel Shaded Anime / Stylized Game
      const grad = ctx.createRadialGradient(cx - 30, cy - 30, 20, cx, cy, r);
      grad.addColorStop(0, '#e2e8f0');
      grad.addColorStop(0.49, '#e2e8f0');
      grad.addColorStop(0.5, '#94a3b8');
      grad.addColorStop(0.79, '#94a3b8');
      grad.addColorStop(0.8, '#475569');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Cel Specular
      ctx.beginPath();
      ctx.arc(cx - 45, cy - 45, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
    }
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  matcapCache.set(type, texture);
  return texture;
}

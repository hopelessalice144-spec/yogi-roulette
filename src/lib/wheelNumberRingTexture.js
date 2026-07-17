/**
 * High-contrast European wheel number ring — single canvas texture (crisp at all angles).
 */
import * as THREE from 'three';
import { EUROPEAN_SEQUENCE, POCKET_ANGLE, WHEEL } from './wheel.js';
import { getColor } from './math.js';

const SIZE = 1024;
const CENTER = SIZE / 2;

const FELT = {
  red: '#b81828',
  black: '#141820',
  green: '#0a6b42',
};

const INK = {
  red: '#fff8f6',
  black: '#f4f7ff',
  green: '#ecfff6',
};

let cachedTexture = null;

export function createWheelNumberRingTexture() {
  if (cachedTexture) return cachedTexture;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('wheel number canvas unavailable');

  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const outerR = CENTER - 18;
  const innerR = CENTER - 118;

  for (let i = 0; i < EUROPEAN_SEQUENCE.length; i++) {
    const num = EUROPEAN_SEQUENCE[i];
    const felt = getColor(num);
    const start = i * POCKET_ANGLE - POCKET_ANGLE / 2;
    const end = start + POCKET_ANGLE;

    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, outerR, start, end);
    ctx.arc(CENTER, CENTER, innerR, end, start, true);
    ctx.closePath();
    ctx.fillStyle = FELT[felt] ?? FELT.black;
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 85, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const mid = start + POCKET_ANGLE / 2;
    const labelR = (outerR + innerR) * 0.5;
    const lx = CENTER + Math.sin(mid) * labelR;
    const ly = CENTER - Math.cos(mid) * labelR;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(mid);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${num >= 10 ? 26 : 30}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = INK[felt] ?? '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 4;
    ctx.strokeText(String(num), 0, 0);
    ctx.fillText(String(num), 0, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(CENTER, CENTER, innerR - 6, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212, 175, 85, 0.85)';
  ctx.lineWidth = 5;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  cachedTexture = tex;
  return tex;
}

/** Radius matching WHEEL.trackRadius in scene units. */
export function wheelNumberRingRadius() {
  return (WHEEL.trackRadius + WHEEL.pocketInner) * 0.5 + 0.02;
}

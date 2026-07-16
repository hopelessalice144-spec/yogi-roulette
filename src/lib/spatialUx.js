/** UI-UX Pro Max Phase 2 — ref-driven spatial micro-interactions (zero React re-renders). */

export const MAGNET_RADIUS = 35;
export const SPATIAL_SPRING = '0.4s cubic-bezier(0.25, 1, 0.5, 1.25)';

export function applyChipMagnet(chipEl, clientX, clientY, isActive = false) {
  if (!chipEl) return false;

  const chipRect = chipEl.getBoundingClientRect();
  const cx = chipRect.left + chipRect.width / 2;
  const cy = chipRect.top + chipRect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const dist = Math.hypot(dx, dy);

  if (dist >= MAGNET_RADIUS || dist <= 0.5) {
    resetChipMagnet(chipEl);
    return false;
  }

  const magnetBoost = 1 - dist / MAGNET_RADIUS;
  const pull = magnetBoost * (isActive ? 0.62 : 0.52);

  chipEl.style.setProperty('--chip-mx', `${dx * pull}px`);
  chipEl.style.setProperty('--chip-my', `${dy * pull}px`);
  chipEl.style.setProperty('--chip-rot', `${dx * pull * 0.35}deg`);
  chipEl.style.setProperty('--chip-scale', `${1 + magnetBoost * 0.12}`);
  chipEl.style.setProperty('--chip-lift', `${-magnetBoost * 4}px`);
  chipEl.dataset.magnet = '1';
  return true;
}

export function resetChipMagnet(chipEl) {
  if (!chipEl) return;
  chipEl.style.setProperty('--chip-mx', '0px');
  chipEl.style.setProperty('--chip-my', '0px');
  chipEl.style.setProperty('--chip-rot', '0deg');
  chipEl.style.setProperty('--chip-scale', '1');
  chipEl.style.setProperty('--chip-lift', '0px');
  delete chipEl.dataset.magnet;
}

export function updateCellSpotlight(cellEl, clientX, clientY) {
  if (!cellEl) return;
  const rect = cellEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const px = ((clientX - rect.left) / rect.width) * 100;
  const py = ((clientY - rect.top) / rect.height) * 100;
  cellEl.style.setProperty('--spot-x', `${px}%`);
  cellEl.style.setProperty('--spot-y', `${py}%`);
  cellEl.dataset.spotlit = '1';
}

export function clearCellSpotlight(cellEl) {
  if (!cellEl) return;
  cellEl.style.setProperty('--spot-x', '50%');
  cellEl.style.setProperty('--spot-y', '50%');
  delete cellEl.dataset.spotlit;
}

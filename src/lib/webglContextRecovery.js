/**
 * WebGL context loss / restore — mobile GPU reclaim, tab backgrounding.
 */

import * as THREE from 'three';

/**
 * @param {import('three').WebGLRenderer} gl
 * @param {{ shadows?: boolean }} [settings]
 */
export function configureWebGLRenderer(gl, { shadows = true } = {}) {
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  gl.shadowMap.enabled = shadows;
  gl.outputColorSpace = THREE.SRGBColorSpace;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ onLost?: (event: Event) => void, onRestored?: (event: Event) => void }} [handlers]
 */
export function attachWebGLContextRecovery(canvas, { onLost, onRestored } = {}) {
  const handleLost = (event) => {
    event.preventDefault();
    onLost?.(event);
  };

  const handleRestored = (event) => {
    onRestored?.(event);
  };

  canvas.addEventListener('webglcontextlost', handleLost, false);
  canvas.addEventListener('webglcontextrestored', handleRestored, false);

  return () => {
    canvas.removeEventListener('webglcontextlost', handleLost, false);
    canvas.removeEventListener('webglcontextrestored', handleRestored, false);
  };
}

console.assert(typeof configureWebGLRenderer === 'function', 'configureWebGLRenderer');

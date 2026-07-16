import { useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { POCKET_ANGLE, WHEEL, positionOnRing } from '../lib/wheel.js';
import { dividerIndicesForHighlight } from '../lib/highlight.js';
import { dampFactor } from './materials.js';
import { disposeMaterial } from '../lib/disposeUtils.js';

const _m = new THREE.Object3D();
const _emissive = new THREE.Color('#ffcc55');

/**
 * Instanced gold divider pins — per-pin emissive glow on UI hover.
 */
export function InstancedPins({ material, hoverHighlightRef }) {
  const meshRef = useRef();
  const glow = useRef(new Float32Array(37).fill(0));

  const pinMaterial = useMemo(() => {
    const m = material.clone();
    m.emissive = new THREE.Color('#000000');
    m.emissiveIntensity = 0;
    return m;
  }, [material]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < 37; i++) {
      const dividerAngle = i * POCKET_ANGLE;
      const [dx, dy, dz] = positionOnRing(WHEEL.trackRadius, dividerAngle, 0.1);
      _m.position.set(dx, dy, dz);
      _m.rotation.set(0, dividerAngle, 0);
      _m.updateMatrix();
      mesh.setMatrixAt(i, _m.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [material]);

  useEffect(() => {
    return () => disposeMaterial(pinMaterial);
  }, [pinMaterial]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || !hoverHighlightRef) return;

    const lit = dividerIndicesForHighlight(hoverHighlightRef.current);
    const rate = dampFactor(lit.size > 0 ? 36 : 16, delta);
    let peak = 0;

    for (let i = 0; i < 37; i++) {
      const target = lit.has(i) ? 1 : 0;
      glow.current[i] += (target - glow.current[i]) * rate;
      peak = Math.max(peak, glow.current[i]);
    }

    pinMaterial.emissiveIntensity = peak * 1.35;
    pinMaterial.emissive.copy(_emissive).multiplyScalar(peak > 0.05 ? 1 : 0);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 37]} material={pinMaterial} castShadow>
      <boxGeometry args={[0.014, 0.12, 0.045]} />
    </instancedMesh>
  );
}

import { useMemo } from 'react';
import * as THREE from 'three';
import { createWheelNumberRingTexture, wheelNumberRingRadius } from '../lib/wheelNumberRingTexture.js';

/**
 * Felt + printed numbers on one ring — rotates with the wheel group.
 */
export function WheelNumberRing() {
  const { map, radius } = useMemo(() => {
    const texture = createWheelNumberRingTexture();
    return { map: texture, radius: wheelNumberRingRadius() };
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.108, 0]} receiveShadow castShadow>
      <ringGeometry args={[radius * 0.72, radius * 1.28, 128]} />
      <meshStandardMaterial
        map={map}
        roughness={0.62}
        metalness={0.08}
        envMapIntensity={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

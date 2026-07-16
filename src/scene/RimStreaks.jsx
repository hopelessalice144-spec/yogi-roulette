import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WHEEL } from '../lib/wheel.js';
import { useGame } from '../context/GameContext.jsx';

const COUNT = 24;
const RADIUS = WHEEL.rimRadius;

/** Gold velocity streaks on the rim during high-speed spin. */
export function RimStreaks({ spinSpeed = 0, wheelAngleRef }) {
  const { qualitySettings } = useGame();
  const pointsRef = useRef();
  const life = useRef(new Float32Array(COUNT).fill(1));
  const angles = useRef(
    Array.from({ length: COUNT }, (_, i) => (i / COUNT) * Math.PI * 2)
  );

  useFrame((_, delta) => {
    const geom = pointsRef.current?.geometry;
    if (!geom || spinSpeed < 1.8) return;

    const pos = geom.attributes.position;
    const intensity = Math.min(1, (spinSpeed - 1.5) / 2);
    const wheelAngle = wheelAngleRef?.current ?? 0;

    for (let i = 0; i < COUNT; i++) {
      angles.current[i] += delta * spinSpeed * (0.8 + (i % 3) * 0.15);
      const a = angles.current[i] + wheelAngle;
      const r = RADIUS + Math.sin(i * 1.7) * 0.02;
      pos.array[i * 3] = Math.sin(a) * r;
      pos.array[i * 3 + 1] = 0.13 + Math.sin(i * 2.1) * 0.01 * intensity;
      pos.array[i * 3 + 2] = Math.cos(a) * r;
      life.current[i] = 0.4 + intensity * 0.6;
    }
    pos.needsUpdate = true;

    const mat = pointsRef.current?.material;
    if (mat) mat.opacity = intensity * 0.75;
  });

  if (!qualitySettings.rimStreaks && spinSpeed < 2) return null;

  const positions = new Float32Array(COUNT * 3);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#ffd070"
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

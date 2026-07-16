import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 120;

/**
 * Confetti burst on winning bets.
 */
export function WinParticles({ burstKey, active }) {
  const pointsRef = useRef();
  const lifeRef = useRef(0);
  const velocitiesRef = useRef([]);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = [];
    const col = new Float32Array(COUNT * 3);
    const palette = [
      new THREE.Color('#ffd700'),
      new THREE.Color('#ff6b6b'),
      new THREE.Color('#4ecdc4'),
      new THREE.Color('#f5d78e'),
    ];
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 1] = 0.4 + Math.random() * 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      vel.push({
        x: (Math.random() - 0.5) * 2.5,
        y: 1.5 + Math.random() * 2.5,
        z: (Math.random() - 0.5) * 2.5,
      });
      const c = palette[i % palette.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    velocitiesRef.current = vel;
    return { positions: pos, colors: col };
  }, [burstKey]);

  useEffect(() => {
    lifeRef.current = 0;
  }, [burstKey]);

  useFrame((_, delta) => {
    if (!active || !pointsRef.current) return;
    lifeRef.current += delta;
    if (lifeRef.current > 2.5) return;

    const attr = pointsRef.current.geometry.attributes.position;
    const velocities = velocitiesRef.current;
    for (let i = 0; i < COUNT; i++) {
      const v = velocities[i];
      v.y -= 4.5 * delta;
      attr.array[i * 3] += v.x * delta;
      attr.array[i * 3 + 1] += v.y * delta;
      attr.array[i * 3 + 2] += v.z * delta;
    }
    attr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef} key={burstKey}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.9} />
    </points>
  );
}

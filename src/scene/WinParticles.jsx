import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext.jsx';
import { WIN_TIERS, celebrationParticleCount } from '../lib/winCelebration.js';

const BASE_COUNT = 120;

/**
 * Confetti burst on winning bets — scales with celebration tier.
 */
export function WinParticles({ burstKey, active }) {
  const { winCelebration } = useGame();
  const tier = WIN_TIERS[winCelebration?.tier] ?? WIN_TIERS.none;
  const count = celebrationParticleCount(BASE_COUNT, tier.particleScale || 1);

  const pointsRef = useRef();
  const lifeRef = useRef(0);
  const velocitiesRef = useRef([]);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = [];
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffd700'),
      new THREE.Color('#ff6b6b'),
      new THREE.Color('#4ecdc4'),
      new THREE.Color('#f5d78e'),
      new THREE.Color('#c084fc'),
      new THREE.Color('#38bdf8'),
    ];
    const spread = 0.35 + tier.particleScale * 0.15;
    const lift = 1.4 + tier.particleScale * 0.9;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = 0.4 + Math.random() * 0.25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      vel.push({
        x: (Math.random() - 0.5) * (2.2 + tier.particleScale),
        y: lift + Math.random() * (2 + tier.particleScale),
        z: (Math.random() - 0.5) * (2.2 + tier.particleScale),
      });
      const c = palette[i % palette.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    velocitiesRef.current = vel;
    return { positions: pos, colors: col };
  }, [burstKey, count, tier.particleScale]);

  useEffect(() => {
    lifeRef.current = 0;
  }, [burstKey]);

  useFrame((_, delta) => {
    if (!active || !pointsRef.current) return;
    lifeRef.current += delta;
    const maxLife = 2.2 + tier.particleScale * 0.6;
    if (lifeRef.current > maxLife) return;

    const attr = pointsRef.current.geometry.attributes.position;
    const velocities = velocitiesRef.current;
    const drag = 4.2 + tier.particleScale * 0.8;
    for (let i = 0; i < count; i++) {
      const v = velocities[i];
      v.y -= drag * delta;
      attr.array[i * 3] += v.x * delta;
      attr.array[i * 3 + 1] += v.y * delta;
      attr.array[i * 3 + 2] += v.z * delta;
    }
    attr.needsUpdate = true;
  });

  if (!active) return null;

  const pointSize = 0.05 + Math.min(0.04, tier.particleScale * 0.02);

  return (
    <points ref={pointsRef} key={`${burstKey}-${count}`}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={pointSize} vertexColors transparent opacity={0.92} />
    </points>
  );
}

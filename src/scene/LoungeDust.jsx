import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext.jsx';

const COUNT = 180;

/**
 * Procedural micro-dust drifting through spotlight beams — wheel-draft reactive.
 */
export function LoungeDust() {
  const { qualitySettings, wheelAngleRef, wheelSpinSpeed } = useGame();
  const pointsRef = useRef();
  const velocities = useRef(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = 0.4 + Math.random() * 5.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    velocities.current = vel;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((_, delta) => {
    if (!qualitySettings.loungeDust || !pointsRef.current) return;

    const pos = pointsRef.current.geometry.attributes.position;
    const vel = velocities.current;
    const draft = wheelSpinSpeed * 0.015;
    const spin = wheelAngleRef.current;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      pos.array[ix] += vel[ix] + Math.sin(spin + i) * draft * delta;
      pos.array[ix + 1] += vel[ix + 1] + 0.002 * delta;
      pos.array[ix + 2] += vel[ix + 2] + Math.cos(spin + i * 0.7) * draft * delta;

      if (pos.array[ix + 1] > 6) pos.array[ix + 1] = 0.3;
      if (pos.array[ix + 1] < 0.2) pos.array[ix + 1] = 5.8;
      if (Math.abs(pos.array[ix]) > 4) pos.array[ix] *= -0.85;
      if (Math.abs(pos.array[ix + 2]) > 4) pos.array[ix + 2] *= -0.85;
    }
    pos.needsUpdate = true;
  });

  if (!qualitySettings.loungeDust) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.035}
        color="#ffe8b8"
        transparent
        opacity={0.45}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

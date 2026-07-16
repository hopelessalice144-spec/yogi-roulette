import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext.jsx';

const MAX = 36;

/** Pooled collision sparks — velocity-scaled gold impacts. */
export function SparkBurst() {
  const { sparkQueueRef } = useGame();
  const pointsRef = useRef();
  const life = useRef(new Float32Array(MAX).fill(-1));
  const velocities = useRef(
    Array.from({ length: MAX }, () => new THREE.Vector3())
  );
  const matRef = useRef();

  useFrame((_, delta) => {
    const geom = pointsRef.current?.geometry;
    if (!geom) return;
    const pos = geom.attributes.position;
    const q = sparkQueueRef.current;
    let active = 0;

    while (q.length > 0) {
      const burst = q.shift();
      const slot = life.current.findIndex((l) => l < 0);
      if (slot < 0) break;
      const power = burst.power ?? 1;
      life.current[slot] = 0.22 + power * 0.14;
      pos.array[slot * 3] = burst.x;
      pos.array[slot * 3 + 1] = burst.y;
      pos.array[slot * 3 + 2] = burst.z;
      velocities.current[slot].set(
        (Math.random() - 0.5) * power * 1.2,
        0.2 + Math.random() * power * 0.65,
        (Math.random() - 0.5) * power * 1.2
      );
    }

    for (let i = 0; i < MAX; i++) {
      if (life.current[i] < 0) continue;
      active += 1;
      life.current[i] -= delta;
      const v = velocities.current[i];
      v.y -= 5.5 * delta;
      v.multiplyScalar(1 - delta * 1.8);
      pos.array[i * 3] += v.x * delta;
      pos.array[i * 3 + 1] += v.y * delta;
      pos.array[i * 3 + 2] += v.z * delta;
      if (life.current[i] < 0) life.current[i] = -1;
    }
    pos.needsUpdate = true;

    if (matRef.current) {
      matRef.current.opacity = active > 0 ? 0.92 : 0;
      matRef.current.size = active > 0 ? 0.038 : 0.03;
    }
  });

  const positions = useRef(new Float32Array(MAX * 3));

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.038}
        sizeAttenuation
        color="#ffd070"
        transparent
        opacity={0.92}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

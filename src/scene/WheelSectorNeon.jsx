import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pocketIndicesForHighlight, warmGlowColorForHighlight } from '../lib/highlight.js';
import { useGame } from '../context/GameContext.jsx';
import { pocketIndexToAngle, positionOnRing, WHEEL } from '../lib/wheel.js';
import { dampFactor } from './materials.js';

const _color = new THREE.Color('#ffaa44');

function neonColorForHighlight(highlight) {
  return warmGlowColorForHighlight(highlight);
}

/**
 * Dynamic neon spotlights on 3D wheel sectors matching UI hover.
 */
export function WheelSectorNeon() {
  const { hoverHighlightRef, wheelAngleRef } = useGame();
  const lightsRef = useRef([]);
  const intensities = useRef(new Float32Array(6).fill(0));
  const positions = useRef(Array.from({ length: 6 }, () => new THREE.Vector3()));

  useFrame((state, delta) => {
    const highlighted = pocketIndicesForHighlight(hoverHighlightRef.current);
    const wheelAngle = wheelAngleRef.current ?? 0;
    const hasHighlight = highlighted.size > 0;
    const glowAlpha = dampFactor(hasHighlight ? 42 : 12, delta);

    let slot = 0;
    for (const idx of highlighted) {
      if (slot >= 6) break;
      const angle = pocketIndexToAngle(idx) + wheelAngle;
      const [x, , z] = positionOnRing(WHEEL.trackRadius - 0.05, angle, 0.14);
      positions.current[slot].set(x, 0.22, z);
      slot += 1;
    }

    _color.set(neonColorForHighlight(hoverHighlightRef.current));

    for (let i = 0; i < 6; i++) {
      const target = i < slot && hasHighlight ? 1 : 0;
      intensities.current[i] += (target - intensities.current[i]) * glowAlpha;

      const light = lightsRef.current[i];
      if (!light) continue;

      if (i < slot && hasHighlight) {
        light.position.copy(positions.current[i]);
      }
      light.visible = intensities.current[i] > 0.02;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 6 + i) * 0.22;
      light.intensity = intensities.current[i] * 4.2 * pulse;
      light.color.copy(_color);
    }
  });

  return (
    <group>
      {Array.from({ length: 6 }, (_, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            lightsRef.current[i] = el;
          }}
          color="#00ffc8"
          intensity={0}
          distance={2}
          decay={2}
          visible={false}
        />
      ))}
    </group>
  );
}

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UI_THEME_LOUNGE, UI_THEME_NEON } from '../lib/uiTheme.js';
import {
  neonGlowColorForHighlight,
  pocketIndicesForHighlight,
  samplePocketIndices,
  warmGlowColorForHighlight,
} from '../lib/highlight.js';
import { useGame } from '../context/GameContext.jsx';
import { pocketIndexToAngle, positionOnRing, WHEEL } from '../lib/wheel.js';
import { dampFactor } from './materials.js';

const MAX_GLOW = 22;
const MAX_LIGHTS = 8;
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

/**
 * Dynamic neon spotlights + instanced sector glows synced to board/racetrack hover.
 */
export function WheelSectorNeon() {
  const { hoverHighlightRef, wheelAngleRef, uiTheme } = useGame();
  const meshRef = useRef();
  const lightsRef = useRef([]);
  const intensities = useRef(new Float32Array(MAX_LIGHTS).fill(0));
  const positions = useRef(Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector3()));
  const glowStrength = useRef(0);

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00ffc8',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  useFrame((state, delta) => {
    const highlighted = pocketIndicesForHighlight(hoverHighlightRef.current);
    const wheelAngle = wheelAngleRef.current ?? 0;
    const hasHighlight = highlighted.size > 0;
    const fade = dampFactor(hasHighlight ? 46 : 14, delta);
    glowStrength.current += ((hasHighlight ? 1 : 0) - glowStrength.current) * fade;

    _color.set(
      uiTheme === UI_THEME_LOUNGE
        ? warmGlowColorForHighlight(hoverHighlightRef.current)
        : neonGlowColorForHighlight(hoverHighlightRef.current, uiTheme),
    );
    const slots = samplePocketIndices(highlighted, MAX_GLOW);
    const scaleBase = highlighted.size > 10 ? 0.11 : highlighted.size > 4 ? 0.09 : 0.075;

    const mesh = meshRef.current;
    if (mesh) {
      for (let i = 0; i < MAX_GLOW; i += 1) {
        if (i < slots.length && hasHighlight) {
          const angle = pocketIndexToAngle(slots[i]) + wheelAngle;
          const [x, , z] = positionOnRing(WHEEL.trackRadius - 0.03, angle, 0.13);
          _dummy.position.set(x, 0.17, z);
          _dummy.rotation.set(-Math.PI / 2, 0, 0);
          const pulse = 1 + Math.sin(state.clock.elapsedTime * 7 + i * 0.6) * 0.12;
          _dummy.scale.setScalar(scaleBase * pulse * glowStrength.current);
        } else {
          _dummy.scale.setScalar(0);
        }
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      glowMaterial.color.copy(_color);
      glowMaterial.opacity = glowStrength.current * (highlighted.size > 12 ? 0.55 : 0.78);
    }

    const lightSlots = samplePocketIndices(highlighted, MAX_LIGHTS);
    for (let i = 0; i < MAX_LIGHTS; i += 1) {
      const target = i < lightSlots.length && hasHighlight ? 1 : 0;
      intensities.current[i] += (target - intensities.current[i]) * fade;

      const light = lightsRef.current[i];
      if (!light) continue;

      if (i < lightSlots.length && hasHighlight) {
        const angle = pocketIndexToAngle(lightSlots[i]) + wheelAngle;
        const [x, , z] = positionOnRing(WHEEL.trackRadius - 0.05, angle, 0.14);
        positions.current[i].set(x, 0.22, z);
        light.position.copy(positions.current[i]);
      }

      light.visible = intensities.current[i] > 0.02;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 6 + i) * 0.22;
      light.intensity = intensities.current[i] * (uiTheme === UI_THEME_NEON ? 5.2 : uiTheme === UI_THEME_LOUNGE ? 4.2 : 3.4) * pulse;
      light.color.copy(_color);
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, glowMaterial, MAX_GLOW]}>
        <ringGeometry args={[0.55, 1, 20]} />
      </instancedMesh>
      {Array.from({ length: MAX_LIGHTS }, (_, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            lightsRef.current[i] = el;
          }}
          color="#00ffc8"
          intensity={0}
          distance={uiTheme === UI_THEME_NEON ? 2.4 : uiTheme === UI_THEME_LOUNGE ? 2 : 1.7}
          decay={2}
          visible={false}
        />
      ))}
    </group>
  );
}

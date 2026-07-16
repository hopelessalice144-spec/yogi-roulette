import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../context/GameContext.jsx';
import { createGodRayMaterial } from '../shaders/godRays.js';
import { disposeMaterial } from '../lib/disposeUtils.js';

/**
 * Volumetric god-ray cones — degrades to gradient quads when throttled.
 */
export function VolumetricGodRays() {
  const { qualitySettings } = useGame();
  const mats = useRef([]);
  const mode = qualitySettings.godRays ?? 'off';
  const isVolumetric = mode === 'volumetric';

  if (mats.current.length === 0 && mode !== 'off') {
    mats.current = [
      createGodRayMaterial(isVolumetric ? 'volumetric' : 'gradient'),
      createGodRayMaterial(isVolumetric ? 'volumetric' : 'gradient'),
    ];
    mats.current[1].uniforms.uColor.value.set('#00ffc8');
    mats.current[1].uniforms.uIntensity.value = 0.28;
  }

  useFrame((state) => {
    if (mode === 'off' || mats.current.length === 0) return;
    const t = state.clock.elapsedTime;
    for (const m of mats.current) {
      m.uniforms.uTime.value = t;
      m.uniforms.uMode.value = isVolumetric ? 1 : 0;
    }
  });

  useEffect(() => {
    return () => {
      for (const m of mats.current) disposeMaterial(m);
      mats.current = [];
    };
  }, []);

  if (mode === 'off') return null;

  return (
    <group position={[0, 4.2, 0]}>
      <mesh rotation={[-Math.PI * 0.42, 0.1, 0]} material={mats.current[0]}>
        <planeGeometry args={[5.5, 9, 1, 1]} />
      </mesh>
      <mesh rotation={[-Math.PI * 0.38, -0.35, 0.08]} position={[-1.8, 0, 0.6]} material={mats.current[1]}>
        <planeGeometry args={[3.2, 7, 1, 1]} />
      </mesh>
    </group>
  );
}

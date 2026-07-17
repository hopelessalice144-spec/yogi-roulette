import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext.jsx';
import { createPlasmaRibbonMaterial } from '../shaders/plasmaRibbon.js';
import { disposeMaterial } from '../lib/disposeUtils.js';

const MAX_TRAIL = 24;

/**
 * Ultra-faint friction vapor ribbon behind the ball during high-speed orbit.
 */
export function BallFrictionVapor() {
  const { ballPosRef, ballVelRef, ballPhaseRef, qualitySettings } = useGame();
  const meshRef = useRef();
  const trail = useRef([]);
  const material = useMemo(() => {
    const m = createPlasmaRibbonMaterial();
    m.uniforms.uColorHot.value.set('#fff8e8');
    m.uniforms.uColorCold.value.set('#ffaa66');
    return m;
  }, []);

  useEffect(() => {
    return () => {
      meshRef.current?.geometry?.dispose();
      disposeMaterial(material);
    };
  }, [material]);

  useFrame((state, delta) => {
    if (!qualitySettings.ballVapor) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    const phase = ballPhaseRef.current;
    const pos = ballPosRef.current;
    const vel = ballVelRef.current;
    const speed = Math.hypot(vel.x, vel.y, vel.z);

    if (phase !== 'orbit' && phase !== 'descent') {
      trail.current = [];
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    if (speed < 0.35 && phase === 'orbit') {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    if (speed > 0.8 || phase === 'descent') {
      trail.current.push({ x: pos.x, y: pos.y, z: pos.z, t: state.clock.elapsedTime });
      if (trail.current.length > MAX_TRAIL) trail.current.shift();
    }

    for (let i = trail.current.length - 1; i >= 0; i--) {
      if (state.clock.elapsedTime - trail.current[i].t > 0.55) {
        trail.current.splice(i, 1);
      }
    }

    const mesh = meshRef.current;
    if (!mesh || trail.current.length < 3) {
      if (mesh) mesh.visible = false;
      return;
    }

    const pts = trail.current;
    const segments = pts.length - 1;
    const positions = new Float32Array((segments + 1) * 2 * 3);
    const uvs = new Float32Array((segments + 1) * 2 * 2);
    const indices = [];
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= segments; i++) {
      const p = pts[Math.min(i, pts.length - 1)];
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      const tangent = new THREE.Vector3(next.x - prev.x, next.y - prev.y, next.z - prev.z);
      if (tangent.lengthSq() < 1e-6) tangent.set(0, 0, 1);
      tangent.normalize();
      const side = new THREE.Vector3().crossVectors(up, tangent).normalize();
      const width = 0.018 * (1 - i / segments);

      const base = i * 2;
      positions[base * 3] = p.x + side.x * width;
      positions[base * 3 + 1] = p.y;
      positions[base * 3 + 2] = p.z + side.z * width;
      positions[(base + 1) * 3] = p.x - side.x * width;
      positions[(base + 1) * 3 + 1] = p.y;
      positions[(base + 1) * 3 + 2] = p.z - side.z * width;

      uvs[base * 2] = i / segments;
      uvs[(base + 1) * 2] = i / segments;

      if (i < segments) {
        const a = base;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);

    mesh.geometry.dispose();
    mesh.geometry = geo;
    mesh.visible = true;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uIntensity.value = Math.min(0.55, speed * 0.12 + 0.15);
    material.uniforms.uSpread.value = 0.85;
  });

  if (!qualitySettings.ballVapor) return null;

  return <mesh ref={meshRef} material={material} renderOrder={4} />;
}

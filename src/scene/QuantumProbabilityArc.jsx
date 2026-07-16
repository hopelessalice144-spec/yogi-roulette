import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext.jsx';
import { numberToPocketIndex } from '../lib/wheel.js';
import { computeQuantumArc, focusPocketPositions } from '../lib/quantumTrajectory.js';
import { createPlasmaRibbonMaterial } from '../shaders/plasmaRibbon.js';
import { disposeMaterial } from '../lib/disposeUtils.js';

const _up = new THREE.Vector3(0, 1, 0);
const _tangent = new THREE.Vector3();

function buildRibbonGeometry(points) {
  if (points.length < 2) return null;

  const segments = points.length - 1;
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const uvs = new Float32Array((segments + 1) * 2 * 2);
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const p = points[Math.min(i, points.length - 1)];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];

    _tangent.set(next.x - prev.x, next.y - prev.y, next.z - prev.z);
    if (_tangent.lengthSq() < 1e-6) _tangent.set(1, 0, 0);
    _tangent.normalize();

    const side = new THREE.Vector3().crossVectors(_up, _tangent).normalize();
    const width = 0.04 * (1 - i / (segments + 1) * 0.35);

    const base = i * 2;
    positions[base * 3] = p.x + side.x * width;
    positions[base * 3 + 1] = p.y + 0.02;
    positions[base * 3 + 2] = p.z + side.z * width;
    positions[(base + 1) * 3] = p.x - side.x * width;
    positions[(base + 1) * 3 + 1] = p.y + 0.02;
    positions[(base + 1) * 3 + 2] = p.z - side.z * width;

    uvs[base * 2] = i / segments;
    uvs[base * 2 + 1] = 0;
    uvs[(base + 1) * 2] = i / segments;
    uvs[(base + 1) * 2 + 1] = 1;

    if (i < segments) {
      const a = base;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function FocusRings({ positions }) {
  if (!positions?.length) return null;
  return positions.map((p) => (
    <mesh key={p.idx} position={[p.x, p.y, p.z]} renderOrder={6}>
      <ringGeometry args={[0.03, 0.055, 24]} />
      <meshBasicMaterial
        color="#00ffc8"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  ));
}

/**
 * Hacker-style predictive probability arc over the spinning wheel.
 */
export function QuantumProbabilityArc() {
  const {
    ballPosRef,
    ballVelRef,
    wheelAngleRef,
    ballPhaseRef,
    wheelSpinSpeed,
    targetNumber,
    qualitySettings,
  } = useGame();

  const meshRef = useRef();
  const [focusPositions, setFocusPositions] = useState([]);
  const material = useMemo(() => createPlasmaRibbonMaterial(), []);
  const frameSkip = useRef(0);

  useEffect(() => {
    return () => {
      meshRef.current?.geometry?.dispose();
      disposeMaterial(material);
    };
  }, [material]);

  useFrame((state) => {
    if (!qualitySettings.quantumArc) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    const phase = ballPhaseRef.current;
    if (phase === 'orbit') {
      if (meshRef.current) meshRef.current.visible = false;
      setFocusPositions([]);
      return;
    }

    let pocketIdx = -1;
    try {
      if (targetNumber != null) pocketIdx = numberToPocketIndex(targetNumber);
    } catch {
      pocketIdx = -1;
    }

    const arc = computeQuantumArc({
      pos: ballPosRef.current,
      vel: ballVelRef.current,
      wheelAngle: wheelAngleRef.current,
      wheelSpinSpeed,
      phase,
      targetNumber,
      targetPocketIndex: pocketIdx,
    });

    const mesh = meshRef.current;
    if (!mesh || arc.points.length < 2 || arc.intensity < 0.05) {
      if (mesh) mesh.visible = false;
      return;
    }

    const geo = buildRibbonGeometry(arc.points);
    if (!geo) {
      mesh.visible = false;
      return;
    }

    mesh.geometry.dispose();
    mesh.geometry = geo;
    mesh.visible = true;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uIntensity.value = arc.intensity;
    material.uniforms.uSpread.value = arc.spread;

    frameSkip.current += 1;
    if (frameSkip.current % 2 === 0) {
      setFocusPositions(focusPocketPositions(arc.focusIndices, wheelAngleRef.current));
    }
  });

  if (!qualitySettings.quantumArc) return null;

  return (
    <group>
      <mesh ref={meshRef} material={material} renderOrder={5} />
      <FocusRings positions={focusPositions} />
    </group>
  );
}

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMaterials } from './MaterialLibrary.jsx';
import { BALL_RADIUS } from '../lib/trajectory.js';

const _axis = new THREE.Vector3();
const _vel = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _deltaQ = new THREE.Quaternion();

/**
 * Ivory ball with visual roll driven by world-space velocity (m/s).
 */
export function IvoryBallMesh({ velocityRef, rollSpeedRef, castShadow = true }) {
  const { ivoryBall } = useMaterials();
  const meshRef = useRef();
  const rollQuat = useRef(new THREE.Quaternion());

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const v = velocityRef?.current;
    let vx = v?.x ?? 0;
    let vy = v?.y ?? 0;
    let vz = v?.z ?? 0;
    const rollHint = rollSpeedRef?.current;
    if (rollHint != null && Math.hypot(vx, vz) < 0.02) {
      vx = rollHint;
      vz = 0;
    }

    const speed = Math.hypot(vx, vy, vz);
    if (speed < 0.004) return;

    const angle = (speed / BALL_RADIUS) * delta;
    _vel.set(vx, vy, vz);
    _axis.crossVectors(_vel, _up);
    if (_axis.lengthSq() < 1e-8) {
      _axis.set(vz, 0, -vx);
    }
    _axis.normalize();
    _deltaQ.setFromAxisAngle(_axis, angle);
    rollQuat.current.multiplyQuaternions(_deltaQ, rollQuat.current);
    mesh.quaternion.copy(rollQuat.current);
  });

  return (
    <mesh ref={meshRef} castShadow={castShadow} receiveShadow material={ivoryBall}>
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
    </mesh>
  );
}

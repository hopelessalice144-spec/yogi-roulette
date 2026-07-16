import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useMaterials } from './MaterialLibrary.jsx';
import { orbitPose, BALL_RADIUS } from '../lib/trajectory.js';
import { useGame } from '../context/GameContext.jsx';

/** Kinematic orbit ball for betting / idle wheel — no Rapier required. */
export function OrbitBallVisual({ spinSpeed = 0.42 }) {
  const { ivoryBall } = useMaterials();
  const { simulationPausedRef, wheelAngleRef } = useGame();
  const meshRef = useRef();
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2);
  const rollRef = useRef(0);

  useFrame((_, delta) => {
    if (simulationPausedRef?.current) return;
    const wheelAngle = wheelAngleRef?.current ?? 0;
    const pose = orbitPose(orbitAngleRef.current, wheelAngle, spinSpeed);
    orbitAngleRef.current += delta * pose.angular;
    rollRef.current += delta * (pose.angular * 2.4 + spinSpeed * 0.35);

    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.set(pose.x, pose.y, pose.z);
    mesh.rotation.x = rollRef.current;
    mesh.rotation.z = rollRef.current * 0.62;
  });

  return (
    <mesh ref={meshRef} castShadow material={ivoryBall}>
      <sphereGeometry args={[BALL_RADIUS, 24, 24]} />
    </mesh>
  );
}

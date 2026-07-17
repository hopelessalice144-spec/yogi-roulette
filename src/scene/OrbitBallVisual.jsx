import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { orbitPose } from '../lib/trajectory.js';
import { computeBallKinematicSync } from '../lib/cycleResync.js';
import { useGame } from '../context/GameContext.jsx';
import { IvoryBallMesh } from './IvoryBallMesh.jsx';

/**
 * Kinematic orbit ball for betting / idle wheel — no Rapier required.
 * @param {boolean} [wheelLocal] — when true, parent group applies wheel rotation (use wheelAngle 0).
 */
export function OrbitBallVisual({ spinSpeed = 0.42, wheelLocal = false }) {
  const { simulationPausedRef, wheelAngleRef, clock } = useGame();
  const groupRef = useRef();
  const orbitAngleRef = useRef(0);
  const ballVelRef = useRef({ x: 0, y: 0, z: 0 });
  const rollSpeedRef = useRef(0);

  useEffect(() => {
    const wheelAngle = wheelLocal ? 0 : (wheelAngleRef?.current ?? 0);
    const snap = computeBallKinematicSync(clock, wheelAngle, spinSpeed);
    orbitAngleRef.current = snap.orbitAngle;
  }, [clock.cycleId, clock, spinSpeed, wheelAngleRef, wheelLocal]);

  useFrame((_, delta) => {
    if (simulationPausedRef?.current) return;
    const wheelAngle = wheelLocal ? 0 : (wheelAngleRef?.current ?? 0);
    const pose = orbitPose(orbitAngleRef.current, wheelAngle, spinSpeed);
    orbitAngleRef.current += delta * pose.angular;

    const tangential = pose.angular * 0.04;
    ballVelRef.current = {
      x: Math.cos(pose.angle) * tangential,
      y: 0,
      z: -Math.sin(pose.angle) * tangential,
    };
    rollSpeedRef.current = tangential;

    groupRef.current?.position.set(pose.x, pose.y, pose.z);
  });

  return (
    <group ref={groupRef}>
      <IvoryBallMesh velocityRef={ballVelRef} rollSpeedRef={rollSpeedRef} />
    </group>
  );
}

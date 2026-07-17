import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext.jsx';
import { resolveKinematicBallState, rimTangentialVelocity } from '../lib/ballKinematics.js';
import { descentVelocity, orbitPose } from '../lib/trajectory.js';
import { IvoryBallMesh } from './IvoryBallMesh.jsx';

/**
 * Kinematic orbit ball for betting / idle wheel — no Rapier required.
 * @param {boolean} [wheelLocal] — parent wheel group applies rotation (wheel angle 0 in pose).
 */
export function OrbitBallVisual({ spinSpeed = 0.42, wheelLocal = false }) {
  const {
    simulationPausedRef,
    wheelAngleRef,
    clockRef,
    ballResyncRef,
    ballVelRef,
    onBallPosition,
  } = useGame();
  const groupRef = useRef();
  const worldPos = useRef(new THREE.Vector3());
  const prevWorldPos = useRef(new THREE.Vector3());
  const hasWorldSample = useRef(false);
  const localVelRef = useRef({ x: 0, y: 0, z: 0 });
  const rollSpeedRef = useRef(0);
  const lastResyncToken = useRef(0);

  useFrame((_, delta) => {
    if (simulationPausedRef?.current) return;

    const resync = ballResyncRef?.current;
    if (resync && resync.token !== lastResyncToken.current) {
      lastResyncToken.current = resync.token;
      hasWorldSample.current = false;
    }

    const clock = clockRef?.current;
    if (!clock) return;

    const wheelAngle = wheelLocal ? 0 : (wheelAngleRef?.current ?? 0);
    const kin = resolveKinematicBallState(clock, wheelAngle, spinSpeed, { wheelLocal });

    const pose = orbitPose(kin.orbitAngle, wheelAngle, spinSpeed);
    let vel =
      kin.phase === 'descent'
        ? (() => {
            const v = descentVelocity(kin.descentT, kin.orbitAngle, wheelAngle, spinSpeed);
            return { x: v.x, y: v.y, z: v.z, speed: v.speed };
          })()
        : rimTangentialVelocity(pose);

    groupRef.current?.position.set(kin.position.x, kin.position.y, kin.position.z);

    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPos.current);
      onBallPosition?.({
        x: worldPos.current.x,
        y: worldPos.current.y,
        z: worldPos.current.z,
      });

      const dt = Math.max(delta, 1 / 240);
      if (wheelLocal && hasWorldSample.current) {
        vel = {
          x: (worldPos.current.x - prevWorldPos.current.x) / dt,
          y: (worldPos.current.y - prevWorldPos.current.y) / dt,
          z: (worldPos.current.z - prevWorldPos.current.z) / dt,
          speed: 0,
        };
        vel.speed = Math.hypot(vel.x, vel.y, vel.z);
      }
      prevWorldPos.current.copy(worldPos.current);
      hasWorldSample.current = true;
    }

    localVelRef.current = { x: vel.x, y: vel.y, z: vel.z };
    rollSpeedRef.current = vel.speed;
    if (ballVelRef) {
      ballVelRef.current = { x: vel.x, y: vel.y, z: vel.z };
    }
  });

  return (
    <group ref={groupRef}>
      <IvoryBallMesh velocityRef={localVelRef} rollSpeedRef={rollSpeedRef} />
    </group>
  );
}

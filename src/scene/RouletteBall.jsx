import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useGame } from '../context/GameContext.jsx';
import { useMaterials } from './MaterialLibrary.jsx';
import {
  descentPose,
  descentVelocity,
  synchronizeHandoffState,
  orbitPose,
  predictPocketTarget,
  DESCENT_DURATION,
  BALL_RADIUS,
} from '../lib/trajectory.js';
import {
  BALL_PHYSICS,
  POCKET_CAPTURE,
  pocketCenterWorld,
  numberToPocketIndex,
} from '../lib/wheel.js';
import {
  CAPTURE_STAGE,
  applyRollingKinetics,
  pocketGuideImpulse,
  nestlePose,
  resolveCaptureStage,
} from '../lib/ballPhysics.js';
import { createTimestepAccumulator, runFixedSteps } from '../lib/fixedTimestep.js';
import {
  recoverBallIfOOB,
  SETTLE_WATCHDOG_MS,
  WATCHDOG_EVENT,
  isBallStuck,
  recordWatchdogEvent,
} from '../lib/physicsWatchdog.js';
import { resetTimestepAccumulator } from '../lib/disposeUtils.js';
import { impactToClackIntensity } from '../lib/audioSynth.js';

const RB_DYNAMIC = 0;
const RB_KINEMATIC_POSITION = 2;
const _prevPos = new THREE.Vector3();

export function RouletteBall({ phase, targetNumber, wheelSpinSpeed = 2, onBallPosition }) {
  const {
    wheelAngleRef,
    ballVelRef,
    guideStrengthRef,
    registerCollisionShake,
    onBallPocketLock,
    emitSpark,
    timeScaleRef,
    audioRef,
    simulationPausedRef,
    ballResyncRef,
    clockRef,
    watchdogJournalRef,
  } = useGame();
  const { ivoryBall } = useMaterials();
  const bodyRef = useRef();
  const orbitAngle = useRef(Math.random() * Math.PI * 2);
  const releasedRef = useRef(false);
  const lockedRef = useRef(false);
  const descentT = useRef(0);
  const lastSpeedRef = useRef(0);
  const settleAlpha = useRef(0);
  const rollSpeedRef = useRef(0);
  const captureStageRef = useRef(CAPTURE_STAGE.GUIDE);
  const physicsAccum = useRef(createTimestepAccumulator());
  const guidedEnterMs = useRef(0);
  const settlePhaseEnterMs = useRef(0);
  const lastResyncToken = useRef(0);
  const phaseRef = useRef(phase);
  const pocketLockPlayedRef = useRef(false);
  const stuckSinceMs = useRef(0);
  const lastMovingMs = useRef(Date.now());

  phaseRef.current = phase;

  const enterKinematicLock = (rb) => {
    if (!rb || lockedRef.current) return;
    lockedRef.current = true;
    captureStageRef.current = CAPTURE_STAGE.NESTLE;
    rb.setBodyType(RB_KINEMATIC_POSITION, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
    settleAlpha.current = Math.max(settleAlpha.current, 0.2);
  };

  const applyMomentumHandoff = (rb) => {
    const handoff = synchronizeHandoffState(
      orbitAngle.current,
      wheelAngleRef.current,
      wheelSpinSpeed,
      Math.min(1, descentT.current)
    );
    descentT.current = 1;
    rb.setTranslation({ x: handoff.x, y: handoff.y, z: handoff.z }, true);
    rb.setLinvel(
      { x: handoff.velocity.x, y: handoff.velocity.y, z: handoff.velocity.z },
      true
    );
    rb.setAngvel(
      {
        x: handoff.angularVelocity.x,
        y: handoff.angularVelocity.y,
        z: handoff.angularVelocity.z,
      },
      true
    );
    _prevPos.set(handoff.x, handoff.y, handoff.z);
    ballVelRef.current = {
      x: handoff.velocity.x,
      y: handoff.velocity.y,
      z: handoff.velocity.z,
    };
  };

  const applyOOBRecovery = (rb) => {
    const t = rb.translation();
    const recovered = recoverBallIfOOB(
      t.x,
      t.y,
      t.z,
      wheelAngleRef.current,
      watchdogJournalRef?.current
    );
    if (!recovered) return false;
    rb.setTranslation({ x: recovered.x, y: recovered.y, z: recovered.z }, true);
    rb.setLinvel({ x: recovered.vx, y: recovered.vy, z: recovered.vz }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
    ballVelRef.current = { x: 0, y: 0, z: 0 };
    _prevPos.set(recovered.x, recovered.y, recovered.z);
    return true;
  };

  const syncFromResync = (rb) => {
    const resync = ballResyncRef?.current;
    if (!resync || resync.token === lastResyncToken.current || !rb) return;
    lastResyncToken.current = resync.token;
    const snap = resync.snapshot;
    if (!snap) return;

    orbitAngle.current = snap.orbitAngle ?? orbitAngle.current;
    descentT.current = snap.descentT ?? 0;
    releasedRef.current = snap.phase === 'free' || snap.phase === 'guided';
    lockedRef.current = snap.forceGuidedLock ?? false;
    captureStageRef.current = snap.forceGuidedLock ? CAPTURE_STAGE.NESTLE : CAPTURE_STAGE.GUIDE;
    settleAlpha.current = snap.forceGuidedLock ? 0.5 : 0;

    if (snap.position) {
      rb.setTranslation(snap.position, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      _prevPos.set(snap.position.x, snap.position.y, snap.position.z);
    }

    resetTimestepAccumulator(physicsAccum.current);
    stuckSinceMs.current = 0;
    lastMovingMs.current = Date.now();

    if (snap.phase === 'orbit') {
      rb.setBodyType(RB_KINEMATIC_POSITION, true);
      releasedRef.current = false;
      lockedRef.current = false;
      captureStageRef.current = CAPTURE_STAGE.GUIDE;
    } else if (snap.forceGuidedLock) {
      rb.setBodyType(RB_KINEMATIC_POSITION, true);
      lockedRef.current = true;
    } else if (snap.phase === 'free') {
      rb.setBodyType(RB_DYNAMIC, true);
    }
  };

  useEffect(() => {
    if (phase === 'orbit' || phase === 'descent') {
      releasedRef.current = false;
      lockedRef.current = false;
      captureStageRef.current = CAPTURE_STAGE.GUIDE;
      descentT.current = 0;
      lastSpeedRef.current = 0;
      settleAlpha.current = 0;
      guidedEnterMs.current = 0;
      settlePhaseEnterMs.current = 0;
      pocketLockPlayedRef.current = false;
      stuckSinceMs.current = 0;
      lastMovingMs.current = Date.now();
      const rb = bodyRef.current;
      if (rb && phase === 'orbit') {
        rb.setBodyType(RB_KINEMATIC_POSITION, true);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
    if (phase === 'guided') guidedEnterMs.current = Date.now();
  }, [phase]);

  useEffect(() => {
    if (phase === 'descent') descentT.current = 0;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'free' || releasedRef.current) return;
    const rb = bodyRef.current;
    if (!rb) return;
    releasedRef.current = true;
    rb.setBodyType(RB_DYNAMIC, true);
    applyMomentumHandoff(rb);
  }, [phase, wheelAngleRef, wheelSpinSpeed]);

  const handleCollision = (payload) => {
    const rb = bodyRef.current;
    if (!rb || (phaseRef.current !== 'free' && phaseRef.current !== 'guided') || lockedRef.current)
      return;

    const v = rb.linvel();
    const speed = Math.hypot(v.x, v.y, v.z);

    let normalImpact = speed;
    const manifold = payload?.manifold;
    if (manifold && typeof manifold.normalX === 'function') {
      const nx = manifold.normalX();
      const ny = manifold.normalY();
      const nz = manifold.normalZ();
      normalImpact = Math.abs(v.x * nx + v.y * ny + v.z * nz);
    } else if (payload?.totalForceMagnitude) {
      normalImpact = Math.min(speed, payload.totalForceMagnitude * 0.14);
    }

    const relSpeed = Math.max(normalImpact, speed * 0.55);
    const deltaV = Math.abs(relSpeed - lastSpeedRef.current);
    lastSpeedRef.current = relSpeed;

    if (deltaV > 0.028 || relSpeed > 0.16) {
      const impact = impactToClackIntensity(Math.max(deltaV * 1.15, relSpeed * 0.78));
      registerCollisionShake(impact);
      const t = rb.translation();
      emitSpark(t.x, t.y + 0.02, t.z, impact * 2.1);
    }
  };

  const simulateGuidedCapture = (rb, stepDt, pocketIdx, strength) => {
    const clock = clockRef?.current;
    if (clock?.cycleSecond >= 29 && settlePhaseEnterMs.current === 0) {
      settlePhaseEnterMs.current = Date.now();
    }

    const now = Date.now();
    const guidedElapsed = guidedEnterMs.current > 0 ? now - guidedEnterMs.current : 0;
    const settleElapsed =
      settlePhaseEnterMs.current > 0 ? now - settlePhaseEnterMs.current : 0;

    if (
      !lockedRef.current &&
      (guidedElapsed >= SETTLE_WATCHDOG_MS || settleElapsed >= SETTLE_WATCHDOG_MS)
    ) {
      recordWatchdogEvent(watchdogJournalRef?.current, WATCHDOG_EVENT.SETTLE_FORCE);
      enterKinematicLock(rb);
    }

    const lookahead = 0.2 + strength * 0.3;
    const t = rb.translation();
    const guideTarget = predictPocketTarget(
      pocketIdx,
      wheelAngleRef.current,
      wheelSpinSpeed,
      lookahead
    );
    const nestleTarget = pocketCenterWorld(pocketIdx, wheelAngleRef.current);

    const dx = guideTarget.x - t.x;
    const dy = guideTarget.y - t.y;
    const dz = guideTarget.z - t.z;
    const dist = Math.hypot(dx, dy, dz) || 0.001;
    const lv = rb.linvel();
    const speed = Math.hypot(lv.x, lv.y, lv.z);

    captureStageRef.current = resolveCaptureStage(
      dist,
      speed,
      captureStageRef.current
    );

    if (captureStageRef.current >= CAPTURE_STAGE.NESTLE && !lockedRef.current) {
      enterKinematicLock(rb);
    }

    if (lockedRef.current) {
      settleAlpha.current = Math.min(1.15, settleAlpha.current + stepDt * 5.2);
      const nestled = nestlePose(t, nestleTarget, settleAlpha.current, stepDt);
      rb.setNextKinematicTranslation({
        x: nestled.x,
        y: nestled.y,
        z: nestled.z,
      });
      ballVelRef.current = { x: 0, y: 0, z: 0 };
      const fade = rollSpeedRef.current * Math.max(0, 1 - settleAlpha.current);
      audioRef?.current?.setRollingVelocity({ x: fade * 0.4, y: 0, z: fade * 0.4 });
      if (nestled.done) {
        captureStageRef.current = CAPTURE_STAGE.LOCKED;
        if (!pocketLockPlayedRef.current) {
          pocketLockPlayedRef.current = true;
          onBallPocketLock?.();
        }
      }
      return;
    }

    pocketGuideImpulse(rb, guideTarget, strength, stepDt, captureStageRef.current);
  };

  const simulateStep = (dt, rb) => {
    const currentPhase = phaseRef.current;
    const stepDt = dt * (timeScaleRef?.current ?? 1);

    if (currentPhase === 'orbit') {
      orbitAngle.current += stepDt * orbitPose(0, 0, wheelSpinSpeed).angular;
      const pose = orbitPose(orbitAngle.current, wheelAngleRef.current, wheelSpinSpeed);
      rb.setNextKinematicTranslation({ x: pose.x, y: pose.y, z: pose.z });
      rollSpeedRef.current = pose.angular * BALL_PHYSICS.radius * 28;
      audioRef?.current?.setRollingVelocity({
        x: Math.cos(pose.angle) * rollSpeedRef.current,
        y: 0,
        z: -Math.sin(pose.angle) * rollSpeedRef.current,
      });
      return;
    }

    if (currentPhase === 'descent') {
      descentT.current = Math.min(1, descentT.current + stepDt / DESCENT_DURATION);
      const pose = descentPose(
        descentT.current,
        orbitAngle.current,
        wheelAngleRef.current,
        wheelSpinSpeed
      );
      rb.setNextKinematicTranslation({ x: pose.x, y: pose.y, z: pose.z });
      const vel = descentVelocity(
        descentT.current,
        orbitAngle.current,
        wheelAngleRef.current,
        wheelSpinSpeed
      );
      rollSpeedRef.current = vel.speed;
      audioRef?.current?.setRollingVelocity(vel);
      return;
    }

    applyOOBRecovery(rb);

    if (currentPhase === 'free' || currentPhase === 'guided') {
      if (!lockedRef.current) {
        applyRollingKinetics(rb, stepDt);
      }
      const lv = rb.linvel();
      rollSpeedRef.current = Math.hypot(lv.x, lv.z);
      audioRef?.current?.setRollingVelocity(lv);

      const speed = Math.hypot(lv.x, lv.y, lv.z);
      if (speed > 0.04) {
        lastMovingMs.current = Date.now();
        stuckSinceMs.current = 0;
      } else {
        stuckSinceMs.current = Date.now() - lastMovingMs.current;
      }

      if (
        currentPhase === 'free' &&
        !lockedRef.current &&
        isBallStuck(speed, currentPhase, stuckSinceMs.current)
      ) {
        recordWatchdogEvent(watchdogJournalRef?.current, WATCHDOG_EVENT.STUCK_RECOVERY);
        applyOOBRecovery(rb);
        stuckSinceMs.current = 0;
        lastMovingMs.current = Date.now();
      }
    }

    if (currentPhase === 'guided' && targetNumber != null) {
      const pocketIdx = numberToPocketIndex(targetNumber);
      const strength = guideStrengthRef.current ?? 0.7;
      simulateGuidedCapture(rb, stepDt, pocketIdx, strength);
    }
  };

  useFrame((_, delta) => {
    if (simulationPausedRef?.current) return;
    const rb = bodyRef.current;
    if (!rb) return;

    syncFromResync(rb);
    runFixedSteps(physicsAccum.current, delta, (fixedDt) => simulateStep(fixedDt, rb));

    const t = rb.translation();
    const dt = Math.max(delta, 0.001);
    ballVelRef.current = {
      x: (t.x - _prevPos.x) / dt,
      y: (t.y - _prevPos.y) / dt,
      z: (t.z - _prevPos.z) / dt,
    };
    _prevPos.set(t.x, t.y, t.z);
    onBallPosition?.({ x: t.x, y: t.y, z: t.z });
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="ball"
      mass={BALL_PHYSICS.mass}
      restitution={BALL_PHYSICS.restitution}
      friction={BALL_PHYSICS.friction}
      linearDamping={BALL_PHYSICS.linearDamping}
      angularDamping={BALL_PHYSICS.angularDamping}
      position={[0, 0.29, 1.15]}
      ccd
      onCollisionEnter={handleCollision}
    >
      <mesh castShadow receiveShadow userData={{ isBall: true }} material={ivoryBall}>
        <sphereGeometry args={[BALL_RADIUS, 24, 24]} />
      </mesh>
    </RigidBody>
  );
}

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext.jsx';
import {
  CAMERA_MAX_VELOCITY,
  computeCameraTargets,
  emaVec3,
  getCycleTimeFloat,
  LOOK_EMA_LAMBDA,
  LOOK_SHADOW_LAMBDA,
  springVec3,
} from '../lib/cameraDirector.js';
import {
  adaptiveLookEmaLambda,
  applyAspectFraming,
  applyDistanceCompensation,
  cinematicHandheld,
  computeImpactShake,
  dropVertigoProgress,
  dollyZoomVertigo,
  impactShakeIntensity,
  ORIENT_SLERP_LAMBDA,
  slerpTowardLookAt,
} from '../lib/cameraRig.js';
import { FIXED_TIMESTEP } from '../lib/fixedTimestep.js';

const _up = new THREE.Vector3(0, 1, 0);
const _euler = new THREE.Euler();
const _posVel = new THREE.Vector3();
const _finalPos = new THREE.Vector3();
const _viewDir = new THREE.Vector3();
const _shakeOffset = new THREE.Vector3();
const _framedPos = new THREE.Vector3();
const _shadowLook = new THREE.Vector3();

/**
 * Hollywood Camera Director v2 — dual-EMA shadow tracking, vertigo dolly, operator motion.
 */
export function CinematicCamera() {
  const { camera } = useThree();
  const {
    clockRef,
    ballPosRef,
    ballVelRef,
    wheelAngleRef,
    targetNumberRef,
    winningNumberRef,
    shakeRef,
    cameraModeRef,
  } = useGame();

  const initialized = useRef(false);
  const smoothPos = useRef(new THREE.Vector3(0.35, 3.65, 5.2));
  const dampedLook = useRef(new THREE.Vector3(0, 0.35, 0));
  const shadowLook = useRef(new THREE.Vector3(0, 0.35, 0));
  const orientQuat = useRef(new THREE.Quaternion());
  const fovRef = useRef(55);
  const rollRef = useRef(0);
  const shakeTime = useRef(0);
  const shakeAmp = useRef(0);
  const prevShakeAmount = useRef(0);
  const accum = useRef(0);

  useFrame((state, delta) => {
    accum.current += Math.min(delta, 0.05);
    const steps = Math.min(3, Math.floor(accum.current / FIXED_TIMESTEP));
    if (steps === 0) return;
    const dt = accum.current / steps;
    accum.current -= dt * steps;

    for (let i = 0; i < steps; i++) {
      stepCamera(state, dt);
    }
  });

  function stepCamera(state, dt) {
    if (!initialized.current) {
      smoothPos.current.copy(camera.position);
      dampedLook.current.set(0, 0.35, 0);
      shadowLook.current.set(0, 0.35, 0);
      orientQuat.current.copy(camera.quaternion);
      fovRef.current = camera.isPerspectiveCamera ? camera.fov : 55;
      initialized.current = true;
    }

    const clock = clockRef.current;
    const mode = cameraModeRef.current || 'lounge';
    const elapsed = state.clock.elapsedTime;
    const cycleTimeFloat = getCycleTimeFloat(clock?.nowMs ?? Date.now());
    const aspect = state.size.height > 0 ? state.size.width / state.size.height : 16 / 9;

    const ballVel = ballVelRef.current;
    const ballSpeed = Math.hypot(ballVel?.x ?? 0, ballVel?.y ?? 0, ballVel?.z ?? 0);

    const targets = computeCameraTargets({
      mode,
      clock,
      ballPos: ballPosRef.current,
      ballVel,
      wheelAngle: wheelAngleRef.current,
      targetNumber: targetNumberRef.current,
      winningNumber: winningNumberRef?.current ?? null,
      elapsedTime: elapsed,
      cycleTimeFloat,
    });

    const framed = applyAspectFraming(
      targets.position,
      targets.lookAt,
      targets.fov,
      aspect,
      _framedPos
    );

    const stiffness = targets.stiffness ?? 3;
    const damping = 2 * Math.sqrt(stiffness);
    springVec3(smoothPos.current, _framedPos, _posVel, stiffness, damping, dt);
    const velLen = _posVel.length();
    if (velLen > CAMERA_MAX_VELOCITY) {
      _posVel.multiplyScalar(CAMERA_MAX_VELOCITY / velLen);
    }

    // Rule 1 — dual EMA shadow look-at: never bind to raw physics coordinates
    const lookLambda = adaptiveLookEmaLambda(ballSpeed, LOOK_EMA_LAMBDA);
    emaVec3(dampedLook.current, targets.lookAt, lookLambda, dt);
    emaVec3(shadowLook.current, dampedLook.current, LOOK_SHADOW_LAMBDA, dt);

    // Rule 2 — vertigo dolly zoom during T-5 drop (FOV decoupled from dolly position)
    const dropVertigo = dropVertigoProgress(cycleTimeFloat, clock?.name ?? 'betting');
    const vertigoMix = Math.min(targets.vertigoProgress ?? 0, dropVertigo * 0.45);
    const vertigo = vertigoMix > 0.08 ? dollyZoomVertigo(vertigoMix, 48, 40) : null;

    let targetFov = vertigo ? vertigo.fov : framed.fov;
    _finalPos.copy(smoothPos.current);

    if (vertigo && vertigo.pullBack > 0.01) {
      _viewDir.subVectors(_finalPos, shadowLook.current).normalize();
      _finalPos.addScaledVector(_viewDir, vertigo.pullBack);
    }
    if (vertigo && vertigo.distanceScale > 1.002) {
      applyDistanceCompensation(_finalPos, shadowLook.current, vertigo.distanceScale, _finalPos);
    }

    // Rule 3 — continuous handheld operator motion (simplex + breathing sine)
    const weights = targets.stateWeights ?? { betting: 1, spinDrop: 0, settle: 0 };
    const handheldAmp = 0.007;
    _finalPos.add(cinematicHandheld(elapsed, handheldAmp, weights));

    // Rule 2c — impact shake on divider collision: A × e^(-βt) × sin(ωt)
    const shakeAmount = shakeRef.current.amount;
    if (shakeAmount > prevShakeAmount.current + 0.02) {
      shakeAmp.current = Math.max(shakeAmp.current, impactShakeIntensity(shakeAmount));
      shakeTime.current = 0;
    }
    prevShakeAmount.current = shakeAmount * 0.9;
    shakeTime.current += dt;

    const shake = computeImpactShake(shakeAmp.current, shakeTime.current);
    let shakeRoll = 0;
    if (shake.envelope > 0.0003) {
      _shakeOffset.set(shake.x, shake.y, shake.z);
      _finalPos.add(_shakeOffset);
      shakeRoll = shake.roll ?? 0;
    } else {
      shakeAmp.current = 0;
    }
    shakeRef.current.amount *= Math.exp(-dt / 0.28);

    // Subtle lens breathing tied to vertigo intensity
    if (vertigo) {
      targetFov += Math.sin(elapsed * 2.1) * 0.35 * vertigo.ease;
    }

    rollRef.current = THREE.MathUtils.damp(
      rollRef.current,
      targets.roll + shakeRoll,
      14,
      dt
    );
    camera.position.copy(_finalPos);

    slerpTowardLookAt(
      orientQuat.current,
      camera.position,
      shadowLook.current,
      _up,
      ORIENT_SLERP_LAMBDA,
      dt
    );

    _euler.setFromQuaternion(orientQuat.current);
    _euler.z += rollRef.current;
    camera.quaternion.setFromEuler(_euler);

    if (camera.isPerspectiveCamera) {
      const fovLambda = 14;
      const fovAlpha = 1 - Math.exp(-fovLambda * dt);
      fovRef.current += (targetFov - fovRef.current) * fovAlpha;
      camera.fov = fovRef.current;
      camera.updateProjectionMatrix();
    }
  }

  return null;
}

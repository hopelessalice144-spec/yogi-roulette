/**
 * Real-time quantum probability arc — samples ball physics into pocket weights.
 */
import {
  TRACK_RADIUS,
  TRACK_Y,
  ORBIT_RADIUS,
  ORBIT_Y,
  ORBIT_ANGULAR_BASE,
  WHEEL_COUPLING,
  predictPocketTarget,
} from './trajectory.js';
import { angleToPocketIndex, pocketIndexToAngle, WHEEL } from './wheel.js';

const ARC_STEPS = 28;
const SIM_STEPS = 48;
const DAMP = 0.94;
const GRAVITY = -0.12;

function integrateStep(x, y, z, vx, vy, vz, wheelAngle, wheelSpin, dt) {
  const r = Math.hypot(x, z);
  const onTrack = y < ORBIT_Y - 0.02;

  if (r > 0.01 && onTrack) {
    const tangentX = Math.cos(Math.atan2(x, z));
    const tangentZ = -Math.sin(Math.atan2(x, z));
    const tangentSpeed = vx * tangentX + vz * tangentZ;
    const centripetal = tangentSpeed * tangentSpeed / Math.max(r, 0.5);
    vx += -x / r * centripetal * dt * 0.35;
    vz += -z / r * centripetal * dt * 0.35;
    vy += GRAVITY * dt;
  }

  vx *= DAMP;
  vy *= DAMP;
  vz *= DAMP;

  x += vx * dt;
  y += vy * dt;
  z += vz * dt;

  wheelAngle += wheelSpin * dt;

  const newR = Math.hypot(x, z);
  if (newR > ORBIT_RADIUS + 0.05) {
    const shrink = TRACK_RADIUS / newR;
    x *= shrink;
    z *= shrink;
    y = Math.max(TRACK_Y, y);
  }

  return { x, y, z, vx, vy, vz, wheelAngle };
}

/**
 * Build arc ribbon points + pocket probability distribution.
 */
export function computeQuantumArc({
  pos,
  vel,
  wheelAngle,
  wheelSpinSpeed,
  phase,
  targetNumber,
  targetPocketIndex,
}) {
  const speed = Math.hypot(vel.x, vel.y, vel.z);
  const pockets = new Float32Array(37).fill(0);

  if (phase === 'orbit' || speed < 0.02) {
    return { points: [], pockets, focusIndices: [], intensity: 0, spread: 1 };
  }

  let x = pos.x;
  let y = pos.y;
  let z = pos.z;
  let vx = vel.x;
  let vy = vel.y;
  let vz = vel.z;
  let wAngle = wheelAngle;
  const dt = 0.045;

  const points = [{ x, y, z, t: 0 }];
  const weights = [];

  for (let i = 0; i < SIM_STEPS; i++) {
    const state = integrateStep(x, y, z, vx, vy, vz, wAngle, wheelSpinSpeed, dt);
    x = state.x;
    y = state.y;
    z = state.z;
    vx = state.vx;
    vy = state.vy;
    vz = state.vz;
    wAngle = state.wheelAngle;

    if (i % 2 === 0) {
      const angle = Math.atan2(x, z);
      const idx = angleToPocketIndex(angle + wAngle);
      const w = 1 / (1 + i * 0.08);
      weights.push({ idx, w });
      pockets[idx] += w;
    }

    if (i % Math.ceil(SIM_STEPS / ARC_STEPS) === 0) {
      points.push({ x, y, z, t: i / SIM_STEPS });
    }
  }

  if (phase === 'guided' && targetPocketIndex >= 0) {
    const target = predictPocketTarget(
      targetPocketIndex,
      wAngle,
      wheelSpinSpeed * 0.3,
      0.35
    );
    points.push({ x: target.x, y: target.y, z: target.z, t: 1 });
    pockets[targetPocketIndex] += 3;
  }

  let total = 0;
  for (let i = 0; i < 37; i++) total += pockets[i];
  if (total > 0) {
    for (let i = 0; i < 37; i++) pockets[i] /= total;
  }

  const spread = Math.max(0.08, Math.min(1, speed / 2.8));
  const focusCount = Math.max(3, Math.min(6, Math.round(3 + (1 - spread) * 3)));
  const sorted = [...pockets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, focusCount)
    .map(([idx]) => idx);

  const intensity = Math.min(1, 0.25 + (1 - spread) * 0.75);

  return {
    points,
    pockets,
    focusIndices: sorted,
    intensity,
    spread,
    speed,
  };
}

/** World positions for focused pocket highlights on the wheel rim. */
export function focusPocketPositions(focusIndices, wheelAngle) {
  const r = WHEEL.trackRadius - 0.06;
  return focusIndices.map((idx) => {
    const a = pocketIndexToAngle(idx) + wheelAngle;
    return {
      x: Math.sin(a) * r,
      y: 0.14,
      z: Math.cos(a) * r,
      idx,
    };
  });
}

console.assert(computeQuantumArc({ pos: { x: 0, y: 0.26, z: 1 }, vel: { x: 1, y: 0, z: 0 }, wheelAngle: 0, wheelSpinSpeed: 1, phase: 'free' }).points.length > 0, 'arc samples');

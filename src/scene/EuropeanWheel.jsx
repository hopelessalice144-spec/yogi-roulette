import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { getColor } from '../lib/math.js';
import { UI_THEME_LOUNGE } from '../lib/uiTheme.js';
import { pocketIndicesForHighlight, neonGlowColorForHighlight, warmGlowColorForHighlight } from '../lib/highlight.js';
import { useGame } from '../context/GameContext.jsx';
import {
  EUROPEAN_SEQUENCE,
  POCKET_ANGLE,
  WHEEL,
  numberToPocketIndex,
  pocketIndexToAngle,
  positionOnRing,
} from '../lib/wheel.js';
import { useMaterials } from './MaterialLibrary.jsx';
import { dampFactor } from './materials.js';
import { disposeMaterial } from '../lib/disposeUtils.js';
import { InstancedPins } from './WheelInstanced.jsx';
import { RimStreaks } from './RimStreaks.jsx';
import { WheelSectorNeon } from './WheelSectorNeon.jsx';
import { WheelNumberRing } from './WheelNumberRing.jsx';
import { blendWheelSpinVelocity } from '../lib/wheelSpinEase.js';

/** Full physics wheel — only imported from lazy RapierStage. */
export function EuropeanWheel({
  spinSpeed = 0.4,
  winningNumber = null,
  onPocketHit,
  onWheelAngle,
}) {
  const mats = useMaterials();
  const { hoverHighlightRef, simulationPausedRef, wheelResyncRef, clock, uiTheme } = useGame();

  const pocketMats = useMemo(
    () => EUROPEAN_SEQUENCE.map((num) => mats.pocket[getColor(num)].clone()),
    [mats]
  );
  const underlineMats = useMemo(
    () => Array.from({ length: 37 }, () => mats.neonUnderline.clone()),
    [mats]
  );

  const bodyRef = useRef();
  const spindleRef = useRef();
  const angleRef = useRef(0);
  const spinVelRef = useRef(spinSpeed);
  const pocketGlow = useRef(new Float32Array(37));
  const winPulse = useRef(0);
  const underlineRefs = useRef([]);
  const winIdx = winningNumber != null ? numberToPocketIndex(winningNumber) : -1;
  const glowColor = useRef(new THREE.Color('#ffaa44'));
  const baseEmissive = useRef({
    red: new THREE.Color('#ff1a3a'),
    black: new THREE.Color('#4488ff'),
    green: new THREE.Color('#00ffc8'),
  });
  const lastWheelResyncToken = useRef(0);

  useEffect(() => {
    return () => {
      pocketMats.forEach(disposeMaterial);
      underlineMats.forEach(disposeMaterial);
    };
  }, [pocketMats, underlineMats]);

  useFrame((state, delta) => {
    if (simulationPausedRef?.current) return;

    const wheelResync = wheelResyncRef?.current;
    if (wheelResync && wheelResync.token !== lastWheelResyncToken.current) {
      lastWheelResyncToken.current = wheelResync.token;
      if (wheelResync.hard !== false && Number.isFinite(wheelResync.angle)) {
        angleRef.current = wheelResync.angle;
      }
    }

    spinVelRef.current = blendWheelSpinVelocity(
      spinVelRef.current,
      spinSpeed,
      delta,
      clock?.cycleSecond ?? 0,
    );
    angleRef.current += delta * spinVelRef.current;
    onWheelAngle?.(angleRef.current);

    const rb = bodyRef.current;
    if (rb) {
      rb.setNextKinematicRotation(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          angleRef.current
        )
      );
    }

    const spindle = spindleRef.current;
    if (spindle) {
      const v = spinVelRef.current;
      const t = state.clock.elapsedTime;
      const amp = 0.0035 + v * 0.003;
      const settle = THREE.MathUtils.clamp(1 - Math.abs(v - spinSpeed) * 0.35, 0.3, 1);
      spindle.rotation.x = Math.sin(t * 12.1) * amp * settle;
      spindle.rotation.z = Math.cos(t * 9.3) * amp * 0.9 * settle;
      spindle.rotation.y = Math.sin(t * 4.7) * amp * 0.42 * settle;
    }

    const highlighted = pocketIndicesForHighlight(hoverHighlightRef.current);
    const hasHover = highlighted.size > 0;
    const glowAlpha = dampFactor(hasHover ? 48 : 14, delta);
    const colorAlpha = dampFactor(hasHover ? 32 : 10, delta);
    glowColor.current.set(
      uiTheme === UI_THEME_LOUNGE
        ? warmGlowColorForHighlight(hoverHighlightRef.current)
        : neonGlowColorForHighlight(hoverHighlightRef.current, uiTheme),
    );
    const winTarget = winIdx >= 0 ? 1 : 0;
    winPulse.current += (winTarget - winPulse.current) * dampFactor(6, delta);
    const winBeat = winIdx >= 0 ? 0.35 + Math.sin(state.clock.elapsedTime * 8) * 0.25 : 0;

    for (let i = 0; i < 37; i++) {
      const num = EUROPEAN_SEQUENCE[i];
      const felt = getColor(num);
      const hoverTarget = highlighted.has(i) ? 1 : 0;
      const winBoost = i === winIdx ? winPulse.current * (0.85 + winBeat) : 0;
      const target = Math.min(1, hoverTarget + winBoost);
      pocketGlow.current[i] += (target - pocketGlow.current[i]) * glowAlpha;
      const hoverBoost = highlighted.has(i) ? 1.45 : 1;
      const mat = pocketMats[i];
      if (highlighted.has(i)) {
        mat.emissive.lerp(glowColor.current, colorAlpha);
      } else {
        mat.emissive.lerp(baseEmissive.current[felt], colorAlpha);
      }
      mat.emissiveIntensity =
        pocketGlow.current[i] * (i === winIdx ? 3.4 : 2.85) * hoverBoost;
      const underline = underlineRefs.current[i];
      if (underline?.material) {
        underline.material.color.lerp(glowColor.current, highlighted.has(i) ? colorAlpha : colorAlpha * 0.5);
        underline.material.opacity = pocketGlow.current[i] * (i === winIdx ? 1.35 : 1.15);
      }
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={[0, 0.22, 0]}
      friction={0.85}
      restitution={0.35}
    >
      <group>
        <mesh castShadow receiveShadow position={[0, 0.06, 0]} material={mats.mahogany}>
          <torusGeometry args={[WHEEL.outerRadius, 0.1, 20, 72]} />
        </mesh>
        <mesh castShadow position={[0, 0.12, 0]} material={mats.gold}>
          <torusGeometry args={[WHEEL.rimRadius, 0.028, 16, 72]} />
        </mesh>
        <mesh receiveShadow position={[0, 0.02, 0]} material={mats.bowl}>
          <cylinderGeometry args={[WHEEL.bowlRadius, WHEEL.pocketInner, 0.08, 48]} />
        </mesh>

        <group ref={spindleRef}>
          <mesh castShadow position={[0, 0.14, 0]} material={mats.gold}>
            <cylinderGeometry args={[WHEEL.hubRadius, WHEEL.hubRadius * 1.2, 0.1, 32]} />
          </mesh>
          <mesh castShadow position={[0, 0.2, 0]} material={mats.spindle}>
            <coneGeometry args={[0.12, 0.14, 24]} />
          </mesh>
        </group>

        <InstancedPins material={mats.gold} hoverHighlightRef={hoverHighlightRef} />
        <RimStreaks spinSpeed={spinSpeed} wheelAngleRef={angleRef} />
        <WheelNumberRing />
        <WheelSectorNeon />

        {EUROPEAN_SEQUENCE.map((num, i) => {
          const centerAngle = pocketIndexToAngle(i);
          const midR = (WHEEL.trackRadius + WHEEL.pocketInner) * 0.5;
          const [px, py, pz] = positionOnRing(midR, centerAngle, 0.08);
          const dividerAngle = i * POCKET_ANGLE;
          const [dx, dy, dz] = positionOnRing(WHEEL.trackRadius, dividerAngle, 0.1);
          const pocketDepth = (WHEEL.trackRadius - WHEEL.pocketInner) * 0.75;
          const pocketWidth = POCKET_ANGLE * midR * 0.95;

          return (
            <group key={`p-${num}-${i}`}>
              <mesh
                position={[px, py, pz]}
                rotation={[0, centerAngle, 0]}
                receiveShadow
                material={pocketMats[i]}
              >
                <boxGeometry args={[pocketDepth, 0.028, pocketWidth]} />
              </mesh>
              <mesh
                ref={(el) => {
                  underlineRefs.current[i] = el;
                }}
                position={[px, py - 0.028, pz]}
                rotation={[0, centerAngle, 0]}
                material={underlineMats[i]}
              >
                <boxGeometry args={[pocketDepth * 0.92, 0.006, pocketWidth * 0.88]} />
              </mesh>
              <CuboidCollider
                args={[WHEEL.dividerThickness * 0.5, WHEEL.dividerHeight * 0.5, 0.03]}
                position={[dx, dy, dz]}
                rotation={[0, dividerAngle, 0]}
                friction={0.55}
                restitution={0.5}
              />
              <CuboidCollider
                sensor
                args={[pocketDepth * 0.5, 0.04, pocketWidth * 0.5]}
                position={[px, py, pz]}
                rotation={[0, centerAngle, 0]}
                onIntersectionEnter={() => onPocketHit?.(i, num)}
              />
            </group>
          );
        })}

        <WheelNumberRing />

        <CuboidCollider
          args={[WHEEL.outerRadius, 0.05, 0.04]}
          position={[0, 0.14, WHEEL.outerRadius - 0.02]}
          rotation={[0.15, 0, 0]}
          friction={0.4}
          restitution={0.55}
        />
        <CuboidCollider
          args={[WHEEL.outerRadius, 0.05, 0.04]}
          position={[0, 0.14, -(WHEEL.outerRadius - 0.02)]}
          rotation={[-0.15, 0, 0]}
          friction={0.4}
          restitution={0.55}
        />
      </group>
    </RigidBody>
  );
}

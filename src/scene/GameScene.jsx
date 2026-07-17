import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AdaptiveDpr, AdaptiveEvents, ContactShadows, Environment, Stars } from '@react-three/drei';
import { useGame } from '../context/GameContext.jsx';
import {
  isRapierStageReady,
  loadRapierStage,
  shouldMountPhysics,
  shouldPrefetchPhysics,
} from '../lib/loadRapier.js';
import { MaterialLibrary } from './MaterialLibrary.jsx';
import { VIPLighting } from './VIPLighting.jsx';
import { VIPPostFX } from './VIPPostFX.jsx';
import { FeltTable } from './FeltTable.jsx';
import { EuropeanWheelVisual } from './EuropeanWheelVisual.jsx';
import { WinParticles } from './WinParticles.jsx';
import { FloatingWinText } from './FloatingWinText.jsx';
import { CinematicCamera } from './CinematicCamera.jsx';
import { SparkBurst } from './SparkBurst.jsx';
import { PerformanceMonitor } from './PerformanceMonitor.jsx';
import { QuantumProbabilityArc } from './QuantumProbabilityArc.jsx';
import { VolumetricGodRays } from './VolumetricGodRays.jsx';
import { LoungeDust } from './LoungeDust.jsx';
import { BallFrictionVapor } from './BallFrictionVapor.jsx';

const RapierStage = lazy(() => loadRapierStage().then((m) => ({ default: m.RapierStage })));

function IdleWheelStage({ wheelSpinSpeed, winningNumber, onWheelAngle }) {
  return (
    <>
      <FeltTable />
      <EuropeanWheelVisual
        spinSpeed={wheelSpinSpeed}
        winningNumber={winningNumber}
        onWheelAngle={onWheelAngle}
      />
    </>
  );
}

export function GameScene() {
  const {
    clock,
    clockRef,
    wheelSpinSpeed,
    targetNumber,
    winningNumber,
    qualitySettings,
    qualityTier,
    onPocketHit,
    onWheelAngle,
    particleBurst,
    lastWin,
    setPhysicsLoadState,
  } = useGame();

  const mountPhysics = shouldMountPhysics(clock);
  const [stageReady, setStageReady] = useState(false);

  const completeRapierPrefetch = useCallback((isCancelled) => {
    setPhysicsLoadState?.('prefetching');
    return loadRapierStage()
      .then(() => {
        if (isCancelled?.()) return;
        setStageReady(true);
        setPhysicsLoadState?.('ready');
      })
      .catch(() => {
        if (isCancelled?.()) return;
        setPhysicsLoadState?.('error');
      });
  }, [setPhysicsLoadState]);

  useEffect(() => {
    if (!shouldPrefetchPhysics(clock, qualityTier)) return;
    let cancelled = false;
    void completeRapierPrefetch(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [clock.cycleId, clock.name, clock.cycleSecond, qualityTier, completeRapierPrefetch]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) return;
      const snap = clockRef?.current ?? clock;
      if (!shouldPrefetchPhysics(snap, qualityTier)) return;
      void completeRapierPrefetch();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [clock, clockRef, qualityTier, completeRapierPrefetch]);

  useEffect(() => {
    if (mountPhysics) return;
    setStageReady(false);
    void isRapierStageReady().then((ready) => {
      setPhysicsLoadState?.(ready ? 'ready' : 'idle');
    });
  }, [mountPhysics, setPhysicsLoadState]);

  useEffect(() => {
    if (!mountPhysics) return;
    let cancelled = false;
    void isRapierStageReady().then((ready) => {
      if (!cancelled && ready) setStageReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mountPhysics]);

  useEffect(() => {
    if (!mountPhysics || stageReady) return;
    let cancelled = false;
    void completeRapierPrefetch(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [mountPhysics, stageReady, completeRapierPrefetch]);

  const showPhysics = mountPhysics && stageReady;

  return (
    <MaterialLibrary>
      <PerformanceMonitor />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <color attach="background" args={['#030408']} />
      <fog attach="fog" args={['#030408', 12, 32]} />

      <Stars
        radius={80}
        depth={40}
        count={qualitySettings.starCount}
        factor={3}
        saturation={0}
        fade
        speed={0.4}
      />

      <VIPLighting
        shadowsEnabled={qualitySettings.shadows}
        shadowMapSize={qualitySettings.shadowMapSize ?? 2048}
      />
      <VolumetricGodRays />
      <LoungeDust />
      <Environment preset="night" blur={qualitySettings.envBlur} environmentIntensity={0.45} />

      <CinematicCamera />
      <SparkBurst />
      <QuantumProbabilityArc />
      <BallFrictionVapor />

      {showPhysics ? (
        <Suspense
          fallback={
            <IdleWheelStage
              wheelSpinSpeed={wheelSpinSpeed}
              winningNumber={winningNumber}
              onWheelAngle={onWheelAngle}
            />
          }
        >
          <RapierStage />
        </Suspense>
      ) : (
        <IdleWheelStage
          wheelSpinSpeed={wheelSpinSpeed}
          winningNumber={winningNumber}
          onWheelAngle={onWheelAngle}
        />
      )}

      <WinParticles burstKey={particleBurst} active={particleBurst > 0 && lastWin > 0} />
      <FloatingWinText amount={lastWin} trigger={particleBurst} />

      {qualitySettings.contactShadows && (
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.72}
          scale={14}
          blur={3}
          far={8}
          color="#060a12"
        />
      )}

      <VIPPostFX />
    </MaterialLibrary>
  );
}

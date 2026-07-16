import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import { GameProvider, useGame } from './context/GameContext.jsx';
import { GameScene } from './scene/GameScene.jsx';
import { BettingBoard } from './ui/BettingBoard.jsx';
import { InstallPrompt } from './ui/InstallPrompt.jsx';
import { PayoutToast } from './ui/PayoutToast.jsx';
import { IconVolumeOff, IconVolumeOn } from './ui/icons.jsx';
import { useWebGLRecovery } from './hooks/useWebGLRecovery.js';
import APP_CONFIG from '@core/config.js';

function TopHud() {
  const { clock, ballPhase, qualityTier, liveFps, audioMuted, toggleAudio } = useGame();
  const phaseLabel =
    ballPhase === 'descent'
      ? 'Descent'
      : ballPhase === 'orbit'
        ? 'Orbital'
        : ballPhase === 'free'
          ? 'Live Drop'
          : ballPhase === 'guided'
            ? 'Settling'
            : ballPhase;

  return (
    <div className="hud-top">
      <div className="brand">
        {APP_CONFIG.name}
        <span>VIP Lounge · Web3 Edition</span>
      </div>
      <div className={`phase-pill phase-${clock.name}`} data-testid="phase-pill">
        <strong>{clock.name}</strong> · {phaseLabel} · Cycle {clock.cycleId} · {clock.cycleSecond}s
      </div>
      <div className="hud-controls">
        <span className={`quality-badge tier-${qualityTier}`} title="Adaptive quality tier">
          {qualityTier.toUpperCase()} · {liveFps} FPS
        </span>
        <button
          type="button"
          className={`audio-toggle ${audioMuted ? 'muted' : ''}`}
          onClick={() => toggleAudio()}
          aria-label={audioMuted ? 'Unmute sound and haptics' : 'Mute sound and haptics'}
          aria-pressed={!audioMuted}
        >
          {audioMuted ? <IconVolumeOff /> : <IconVolumeOn />}
        </button>
      </div>
    </div>
  );
}

function ScreenEffects() {
  const { settleFlash, clock, securityFrozen } = useGame();
  return (
    <>
      {settleFlash && <div className="settle-flash" aria-hidden />}
      {clock.name === 'locked' && <div className="lock-vignette" aria-hidden />}
      {securityFrozen && (
        <div className="security-freeze" role="alert" aria-live="assertive">
          <div className="security-freeze-panel">
            <strong>Security Hold</strong>
            <p>Wallet state was modified outside the game. Session restored.</p>
          </div>
        </div>
      )}
    </>
  );
}

function AppInner() {
  const { qualitySettings, simulationPaused, recoverWebGLContext } = useGame();
  const { canvasKey, webglStatus, attachToCanvas } = useWebGLRecovery({
    onRestore: recoverWebGLContext,
  });

  return (
    <div className="game-shell">
      <div className="hud">
        <TopHud />
      </div>
      <ScreenEffects />
      {webglStatus === 'lost' && (
        <div className="webgl-recovery" role="status" aria-live="polite">
          <div className="webgl-recovery-panel">
            <strong>Graphics paused</strong>
            <p>Restoring WebGL context…</p>
          </div>
        </div>
      )}
      <PayoutToast />
      <InstallPrompt />
      <div className="layout">
        <div className="canvas-wrap vignette-edge">
          <Canvas
            key={canvasKey}
            frameloop={simulationPaused ? 'never' : 'always'}
            shadows={qualitySettings.shadows}
            dpr={[1, qualitySettings.dprMax]}
            camera={{ position: [3.8, 3.2, 4.6], fov: 42, near: 0.1, far: 55 }}
            gl={{
              antialias: qualitySettings.dprMax > 1,
              toneMapping: THREE.AgXToneMapping,
              toneMappingExposure: 1.34,
              powerPreference: 'high-performance',
            }}
            onCreated={({ gl }) => {
              attachToCanvas(gl, { shadows: qualitySettings.shadows });
            }}
          >
            <Suspense fallback={null}>
              <GameScene />
            </Suspense>
          </Canvas>
        </div>
        <BettingBoard />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
}

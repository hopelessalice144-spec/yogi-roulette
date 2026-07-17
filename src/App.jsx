import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameProvider, useGame } from './context/GameContext.jsx';
import { GameScene } from './scene/GameScene.jsx';
import { BettingBoard } from './ui/BettingBoard.jsx';
import { InstallPrompt } from './ui/InstallPrompt.jsx';
import { LockPhaseBanner } from './ui/LockPhaseBanner.jsx';
import { PayoutToast } from './ui/PayoutToast.jsx';
import { PhasePill } from './ui/PhasePill.jsx'; // data-testid="phase-pill"
import { ShortcutsOverlay } from './ui/ShortcutsOverlay.jsx';
import { WinStreakBadge } from './ui/WinStreakBadge.jsx';
import { IconThemeLight, IconThemeLounge, IconThemeNeon, IconVolumeOff, IconVolumeOn } from './ui/icons.jsx';
import {
  UI_THEME_LIGHT,
  UI_THEME_LOUNGE,
  UI_THEME_NEON,
  cycleUiTheme as nextUiTheme,
  themeLabel,
  themeSubtitle,
} from './lib/uiTheme.js';
import { useWebGLRecovery } from './hooks/useWebGLRecovery.js';
import APP_CONFIG from '@core/config.js';
import { settleRimGlowKey, shouldSettleRimGlow } from './lib/settleRimGlow.js';
import { shouldSettleRimGlowEntryPulse } from './lib/settleRimGlowEntryPulse.js';
import { shouldSpinActiveEntryPulse } from './lib/spinActiveEntryPulse.js';
import { shouldShortcutsOverlayReadyGlow } from './lib/shortcutsOverlayReadyGlow.js';
import { shouldShortcutsOverlayReadyEntryPulse } from './lib/shortcutsOverlayReadyEntryPulse.js';
import { shouldQualityBadgeTierEntryPulse } from './lib/qualityBadgeTierEntryPulse.js';
import { shouldAudioToggleReadyGlow } from './lib/audioToggleReadyGlow.js';
import { shouldAudioToggleReadyEntryPulse } from './lib/audioToggleReadyEntryPulse.js';
import { shouldThemeToggleReadyGlow } from './lib/themeToggleReadyGlow.js';
import { shouldThemeToggleReadyEntryPulse } from './lib/themeToggleReadyEntryPulse.js';
import { shouldBrandSubtitleEntryPulse } from './lib/brandSubtitleEntryPulse.js';

function TopHud({ onOpenShortcuts, bettingOpen, shortcutsOpen }) {
  const {
    clock,
    ballPhase,
    qualityTier,
    liveFps,
    audioMuted,
    uiTheme,
    sessionRounds,
    toggleAudio,
    cycleUiTheme,
  } = useGame();
  const isNeon = uiTheme === UI_THEME_NEON;
  const isLight = uiTheme === UI_THEME_LIGHT;
  const nextTheme = nextUiTheme(uiTheme);
  const themeToggleReadyGlow = shouldThemeToggleReadyGlow(sessionRounds);
  const prevThemeToggleReadyRef = useRef(false);
  const [themeToggleReadyEntryPulsing, setThemeToggleReadyEntryPulsing] = useState(false);
  const themeToggleClass = [
    'theme-toggle',
    isNeon ? 'neon-active' : '',
    isLight ? 'light-active' : '',
    themeToggleReadyGlow ? 'theme-toggle-ready-glow-active' : '',
    themeToggleReadyEntryPulsing ? 'theme-toggle-ready-entry-pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const ThemeNextIcon =
    uiTheme === UI_THEME_LOUNGE
      ? IconThemeNeon
      : uiTheme === UI_THEME_NEON
        ? IconThemeLight
        : IconThemeLounge;
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
  const shortcutsReadyGlow = shouldShortcutsOverlayReadyGlow(bettingOpen, shortcutsOpen);
  const prevShortcutsReadyRef = useRef(false);
  const [shortcutsReadyEntryPulsing, setShortcutsReadyEntryPulsing] = useState(false);
  const audioToggleReadyGlow = shouldAudioToggleReadyGlow(audioMuted);
  const prevAudioToggleReadyRef = useRef(false);
  const [audioToggleReadyEntryPulsing, setAudioToggleReadyEntryPulsing] = useState(false);
  const prevQualityTierRef = useRef(qualityTier);
  const [qualityTierEntryPulsing, setQualityTierEntryPulsing] = useState(false);
  const prevThemeRef = useRef(uiTheme);
  const [subtitleEntryPulsing, setSubtitleEntryPulsing] = useState(false);

  useEffect(() => {
    const prevTheme = prevThemeRef.current;
    prevThemeRef.current = uiTheme;
    if (!shouldBrandSubtitleEntryPulse(prevTheme, uiTheme)) return undefined;
    setSubtitleEntryPulsing(true);
    const timer = window.setTimeout(() => setSubtitleEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [uiTheme]);

  useEffect(() => {
    const prevTier = prevQualityTierRef.current;
    prevQualityTierRef.current = qualityTier;
    if (!shouldQualityBadgeTierEntryPulse(prevTier, qualityTier)) return undefined;
    setQualityTierEntryPulsing(true);
    const timer = window.setTimeout(() => setQualityTierEntryPulsing(false), 680);
    return () => window.clearTimeout(timer);
  }, [qualityTier]);

  useEffect(() => {
    const prevShortcutsReady = prevShortcutsReadyRef.current;
    prevShortcutsReadyRef.current = shortcutsReadyGlow;
    if (!shouldShortcutsOverlayReadyEntryPulse(prevShortcutsReady, shortcutsReadyGlow)) return undefined;
    setShortcutsReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setShortcutsReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [shortcutsReadyGlow]);

  useEffect(() => {
    const prevAudioToggleReady = prevAudioToggleReadyRef.current;
    prevAudioToggleReadyRef.current = audioToggleReadyGlow;
    if (!shouldAudioToggleReadyEntryPulse(prevAudioToggleReady, audioToggleReadyGlow)) return undefined;
    setAudioToggleReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setAudioToggleReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [audioToggleReadyGlow]);

  useEffect(() => {
    const prevThemeToggleReady = prevThemeToggleReadyRef.current;
    prevThemeToggleReadyRef.current = themeToggleReadyGlow;
    if (!shouldThemeToggleReadyEntryPulse(prevThemeToggleReady, themeToggleReadyGlow)) return undefined;
    setThemeToggleReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setThemeToggleReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [themeToggleReadyGlow]);

  return (
    <div className="hud-top">
      <div className="brand" aria-label={APP_CONFIG.name}>
        <span className="brand-mark" aria-hidden>
          <span>Y</span>
        </span>
        <span className="brand-copy">
          <span className="brand-eyebrow">Private table · European</span>
          <strong>{APP_CONFIG.name}</strong>
          <span className={subtitleEntryPulsing ? 'brand-subtitle-entry-pulse' : ''}>
            {themeSubtitle(uiTheme)}
          </span>
        </span>
      </div>
      <PhasePill clock={clock} phaseLabel={phaseLabel} />
      <WinStreakBadge sessionRounds={sessionRounds} />
      <div className="hud-controls">
        <span
          className={[
            'quality-badge',
            `tier-${qualityTier}-active`,
            qualityTierEntryPulsing ? 'quality-badge-tier-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          title="Adaptive rendering quality"
        >
          <span className="quality-dot" aria-hidden />
          {qualityTier.toUpperCase()} · {liveFps} FPS
        </span>
        <button
          type="button"
          className={[
            'shortcuts-help-toggle',
            shortcutsReadyGlow ? 'shortcuts-ready-glow-active' : '',
            shortcutsReadyEntryPulsing ? 'shortcuts-ready-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={onOpenShortcuts}
          aria-label="Show keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <span aria-hidden>?</span>
        </button>
        <button
          type="button"
          className={themeToggleClass}
          onClick={() => cycleUiTheme()}
          aria-label={`Switch to ${themeLabel(nextTheme)} theme`}
          aria-pressed={uiTheme !== UI_THEME_LOUNGE}
          title={`${themeLabel(nextTheme)} theme`}
        >
          <ThemeNextIcon />
        </button>
        <button
          type="button"
          className={[
            'audio-toggle',
            audioMuted ? 'muted' : '',
            audioToggleReadyGlow ? 'audio-toggle-ready-glow-active' : '',
            audioToggleReadyEntryPulsing ? 'audio-toggle-ready-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
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
  const {
    qualitySettings,
    simulationPaused,
    recoverWebGLContext,
    clock,
    hudPhase,
    winCelebration,
    chipValues,
    setSelectedChip,
    undoLastBet,
    canUndoBet,
    repeatLastRound,
    canRepeatLastRound,
    clearBets,
    scaleBoardStake,
    canScaleBoardHalf,
    canScaleBoardDouble,
    favorites,
    applyFavoriteBets,
    revealedWinningNumber,
  } = useGame();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const prevSettleRimGlowRef = useRef(false);
  const [settleRimGlowEntryPulsing, setSettleRimGlowEntryPulsing] = useState(false);
  const isWheelSpinning =
    clock.name === 'spinning' || hudPhase === 'spin-focus' || hudPhase === 'settle-reveal';
  const prevSpinActiveRef = useRef(false);
  const [spinActiveEntryPulsing, setSpinActiveEntryPulsing] = useState(false);
  const bettingOpen = clock.acceptsBets ?? clock.name === 'betting';
  const settleRimGlow = shouldSettleRimGlow(hudPhase, revealedWinningNumber);
  const rimGlowKey = settleRimGlowKey(revealedWinningNumber, hudPhase);

  useEffect(() => {
    const prevSettleRimGlow = prevSettleRimGlowRef.current;
    prevSettleRimGlowRef.current = settleRimGlow;
    if (!shouldSettleRimGlowEntryPulse(prevSettleRimGlow, settleRimGlow)) return undefined;
    setSettleRimGlowEntryPulsing(true);
    const timer = window.setTimeout(() => setSettleRimGlowEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [settleRimGlow]);

  useEffect(() => {
    const prevSpinActive = prevSpinActiveRef.current;
    prevSpinActiveRef.current = isWheelSpinning;
    if (!shouldSpinActiveEntryPulse(prevSpinActive, isWheelSpinning)) return undefined;
    setSpinActiveEntryPulsing(true);
    const timer = window.setTimeout(() => setSpinActiveEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [isWheelSpinning]);
  const winShakeClass =
    winCelebration?.tier && winCelebration.tier !== 'none'
      ? ` win-shake win-shake-${winCelebration.tier}`
      : '';
  const { canvasKey, webglStatus, attachToCanvas } = useWebGLRecovery({
    onRestore: recoverWebGLContext,
  });

  return (
    <div className="game-shell">
      <div className="hud">
        <TopHud
          onOpenShortcuts={() => setShortcutsOpen(true)}
          bettingOpen={bettingOpen}
          shortcutsOpen={shortcutsOpen}
        />
      </div>
      <ScreenEffects />
      <ShortcutsOverlay
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        chipValues={chipValues}
        onSelectChip={setSelectedChip}
        onUndo={undoLastBet}
        canUndo={canUndoBet}
        onRepeat={repeatLastRound}
        canRepeat={canRepeatLastRound}
        onClear={clearBets}
        onScaleHalf={() => scaleBoardStake(0.5)}
        canScaleHalf={canScaleBoardHalf}
        onScaleDouble={() => scaleBoardStake(2)}
        canScaleDouble={canScaleBoardDouble}
        favorites={favorites}
        onApplyFavorite={applyFavoriteBets}
        bettingOpen={bettingOpen}
      />
      {webglStatus === 'lost' && (
        <div className="webgl-recovery" role="status" aria-live="polite">
          <div className="webgl-recovery-panel">
            <strong>Graphics paused</strong>
            <p>Restoring WebGL context…</p>
          </div>
        </div>
      )}
      <PayoutToast />
      <LockPhaseBanner />
      <InstallPrompt />
      <div className="layout">
        <div
          key={winCelebration?.pulse ?? 0}
          className={`canvas-wrap vignette-edge${isWheelSpinning ? ' spin-active-active' : ''}${spinActiveEntryPulsing ? ' spin-active-entry-pulse' : ''}${settleRimGlow ? ' settle-rim-glow-active' : ''}${settleRimGlowEntryPulsing ? ' settle-rim-glow-entry-pulse' : ''}${winShakeClass}`}
        >
          <div className="table-meta" aria-hidden>
            <span className="table-meta-line" />
            <span>Live table</span>
            <strong>European single zero</strong>
          </div>
          <div className="table-watermark" aria-hidden>
            <span>Y</span>
          </div>
          {settleRimGlow && (
            <div className="canvas-settle-rim" aria-hidden key={rimGlowKey} />
          )}
          <Canvas
            key={canvasKey}
            frameloop={simulationPaused ? 'never' : 'always'}
            shadows={qualitySettings.shadows}
            dpr={[1, qualitySettings.dprMax]}
            camera={{ position: [0.35, 3.65, 5.2], fov: 48, near: 0.1, far: 55 }}
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

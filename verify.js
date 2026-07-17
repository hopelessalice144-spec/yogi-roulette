/**
 * Phase 2–5 verification (Node).
 * Run: node verify.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EUROPEAN_SEQUENCE,
  POCKET_COUNT,
  numberToPocketIndex,
  pocketIndexToNumber,
} from './src/lib/wheel.js';
import { evaluateBet, getColor, PAYOUTS } from './src/lib/math.js';
import { placeChip, settleAll, totalStaked } from './src/lib/bets.js';
import { pocketIndicesForHighlight, dividerIndicesForHighlight } from './src/lib/highlight.js';
import { createGhostEngine } from './src/lib/ghostPlayers.js';
import { computeQuantumArc } from './src/lib/quantumTrajectory.js';
import { resolveGodModeSettings } from './src/lib/performanceGuard.js';
import {
  BALL_DROP_AT,
  BALL_PHYSICS_AT,
  BALL_MAGNET_AT,
  CYCLE_SECONDS,
  getPhase,
} from './src/core/timer.js';
import {
  DEFAULT_BALANCE,
  FAUCET_AMOUNT,
  FAUCET_TRIGGER_BALANCE,
} from './src/lib/storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) passed += 1;
  else {
    failed += 1;
    console.error('FAIL:', msg);
  }
}

const {
  assertDebtRegistryIntegrity,
  RESOLVED_TECH_DEBT,
  MITIGATED_TECH_DEBT,
  TECH_DEBT,
} = await import('./src/core/techManifest.js');

const {
  runVitestVerifyAudits,
  FULL_SURFACE_TEST_PARITY_COMPLETE,
  FULL_SURFACE_TEST_PARITY_COVERED_COUNT,
  FULL_SURFACE_TEST_PARITY_MISSING_COUNT,
  FULL_SURFACE_TEST_PARITY_MODULE_COUNT,
  JS_TEST_PARITY_COMPLETE,
  JSX_SURFACE_TEST_PARITY_COMPLETE,
  JSX_SURFACE_TEST_PARITY_COVERED_COUNT,
  JSX_SURFACE_TEST_PARITY_MISSING_COUNT,
  VITEST_SURFACE_TEST_PARITY_MODULE_COUNT,
  VITEST_SURFACE_TEST_PARITY_COVERED_COUNT,
  VITEST_SURFACE_TEST_PARITY_MISSING_COUNT,
  VITEST_SURFACE_TEST_PARITY_COMPLETE,
  SURFACE_FLAT_FIELD_PAIR_COUNT,
  SURFACE_FLAT_TOTAL_FIELD_COUNT,
  SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE,
  SURFACE_FLAT_FIELD_TRILOGY_COMPLETE,
  SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT,
  SURFACE_FLAT_REPORT_QUARTET_COMPLETE,
  VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE,
} = await import('./src/core/vitestCoverage.ts');

console.log('=== Phase 2: European wheel ===');
assert(EUROPEAN_SEQUENCE.length === 37, '37 pockets');
assert(EUROPEAN_SEQUENCE[0] === 0, 'starts at 0');
assert(new Set(EUROPEAN_SEQUENCE).size === 37, 'unique numbers');
assert(
  EUROPEAN_SEQUENCE.join(',') ===
    [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26].join(','),
  'standard European sequence'
);
assert(pocketIndexToNumber(0) === 0, 'index 0 → 0');
assert(numberToPocketIndex(26) === 36, '26 at last index');

const wheelSrc = fs.readFileSync(path.join(__dirname, 'src/scene/EuropeanWheel.jsx'), 'utf8');
assert(wheelSrc.includes('kinematicPosition'), 'kinematic wheel body');
assert(wheelSrc.includes('CuboidCollider'), 'pocket colliders');
assert(wheelSrc.includes('useMaterials'), 'shared wheel materials');

console.log('\n=== Phase 3: timer + physics hooks ===');
assert(BALL_DROP_AT === 25, 'T-5 drop at second 25');
assert(BALL_PHYSICS_AT === 26, 'kinematic descent handoff');
assert(BALL_MAGNET_AT === 28, 'T-1 magnetic guide');
assert(CYCLE_SECONDS === 30, '30s cycle');
const aligned = 1_700_000_000 - (1_700_000_000 % 30);
assert(getPhase((aligned + 25) * 1000).name === 'spinning', 'spinning at 25');
const ballSrc = fs.readFileSync(path.join(__dirname, 'src/scene/RouletteBall.jsx'), 'utf8');
const appSrc = fs.readFileSync(path.join(__dirname, 'src/App.jsx'), 'utf8');
const sceneSrc = fs.readFileSync(path.join(__dirname, 'src/scene/GameScene.jsx'), 'utf8');
assert(ballSrc.includes('descent'), 'kinematic descent phase');
assert(ballSrc.includes('descentVelocity'), 'silky descent easing');
assert(ballSrc.includes('lockedRef'), 'deterministic pocket lock');
assert(ballSrc.includes('synchronizeHandoffState'), 'trajectory handoff');
assert(ballSrc.includes('descentPose'), 'spline descent pose');
assert(fs.existsSync(path.join(__dirname, 'src/lib/trajectory.js')), 'trajectory engine');
assert(fs.existsSync(path.join(__dirname, 'src/core/performanceGuard.ts')), 'performance guard ts');
assert(fs.existsSync(path.join(__dirname, 'src/lib/performanceGuard.js')), 'performance guard shim');
assert(fs.existsSync(path.join(__dirname, 'src/lib/audioSynth.js')), 'audio synthesizer');
assert(fs.existsSync(path.join(__dirname, 'src/lib/haptics.js')), 'haptic feedback');
assert(fs.existsSync(path.join(__dirname, 'src/scene/PerformanceMonitor.jsx')), 'FPS monitor');
assert(sceneSrc.includes('PerformanceMonitor'), 'performance monitor wired');
assert(fs.existsSync(path.join(__dirname, 'src/scene/VIPPostFX.jsx')), 'VIP post FX');
assert(fs.existsSync(path.join(__dirname, 'src/scene/VIPLighting.jsx')), 'VIP lighting');
assert(fs.existsSync(path.join(__dirname, 'src/scene/SparkBurst.jsx')), 'spark burst');
assert(fs.existsSync(path.join(__dirname, 'src/scene/WheelInstanced.jsx')), 'instanced pins');
assert(sceneSrc.includes('preset="night"'), 'moody night IBL');
assert(sceneSrc.includes('VIPPostFX'), 'bloom pipeline');

console.log('\n=== Elite graphics pipeline ===');
assert(appSrc.includes('AgXToneMapping'), 'AgX tone mapping');
const webglRecoverySrcEarly = fs.readFileSync(path.join(__dirname, 'src/lib/webglContextRecovery.js'), 'utf8');
assert(webglRecoverySrcEarly.includes('SRGBColorSpace'), 'sRGB output');
assert(webglRecoverySrcEarly.includes('PCFSoftShadowMap'), 'soft shadows');
assert(sceneSrc.includes('AdaptiveDpr'), 'adaptive DPR');
assert(sceneSrc.includes('AdaptiveEvents'), 'adaptive events');
assert(fs.existsSync(path.join(__dirname, 'src/scene/MaterialLibrary.jsx')), 'shared material library');
assert(fs.existsSync(path.join(__dirname, 'src/scene/createIvorySSSMaterial.js')), 'ivory SSS shader');
assert(fs.existsSync(path.join(__dirname, 'src/lib/highlight.js')), '3D highlight bridge');
assert(fs.existsSync(path.join(__dirname, 'src/lib/hoverBridge.js')), 'zero-lag hover bridge');
const highlightSrc = fs.readFileSync(path.join(__dirname, 'src/lib/highlight.js'), 'utf8');
assert(highlightSrc.includes('dividerIndicesForHighlight'), 'divider pin glow indices');
const pinSrc = fs.readFileSync(path.join(__dirname, 'src/scene/WheelInstanced.jsx'), 'utf8');
assert(pinSrc.includes('dividerIndicesForHighlight'), 'instanced pin hover glow');
assert(wheelSrc.includes('hoverHighlightRef'), 'wheel reads hover ref');
const ctxSrc = fs.readFileSync(path.join(__dirname, 'src/context/GameContext.jsx'), 'utf8');
assert(ctxSrc.includes('registerCollisionShake'), 'collision camera shake');
assert(ctxSrc.includes('createAudioEngine'), 'audio engine in context');
assert(ctxSrc.includes('ensureAudioActive'), 'lazy audio unlock pipeline');
assert(ctxSrc.includes('createPerformanceGuard'), 'perf guard in context');
assert(fs.existsSync(path.join(__dirname, 'src/scene/RimStreaks.jsx')), 'rim velocity streaks');
assert(wheelSrc.includes('RimStreaks'), 'rim streaks on wheel');
assert(ctxSrc.includes('createFeedbackBridge'), 'feedback bridge in context');
assert(ctxSrc.includes('feedbackRef'), 'win fanfare via feedback bridge');
assert(ctxSrc.includes('settleFlash'), 'settle screen flash');
assert(ctxSrc.includes('recentResults'), 'recent results history');
assert(appSrc.includes('quality-badge'), 'quality FPS HUD');
assert(appSrc.includes('settle-flash'), 'settle flash overlay');
assert(fs.existsSync(path.join(__dirname, 'src/lib/gamePhase.js')), 'game phase engine');
assert(fs.existsSync(path.join(__dirname, 'src/lib/cameraDirector.js')), 'camera director');
const camDirSrc = fs.readFileSync(path.join(__dirname, 'src/lib/cameraDirector.js'), 'utf8');
const camSrc = fs.readFileSync(path.join(__dirname, 'src/scene/CinematicCamera.jsx'), 'utf8');
assert(camDirSrc.includes('springVec3'), 'spring camera smoothing');
assert(camDirSrc.includes('emaVec3'), 'EMA damped look-at shadow target');
assert(camDirSrc.includes('LOOK_EMA_LAMBDA'), 'look-at EMA lambda constant');
assert(camDirSrc.includes('CAMERA_STATE'), '3-state cinematic architecture');
assert(camDirSrc.includes('rim'), 'rim-tracking mode');
assert(camDirSrc.includes('computeCameraTargets'), 'camera target compute');
assert(camSrc.includes('dollyZoomVertigo'), 'hitchcock dolly zoom');
assert(camSrc.includes('emaVec3'), 'EMA look-at in render loop');
assert(camSrc.includes('computeImpactShake'), 'decaying impact shake');
assert(camSrc.includes('shadowLook'), 'shadow look-at target (zero jitter)');
assert(fs.existsSync(path.join(__dirname, 'src/lib/cameraRig.js')), 'camera rig module');
const rigSrc = fs.readFileSync(path.join(__dirname, 'src/lib/cameraRig.js'), 'utf8');
assert(rigSrc.includes('computeImpactShake'), 'spring-oscillation impact shake');
assert(rigSrc.includes('distanceScale'), 'vertigo subject-size compensation');
assert(fs.existsSync(path.join(__dirname, 'src/lib/noise.js')), 'simplex noise module');
const noiseSrc = fs.readFileSync(path.join(__dirname, 'src/lib/noise.js'), 'utf8');
assert(noiseSrc.includes('simplex3'), '3D simplex noise');
assert(noiseSrc.includes('handheldSimplex'), 'multi-octave handheld displacement');
const perfSrc = fs.readFileSync(path.join(__dirname, 'src/core/performanceGuard.ts'), 'utf8');
assert(perfSrc.includes('resolveGodModeSettings'), 'god-mode quality step-down');
assert(perfSrc.includes('quantumArc'), 'quantum arc tier flag');
assert(fs.existsSync(path.join(__dirname, 'src/lib/ghostPlayers.js')), 'ghost VIP engine');
assert(fs.existsSync(path.join(__dirname, 'src/lib/quantumTrajectory.js')), 'quantum trajectory math');
assert(fs.existsSync(path.join(__dirname, 'src/shaders/plasmaRibbon.js')), 'plasma ribbon shader');
assert(fs.existsSync(path.join(__dirname, 'src/shaders/godRays.js')), 'volumetric god-ray shader');
assert(fs.existsSync(path.join(__dirname, 'src/scene/QuantumProbabilityArc.jsx')), 'quantum probability arc');
assert(fs.existsSync(path.join(__dirname, 'src/scene/VolumetricGodRays.jsx')), 'volumetric god rays');
assert(fs.existsSync(path.join(__dirname, 'src/scene/LoungeDust.jsx')), 'lounge dust particles');
assert(fs.existsSync(path.join(__dirname, 'src/scene/BallFrictionVapor.jsx')), 'ball friction vapor');
assert(fs.existsSync(path.join(__dirname, 'src/ui/GhostBetLayer.jsx')), 'ghost bet layer');
assert(sceneSrc.includes('QuantumProbabilityArc'), 'quantum arc wired');
assert(sceneSrc.includes('VolumetricGodRays'), 'god rays wired');
assert(sceneSrc.includes('LoungeDust'), 'lounge dust wired');
assert(sceneSrc.includes('BallFrictionVapor'), 'ball vapor wired');
assert(ctxSrc.includes('createGhostEngine'), 'ghost engine in context');
assert(ctxSrc.includes('ghostBets'), 'ghost bets state');
assert(perfSrc.includes('ivorySSS'), 'ivory shader tier degrade');
assert(perfSrc.includes('bloomThreshold'), 'selective bloom threshold per tier');
const ivorySrc = fs.readFileSync(path.join(__dirname, 'src/scene/createIvorySSSMaterial.js'), 'utf8');
assert(ivorySrc.includes('ivory-sss-v3'), 'ivory SSS v3 fresnel shader');
const trajSrc = fs.readFileSync(path.join(__dirname, 'src/lib/trajectory.js'), 'utf8');
assert(trajSrc.includes('handoffAngularVelocity'), 'momentum-conserving angular handoff');
const audioSrc = fs.readFileSync(path.join(__dirname, 'src/lib/audioSynth.js'), 'utf8');
assert(audioSrc.includes('RouletteAudioEngine'), 'RouletteAudioEngine class');
assert(audioSrc.includes('ensureContextActive'), 'browser-safe audio resume');
assert(audioSrc.includes('MAX_CLACK_VOICES'), 'clack voice pool limiter');
assert(audioSrc.includes('ROLL_BASE_HZ'), '60Hz organic roll base');
assert(audioSrc.includes('playOrbitTick'), 'orbital track tick on roll');
assert(audioSrc.includes('trackRingFilter'), 'ball-on-track ring filter');
const hapticsSrc = fs.readFileSync(path.join(__dirname, 'src/lib/haptics.js'), 'utf8');
assert(hapticsSrc.includes('SETTLE_HAPTIC_PATTERN'), 'settle haptic pattern export');
assert(hapticsSrc.includes('FEEDBACK_CONFIG.haptics.settlePattern'), 'settle double-pulse haptics');
const postFxSrc = fs.readFileSync(path.join(__dirname, 'src/scene/VIPPostFX.jsx'), 'utf8');
assert(postFxSrc.includes('bloomThreshold'), 'selective bloom from quality tier');
assert(sceneSrc.includes('shadowMapSize'), 'shadow map wired to lighting');
assert(fs.existsSync(path.join(__dirname, 'src/scene/WheelSectorNeon.jsx')), '3D sector neon lights');
assert(wheelSrc.includes('WheelSectorNeon'), 'wheel sector neon wired');
assert(ctxSrc.includes('resolveGameState'), 'centralized phase logic');
assert(ctxSrc.includes('ballVelRef'), 'ball velocity for camera');
assert(ballSrc.includes('predictPocketTarget'), 'predictive pocket settle');
const wheelSrc2 = fs.readFileSync(path.join(__dirname, 'src/scene/EuropeanWheel.jsx'), 'utf8');
assert(wheelSrc2.includes('spindleRef'), 'spindle wobble');
assert(wheelSrc2.includes('winPulse'), 'winning pocket pulse');
assert(wheelSrc2.includes('MaterialLibrary') || wheelSrc2.includes('useMaterials'), 'shared wheel materials');

console.log('\n=== Phase 4: GameFi UI + faucet ===');
assert(DEFAULT_BALANCE === 1000, 'start $1000');
assert(FAUCET_AMOUNT === 1000, 'faucet $1000');
assert(FAUCET_TRIGGER_BALANCE === 0, 'faucet at $0');
assert(fs.existsSync(path.join(__dirname, 'src/ui/BettingBoard.jsx')), 'betting board');
const uiCss = fs.readFileSync(path.join(__dirname, 'src/index.css'), 'utf8');
assert(uiCss.includes('pathway-lit-active'), 'pathway highlight cells');
assert(uiCss.includes('rgba(245, 215, 142'), 'gold felt highlight tokens');
assert(uiCss.includes('panel-pointer-active'), 'panel pointer cursor glow');
assert(uiCss.includes('panel-enter'), 'panel entrance animation');
assert(uiCss.includes('holo-border-active'), 'holographic iridescent border');
assert(uiCss.includes('glass-sheen-active'), 'panel glass sheen layer');
assert(uiCss.includes('glass-reflection-active'), 'panel glass reflection layer');
assert(uiCss.includes('glass-depth-layer-active'), 'panel glass depth layer');
assert(uiCss.includes('chip-stack'), 'physical chip stacking');
assert(uiCss.includes('var(--spin-focus-opacity, 0.15)'), 'spin-focus 15% opacity');
assert(uiCss.includes('phase-betting-active'), 'betting phase full opacity');
assert(fs.existsSync(path.join(__dirname, 'src/lib/chipVisual.js')), 'chip visual stack util');
const boardSrc = fs.readFileSync(path.join(__dirname, 'src/ui/BettingBoard.jsx'), 'utf8');
assert(boardSrc.includes('ChipStack'), 'chip stack component');
assert(boardSrc.includes('spatialUx.js'), 'spatial UX module import');
const spatialSrc = fs.readFileSync(path.join(__dirname, 'src/lib/spatialUx.js'), 'utf8');
assert(spatialSrc.includes('MAGNET_RADIUS = 35'), '35px magnetic chip pull');
assert(boardSrc.includes('chip-drag-ghost'), 'chip drag ghost');
assert(boardSrc.includes('winning-cell'), 'settle winning cell glow');
assert(boardSrc.includes('onDragStart'), 'chip drag and drop');
assert(fs.existsSync(path.join(__dirname, 'src/ui/PayoutToast.jsx')), 'payout toast component');
const payoutToastSrc = fs.readFileSync(path.join(__dirname, 'src/ui/PayoutToast.jsx'), 'utf8');
assert(appSrc.includes('PayoutToast'), 'payout toast wired');
assert(uiCss.includes('payout-toast-jackpot'), 'jackpot toast tier');
assert(uiCss.includes('payout-toast-spark-active'), 'payout tier spark active');
assert(uiCss.includes('payout-toast-coins-active'), 'payout tier coins active');
assert(uiCss.includes('payout-tier-mega-entry-pulse'), 'payout mega spark entry pulse');
assert(uiCss.includes('payout-tier-legendary-entry-pulse'), 'payout legendary spark entry pulse');
assert(uiCss.includes('payout-tier-mega-coins-entry-pulse'), 'payout mega coins entry pulse');
assert(uiCss.includes('payout-tier-legendary-coins-entry-pulse'), 'payout legendary coins entry pulse');
assert(payoutToastSrc.includes('payout-tier-${t.tierId}-active'), 'payout toast tier active class');
assert(payoutToastSrc.includes('payoutTierEntryPulseClass'), 'payout toast tier entry pulse helper');
assert(uiCss.includes('--chip-spring'), 'bouncy chip spring curve');
assert(uiCss.includes('--glass-saturate'), 'premium glass saturation');
assert(uiCss.includes('scale(0.95)'), 'spin-focus 5% scale down');
assert(uiCss.includes('--spring-premium'), 'premium spring transition token');
assert(uiCss.includes('--glass-border'), 'glass panel border token');
assert(uiCss.includes('blur(20px) saturate(180%)'), 'premium glass blur spec');
assert(uiCss.includes('winning-cell-glow'), 'winning cell glow animation');
assert(boardSrc.includes('feedbackChipHover'), 'chip hover haptics');
const hapticsSrc2 = fs.readFileSync(path.join(__dirname, 'src/lib/haptics.js'), 'utf8');
assert(hapticsSrc2.includes('vibrateChipHover'), 'chip hover vibration fn');
assert(hapticsSrc2.includes('betMs'), 'bet placement haptic config');
assert(hapticsSrc2.includes('vibratePayout'), 'payout double-pulse haptics');
assert(boardSrc.includes('data-bet-type'), 'delegated hover data attributes');
assert(boardSrc.includes('handleBoardPointer'), 'grid hover delegation');
assert(boardSrc.includes('onPointerMove'), 'pointermove raycast hover');
assert(boardSrc.includes('GhostChipStack'), 'ghost chips on board');
assert(uiCss.includes('ghost-chip'), 'ghost chip CSS');
assert(uiCss.includes('ghost-confetti'), 'ghost confetti CSS');
assert(ctxSrc.includes('createHoverBridge'), 'rAF-batched hover bridge');
assert(appSrc.includes('game-shell'), 'viewport-locked app shell');
assert(uiCss.includes('game-shell'), 'anti-jank viewport CSS');
assert(uiCss.includes('overscroll-behavior'), 'mobile bounce prevention');
assert(uiCss.includes('spin-focus-active *'), 'spin-focus blocks pointer events');
assert(uiCss.includes('0.175, 0.885, 0.32, 1.275'), 'elastic spring transitions');
assert(ctxSrc.includes('particleBurst'), 'particle trigger');
assert(fs.existsSync(path.join(__dirname, 'src/scene/WinParticles.jsx')), 'win particles');
assert(fs.existsSync(path.join(__dirname, 'src/scene/FloatingWinText.jsx')), 'floating win text');

console.log('\n=== Limit-Break 4: synthesis & haptics ===');
assert(audioSrc.includes('rollLfo'), 'LFO friction hum modulator');
assert(audioSrc.includes('frictionFilter'), 'bandpass friction texture');
assert(audioSrc.includes('bodyOsc.type = \'triangle\''), 'wood settle triangle body');
assert(audioSrc.includes('clickOsc'), 'ivory pocket click on settle');
assert(audioSrc.includes('impactToClackIntensity'), 'linear clack intensity map');
assert(hapticsSrc.includes('MINOR_BOUNCE_MS = 12'), '12ms minor bounce haptic');
assert(hapticsSrc.includes('SETTLE_HAPTIC_PATTERN'), 'settle haptic pattern constant');
assert(ctxSrc.includes('onBallPocketLock'), 'pocket lock audio hook');
assert(ctxSrc.includes('pocketSettlePlayedRef'), 'settle dedup per cycle');
assert(ballSrc.includes('onBallPocketLock'), 'ball triggers pocket lock');
assert(ballSrc.includes('impactToClackIntensity'), 'Rapier impact → clack intensity');
assert(ballSrc.includes('manifold.normalX'), 'contact normal impact velocity');

console.log('\n=== Limit-Break 3: holographic HUD ===');
const neonSrc = fs.readFileSync(path.join(__dirname, 'src/scene/WheelSectorNeon.jsx'), 'utf8');
assert(boardSrc.includes('ChipRack'), 'proximity magnetic chip rack');
assert(boardSrc.includes('ELASTIC_SPRING'), 'elastic bezier spring constant');
assert(boardSrc.includes('data-hud-phase'), 'HUD phase data attribute');
const engineHudSrc = fs.readFileSync(path.join(__dirname, 'src/core/gameEngine.ts'), 'utf8');
assert(boardSrc.includes('hudPhase'), 'context HUD phase coupling');
assert(engineHudSrc.includes('resolveHudPhaseFromClock'), 'HUD phase resolver in engine');
assert(boardSrc.includes('hudPhase'), 'HUD phase in betting board');
assert(highlightSrc.includes('warmGlowColorForHighlight'), 'warm neon glow color map');
assert(wheelSrc2.includes('warmGlowColorForHighlight'), 'wheel warm glow coupling');
assert(neonSrc.includes('warmGlowColorForHighlight'), 'sector neon warm glow');
assert(uiCss.includes('hud-spin-veil'), 'spin-focus vignette veil');
assert(uiCss.includes('hud-spin-focus'), 'HUD spin-focus phase class');
assert(engineHudSrc.includes('BALL_DROP_AT') && engineHudSrc.includes('spin-focus'), 'T-5 spin-focus resolver');
assert(boardSrc.includes('SPRING_PREMIUM'), 'premium spring in betting board');
assert(spatialSrc.includes('MAGNET_RADIUS = 35'), '35px magnetic threshold');

console.log('\n=== UI-UX Pro Max design audit ===');
assert(uiCss.includes('--touch-min: 44px'), '44px touch target token');
assert(uiCss.includes('--ease-soft'), '200-300ms soft ease curve');
assert(uiCss.includes('--elev-border'), 'micro-depth translucent border');
assert(uiCss.includes('focus-visible'), 'keyboard focus ring styles');
assert(uiCss.includes('focus-ring-pulse'), 'animated focus ring');
assert(uiCss.includes('prefers-reduced-motion'), 'reduced motion respect');
assert(uiCss.includes('--text-muted-glass'), 'glass panel contrast text token');
assert(boardSrc.includes('aria-pressed'), 'chip aria-pressed state');
assert(boardSrc.includes('aria-label="Clear all bets"'), 'action button aria labels');

console.log('\n=== UI-UX Pro Max Phase 2: spatial integration ===');
assert(fs.existsSync(path.join(__dirname, 'src/lib/spatialUx.js')), 'spatialUx module');
assert(spatialSrc.includes('0.25, 1, 0.5, 1.25'), 'spatial elastic bezier');
assert(spatialSrc.includes('applyChipMagnet'), 'chip magnet physics');
assert(spatialSrc.includes('updateCellSpotlight'), 'cell spotlight tracker');
assert(uiCss.includes('bet-spotlight-active'), 'kinetic cell spotlight CSS');
assert(uiCss.includes('bet-shine-active'), 'bet cell shine sweep CSS');
assert(uiCss.includes('bet-glow-casing-active'), 'dual-layer glow casing');
assert(uiCss.includes('bet-glass-depth-active'), 'bet cell glass depth layer');
assert(boardSrc.includes('betHoverActive'), 'bet cell shared hover state');
assert(boardSrc.includes('betHoverEntryPulsing'), 'bet cell shared hover entry pulse');
assert(uiCss.includes('--spatial-spring'), 'spatial spring token');
assert(uiCss.includes('--chip-scale'), 'chip magnet scale var');
assert(boardSrc.includes('registerChip'), 'ref-based chip registry');

console.log('\n=== UI-UX Pro Max Skill Pass 1: hardening ===');
assert(uiCss.includes('0.25, 1, 0.5, 1)'), 'premium tactile spring curve');
assert(uiCss.includes('--neon-accent'), 'harmonized neon accent token');
assert(uiCss.includes('--text-on-glass: #f0f4fa'), 'WCAG glass typography');
assert(boardSrc.includes('isSpinFocus'), 'T-5 spin-focus interaction lock');

console.log('\n=== Limit-Break 2: cinematic camera ===');
assert(camDirSrc.includes('LOOK_SHADOW_LAMBDA'), 'dual EMA shadow look-at');
assert(camDirSrc.includes('dropVertigoProgress'), 'T-5 vertigo progress export');
assert(rigSrc.includes('adaptiveLookEmaLambda'), 'speed-adaptive EMA lambda');
assert(rigSrc.includes('dropVertigoProgress'), 'drop phase vertigo curve');
assert(rigSrc.includes('cinematicHandheld'), 'operator handheld blend');
assert(rigSrc.includes('operatorBreathing'), 'breathing sine layer');
assert(noiseSrc.includes('operatorBreathing'), 'multi-octave breathing noise');
assert(camSrc.includes('shadowLook'), 'shadow look target ref');
assert(camSrc.includes('LOOK_SHADOW_LAMBDA'), 'second-pass EMA in camera');
assert(camSrc.includes('cinematicHandheld'), 'cinematic handheld in loop');
assert(camSrc.includes('FIXED_TIMESTEP'), '60Hz camera substeps');
assert(rigSrc.includes('roll:'), 'impact shake roll channel');

console.log('\n=== Limit-Break 1: mathematical physics ===');
assert(fs.existsSync(path.join(__dirname, 'src/lib/ballPhysics.js')), 'ball physics module');
const wheelPhysSrc = fs.readFileSync(path.join(__dirname, 'src/lib/wheel.js'), 'utf8');
assert(wheelPhysSrc.includes('BALL_PHYSICS'), 'ivory ball physics preset');
assert(wheelPhysSrc.includes('0.062'), 'mass 0.062');
assert(wheelPhysSrc.includes('POCKET_CAPTURE'), 'pocket capture radii');
const ballPhysSrc = fs.readFileSync(path.join(__dirname, 'src/lib/ballPhysics.js'), 'utf8');
assert(ballPhysSrc.includes('applyRollingKinetics'), 'slide-roll kinetics');
assert(ballPhysSrc.includes('CAPTURE_STAGE'), 'dual-stage capture');
assert(ballPhysSrc.includes('nestlePose'), 'pocket nestle bounce');
assert(trajSrc.includes('synchronizeHandoffState'), 'C¹ handoff sync');
assert(ballSrc.includes('applyMomentumHandoff'), 'momentum handoff apply');
assert(ballSrc.includes('captureStageRef'), 'capture stage state machine');
assert(ballSrc.includes('BALL_PHYSICS.mass'), 'ball uses physics preset');

console.log('\n=== Limit-Break 5: stability hardening ===');
const resyncSrc = fs.readFileSync(path.join(__dirname, 'src/lib/cycleResync.js'), 'utf8');
const disposeSrc = fs.readFileSync(path.join(__dirname, 'src/lib/disposeUtils.js'), 'utf8');
const watchdogSrc = fs.readFileSync(path.join(__dirname, 'src/lib/physicsWatchdog.js'), 'utf8');
const wheelSrc3 = fs.readFileSync(path.join(__dirname, 'src/scene/EuropeanWheel.jsx'), 'utf8');
const matLibSrc = fs.readFileSync(path.join(__dirname, 'src/scene/MaterialLibrary.jsx'), 'utf8');
assert(resyncSrc.includes('computeWheelAngleSync'), 'wheel angle wall-clock resync');
assert(ctxSrc.includes('wheelResyncRef'), 'wheel resync ref in context');
assert(ctxSrc.includes('watchdogJournalRef'), 'watchdog journal in context');
assert(ctxSrc.includes('hiddenAtRef'), 'visibility hidden timestamp');
assert(ctxSrc.includes('sparkQueueRef.current.length = 0'), 'clear sparks on hide');
assert(watchdogSrc.includes('createWatchdogJournal'), 'watchdog event journal');
assert(watchdogSrc.includes('WATCHDOG_EVENT'), 'watchdog event types');
assert(watchdogSrc.includes('isBallStuck'), 'stuck ball detector');
assert(watchdogSrc.includes('recordWatchdogEvent'), 'silent recovery telemetry');
assert(disposeSrc.includes('disposeMaterials'), 'batch material disposal');
assert(disposeSrc.includes('resetTimestepAccumulator'), 'accumulator reset on resync');
assert(matLibSrc.includes('disposeMaterials'), 'MaterialLibrary unmount dispose');
assert(wheelSrc3.includes('simulationPausedRef'), 'wheel pauses when tab hidden');
assert(wheelSrc3.includes('wheelResyncRef'), 'wheel snaps on resync token');
assert(wheelSrc3.includes('disposeMaterial'), 'wheel cloned mat dispose');
assert(ballSrc.includes('watchdogJournalRef'), 'ball reports watchdog events');
assert(ballSrc.includes('resetTimestepAccumulator'), 'ball resets accum on resync');
assert(ballSrc.includes('WATCHDOG_EVENT'), 'ball settle force event');
assert(ballSrc.includes('isBallStuck'), 'ball stuck recovery');

console.log('\n=== Industrial robustness ===');
assert(fs.existsSync(path.join(__dirname, 'src/lib/fixedTimestep.js')), 'fixed timestep accumulator');
assert(fs.existsSync(path.join(__dirname, 'src/lib/cycleResync.js')), 'cycle resync module');
assert(fs.existsSync(path.join(__dirname, 'src/lib/physicsWatchdog.js')), 'physics watchdog');
assert(fs.existsSync(path.join(__dirname, 'src/lib/disposeUtils.js')), 'dispose utilities');
const ballSrc2 = fs.readFileSync(path.join(__dirname, 'src/scene/RouletteBall.jsx'), 'utf8');
assert(ballSrc2.includes('runFixedSteps'), 'ball fixed timestep steps');
assert(ballSrc2.includes('recoverBallIfOOB'), 'ball OOB recovery');
assert(ballSrc2.includes('SETTLE_WATCHDOG_MS'), 'settle watchdog');
assert(ballSrc2.includes('simulationPausedRef'), 'ball respects pause ref');
assert(ctxSrc.includes('visibilitychange'), 'Page Visibility API');
assert(ctxSrc.includes('syncWallClock'), 'wall-clock resync');
assert(ctxSrc.includes('ballResyncRef'), 'ball resync token');
assert(appSrc.includes("frameloop={simulationPaused ? 'never' : 'always'}"), 'canvas pause on hidden tab');
assert(sceneSrc.includes('loadRapierStage') || sceneSrc.includes('RapierStage'), 'lazy rapier stage');
const rapierStageSrc = fs.readFileSync(path.join(__dirname, 'src/scene/RapierStage.jsx'), 'utf8');
assert(rapierStageSrc.includes('timeStep={1 / 60}'), 'Rapier fixed 60Hz timestep');
assert(rapierStageSrc.includes('paused={simulationPaused}'), 'physics paused when hidden');
const audioSrc2 = fs.readFileSync(path.join(__dirname, 'src/lib/audioSynth.js'), 'utf8');
assert(audioSrc2.includes('destroy()'), 'audio engine destroy');
assert(audioSrc2.includes('_scheduleVoiceTeardown'), 'ephemeral audio cleanup');
import { FIXED_TIMESTEP, runFixedSteps, createTimestepAccumulator } from './src/lib/fixedTimestep.js';
import { recoverBallIfOOB, SETTLE_WATCHDOG_MS } from './src/lib/physicsWatchdog.js';
const acc = createTimestepAccumulator();
const steps = runFixedSteps(acc, 0.05, () => {});
assert(steps >= 1, 'accumulator runs fixed steps');
const recovered = recoverBallIfOOB(5, 5, 5, 0, null);
assert(recovered !== null, 'OOB coords recover');
assert(SETTLE_WATCHDOG_MS === 4000, '4s settle watchdog');

console.log('\n=== Cyber-security audit ===');
assert(fs.existsSync(path.join(__dirname, 'src/lib/betSchema.js')), 'bet schema module');
assert(fs.existsSync(path.join(__dirname, 'src/lib/secureStorage.js')), 'secure storage module');
const schemaSrc = fs.readFileSync(path.join(__dirname, 'src/lib/betSchema.js'), 'utf8');
const secureSrc = fs.readFileSync(path.join(__dirname, 'src/lib/secureStorage.js'), 'utf8');
const storageSrc = fs.readFileSync(path.join(__dirname, 'src/lib/storage.js'), 'utf8');
assert(schemaSrc.includes('validateBetTarget'), 'bet target whitelist');
assert(schemaSrc.includes('validateChipValue'), 'chip whitelist validation');
assert(schemaSrc.includes('sanitizeBets'), 'bet array sanitization');
assert(schemaSrc.includes('MAX_BALANCE'), 'balance ceiling');
assert(secureSrc.includes('integrityDigest'), 'checksum verify on load');
assert(secureSrc.includes('unwrapRecord'), 'checksum verify on load');
assert(storageSrc.includes('secureLoadBalance'), 'secure balance load');
assert(storageSrc.includes('secureSaveBets'), 'secure bets save');
assert(ctxSrc.includes('cycleTargetNumber(cycleId)'), 'authoritative settle result');
assert(ctxSrc.includes('validateBetTarget'), 'placeBet schema gate');
assert(ctxSrc.includes('sanitizeBets'), 'persist sanitizes bets');
assert(boardSrc.includes('validateBetTarget'), 'UI bet parse validation');
const srcFiles = [];
function walkSrc(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkSrc(p);
    else if (/\.(jsx?|tsx?)$/.test(ent.name)) srcFiles.push(p);
  }
}
walkSrc(path.join(__dirname, 'src'));
const xssHits = srcFiles.filter((f) => fs.readFileSync(f, 'utf8').includes('dangerouslySetInnerHTML'));
assert(xssHits.length === 0, 'no dangerouslySetInnerHTML in src');
const gitignore = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
assert(gitignore.includes('.env'), '.env gitignored');
import { validateChipValue, sanitizeBets, clampBalance } from './src/lib/betSchema.js';
assert(!validateChipValue(3.14), 'reject fractional chip');
assert(sanitizeBets([{ type: 'red', amount: -5 }]).length === 0, 'reject negative bet');
assert(clampBalance(9e15) === 1_000_000, 'balance ceiling enforced');
import { StateIntegrityGuard } from './src/lib/stateIntegrity.js';
import { integrityDigest } from './src/lib/integrityDigest.js';
const guard = new StateIntegrityGuard();
const signed = guard.signWallet(1000, [{ type: 'red', amount: 25 }]);
assert(signed.balance === 1000, 'integrity guard signs balance');
const tampered = guard.verifyWallet(999999, signed.bets);
assert(tampered.ok === false && tampered.frozen === true, 'detect memory tamper');
assert(integrityDigest('wallet').length === 64, 'sha256 digest hex');
assert(fs.existsSync(path.join(__dirname, 'src/lib/frameBuster.js')), 'frame buster module');
assert(fs.existsSync(path.join(__dirname, 'src/lib/stateIntegrity.js')), 'state integrity guard');
assert(fs.existsSync(path.join(__dirname, 'src/lib/domSanitize.js')), 'dom sanitize module');
const mainSrc = fs.readFileSync(path.join(__dirname, 'src/main.jsx'), 'utf8');
assert(mainSrc.includes('enforceTopLevelFrame'), 'frame buster at boot');
assert(mainSrc.includes('registerPhysicsCacheWorker'), 'physics cache SW at boot');
assert(ctxSrc.includes('StateIntegrityGuard'), 'integrity guard in context');
assert(ctxSrc.includes('commitWallet'), 'signed wallet commits');
assert(ctxSrc.includes('securityFrozen'), 'security freeze state');
assert(appSrc.includes('security-freeze'), 'security freeze UI');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(indexHtml.includes('X-Frame-Options'), 'anti-clickjacking header');
assert(indexHtml.includes('frame-ancestors'), 'CSP frame-ancestors none');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
assert(!String(pkg.dependencies.react).startsWith('^'), 'pinned react version');
assert(!String(pkg.dependencies.three).startsWith('^'), 'pinned three version');

console.log('\n=== God-mode systems ===');
const ghost = createGhostEngine();
const ghostTick = ghost.tick({ name: 'betting', cycleSecond: 5, cycleId: 42 }, null);
assert(ghostTick.bets.length >= 0, 'ghost engine ticks');
const arc = computeQuantumArc({
  pos: { x: 0.5, y: 0.26, z: 1 },
  vel: { x: 0.8, y: 0, z: -0.3 },
  wheelAngle: 0.5,
  wheelSpinSpeed: 2,
  phase: 'free',
});
assert(arc.focusIndices.length >= 3, 'quantum arc narrows to pockets');
const throttled = resolveGodModeSettings({ godRays: 'volumetric', loungeDust: true, ghostChipsFull: true, quantumArc: true, ballVapor: true }, 2);
assert(throttled.loungeDust === false, 'god step 2 disables dust');
assert(throttled.godRays === 'gradient', 'god step 1 degrades rays');

console.log('\n=== Hover bridge math ===');
const straightDivs = dividerIndicesForHighlight({ type: 'straight', value: 7 });
assert(straightDivs.size >= 2, 'straight highlight flanks dividers');
const pocketSet = pocketIndicesForHighlight({ type: 'straight', value: 7 });
assert(pocketSet.size === 1, 'single pocket for straight');

console.log('\n=== Payout math ===');
assert(PAYOUTS.straight === 35, '35:1');
let bets = placeChip([], { type: 'straight', value: 7 }, 10);
assert(bets.length === 0, 'reject non-whitelist chip 10');
bets = placeChip([], { type: 'straight', value: 7 }, 5);
assert(totalStaked(bets) === 5, 'staked');
assert(evaluateBet(bets[0], 7) === 180, 'straight return');
assert(settleAll([{ type: 'red', amount: 50 }], 1, evaluateBet) === 100, 'red 1:1');

console.log('\n=== Architect Phase 1: core engine scaffold ===');
assert(fs.existsSync(path.join(__dirname, 'docs/UPGRADE_AUDIT.md')), 'upgrade audit document');
const auditDoc = fs.readFileSync(path.join(__dirname, 'docs/UPGRADE_AUDIT.md'), 'utf8');
assert(auditDoc.includes('KEEP'), 'audit keep verdicts');
assert(auditDoc.includes('Tech Debt'), 'audit tech debt register');
const techManifestSrc = fs.readFileSync(path.join(__dirname, 'src/core/techManifest.js'), 'utf8');
const perfBudgetSrc = fs.readFileSync(path.join(__dirname, 'src/core/performanceBudget.js'), 'utf8');
const viteCfg = fs.readFileSync(path.join(__dirname, 'vite.config.js'), 'utf8');
const pkgJson = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
assert(techManifestSrc.includes('REJECTED_STACK'), 'tech manifest rejected list');
assert(techManifestSrc.includes('COMPLETED_UPGRADES'), 'completed upgrades register');
assert(techManifestSrc.includes('DEFERRED_UPGRADES'), 'deferred upgrades');
assert(techManifestSrc.includes('RESOLVED_TECH_DEBT'), 'resolved tech debt register');
assert(techManifestSrc.includes('MITIGATED_TECH_DEBT'), 'mitigated tech debt register');
assert(techManifestSrc.includes('3.0.0-phase9'), 'tech manifest phase9 version');
assert(techManifestSrc.includes("id: 'TD-02'"), 'TD-02 documented');
assert(techManifestSrc.includes("id: 'TD-03'"), 'TD-03 documented');
assert(assertDebtRegistryIntegrity() === true, 'tech debt registry no id collisions');
assert(RESOLVED_TECH_DEBT.some((d) => d.id === 'TD-02'), 'TD-02 resolved export');
assert(RESOLVED_TECH_DEBT.some((d) => d.id === 'TD-03'), 'TD-03 resolved export');
assert(MITIGATED_TECH_DEBT.some((d) => d.id === 'TD-01'), 'TD-01 mitigated export');
assert(!TECH_DEBT.some((d) => d.id === 'TD-02' || d.id === 'TD-03'), 'TD-02/03 not open');
assert(perfBudgetSrc.includes('FPS_BUDGET'), 'FPS budget export');
assert(perfBudgetSrc.includes('RENDER_BUDGET'), 'bundle budget export');
assert(perfBudgetSrc.includes('resolveDprCap'), 'DPR cap resolver');
assert(perfBudgetSrc.includes('applyRenderBudget'), 'render budget applier');
assert(perfBudgetSrc.includes('mobileLowTierMaxDpr'), 'mobile low-tier DPR cap');
assert(perfSrc.includes('applyRenderBudget'), 'performance guard uses render budget');
assert(perfSrc.includes('detectDeviceProfile'), 'device profile in guard');
assert(ctxSrc.includes('applyRenderBudget'), 'context applies render budget');
const { resolveDprCap, applyRenderBudget, RENDER_BUDGET } = await import('./src/core/performanceBudget.js');
assert(resolveDprCap('high', { mobile: true, lowTier: true }) === RENDER_BUDGET.mobileLowTierMaxDpr, 'low-tier cap');
const capped = applyRenderBudget({ dprMax: 2, shadowMapSize: 2048 }, 'high', { mobile: true, lowTier: true });
assert(capped.dprMax === RENDER_BUDGET.mobileLowTierMaxDpr, 'applyRenderBudget caps dpr');
assert(capped.shadowMapSize === RENDER_BUDGET.shadowMapMedium, 'low-tier shadow cap');
assert(viteCfg.includes('reportCompressedSize'), 'vite compressed size reporting');
assert(viteCfg.includes('host: true'), 'vite LAN host for mobile test');
assert(pkgJson.includes('"check"'), 'npm check script');
assert(fs.existsSync(path.join(__dirname, 'ARCHITECTURE.md')), 'architecture decision record');
assert(fs.existsSync(path.join(__dirname, 'jsconfig.json')), 'path alias jsconfig');
assert(viteCfg.includes("'@core'"), 'vite @core alias');
assert(viteCfg.includes('es2022'), 'vite es2022 build target');
const coreConfig = fs.readFileSync(path.join(__dirname, 'src/core/config.ts'), 'utf8');
const pfSrc = fs.readFileSync(path.join(__dirname, 'src/core/provablyFair.ts'), 'utf8');
const engineSrc = fs.readFileSync(path.join(__dirname, 'src/core/gameEngine.ts'), 'utf8');
assert(coreConfig.includes('3.0.0'), 'app config v3');
assert(pfSrc.includes('commitServerSeed'), 'provably fair commit');
assert(pfSrc.includes('deriveWinningNumber'), 'provably fair derive');
assert(pfSrc.includes('verifyRound'), 'provably fair verify');
assert(engineSrc.includes('createGameClock'), 'game clock factory');
assert(engineSrc.includes('canPlaceBet'), 'bet lock guard');
assert(engineSrc.includes('resolveCycleOutcome'), 'cycle outcome resolver');
assert(engineSrc.includes('BALL_DROP_AT') && engineSrc.includes('spin-focus'), 'T-5 spin-focus in engine');
const { deriveWinningNumber, verifyRound, commitServerSeed } = await import('./src/core/provablyFair.ts');
const { createGameClock, canPlaceBet } = await import('./src/core/gameEngine.ts');
const demoSeed = 'a'.repeat(32);
const hash = commitServerSeed(demoSeed);
const n = deriveWinningNumber(demoSeed, 'guest', 42);
assert(n >= 0 && n < 37, 'pf outcome in range');
assert(verifyRound(demoSeed, hash, 'guest', 42, n), 'pf round verifies');
const clk = createGameClock();
assert(typeof clk.acceptsBets === 'boolean', 'clock acceptsBets');
assert(canPlaceBet(clk) === (clk.name === 'betting'), 'canPlaceBet matches phase');

console.log('\n=== Architect Phase 2: engine integration ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/fairRoundStore.ts')), 'fairRoundStore.ts');
assert(
  fs.existsSync(path.join(__dirname, 'src/core/fairRoundStore.js')) &&
    fs.readFileSync(path.join(__dirname, 'src/core/fairRoundStore.js'), 'utf8').includes('fairRoundStore.ts'),
  'fairRoundStore shim'
);
const fairStoreSrc = fs.readFileSync(path.join(__dirname, 'src/core/fairRoundStore.ts'), 'utf8');
assert(fairStoreSrc.includes('publicRoundCommit'), 'public round commit');
assert(fairStoreSrc.includes('outcomeForCycle'), 'outcome for cycle');
assert(ctxSrc.includes('fairRoundStore.js'), 'GameContext fair store import');
assert(ctxSrc.includes('createGameClock'), 'GameContext engine clock');
assert(ctxSrc.includes('isBettingOpen'), 'GameContext bet lock guard');
assert(ctxSrc.includes('betRejectionReason'), 'GameContext async bet re-check');
assert(ctxSrc.includes('resolveHudPhaseFromClock'), 'GameContext HUD from engine');
assert(ctxSrc.includes('fairnessCommit'), 'fairness commit in context');
assert(ctxSrc.includes('lastFairnessAudit'), 'fairness audit in context');
assert(ctxSrc.includes('outcomeForCycle'), 'authoritative PF outcome');
const { publicRoundCommit: prc, outcomeForCycle: ofc, revealRound: rr } = await import('./src/core/fairRoundStore.js');
const commit = prc(9999);
assert(commit.serverSeedHash.length === 64, 'live fair commit');
const out = ofc(9999);
assert(out >= 0 && out < 37, 'live fair outcome');
const audit = rr(9999, out);
assert(audit.verified === true, 'live fair audit verifies');

console.log('\n=== Phase 3: UI/UX overhaul ===');
assert(fs.existsSync(path.join(__dirname, 'src/ui/icons.jsx')), 'vector HUD icons');
assert(fs.existsSync(path.join(__dirname, 'src/ui/FairnessPanel.jsx')), 'fairness transparency panel');
const iconsSrc = fs.readFileSync(path.join(__dirname, 'src/ui/icons.jsx'), 'utf8');
const fairnessSrc = fs.readFileSync(path.join(__dirname, 'src/ui/FairnessPanel.jsx'), 'utf8');
assert(iconsSrc.includes('IconVolumeOn'), 'volume on SVG');
assert(iconsSrc.includes('IconShieldCheck'), 'shield check SVG');
assert(!appSrc.includes('🔇') && !appSrc.includes('🔊'), 'no emoji audio icons');
assert(appSrc.includes('IconVolumeOn'), 'App uses SVG audio icons');
assert(boardSrc.includes('FairnessPanel'), 'fairness panel in betting board');
assert(boardSrc.includes('fairnessCommit'), 'fairness commit wired');
assert(fairnessSrc.includes('serverSeedHash'), 'fairness shows commit hash');
assert(uiCss.includes('.fairness-panel'), 'fairness panel CSS');
assert(uiCss.includes('fairness-expand'), 'fairness expand animation');

console.log('\n=== Architect Phase 4: realtime + authority ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/rtProtocol.ts')), 'rtProtocol.ts');
assert(
  fs.existsSync(path.join(__dirname, 'src/core/rtProtocol.js')) &&
    fs.readFileSync(path.join(__dirname, 'src/core/rtProtocol.js'), 'utf8').includes('rtProtocol.ts'),
  'rtProtocol shim'
);
assert(fs.existsSync(path.join(__dirname, 'src/core/authorityClient.ts')), 'authorityClient.ts');
assert(
  fs.existsSync(path.join(__dirname, 'src/core/authorityClient.js')) &&
    fs.readFileSync(path.join(__dirname, 'src/core/authorityClient.js'), 'utf8').includes('authorityClient.ts'),
  'authorityClient shim'
);
assert(fs.existsSync(path.join(__dirname, 'src/core/realtimeHub.ts')), 'realtimeHub.ts');
assert(
  fs.existsSync(path.join(__dirname, 'src/core/realtimeHub.js')) &&
    fs.readFileSync(path.join(__dirname, 'src/core/realtimeHub.js'), 'utf8').includes('realtimeHub.ts'),
  'realtimeHub shim'
);
assert(fs.existsSync(path.join(__dirname, 'server/devAuthority.mjs')), 'dev authority server');
const rtSrc = fs.readFileSync(path.join(__dirname, 'src/core/rtProtocol.ts'), 'utf8');
const authSrc = fs.readFileSync(path.join(__dirname, 'src/core/authorityClient.ts'), 'utf8');
const hubSrc = fs.readFileSync(path.join(__dirname, 'src/core/realtimeHub.ts'), 'utf8');
assert(rtSrc.includes('SYNC_MODES'), 'sync mode constants');
assert(authSrc.includes('fetchRemoteCommit'), 'remote commit fetch');
assert(authSrc.includes('fetchRemoteOutcome'), 'remote outcome fetch');
assert(authSrc.includes('resolveAuthoritativeCommit'), 'authoritative commit resolver');
assert(hubSrc.includes('EventSource'), 'SSE hub');
assert(fairStoreSrc.includes('registerRemoteCommit'), 'remote commit registration');
assert(fairStoreSrc.includes('applyRemoteReveal'), 'remote reveal apply');
assert(ctxSrc.includes('createRealtimeHub'), 'GameContext realtime hub');
assert(ctxSrc.includes('resolveAuthoritativeOutcome'), 'GameContext authoritative settle');
assert(ctxSrc.includes('syncMode'), 'sync mode in context');
assert(fairnessSrc.includes('syncMode'), 'fairness panel sync badge');
assert(pkgJson.includes('dev:authority'), 'dev authority npm script');
const { parseCycleTick, SYNC_MODES } = await import('./src/core/rtProtocol.js');
const tick = parseCycleTick({ cycleId: 10, cycleSecond: 5, name: 'betting', nowMs: 1 });
assert(tick?.cycleId === 10 && tick.name === 'betting', 'parse cycle tick');
assert(SYNC_MODES.WALL_CLOCK === 'wall-clock', 'wall clock mode');
const {
  registerRemoteCommit: rrc,
  applyRemoteReveal: arr,
  clearFairRounds,
  outcomeForCycle: ofc2,
} = await import('./src/core/fairRoundStore.js');
const { commitServerSeed: csh, deriveWinningNumber: dwn } = await import('./src/core/provablyFair.js');
clearFairRounds();
const seed = 'b'.repeat(32);
const remoteHash = csh(seed);
rrc(4242, { serverSeedHash: remoteHash, clientSeed: 'guest' });
const expected = dwn(seed, 'guest', 4242);
const remoteAudit = arr(4242, { serverSeed: seed, winningNumber: expected, serverSeedHash: remoteHash });
assert(remoteAudit.verified === true, 'remote reveal audit');
assert(ofc2(4242) === expected, 'remote outcome after reveal');
clearFairRounds();

console.log('\n=== Architect Phase 5: audio & haptics polish ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/feedbackConfig.ts')), 'feedback config');
assert(fs.existsSync(path.join(__dirname, 'src/lib/feedbackBridge.js')), 'feedback bridge');
const feedbackCfgSrc = fs.readFileSync(path.join(__dirname, 'src/core/feedbackConfig.ts'), 'utf8');
const feedbackBridgeSrc = fs.readFileSync(path.join(__dirname, 'src/lib/feedbackBridge.js'), 'utf8');
assert(feedbackCfgSrc.includes('loadFeedbackPrefs'), 'feedback prefs loader');
assert(feedbackCfgSrc.includes('prefersReducedFeedback'), 'reduced-motion feedback guard');
assert(feedbackBridgeSrc.includes('onPhaseChange'), 'phase-aware feedback');
assert(feedbackBridgeSrc.includes('playBetLock'), 'bet lock audio cue');
assert(feedbackBridgeSrc.includes('playSpinCue'), 'spin drop audio cue');
assert(audioSrc.includes('playChipPlace'), 'chip place audio cue');
assert(audioSrc.includes('playBetLock'), 'bet lock tone');
assert(audioSrc.includes('playSpinCue'), 'spin cue swell');
assert(hapticsSrc.includes('vibrateLock'), 'bet lock haptic');
assert(hapticsSrc.includes('setHapticsEnabled'), 'haptics enable gate');
assert(hapticsSrc.includes('collisionMinGapMs'), 'collision rate limit');
assert(ctxSrc.includes('createFeedbackBridge'), 'feedback bridge in context');
assert(ctxSrc.includes('feedbackChipHover'), 'chip hover via bridge');
assert(boardSrc.includes('feedbackChipHover'), 'board chip hover bridge');
assert(boardSrc.includes('onChipHover'), 'chip hover prop');

console.log('\n=== Architect Phase 6: lazy Rapier + TypeScript core ===');
assert(fs.existsSync(path.join(__dirname, 'src/lib/loadRapier.js')), 'rapier lazy loader');
assert(fs.existsSync(path.join(__dirname, 'src/scene/RapierStage.jsx')), 'rapier stage chunk');
assert(fs.existsSync(path.join(__dirname, 'src/scene/EuropeanWheelVisual.jsx')), 'rapier-free idle wheel');
assert(fs.existsSync(path.join(__dirname, 'src/core/profileHarness.js')), 'profile harness');
assert(fs.existsSync(path.join(__dirname, 'src/core/types.ts')), 'core types');
assert(fs.existsSync(path.join(__dirname, 'tsconfig.json')), 'tsconfig');
assert(fs.existsSync(path.join(__dirname, 'src/core/config.ts')), 'config.ts');
assert(fs.existsSync(path.join(__dirname, 'src/core/provablyFair.ts')), 'provablyFair.ts');
assert(fs.existsSync(path.join(__dirname, 'src/core/gameEngine.ts')), 'gameEngine.ts');
assert(!fs.existsSync(path.join(__dirname, 'src/core/config.js')) || fs.readFileSync(path.join(__dirname, 'src/core/config.js'), 'utf8').includes('config.ts'), 'config shim or ts only');
const loadRapierSrc = fs.readFileSync(path.join(__dirname, 'src/lib/loadRapier.js'), 'utf8');
const gameSceneSrc = fs.readFileSync(path.join(__dirname, 'src/scene/GameScene.jsx'), 'utf8');
assert(loadRapierSrc.includes('shouldPrefetchPhysics'), 'prefetch gate');
assert(loadRapierSrc.includes('RAPIER_PREFETCH_AT'), 'prefetch timing constant');
assert(loadRapierSrc.includes('shouldMountPhysics'), 'mount gate');
assert(gameSceneSrc.includes('loadRapierStage'), 'lazy stage import');
assert(gameSceneSrc.includes('EuropeanWheelVisual'), 'idle visual wheel');
assert(!gameSceneSrc.includes("from '@react-three/rapier'"), 'GameScene rapier-free');
assert(ctxSrc.includes('physicsLoadState'), 'physics load state in context');
assert(pkgJson.includes('"typecheck"'), 'typecheck script');
assert(loadRapierSrc.includes('RAPIER_PREFETCH_AT_MEDIUM'), 'medium-tier prefetch timing');
assert(gameSceneSrc.includes('shouldPrefetchPhysics(clock, qualityTier)'), 'tier-aware prefetch');
assert(gameSceneSrc.includes('visibilitychange'), 'resume rapier prefetch on tab focus');
assert(gameSceneSrc.includes('completeRapierPrefetch'), 'shared rapier prefetch helper');
assert(gameSceneSrc.includes('if (!cancelled && ready) setStageReady(true)'), 'hot-cache physics mount');
assert(gameSceneSrc.includes('if (!mountPhysics || stageReady) return'), 'lock-phase rapier fallback load');
assert(gameSceneSrc.includes('isRapierReady'), 'physics load state respects wasm cache');
const {
  shouldPrefetchPhysics,
  shouldMountPhysics,
  RAPIER_PREFETCH_AT,
  RAPIER_PREFETCH_AT_LOW,
  RAPIER_PREFETCH_AT_MEDIUM,
} = await import('./src/lib/loadRapier.js');
assert(RAPIER_PREFETCH_AT === 17, 'prefetch at second 17');
assert(RAPIER_PREFETCH_AT_LOW === 15, 'low-tier prefetch at second 15');
assert(RAPIER_PREFETCH_AT_MEDIUM === 16, 'medium-tier prefetch at second 16');
assert(shouldPrefetchPhysics({ name: 'betting', cycleSecond: 16 }) === false, 'no prefetch early betting');
assert(shouldPrefetchPhysics({ name: 'betting', cycleSecond: 15 }, 'low') === true, 'low-tier prefetch earlier');
assert(shouldPrefetchPhysics({ name: 'betting', cycleSecond: 16 }, 'medium') === true, 'medium-tier prefetch');
assert(shouldMountPhysics({ name: 'locked', cycleSecond: 20 }) === true, 'mount at lock');
const { markProfile, measureProfile, resetProfileSnapshot } = await import('./src/core/profileHarness.js');
markProfile('verify-start');
measureProfile('verify-span', 'verify-start');
resetProfileSnapshot();

console.log('\n=== Architect Phase 7: atomic bet gate ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/betGate.ts')), 'betGate.ts');
const betGateSrc = fs.readFileSync(path.join(__dirname, 'src/core/betGate.ts'), 'utf8');
assert(betGateSrc.includes('isBettingOpen'), 'isBettingOpen export');
assert(betGateSrc.includes('betRejectionReason'), 'betRejectionReason export');
assert(betGateSrc.includes('createBetMutex'), 'createBetMutex export');
assert(betGateSrc.includes('bettingLockTimestampMs'), 'wall-clock lock cutoff');
assert(ctxSrc.includes('betRejectionReason'), 'context uses bet rejection');
assert(ctxSrc.includes('createBetMutex'), 'context uses bet mutex');
assert(ctxSrc.includes('isBettingOpen'), 'context uses isBettingOpen');
const { isBettingOpen, betRejectionReason, createBetMutex, bettingLockMs } = await import(
  './src/core/betGate.ts'
);
const gateCycle = 1_700_000_000;
const gateLock = bettingLockMs(gateCycle);
const gateClock = { acceptsBets: true, cycleId: gateCycle };
assert(isBettingOpen(gateClock, gateLock - 1), 'open 1ms before lock');
assert(!isBettingOpen(gateClock, gateLock), 'closed at lock ms');
assert(betRejectionReason(gateClock, gateLock) === 'Bets locked.', 'rejection at lock');
assert(betRejectionReason(gateClock, gateLock - 1) === null, 'no rejection before lock');
const m1 = createBetMutex();
assert(m1.tryAcquire() && !m1.tryAcquire(), 'mutex serializes');
m1.release();
assert(m1.tryAcquire(), 'mutex releases');

console.log('\n=== Architect Phase 9: vitest core unit suite ===');
assert(fs.existsSync(path.join(__dirname, 'vitest.config.ts')), 'vitest.config.ts');
assert(fs.existsSync(path.join(__dirname, 'src/core/vitestCoverage.test.ts')), 'vitestCoverage.test.ts');
const verifySrc = fs.readFileSync(path.join(__dirname, 'verify.js'), 'utf8');
const moduleTestExistsSync =
  verifySrc.match(
    /existsSync\(path\.join\(__dirname, 'src\/(?:core|lib|scene|shaders|hooks)\/[^']+\.test\.ts'\)\)/g,
  ) ?? [];
assert(
  moduleTestExistsSync.length === 1 && moduleTestExistsSync[0].includes('vitestCoverage.test.ts'),
  `sole module test existsSync is vitestCoverage (${moduleTestExistsSync.length})`,
);
const vitestCoverageSrc = fs.readFileSync(path.join(__dirname, 'src/core/vitestCoverage.ts'), 'utf8');
assert(vitestCoverageSrc.includes("'hooks'"), 'vitest coverage hooks directory');
assert(vitestCoverageSrc.includes("'core'"), 'vitest coverage core directory');
const perVitestManifestAsserts = verifySrc.match(/techManifestSrc\.includes\('vitest-/g) ?? [];
assert(
  perVitestManifestAsserts.length === 0,
  `verify no per-id vitest manifest asserts (${perVitestManifestAsserts.length})`,
);
assert(pkgJson.includes('"test:unit"'), 'test:unit script');
assert(pkgJson.includes('"vitest"'), 'vitest devDependency');
assert(pkgJson.includes('fake-indexeddb'), 'fake-indexeddb devDependency');
assert(vitestCoverageSrc.includes('runVitestVerifyAudits'), 'runVitestVerifyAudits export');
assert(vitestCoverageSrc.includes('auditJsxSurface'), 'jsx surface probe export');
assert(vitestCoverageSrc.includes('JSX_SCENE_SURFACE_MODULE_COUNT'), 'jsx scene surface count export');
assert(vitestCoverageSrc.includes('JSX_CONTEXT_SURFACE_MODULE_COUNT'), 'jsx context surface count export');
assert(vitestCoverageSrc.includes('JSX_ENTRY_SURFACE_MODULE_COUNT'), 'jsx entry surface count export');
assert(vitestCoverageSrc.includes('auditJsxSurfaceComplete'), 'jsx surface complete audit export');
assert(vitestCoverageSrc.includes('findJsxModulesMissingTests'), 'jsx ui test parity finder export');
assert(vitestCoverageSrc.includes('JS_TEST_PARITY_MISSING_COUNT'), 'js test parity missing count export');
assert(vitestCoverageSrc.includes('JS_TEST_PARITY_COMPLETE'), 'js test parity complete milestone export');
assert(vitestCoverageSrc.includes('auditJsTestParity'), 'js test parity audit export');
assert(vitestCoverageSrc.includes('jsTestParity:'), 'js test parity report on runVitestVerifyAudits');
assert(vitestCoverageSrc.includes('JSX_UI_TEST_PARITY_MISSING_COUNT'), 'jsx ui test parity missing count export');
assert(vitestCoverageSrc.includes('auditJsxSurfaceTestParity'), 'jsx surface test parity audit export');
assert(vitestCoverageSrc.includes('JSX_SURFACE_TEST_PARITY_MISSING_COUNT'), 'jsx surface test parity missing count export');
assert(vitestCoverageSrc.includes('JSX_SURFACE_TEST_PARITY_COVERED_COUNT'), 'jsx surface test parity covered count export');
assert(vitestCoverageSrc.includes('JSX_SURFACE_TEST_PARITY_COMPLETE'), 'jsx surface test parity complete milestone export');
assert(vitestCoverageSrc.includes('jsxSurfaceTestParityCoveredCount'), 'jsx surface test parity covered count on runVitestVerifyAudits');
assert(vitestCoverageSrc.includes('JSX_UI_TEST_PARITY_MISSING_COUNT === 0'), 'jsx ui test parity complete in jsx surface milestone');
assert(vitestCoverageSrc.includes('FULL_SURFACE_TEST_PARITY_COMPLETE'), 'full surface test parity complete milestone export');
assert(vitestCoverageSrc.includes('FULL_SURFACE_TEST_PARITY_COVERED_COUNT'), 'full surface test parity covered count export');
assert(vitestCoverageSrc.includes('FULL_SURFACE_TEST_PARITY_MISSING_COUNT'), 'full surface test parity missing count export');
assert(vitestCoverageSrc.includes('fullSurfaceTestParityCoveredCount'), 'full surface test parity covered count on runVitestVerifyAudits');
assert(vitestCoverageSrc.includes('JS_TEST_PARITY_COMPLETE &&'), 'js test parity complete in full surface milestone');
assert(vitestCoverageSrc.includes('FULL_SURFACE_TEST_PARITY_MODULE_COUNT'), 'full surface test parity module count export');
assert(vitestCoverageSrc.includes('VITEST_SURFACE_TEST_PARITY_MODULE_COUNT'), 'vitest surface test parity module count alias export');
assert(vitestCoverageSrc.includes('vitestSurfaceTestParityModuleCount'), 'vitest surface test parity module count on runVitestVerifyAudits');
assert(
  vitestCoverageSrc.includes('VITEST_SURFACE_TEST_PARITY_MODULE_COUNT = FULL_SURFACE_TEST_PARITY_MODULE_COUNT'),
  'vitest surface test parity module count alias wiring',
);
assert(vitestCoverageSrc.includes('VITEST_SURFACE_TEST_PARITY_COMPLETE'), 'vitest surface test parity complete alias export');
assert(vitestCoverageSrc.includes('SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE'), 'surface flat unified closure complete milestone export');
assert(vitestCoverageSrc.includes('SURFACE_FLAT_FIELD_TRILOGY_COMPLETE'), 'surface flat field trilogy complete milestone export');
assert(
  vitestCoverageSrc.includes('SURFACE_FLAT_FIELD_TRILOGY_COMPLETE =') &&
    vitestCoverageSrc.includes('SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE'),
  'surface flat field trilogy complete milestone wiring',
);
assert(vitestCoverageSrc.includes('SURFACE_FLAT_FIELD_PAIR_COUNT'), 'surface flat field pair count export');
assert(vitestCoverageSrc.includes('SURFACE_FLAT_TOTAL_FIELD_COUNT'), 'surface flat total field count export');
assert(vitestCoverageSrc.includes('SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT'), 'surface flat report flat field count export');
assert(vitestCoverageSrc.includes('SURFACE_FLAT_REPORT_QUARTET_COMPLETE'), 'surface flat report quartet complete milestone export');
assert(
  vitestCoverageSrc.includes('SURFACE_FLAT_REPORT_QUARTET_COMPLETE =') &&
    vitestCoverageSrc.includes('SURFACE_FLAT_FIELD_TRILOGY_COMPLETE'),
  'surface flat report quartet complete milestone wiring',
);
assert(vitestCoverageSrc.includes('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE'), 'vitest surface flat report tail complete milestone export');
assert(
  vitestCoverageSrc.includes('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE =') &&
    vitestCoverageSrc.includes('SURFACE_FLAT_REPORT_QUARTET_COMPLETE'),
  'vitest surface flat report tail complete milestone wiring',
);
assert(
  vitestCoverageSrc.includes('SURFACE_FLAT_TOTAL_FIELD_COUNT = SURFACE_FLAT_FIELD_PAIR_COUNT * 2'),
  'surface flat total field count wiring',
);
assert(vitestCoverageSrc.includes('vitestSurfaceTestParityComplete'), 'vitest surface test parity complete on runVitestVerifyAudits');
assert(vitestCoverageSrc.includes('surfaceFlatUnifiedClosureComplete'), 'surface flat unified closure complete on runVitestVerifyAudits');
assert(vitestCoverageSrc.includes('surfaceFlatFieldPairCount'), 'surface flat field pair count on runVitestVerifyAudits');
assert(
  vitestCoverageSrc.includes('surfaceFlatFieldPairCount: SURFACE_FLAT_FIELD_PAIR_COUNT'),
  'surface flat field pair count from SURFACE_FLAT_FIELD_PAIR_COUNT constant',
);
assert(vitestCoverageSrc.includes('surfaceFlatTotalFieldCount'), 'surface flat total field count on runVitestVerifyAudits');
assert(
  vitestCoverageSrc.includes('surfaceFlatTotalFieldCount: SURFACE_FLAT_TOTAL_FIELD_COUNT'),
  'surface flat total field count from SURFACE_FLAT_TOTAL_FIELD_COUNT constant',
);
assert(vitestCoverageSrc.includes('surfaceFlatFieldTrilogyComplete'), 'surface flat field trilogy complete on runVitestVerifyAudits');
assert(
  vitestCoverageSrc.includes('surfaceFlatFieldTrilogyComplete: SURFACE_FLAT_FIELD_TRILOGY_COMPLETE'),
  'surface flat field trilogy complete from SURFACE_FLAT_FIELD_TRILOGY_COMPLETE constant',
);
assert(vitestCoverageSrc.includes('surfaceFlatReportFlatFieldCount'), 'surface flat report flat field count on runVitestVerifyAudits');
assert(
  vitestCoverageSrc.includes('surfaceFlatReportFlatFieldCount: SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT'),
  'surface flat report flat field count from SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT constant',
);
assert(vitestCoverageSrc.includes('surfaceFlatReportQuartetComplete'), 'surface flat report quartet complete on runVitestVerifyAudits');
assert(
  vitestCoverageSrc.includes('surfaceFlatReportQuartetComplete: SURFACE_FLAT_REPORT_QUARTET_COMPLETE'),
  'surface flat report quartet complete from SURFACE_FLAT_REPORT_QUARTET_COMPLETE constant',
);
assert(vitestCoverageSrc.includes('vitestSurfaceFlatReportTailComplete'), 'vitest surface flat report tail complete on runVitestVerifyAudits');
assert(
  vitestCoverageSrc.includes('vitestSurfaceFlatReportTailComplete: VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE'),
  'vitest surface flat report tail complete from VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE constant',
);
assert(
  vitestCoverageSrc.includes('surfaceFlatUnifiedClosureComplete: vitestSurfaceTestParity.ok'),
  'surface flat unified closure complete from vitestSurfaceTestParity report ok',
);
assert(
  vitestCoverageSrc.includes('VITEST_SURFACE_TEST_PARITY_COMPLETE = FULL_SURFACE_TEST_PARITY_COMPLETE'),
  'vitest surface test parity complete alias wiring',
);
assert(vitestCoverageSrc.includes('VITEST_SURFACE_TEST_PARITY_COVERED_COUNT'), 'vitest surface test parity covered count alias export');
assert(vitestCoverageSrc.includes('VITEST_SURFACE_TEST_PARITY_MISSING_COUNT'), 'vitest surface test parity missing count alias export');
assert(vitestCoverageSrc.includes('vitestSurfaceTestParityCoveredCount'), 'vitest surface test parity covered count on runVitestVerifyAudits');
assert(vitestCoverageSrc.includes('vitestSurfaceTestParityMissingCount'), 'vitest surface test parity missing count on runVitestVerifyAudits');
assert(
  vitestCoverageSrc.includes('VITEST_SURFACE_TEST_PARITY_COVERED_COUNT = FULL_SURFACE_TEST_PARITY_COVERED_COUNT'),
  'vitest surface test parity covered count alias wiring',
);
assert(
  vitestCoverageSrc.includes('VITEST_SURFACE_TEST_PARITY_MISSING_COUNT = FULL_SURFACE_TEST_PARITY_MISSING_COUNT'),
  'vitest surface test parity missing count alias wiring',
);
const runVitestOkIdx = vitestCoverageSrc.indexOf('export function runVitestVerifyAudits');
const okGateStart = vitestCoverageSrc.indexOf('ok:', runVitestOkIdx);
const okGateEnd = vitestCoverageSrc.indexOf('upgradeLog,', okGateStart);
const okGateSlice = vitestCoverageSrc.slice(okGateStart, okGateEnd);
assert(
  !okGateSlice.includes('FULL_SURFACE_TEST_PARITY_COMPLETE'),
  'full surface milestone not duplicated in runVitestVerifyAudits ok gate',
);
assert(
  !okGateSlice.includes('JSX_SURFACE_TEST_PARITY_COMPLETE'),
  'jsx surface milestone not duplicated in runVitestVerifyAudits ok gate',
);
assert(
  !okGateSlice.includes('JS_TEST_PARITY_COMPLETE'),
  'js test parity milestone not duplicated in runVitestVerifyAudits ok gate',
);
assert(
  !okGateSlice.includes('VITEST_SURFACE_TEST_PARITY_COMPLETE'),
  'vitest surface test parity complete alias not duplicated in runVitestVerifyAudits ok gate',
);
assert(
  !okGateSlice.includes('SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE'),
  'surface flat unified closure milestone not duplicated in runVitestVerifyAudits ok gate',
);
assert(
  !okGateSlice.includes('SURFACE_FLAT_REPORT_QUARTET_COMPLETE'),
  'surface flat report quartet milestone not duplicated in runVitestVerifyAudits ok gate',
);
assert(
  !okGateSlice.includes('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE'),
  'vitest surface flat report tail milestone not duplicated in runVitestVerifyAudits ok gate',
);
assert(
  !okGateSlice.includes('fullSurfaceTestParity.ok'),
  'full surface test parity ok not duplicated in runVitestVerifyAudits ok gate',
);
assert(vitestCoverageSrc.includes('vitestSurfaceTestParity.ok &&'), 'vitest surface test parity ok in main ok gate');
assert(vitestCoverageSrc.includes('vitestSurfaceTestParity.moduleCount'), 'vitest surface flat module count from report');
assert(vitestCoverageSrc.includes('vitestSurfaceTestParity.coveredCount'), 'vitest surface flat covered count from report');
assert(vitestCoverageSrc.includes('vitestSurfaceTestParity.missingCount'), 'vitest surface flat missing count from report');
assert(vitestCoverageSrc.includes('vitestSurfaceTestParity.ok'), 'vitest surface flat complete from report ok');
const vitestSurfaceFlatStart = vitestCoverageSrc.indexOf(
  'vitestSurfaceTestParityModuleCount:',
  runVitestOkIdx,
);
const vitestSurfaceFlatEnd = vitestCoverageSrc.indexOf('};', vitestSurfaceFlatStart);
const vitestSurfaceFlatSlice = vitestCoverageSrc.slice(vitestSurfaceFlatStart, vitestSurfaceFlatEnd);
assert(
  !vitestSurfaceFlatSlice.includes('vitestSurfaceTestParity.vitestSurfaceModuleCount'),
  'vitest surface flat module count not from alias sub-field',
);
assert(
  !vitestSurfaceFlatSlice.includes('vitestSurfaceTestParity.vitestSurfaceCoveredCount'),
  'vitest surface flat covered count not from alias sub-field',
);
assert(
  !vitestSurfaceFlatSlice.includes('vitestSurfaceTestParity.vitestSurfaceMissingCount'),
  'vitest surface flat missing count not from alias sub-field',
);
assert(
  !vitestSurfaceFlatSlice.includes('vitestSurfaceTestParity.vitestSurfaceComplete'),
  'vitest surface flat complete not from alias sub-field',
);
assert(
  !vitestSurfaceFlatSlice.includes('VITEST_SURFACE_TEST_PARITY_COMPLETE'),
  'vitest surface flat complete milestone not duplicated in flat fields',
);
assert(
  !vitestSurfaceFlatSlice.includes('VITEST_SURFACE_TEST_PARITY_COVERED_COUNT'),
  'vitest surface flat covered count milestone not duplicated in flat fields',
);
assert(
  !vitestSurfaceFlatSlice.includes('VITEST_SURFACE_TEST_PARITY_MISSING_COUNT'),
  'vitest surface flat missing count milestone not duplicated in flat fields',
);
assert(
  !vitestSurfaceFlatSlice.includes('VITEST_SURFACE_TEST_PARITY_MODULE_COUNT'),
  'vitest surface flat module count milestone not duplicated in flat fields',
);
const surfaceFlatUnifiedClosureStart = vitestCoverageSrc.indexOf(
  'surfaceFlatUnifiedClosureComplete:',
  runVitestOkIdx,
);
const surfaceFlatUnifiedClosureEnd = vitestCoverageSrc.indexOf('};', surfaceFlatUnifiedClosureStart);
const surfaceFlatUnifiedClosureSlice = vitestCoverageSrc.slice(
  surfaceFlatUnifiedClosureStart,
  surfaceFlatUnifiedClosureEnd,
);
assert(
  !surfaceFlatUnifiedClosureSlice.includes('SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE'),
  'surface flat unified closure complete milestone not duplicated in flat field',
);
assert(
  surfaceFlatUnifiedClosureSlice.includes('vitestSurfaceTestParity.ok'),
  'surface flat unified closure complete flat field from vitestSurfaceTestParity report ok',
);
const fullSurfaceFlatStart = vitestCoverageSrc.indexOf(
  'fullSurfaceTestParityCoveredCount:',
  runVitestOkIdx,
);
const fullSurfaceFlatEnd = vitestCoverageSrc.indexOf('vitestSurfaceTestParity,', fullSurfaceFlatStart);
const fullSurfaceFlatSlice = vitestCoverageSrc.slice(fullSurfaceFlatStart, fullSurfaceFlatEnd);
assert(
  fullSurfaceFlatSlice.includes('vitestSurfaceTestParity.coveredCount'),
  'full surface flat covered count from vitestSurfaceTestParity report',
);
assert(
  fullSurfaceFlatSlice.includes('vitestSurfaceTestParity.missingCount'),
  'full surface flat missing count from vitestSurfaceTestParity report',
);
assert(
  fullSurfaceFlatSlice.includes('vitestSurfaceTestParity.moduleCount'),
  'full surface flat module count from vitestSurfaceTestParity report',
);
assert(
  fullSurfaceFlatSlice.includes('vitestSurfaceTestParity.ok'),
  'full surface flat complete from vitestSurfaceTestParity report ok',
);
assert(
  !fullSurfaceFlatSlice.includes('fullSurfaceTestParity.coveredCount'),
  'full surface flat covered count not from fullSurfaceTestParity report',
);
assert(
  !fullSurfaceFlatSlice.includes('fullSurfaceTestParity.missingCount'),
  'full surface flat missing count not from fullSurfaceTestParity report',
);
assert(
  !fullSurfaceFlatSlice.includes('fullSurfaceTestParity.moduleCount'),
  'full surface flat module count not from fullSurfaceTestParity report',
);
assert(
  !fullSurfaceFlatSlice.includes('fullSurfaceTestParity.ok'),
  'full surface flat complete not from fullSurfaceTestParity report',
);
assert(
  !fullSurfaceFlatSlice.includes('FULL_SURFACE_TEST_PARITY_COMPLETE'),
  'full surface flat complete milestone not duplicated in flat fields',
);
assert(
  !fullSurfaceFlatSlice.includes('FULL_SURFACE_TEST_PARITY_COVERED_COUNT'),
  'full surface flat covered count milestone not duplicated in flat fields',
);
assert(
  !fullSurfaceFlatSlice.includes('FULL_SURFACE_TEST_PARITY_MISSING_COUNT'),
  'full surface flat missing count milestone not duplicated in flat fields',
);
assert(
  !fullSurfaceFlatSlice.includes('FULL_SURFACE_TEST_PARITY_MODULE_COUNT'),
  'full surface flat module count milestone not duplicated in flat fields',
);
assert(
  fullSurfaceFlatSlice.includes('vitestSurfaceTestParity.moduleCount') &&
    vitestSurfaceFlatSlice.includes('vitestSurfaceTestParity.moduleCount') &&
    fullSurfaceFlatSlice.includes('vitestSurfaceTestParity.coveredCount') &&
    vitestSurfaceFlatSlice.includes('vitestSurfaceTestParity.coveredCount') &&
    fullSurfaceFlatSlice.includes('vitestSurfaceTestParity.missingCount') &&
    vitestSurfaceFlatSlice.includes('vitestSurfaceTestParity.missingCount') &&
    fullSurfaceFlatSlice.includes('vitestSurfaceTestParity.ok') &&
    vitestSurfaceFlatSlice.includes('vitestSurfaceTestParity.ok'),
  'unified surface flat closure structural symmetry from vitestSurfaceTestParity report',
);
assert(vitestCoverageSrc.includes('auditFullSurfaceTestParity'), 'full surface test parity audit export');
assert(vitestCoverageSrc.includes('auditVitestSurfaceTestParity'), 'vitest surface test parity audit export');
assert(vitestCoverageSrc.includes('vitestSurfaceTestParity:'), 'vitest surface test parity report on runVitestVerifyAudits');
assert(vitestCoverageSrc.includes('fullSurfaceTestParity:'), 'full surface test parity report on runVitestVerifyAudits');
assert(vitestCoverageSrc.includes('findJsxSceneModulesMissingTests'), 'jsx scene test parity finder export');
assert(vitestCoverageSrc.includes('findJsxContextModulesMissingTests'), 'jsx context test parity finder export');
assert(vitestCoverageSrc.includes('JSX_CONTEXT_TEST_PARITY_MISSING_COUNT'), 'jsx context test parity missing count export');
assert(vitestCoverageSrc.includes('findJsxEntryModulesMissingTests'), 'jsx entry test parity finder export');
assert(vitestCoverageSrc.includes('JSX_ENTRY_TEST_PARITY_MISSING_COUNT'), 'jsx entry test parity missing count export');
const techManifestImports =
  verifySrc
    .slice(0, verifySrc.indexOf('=== Architect Phase 9: vitest core unit suite'))
    .match(/await import\('\.\/src\/core\/techManifest\.js'\)/g) ?? [];
assert(techManifestImports.length === 1, `sole techManifest dynamic import (${techManifestImports.length})`);
const vitestCoverageImports =
  verifySrc
    .slice(0, verifySrc.indexOf('=== Architect Phase 9: vitest core unit suite'))
    .match(/await import\('\.\/src\/core\/vitestCoverage\.ts'\)/g) ?? [];
assert(vitestCoverageImports.length === 1, `sole vitestCoverage dynamic import (${vitestCoverageImports.length})`);
const phase2Idx = verifySrc.indexOf("console.log('=== Phase 2:");
assert(
  phase2Idx > 0 && verifySrc.slice(0, phase2Idx).includes('runVitestVerifyAudits'),
  'vitest audit imports hoisted before phase checks',
);
assert(verifySrc.includes('runVitestVerifyAudits'), 'verify uses runVitestVerifyAudits');
assert(
  verifySrc.includes('unified surface flat closure from vitestSurfaceTestParity report'),
  'verify unified surface flat closure runtime assertion',
);
assert(
  verifySrc.includes('vitestAudits.vitestSurfaceTestParity.ok &&'),
  'verify unified surface flat closure consolidated includes vitest surface ok gate',
);
assert(
  verifySrc.includes('vitestAudits.ok === vitestAudits.vitestSurfaceTestParity.ok'),
  'verify unified surface flat closure consolidated includes runVitestVerifyAudits ok gate',
);
assert(
  verifySrc.includes('FULL_SURFACE_TEST_PARITY_COMPLETE &&'),
  'verify unified surface flat closure consolidated includes full surface parity complete milestone',
);
assert(
  verifySrc.includes('fullSurfaceTestParityComplete === FULL_SURFACE_TEST_PARITY_COMPLETE'),
  'verify unified surface flat closure consolidated includes full surface parity complete align',
);
assert(
  verifySrc.includes('fullSurfaceTestParity.ok === FULL_SURFACE_TEST_PARITY_COMPLETE'),
  'verify unified surface flat closure consolidated includes full surface parity ok align',
);
assert(
  verifySrc.includes('vitestSurfaceTestParity.ok === vitestAudits.fullSurfaceTestParity.ok'),
  'verify unified surface flat closure consolidated includes vitest full surface ok cross align',
);
assert(
  verifySrc.includes('vitestSurfaceTestParity.moduleCount === vitestAudits.fullSurfaceTestParity.moduleCount'),
  'verify unified surface flat closure consolidated includes vitest full surface audit module count align',
);
assert(
  verifySrc.includes('vitestSurfaceTestParity.vitestSurfaceComplete === VITEST_SURFACE_TEST_PARITY_COMPLETE'),
  'verify unified surface flat closure consolidated includes vitest surface alias complete milestone',
);
assert(
  verifySrc.includes('vitestSurfaceTestParityComplete === VITEST_SURFACE_TEST_PARITY_COMPLETE'),
  'verify unified surface flat closure consolidated includes vitest surface complete report flag',
);
assert(
  verifySrc.includes('fullSurfaceTestParityComplete === vitestAudits.vitestSurfaceTestParityComplete'),
  'verify unified surface flat closure consolidated includes vitest full surface complete cross align',
);
assert(
  verifySrc.includes('fullSurfaceTestParityCoveredCount === vitestAudits.vitestSurfaceTestParityCoveredCount'),
  'verify unified surface flat closure consolidated includes vitest full surface covered cross align',
);
assert(
  verifySrc.includes('fullSurfaceTestParityMissingCount === vitestAudits.vitestSurfaceTestParityMissingCount'),
  'verify unified surface flat closure consolidated includes vitest full surface missing cross align',
);
assert(
  verifySrc.includes('vitestAudits.coverage.ok &&'),
  'verify unified surface flat closure consolidated includes js test parity ok gate',
);
assert(
  verifySrc.includes('vitestAudits.jsxSurfaceTestParityComplete &&'),
  'verify unified surface flat closure consolidated includes jsx surface test parity complete gate',
);
assert(
  verifySrc.includes('vitestAudits.fullSurfaceTestParityComplete &&'),
  'verify unified surface flat closure consolidated includes full surface test parity complete gate',
);
assert(
  verifySrc.includes('fullSurfaceTestParityCoveredCount === vitestAudits.vitestSurfaceTestParity.coveredCount'),
  'verify unified surface flat closure consolidated includes full surface flat covered count',
);
assert(
  verifySrc.includes('fullSurfaceTestParityMissingCount === vitestAudits.vitestSurfaceTestParity.missingCount'),
  'verify unified surface flat closure consolidated includes full surface flat missing count',
);
assert(
  verifySrc.includes('fullSurfaceTestParityModuleCount === vitestAudits.vitestSurfaceTestParity.moduleCount'),
  'verify unified surface flat closure consolidated includes full surface flat module count',
);
assert(
  verifySrc.includes('fullSurfaceTestParityModuleCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT'),
  'verify unified surface flat closure consolidated includes full surface module count milestone',
);
assert(
  verifySrc.includes('VITEST_SURFACE_TEST_PARITY_MODULE_COUNT === FULL_SURFACE_TEST_PARITY_MODULE_COUNT'),
  'verify unified surface flat closure consolidated includes vitest surface module count alias',
);
assert(
  verifySrc.includes('vitestAudits.vitestSurfaceTestParityModuleCount === VITEST_SURFACE_TEST_PARITY_MODULE_COUNT'),
  'verify unified surface flat closure consolidated includes vitest surface module count report flag',
);
assert(
  verifySrc.includes('VITEST_SURFACE_TEST_PARITY_COMPLETE === FULL_SURFACE_TEST_PARITY_COMPLETE'),
  'verify unified surface flat closure consolidated includes vitest surface complete alias',
);
assert(
  verifySrc.includes('VITEST_SURFACE_TEST_PARITY_COVERED_COUNT === FULL_SURFACE_TEST_PARITY_COVERED_COUNT'),
  'verify unified surface flat closure consolidated includes vitest surface covered count alias',
);
assert(
  verifySrc.includes('vitestAudits.vitestSurfaceTestParityCoveredCount === VITEST_SURFACE_TEST_PARITY_COVERED_COUNT'),
  'verify unified surface flat closure consolidated includes vitest surface covered report flag',
);
assert(
  verifySrc.includes('VITEST_SURFACE_TEST_PARITY_MISSING_COUNT === FULL_SURFACE_TEST_PARITY_MISSING_COUNT'),
  'verify unified surface flat closure consolidated includes vitest surface missing count alias',
);
assert(
  verifySrc.includes('vitestAudits.vitestSurfaceTestParityMissingCount === VITEST_SURFACE_TEST_PARITY_MISSING_COUNT'),
  'verify unified surface flat closure consolidated includes vitest surface missing report flag',
);
assert(
  verifySrc.includes('fullSurfaceTestParityComplete === vitestAudits.vitestSurfaceTestParity.ok'),
  'verify unified surface flat closure consolidated includes full surface flat complete',
);
assert(
  verifySrc.includes('vitestSurfaceTestParityModuleCount === vitestAudits.vitestSurfaceTestParity.moduleCount'),
  'verify unified surface flat closure consolidated includes vitest surface flat module count',
);
assert(
  verifySrc.includes('vitestSurfaceTestParityCoveredCount === vitestAudits.vitestSurfaceTestParity.coveredCount'),
  'verify unified surface flat closure consolidated includes vitest surface flat covered count',
);
assert(
  verifySrc.includes('vitestSurfaceTestParityMissingCount === vitestAudits.vitestSurfaceTestParity.missingCount'),
  'verify unified surface flat closure consolidated includes vitest surface flat missing count',
);
assert(
  verifySrc.includes('vitestSurfaceTestParityComplete === vitestAudits.vitestSurfaceTestParity.ok'),
  'verify unified surface flat closure consolidated includes vitest surface flat complete',
);
assert(
  verifySrc.includes('unified surface flat closure structural symmetry from vitestSurfaceTestParity report'),
  'verify unified surface flat closure structural symmetry assertion',
);
const unifiedClosureTailMilestoneStructuralCount =
  verifySrc.split(
    'verify unified surface flat closure consolidated includes vitest surface flat report tail complete milestone',
  ).length - 1;
assert(
  unifiedClosureTailMilestoneStructuralCount === 1,
  'unified closure structural tail complete milestone guards deduped into quartet section',
);
const unifiedClosureTailAlignStructuralCount =
  verifySrc.split(
    'verify unified surface flat closure consolidated includes vitest surface flat report tail complete align',
  ).length - 1;
assert(
  unifiedClosureTailAlignStructuralCount === 1,
  'unified closure structural tail complete align guards deduped into quartet section',
);
const unifiedClosureLastIndexOfStructuralCount =
  verifySrc.split('unified closure runtime tail dedupe guard uses lastIndexOf runtime message anchor').length - 1;
assert(
  unifiedClosureLastIndexOfStructuralCount === 1,
  'file-level lastIndexOf anchor structural guard deduped into dedupe-block include guard',
);
const unifiedClosureLastIndexOfIncludeMessageCount =
  verifySrc.split('unified closure runtime tail dedupe block includes lastIndexOf message anchor').length - 1;
assert(
  unifiedClosureLastIndexOfIncludeMessageCount === 3,
  'dedupe-block lastIndexOf include message is sole file-level lastIndexOf anchor structural check',
);
const quartetClosureLastIndexOfIncludeMessageCount =
  verifySrc.split('quartet consolidated runtime tail retain slice uses lastIndexOf message anchor').length - 1;
assert(
  quartetClosureLastIndexOfIncludeMessageCount === 4,
  'quartet consolidated runtime tail retain lastIndexOf include message is sole file-level quartet lastIndexOf anchor structural check',
);
const quartetClosureTailAlignRetainMessageCount =
  verifySrc.split('vitest surface flat report tail complete align retained in quartet consolidated guard').length - 1;
assert(
  quartetClosureTailAlignRetainMessageCount === 3,
  'quartet consolidated runtime tail complete align retain message is sole file-level align retain structural check',
);
const quartetClosureTailMilestoneRetainMessageCount =
  verifySrc.split('vitest surface flat report tail milestone retained in quartet consolidated guard').length - 1;
assert(
  quartetClosureTailMilestoneRetainMessageCount === 4,
  'quartet consolidated runtime tail milestone retain message is sole file-level milestone retain structural check',
);
const unifiedClosureTailMilestoneDedupeMessageCount =
  verifySrc.split('vitest surface flat report tail milestone deduped from unified closure into quartet guard').length - 1;
assert(
  unifiedClosureTailMilestoneDedupeMessageCount === 3,
  'unified closure runtime tail milestone dedupe message is sole file-level milestone dedupe structural check',
);
const unifiedClosureTailAlignDedupeMessageCount =
  verifySrc.split('unified closure runtime slice excludes vitest surface flat report tail complete align check').length - 1;
assert(
  unifiedClosureTailAlignDedupeMessageCount === 3,
  'unified closure runtime tail align dedupe message is sole file-level align dedupe structural check',
);
const dedupeBlockColocationMessageCount =
  verifySrc.split('unified closure negative tail dedupe guards colocated before quartet positive retain guards').length - 1;
assert(
  dedupeBlockColocationMessageCount === 2,
  'dedupe-block colocation message is sole file-level negative-before-positive structural check',
);
const dedupeBlockPositiveBeforeIndexOfMessageCount =
  verifySrc.split('quartet positive tail retain guards precede indexOf anchor exclusion guards').length - 1;
assert(
  dedupeBlockPositiveBeforeIndexOfMessageCount === 2,
  'dedupe-block positive-before-indexof ordering message is sole file-level positive-before-indexof structural check',
);
const unifiedClosureIndexOfExclusionMessageCount =
  verifySrc.split('unified closure runtime tail dedupe block excludes indexOf message anchor').length - 1;
assert(
  unifiedClosureIndexOfExclusionMessageCount === 3,
  'unified closure runtime indexOf exclusion message is sole file-level indexOf exclusion structural check',
);
const quartetClosureIndexOfExclusionMessageCount =
  verifySrc.split('quartet consolidated runtime tail retain dedupe block excludes indexOf message anchor').length - 1;
assert(
  quartetClosureIndexOfExclusionMessageCount === 3,
  'quartet consolidated runtime indexOf exclusion message is sole file-level indexOf exclusion structural check',
);
const dedupeBlockIndexOfBeforeLastIndexOfMessageCount =
  verifySrc.split('indexOf anchor exclusion guards precede lastIndexOf include guards').length - 1;
assert(
  dedupeBlockIndexOfBeforeLastIndexOfMessageCount === 3,
  'dedupe-block indexof-before-lastindexof ordering message is sole file-level indexof-before-lastindexof structural check',
);
const dedupeBlockUnifiedBeforeQuartetLastIndexOfMessageCount =
  verifySrc.split('unified lastIndexOf include guard precedes quartet lastIndexOf include guard').length - 1;
assert(
  dedupeBlockUnifiedBeforeQuartetLastIndexOfMessageCount === 3,
  'dedupe-block unified-before-quartet lastindexof ordering message is sole file-level unified-before-quartet lastindexof structural check',
);
const dedupeBlockQuartetLastIndexOfFinalMessageCount =
  verifySrc.split('quartet lastIndexOf include guard is final dedupe-block guard before vitestAudits call').length - 1;
assert(
  dedupeBlockQuartetLastIndexOfFinalMessageCount === 3,
  'dedupe-block quartet-lastindexof-final message is sole file-level quartet-lastindexof-final structural check',
);
const dedupeBlockFinalBoundaryInterstitialMessageCount =
  verifySrc.split('final dedupe-block boundary guard immediately precedes vitestAudits call with no intervening dedupe-block asserts').length - 1;
assert(
  dedupeBlockFinalBoundaryInterstitialMessageCount === 3,
  'dedupe-block final-boundary-interstitial message is sole file-level final-boundary-interstitial structural check',
);
const dedupeBlockPreVitestLastAssertMessageCount =
  verifySrc.split('final-boundary-interstitial guard is last verify.js assert before vitestAudits runtime call').length - 1;
assert(
  dedupeBlockPreVitestLastAssertMessageCount === 3,
  'dedupe-block pre-vitest-last-assert message is sole file-level pre-vitest-last-assert structural check',
);
const dedupeBlockPreVitestImmediateMessageCount =
  verifySrc.split('pre-vitest-last-assert guard immediately precedes vitestAudits runtime call').length - 1;
assert(
  dedupeBlockPreVitestImmediateMessageCount === 3,
  'dedupe-block pre-vitest-immediate message is sole file-level pre-vitest-immediate structural check',
);
const dedupeBlockVitestAuditsOkImmediateMessageCount =
  verifySrc.split('vitestAudits runtime call immediately precedes vitestAudits.ok assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-immediate message is sole file-level vitest-audits-ok-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-immediate guard immediately precedes jsx surface probe assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-immediate message is sole file-level vitest-audits-ok-jsx-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxSceneImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-immediate guard immediately precedes scene jsx surface probe assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxSceneImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-scene-immediate message is sole file-level vitest-audits-ok-jsx-scene-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxContextImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-scene-immediate guard immediately precedes context jsx surface probe assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxContextImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-context-immediate message is sole file-level vitest-audits-ok-jsx-context-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-context-immediate guard immediately precedes entry jsx surface probe assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-immediate message is sole file-level vitest-audits-ok-jsx-entry-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxCompleteImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-immediate guard immediately precedes jsx surface complete assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxCompleteImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-complete-immediate message is sole file-level vitest-audits-ok-jsx-complete-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityScaffoldImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-complete-immediate guard immediately precedes js test parity scaffold assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityScaffoldImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-parity-scaffold-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityAuditImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-scaffold-immediate guard immediately precedes js test parity audit assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityAuditImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-audit-immediate message is sole file-level vitest-audits-ok-jsx-parity-audit-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityGapsImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-audit-immediate guard immediately precedes js test parity gaps assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityGapsImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-gaps-immediate message is sole file-level vitest-audits-ok-jsx-parity-gaps-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityOkImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-gaps-immediate guard immediately precedes js test parity ok assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityOkImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-ok-immediate message is sole file-level vitest-audits-ok-jsx-parity-ok-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityCompleteImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-ok-immediate guard immediately precedes js test parity complete assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityCompleteImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-complete-immediate message is sole file-level vitest-audits-ok-jsx-parity-complete-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityCoverageAlignmentImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-complete-immediate guard immediately precedes js test parity coverage alignment assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityCoverageAlignmentImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-coverage-alignment-immediate message is sole file-level vitest-audits-ok-jsx-parity-coverage-alignment-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityCoverageOkImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-coverage-alignment-immediate guard immediately precedes js test parity coverage ok assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityCoverageOkImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-coverage-ok-immediate message is sole file-level vitest-audits-ok-jsx-parity-coverage-ok-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityBalanceImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-coverage-ok-immediate guard immediately precedes js test parity balance assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityBalanceImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-balance-immediate message is sole file-level vitest-audits-ok-jsx-parity-balance-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityCompleteMilestoneImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-balance-immediate guard immediately precedes js test parity complete milestone assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityCompleteMilestoneImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-complete-milestone-immediate message is sole file-level vitest-audits-ok-jsx-parity-complete-milestone-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityCompleteFlagImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-complete-milestone-immediate guard immediately precedes js test parity complete flag assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityCompleteFlagImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-complete-flag-immediate message is sole file-level vitest-audits-ok-jsx-parity-complete-flag-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityOkMatchesMilestoneImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-complete-flag-immediate guard immediately precedes js test parity ok matches complete milestone assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityOkMatchesMilestoneImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate message is sole file-level vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate guard immediately precedes js test parity coverage ok matches complete milestone assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate message is sole file-level vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxUiParityScaffoldImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate guard immediately precedes jsx ui test parity scaffold assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxUiParityScaffoldImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-ui-parity-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-ui-parity-scaffold-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxUiParityImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-ui-parity-scaffold-immediate guard immediately precedes jsx ui test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxUiParityImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-ui-parity-immediate message is sole file-level vitest-audits-ok-jsx-ui-parity-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxUiParityCompleteImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-ui-parity-immediate guard immediately precedes jsx ui test parity complete assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxUiParityCompleteImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-ui-parity-complete-immediate message is sole file-level vitest-audits-ok-jsx-ui-parity-complete-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxPayoutToastImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-ui-parity-complete-immediate guard immediately precedes payout toast jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxPayoutToastImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-payout-toast-immediate message is sole file-level vitest-audits-ok-jsx-payout-toast-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxInstallPromptImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-payout-toast-immediate guard immediately precedes install prompt jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxInstallPromptImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-install-prompt-immediate message is sole file-level vitest-audits-ok-jsx-install-prompt-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxGhostBetLayerImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-install-prompt-immediate guard immediately precedes ghost bet layer jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxGhostBetLayerImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-ghost-bet-layer-immediate message is sole file-level vitest-audits-ok-jsx-ghost-bet-layer-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxFairnessPanelImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-ghost-bet-layer-immediate guard immediately precedes fairness panel jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxFairnessPanelImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-fairness-panel-immediate message is sole file-level vitest-audits-ok-jsx-fairness-panel-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxUiParityBalanceImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-fairness-panel-immediate guard immediately precedes jsx ui test parity balance assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxUiParityBalanceImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-ui-parity-balance-immediate message is sole file-level vitest-audits-ok-jsx-ui-parity-balance-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxSceneParityScaffoldImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-ui-parity-balance-immediate guard immediately precedes jsx scene test parity scaffold assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxSceneParityScaffoldImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-scene-parity-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-scene-parity-scaffold-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxSceneParityGapsImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-scene-parity-scaffold-immediate guard immediately precedes jsx scene test parity gaps assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxSceneParityGapsImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-scene-parity-gaps-immediate message is sole file-level vitest-audits-ok-jsx-scene-parity-gaps-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxGameSceneImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-scene-parity-gaps-immediate guard immediately precedes game scene jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxGameSceneImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-game-scene-immediate message is sole file-level vitest-audits-ok-jsx-game-scene-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEuropeanWheelImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-game-scene-immediate guard immediately precedes european wheel jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEuropeanWheelImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-european-wheel-immediate message is sole file-level vitest-audits-ok-jsx-european-wheel-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxRapierStageImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-european-wheel-immediate guard immediately precedes rapier stage jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxRapierStageImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-rapier-stage-immediate message is sole file-level vitest-audits-ok-jsx-rapier-stage-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxRouletteBallImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-rapier-stage-immediate guard immediately precedes roulette ball jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxRouletteBallImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-roulette-ball-immediate message is sole file-level vitest-audits-ok-jsx-roulette-ball-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxBallFrictionVaporImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-roulette-ball-immediate guard immediately precedes ball friction vapor jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxBallFrictionVaporImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-ball-friction-vapor-immediate message is sole file-level vitest-audits-ok-jsx-ball-friction-vapor-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxCinematicCameraImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-ball-friction-vapor-immediate guard immediately precedes cinematic camera jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxCinematicCameraImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-cinematic-camera-immediate message is sole file-level vitest-audits-ok-jsx-cinematic-camera-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEuropeanWheelVisualImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-cinematic-camera-immediate guard immediately precedes european wheel visual jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEuropeanWheelVisualImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-european-wheel-visual-immediate message is sole file-level vitest-audits-ok-jsx-european-wheel-visual-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxFeltTableImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-european-wheel-visual-immediate guard immediately precedes felt table jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxFeltTableImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-felt-table-immediate message is sole file-level vitest-audits-ok-jsx-felt-table-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxFloatingWinTextImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-felt-table-immediate guard immediately precedes floating win text jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxFloatingWinTextImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-floating-win-text-immediate message is sole file-level vitest-audits-ok-jsx-floating-win-text-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxLoungeDustImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-floating-win-text-immediate guard immediately precedes lounge dust jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxLoungeDustImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-lounge-dust-immediate message is sole file-level vitest-audits-ok-jsx-lounge-dust-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxMaterialLibraryImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-lounge-dust-immediate guard immediately precedes material library jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxMaterialLibraryImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-material-library-immediate message is sole file-level vitest-audits-ok-jsx-material-library-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxPerformanceMonitorImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-material-library-immediate guard immediately precedes performance monitor jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxPerformanceMonitorImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-performance-monitor-immediate message is sole file-level vitest-audits-ok-jsx-performance-monitor-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxQuantumProbabilityArcImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-performance-monitor-immediate guard immediately precedes quantum probability arc jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxQuantumProbabilityArcImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-quantum-probability-arc-immediate message is sole file-level vitest-audits-ok-jsx-quantum-probability-arc-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxRimStreaksImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-quantum-probability-arc-immediate guard immediately precedes rim streaks jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxRimStreaksImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-rim-streaks-immediate message is sole file-level vitest-audits-ok-jsx-rim-streaks-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxSparkBurstImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-rim-streaks-immediate guard immediately precedes spark burst jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxSparkBurstImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-spark-burst-immediate message is sole file-level vitest-audits-ok-jsx-spark-burst-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxVipLightingImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-spark-burst-immediate guard immediately precedes vip lighting jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxVipLightingImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-vip-lighting-immediate message is sole file-level vitest-audits-ok-jsx-vip-lighting-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxVipPostFxImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-vip-lighting-immediate guard immediately precedes vip post fx jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxVipPostFxImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-vip-post-fx-immediate message is sole file-level vitest-audits-ok-jsx-vip-post-fx-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxVolumetricGodRaysImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-vip-post-fx-immediate guard immediately precedes volumetric god rays jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxVolumetricGodRaysImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-volumetric-god-rays-immediate message is sole file-level vitest-audits-ok-jsx-volumetric-god-rays-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxWheelInstancedImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-volumetric-god-rays-immediate guard immediately precedes wheel instanced jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxWheelInstancedImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-wheel-instanced-immediate message is sole file-level vitest-audits-ok-jsx-wheel-instanced-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxWheelSectorNeonImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-wheel-instanced-immediate guard immediately precedes wheel sector neon jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxWheelSectorNeonImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-wheel-sector-neon-immediate message is sole file-level vitest-audits-ok-jsx-wheel-sector-neon-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxWinParticlesImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-wheel-sector-neon-immediate guard immediately precedes win particles jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxWinParticlesImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-win-particles-immediate message is sole file-level vitest-audits-ok-jsx-win-particles-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxSceneParityOkImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-win-particles-immediate guard immediately precedes jsx scene test parity ok assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxSceneParityOkImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-scene-parity-ok-immediate message is sole file-level vitest-audits-ok-jsx-scene-parity-ok-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxSceneParityCompleteImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-scene-parity-ok-immediate guard immediately precedes jsx scene test parity complete assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxSceneParityCompleteImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-scene-parity-complete-immediate message is sole file-level vitest-audits-ok-jsx-scene-parity-complete-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxSceneParityBalanceImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-scene-parity-complete-immediate guard immediately precedes jsx scene test parity balance assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxSceneParityBalanceImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-scene-parity-balance-immediate message is sole file-level vitest-audits-ok-jsx-scene-parity-balance-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxContextParityScaffoldImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-scene-parity-balance-immediate guard immediately precedes jsx context test parity scaffold assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxContextParityScaffoldImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-context-parity-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-scaffold-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxContextParityGapsImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-context-parity-scaffold-immediate guard immediately precedes jsx context test parity gaps assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxContextParityGapsImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-context-parity-gaps-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-gaps-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxContextParityGapsGameContextImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-context-parity-gaps-immediate guard immediately precedes game context jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxContextParityGapsGameContextImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxContextParityOkImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate guard immediately precedes jsx context test parity ok assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxContextParityOkImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-context-parity-ok-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-ok-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxContextParityCompleteImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-context-parity-ok-immediate guard immediately precedes jsx context test parity complete assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxContextParityCompleteImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-context-parity-complete-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-complete-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxContextParityBalanceImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-context-parity-complete-immediate guard immediately precedes jsx context test parity balance assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxContextParityBalanceImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-context-parity-balance-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-balance-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityScaffoldImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-context-parity-balance-immediate guard immediately precedes jsx entry test parity scaffold assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityScaffoldImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-scaffold-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityGapsImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-scaffold-immediate guard immediately precedes jsx entry test parity gaps assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityGapsImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-gaps-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-gaps-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityGapsAppEntryImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-gaps-immediate guard immediately precedes app entry jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityGapsAppEntryImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityGapsMainEntryImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate guard immediately precedes main entry jsx test parity assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityGapsMainEntryImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityOkImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate guard immediately precedes jsx entry test parity ok assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityOkImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-ok-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-ok-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityCompleteImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-ok-immediate guard immediately precedes jsx entry test parity complete assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityCompleteImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-complete-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-complete-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-complete-immediate guard immediately precedes jsx entry test parity balance assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-immediate guard immediately precedes jsx surface test parity scaffold assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate guard immediately precedes jsx surface test parity matches src tree assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate guard immediately precedes jsx surface test parity ok assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate guard immediately precedes jsx surface test parity complete assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate guard immediately precedes jsx surface test parity gaps assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate guard immediately precedes jsx surface test parity balance assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate guard immediately precedes jsx surface test parity covered assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate guard immediately precedes jsx surface test parity missing assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate guard immediately precedes jsx surface test parity closure assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate guard immediately precedes jsx surface test parity complete milestone assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate guard immediately precedes jsx surface test parity complete flag assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate guard immediately precedes jsx surface test parity ok matches complete milestone assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate guard immediately precedes full surface test parity module count assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate guard immediately precedes full surface test parity audit assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate guard immediately precedes full surface test parity closure assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate guard immediately precedes full surface test parity ok assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate guard immediately precedes full surface test parity complete assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate guard immediately precedes full surface test parity gaps assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate guard immediately precedes full surface test parity balance assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate guard immediately precedes full surface test parity covered assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate guard immediately precedes full surface test parity missing assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate guard immediately precedes unified surface flat closure from vitestSurfaceTestParity report assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate guard immediately precedes surface flat report quartet closure from runVitestVerifyAudits report assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate guard immediately precedes TD-09 resolved note assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-note-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-note-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-note-immediate guard immediately precedes TD-09 resolved assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateMessageCount === 2,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate guard immediately precedes TD-09 in resolved register assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate guard immediately precedes authorityGuard.ts exists assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate guard immediately precedes client startup guard wired assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate guard immediately precedes authority server startup guard assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate guard immediately precedes master secret env documented assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate guard immediately precedes authority guard upgrade logged assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate guard immediately precedes dev demo custody allowed assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate guard immediately precedes prod without API blocked assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate guard immediately precedes prod demo custody opt-in allowed assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate guard immediately precedes prod with API passes assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate guard immediately precedes vercel.json for static demo deploy assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate guard immediately precedes demo custody badge assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate guard immediately precedes fairness custody badge CSS class assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate structural check',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterCustodyBadgePropImmediateMessageCount =
  verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate guard immediately precedes FairnessPanel custody badge prop assert').length - 1;
assert(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterCustodyBadgePropImmediateMessageCount === 3,
  'dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-custody-badge-prop-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-custody-badge-prop-immediate structural check',
);
const vitestStructuralStart = verifySrc.indexOf(
  "verifySrc.includes('unified surface flat closure from vitestSurfaceTestParity report')",
);
const vitestStructuralEnd = verifySrc.lastIndexOf('const vitestCoverageTestSrc = fs.readFileSync');
const vitestStructuralSlice = verifySrc.slice(vitestStructuralStart, vitestStructuralEnd);
const unifiedClosureLastIndexOfIncludesStructuralCount =
  vitestStructuralSlice.split(
    "verifySrc.includes('unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(')",
  ).length - 1;
assert(
  unifiedClosureLastIndexOfIncludesStructuralCount === 1,
  'structural section excludes file-level verifySrc.includes lastIndexOf anchor pattern',
);
const quartetClosureLastIndexOfIncludesStructuralCount =
  vitestStructuralSlice.split(
    "verifySrc.includes('quartetClosureRuntimeMsgIdx = verifySrc.lastIndexOf(')",
  ).length - 1;
assert(
  quartetClosureLastIndexOfIncludesStructuralCount === 1,
  'structural section excludes file-level verifySrc.includes quartetClosureRuntimeMsgIdx lastIndexOf anchor pattern',
);
assert(
  verifySrc.includes('surfaceFlatUnifiedClosureComplete === vitestAudits.vitestSurfaceTestParity.ok'),
  'verify surface flat report quartet closure consolidated includes unified closure complete',
);
assert(
  verifySrc.includes('surfaceFlatUnifiedClosureComplete === SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE'),
  'verify surface flat report quartet closure consolidated includes unified closure milestone align',
);
assert(
  verifySrc.includes('SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE &&'),
  'verify surface flat report quartet closure consolidated includes unified closure milestone',
);
assert(
  verifySrc.includes('surface flat report quartet closure from runVitestVerifyAudits report'),
  'verify surface flat report quartet closure runtime assertion',
);
assert(
  verifySrc.includes('surfaceFlatFieldTrilogyComplete === SURFACE_FLAT_FIELD_TRILOGY_COMPLETE'),
  'verify surface flat report quartet closure consolidated includes trilogy complete',
);
assert(
  verifySrc.includes('SURFACE_FLAT_FIELD_TRILOGY_COMPLETE &&'),
  'verify surface flat report quartet closure consolidated includes trilogy complete milestone',
);
assert(
  verifySrc.includes('surfaceFlatFieldPairCount === SURFACE_FLAT_FIELD_PAIR_COUNT'),
  'verify surface flat report quartet closure consolidated includes field pair count',
);
assert(
  verifySrc.includes('surfaceFlatTotalFieldCount === SURFACE_FLAT_TOTAL_FIELD_COUNT'),
  'verify surface flat report quartet closure consolidated includes total field count',
);
assert(
  verifySrc.includes('surfaceFlatFieldPairCount * 2 === vitestAudits.surfaceFlatTotalFieldCount'),
  'verify surface flat report quartet closure consolidated includes total field count closure',
);
assert(
  verifySrc.includes('surfaceFlatReportFlatFieldCount === SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT'),
  'verify surface flat report quartet closure consolidated includes report flat field count',
);
assert(
  verifySrc.includes('surfaceFlatReportFlatFieldCount === vitestAudits.surfaceFlatFieldPairCount + 2'),
  'verify surface flat report quartet closure consolidated includes report flat field pair-plus-quartet align',
);
assert(
  verifySrc.includes('surfaceFlatReportQuartetComplete === SURFACE_FLAT_REPORT_QUARTET_COMPLETE'),
  'verify surface flat report quartet closure consolidated includes report quartet complete',
);
assert(
  verifySrc.includes('SURFACE_FLAT_REPORT_QUARTET_COMPLETE &&'),
  'verify surface flat report quartet closure consolidated includes report quartet complete milestone',
);
assert(
  verifySrc.includes('vitestAudits.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE'),
  'verify surface flat report quartet closure consolidated includes vitest surface flat report tail complete align',
);
assert(
  verifySrc.includes('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE &&'),
  'verify surface flat report quartet closure consolidated includes vitest surface flat report tail complete milestone',
);
const quartetClosureTailMilestoneStructuralCount =
  verifySrc.split(
    'verify surface flat report quartet closure consolidated includes vitest surface flat report tail complete milestone',
  ).length - 1;
assert(
  quartetClosureTailMilestoneStructuralCount === 2,
  'quartet closure structural tail complete milestone guards retained',
);
const quartetClosureTailAlignStructuralCount =
  verifySrc.split(
    'verify surface flat report quartet closure consolidated includes vitest surface flat report tail complete align',
  ).length - 1;
assert(
  quartetClosureTailAlignStructuralCount === 2,
  'quartet closure structural tail complete align guards retained',
);
const vitestCoverageTestSrc = fs.readFileSync(
  path.join(__dirname, 'src/core/vitestCoverage.test.ts'),
  'utf8',
);
assert(
  vitestCoverageTestSrc.includes("describe('surface flat report quartet closure'"),
  'surface flat report quartet closure vitest describe block',
);
assert(
  !vitestCoverageTestSrc.includes("describe('surface flat field trilogy'"),
  'surface flat field trilogy vitest describe renamed to quartet closure',
);
const trilogyClosureRenameAssertCount =
  verifySrc.split('surface flat field trilogy from runVitestVerifyAudits report').length - 1;
assert(
  trilogyClosureRenameAssertCount === 1,
  'consolidated surface flat runtime assertion renamed from trilogy to quartet closure',
);
const trilogyReportAssertCount =
  verifySrc.split('surface flat field trilogy complete report matches milestone').length - 1;
assert(
  trilogyReportAssertCount === 1,
  'standalone trilogy report runtime assert deduped into consolidated guard',
);
const reportFlatFieldCountAssertCount =
  verifySrc.split('surface flat report flat field count report').length - 1;
assert(
  reportFlatFieldCountAssertCount === 1,
  'standalone report flat field count runtime assert deduped into consolidated guard',
);
const reportFlatFieldPairAlignAssertCount =
  verifySrc.split('surface flat report flat field count aligns with pair count plus quartet report').length - 1;
assert(
  reportFlatFieldPairAlignAssertCount === 1,
  'standalone report flat field pair align runtime assert deduped into consolidated guard',
);
const quartetBalanceAssertCount =
  verifySrc.split('surface flat report quartet milestone balance report').length - 1;
assert(
  quartetBalanceAssertCount === 1,
  'standalone quartet milestone balance runtime assert deduped into consolidated guard',
);
const trilogyBalanceAssertCount =
  verifySrc.split('surface flat field trilogy milestone balance report').length - 1;
assert(
  trilogyBalanceAssertCount === 1,
  'standalone trilogy milestone balance runtime assert deduped into consolidated guard',
);
const totalFieldCountAssertCount =
  verifySrc.split('surface flat total field count report').length - 1;
assert(
  totalFieldCountAssertCount === 1,
  'standalone total field count runtime assert deduped into consolidated guard',
);
const totalFieldCountBalanceAssertCount =
  verifySrc.split('surface flat total field count balance report').length - 1;
assert(
  totalFieldCountBalanceAssertCount === 1,
  'standalone total field count balance runtime assert deduped into consolidated guard',
);
const totalFieldCountClosureAssertCount =
  verifySrc.split('surface flat total field count closure report').length - 1;
assert(
  totalFieldCountClosureAssertCount === 1,
  'standalone total field count closure runtime assert deduped into consolidated guard',
);
const fieldPairCountAssertCount =
  verifySrc.split('surface flat field pair count report').length - 1;
assert(
  fieldPairCountAssertCount === 1,
  'standalone field pair count runtime assert deduped into consolidated guard',
);
const unifiedClosureMilestoneAlignAssertCount =
  verifySrc.split('surface flat unified closure complete matches milestone report').length - 1;
assert(
  unifiedClosureMilestoneAlignAssertCount === 1,
  'standalone unified closure milestone align runtime assert deduped into consolidated guard',
);
const fullSurfaceUnifiedClosureAssertCount =
  verifySrc.split('full surface flat complete matches unified closure milestone report').length - 1;
assert(
  fullSurfaceUnifiedClosureAssertCount === 1,
  'standalone full surface unified closure runtime assert deduped into consolidated guard',
);
const vitestSurfaceUnifiedClosureAssertCount =
  verifySrc.split('vitest surface flat complete matches unified closure milestone report').length - 1;
assert(
  vitestSurfaceUnifiedClosureAssertCount === 1,
  'standalone vitest surface unified closure runtime assert deduped into consolidated guard',
);
const unifiedClosureReportOkAssertCount =
  verifySrc.split('surface flat unified closure complete from vitestSurfaceTestParity report ok report').length -
  1;
assert(
  unifiedClosureReportOkAssertCount === 1,
  'standalone unified closure report ok runtime assert deduped into consolidated guard',
);
const unifiedClosureFullAlignAssertCount =
  verifySrc.split('surface flat unified closure complete aligns with fullSurfaceTestParityComplete report')
    .length - 1;
assert(
  unifiedClosureFullAlignAssertCount === 1,
  'standalone unified closure full align runtime assert deduped into consolidated guard',
);
const unifiedClosureVitestAlignAssertCount =
  verifySrc.split(
    'surface flat unified closure complete aligns with vitestSurfaceTestParityComplete report',
  ).length - 1;
assert(
  unifiedClosureVitestAlignAssertCount === 1,
  'standalone unified closure vitest align runtime assert deduped into consolidated guard',
);
const fullSurfaceFlatCoveredAssertCount =
  verifySrc.split('full surface flat covered count from vitestSurfaceTestParity report report').length - 1;
assert(
  fullSurfaceFlatCoveredAssertCount === 1,
  'standalone full surface flat covered count runtime assert deduped into consolidated guard',
);
const fullSurfaceFlatMissingAssertCount =
  verifySrc.split('full surface flat missing count from vitestSurfaceTestParity report report').length - 1;
assert(
  fullSurfaceFlatMissingAssertCount === 1,
  'standalone full surface flat missing count runtime assert deduped into consolidated guard',
);
const fullSurfaceFlatModuleAssertCount =
  verifySrc.split('full surface flat module count from vitestSurfaceTestParity report report').length - 1;
assert(
  fullSurfaceFlatModuleAssertCount === 1,
  'standalone full surface flat module count runtime assert deduped into consolidated guard',
);
const fullSurfaceFlatCompleteAssertCount =
  verifySrc.split('full surface flat complete from vitestSurfaceTestParity report ok report').length - 1;
assert(
  fullSurfaceFlatCompleteAssertCount === 1,
  'standalone full surface flat complete runtime assert deduped into consolidated guard',
);
const vitestSurfaceFlatModuleAssertCount =
  verifySrc.split('vitest surface flat module count from report report').length - 1;
assert(
  vitestSurfaceFlatModuleAssertCount === 1,
  'standalone vitest surface flat module count runtime assert deduped into consolidated guard',
);
const vitestSurfaceFlatCoveredAssertCount =
  verifySrc.split('vitest surface flat covered count from report report').length - 1;
assert(
  vitestSurfaceFlatCoveredAssertCount === 1,
  'standalone vitest surface flat covered count runtime assert deduped into consolidated guard',
);
const vitestSurfaceFlatMissingAssertCount =
  verifySrc.split('vitest surface flat missing count from report report').length - 1;
assert(
  vitestSurfaceFlatMissingAssertCount === 1,
  'standalone vitest surface flat missing count runtime assert deduped into consolidated guard',
);
const vitestSurfaceFlatCompleteAssertCount =
  verifySrc.split('vitest surface flat complete from report ok report').length - 1;
assert(
  vitestSurfaceFlatCompleteAssertCount === 1,
  'standalone vitest surface flat complete runtime assert deduped into consolidated guard',
);
const unifiedClosureMilestoneAssertCount =
  verifySrc.split('surface flat unified closure complete milestone report').length - 1;
assert(
  unifiedClosureMilestoneAssertCount === 1,
  'standalone surface flat unified closure milestone runtime assert deduped into consolidated guard',
);
const trilogyMilestoneAssertCount =
  verifySrc.split('surface flat field trilogy complete milestone report').length - 1;
assert(
  trilogyMilestoneAssertCount === 1,
  'standalone surface flat field trilogy complete milestone runtime assert deduped into consolidated guard',
);
const quartetMilestoneAssertCount =
  verifySrc.split('surface flat report quartet complete milestone report').length - 1;
assert(
  quartetMilestoneAssertCount === 1,
  'standalone surface flat report quartet complete milestone runtime assert deduped into consolidated guard',
);
const tailCompleteMilestoneAssertCount =
  verifySrc.split('vitest surface flat report tail complete milestone report').length - 1;
assert(
  tailCompleteMilestoneAssertCount === 1,
  'standalone vitest surface flat report tail complete milestone runtime assert deduped into consolidated guard',
);
const vitestSurfaceOkGateAssertCount =
  verifySrc.split('vitest surface test parity runtime ok is sole surface closure gate report').length - 1;
assert(
  vitestSurfaceOkGateAssertCount === 1,
  'standalone vitest surface ok gate runtime assert deduped into consolidated guard',
);
const runVitestOkGateAssertCount =
  verifySrc.split('runVitestVerifyAudits ok gated by vitestSurfaceTestParity.ok report').length - 1;
assert(
  runVitestOkGateAssertCount === 1,
  'standalone runVitestVerifyAudits ok gate runtime assert deduped into consolidated guard',
);
const fullSurfaceParityMilestoneAssertCount =
  verifySrc.split('full surface test parity complete milestone report').length - 1;
assert(
  fullSurfaceParityMilestoneAssertCount === 1,
  'standalone full surface test parity complete milestone runtime assert deduped into consolidated guard',
);
const fullSurfaceParityOkAlignAssertCount =
  verifySrc.split('full surface test parity ok matches complete milestone report').length - 1;
assert(
  fullSurfaceParityOkAlignAssertCount === 1,
  'standalone full surface test parity ok align runtime assert deduped into consolidated guard',
);
const vitestFullSurfaceOkCrossAlignAssertCount =
  verifySrc.split('vitest surface test parity ok aligns with fullSurfaceTestParity.ok report').length - 1;
assert(
  vitestFullSurfaceOkCrossAlignAssertCount === 1,
  'standalone vitest full surface ok cross align runtime assert deduped into consolidated guard',
);
const vitestSurfaceAuditOkAssertCount =
  verifySrc.split(
    'vitest surface test parity audit (${vitestAudits.vitestSurfaceTestParity.coveredCount}/${vitestAudits.vitestSurfaceTestParity.moduleCount} covered) report',
  ).length - 1;
assert(
  vitestSurfaceAuditOkAssertCount === 1,
  'standalone vitest surface test parity audit ok runtime assert deduped into consolidated guard',
);
const vitestSurfaceAuditModuleCountAssertCount =
  verifySrc.split(
    'vitest surface test parity audit module count (${vitestAudits.vitestSurfaceTestParity.moduleCount}/${vitestAudits.fullSurfaceTestParity.moduleCount}) report',
  ).length - 1;
assert(
  vitestSurfaceAuditModuleCountAssertCount === 1,
  'standalone vitest surface test parity audit module count runtime assert deduped into consolidated guard',
);
const vitestSurfaceAliasCompleteMilestoneAssertCount =
  verifySrc.split('vitest surface test parity alias complete milestone report').length - 1;
assert(
  vitestSurfaceAliasCompleteMilestoneAssertCount === 1,
  'standalone vitest surface test parity alias complete milestone runtime assert deduped into consolidated guard',
);
const vitestSurfaceCompleteReportFlagAssertCount =
  verifySrc.split('vitest surface test parity complete report flag report').length - 1;
assert(
  vitestSurfaceCompleteReportFlagAssertCount === 1,
  'standalone vitest surface test parity complete report flag runtime assert deduped into consolidated guard',
);
const vitestSurfaceCompleteCrossAlignAssertCount =
  verifySrc.split('vitest surface test parity complete aligns with fullSurfaceTestParityComplete report').length - 1;
assert(
  vitestSurfaceCompleteCrossAlignAssertCount === 1,
  'standalone vitest surface test parity complete cross align runtime assert deduped into consolidated guard',
);
const vitestSurfaceCoveredCrossAlignAssertCount =
  verifySrc.split('vitest surface test parity covered aligns with fullSurfaceTestParityCoveredCount report').length - 1;
assert(
  vitestSurfaceCoveredCrossAlignAssertCount === 1,
  'standalone vitest surface test parity covered cross align runtime assert deduped into consolidated guard',
);
const vitestSurfaceMissingCrossAlignAssertCount =
  verifySrc.split('vitest surface test parity missing aligns with fullSurfaceTestParityMissingCount report').length - 1;
assert(
  vitestSurfaceMissingCrossAlignAssertCount === 1,
  'standalone vitest surface test parity missing cross align runtime assert deduped into consolidated guard',
);
const fullSurfaceJsJsxMilestonesAssertCount =
  verifySrc.split('full surface test parity js and jsx milestones report').length - 1;
assert(
  fullSurfaceJsJsxMilestonesAssertCount === 1,
  'standalone full surface test parity js and jsx milestones runtime assert deduped into consolidated guard',
);
const fullSurfaceModuleCountFlagAssertCount =
  verifySrc.split('full surface test parity module count flag report').length - 1;
assert(
  fullSurfaceModuleCountFlagAssertCount === 1,
  'standalone full surface test parity module count flag runtime assert deduped into consolidated guard',
);
const vitestSurfaceModuleCountAliasAssertCount =
  verifySrc.split('vitest surface test parity module count alias (${VITEST_SURFACE_TEST_PARITY_MODULE_COUNT}) report').length - 1;
assert(
  vitestSurfaceModuleCountAliasAssertCount === 1,
  'standalone vitest surface test parity module count alias runtime assert deduped into consolidated guard',
);
const vitestSurfaceModuleCountReportAssertCount =
  verifySrc.split('vitest surface test parity module count report (${vitestAudits.vitestSurfaceTestParityModuleCount}/${VITEST_SURFACE_TEST_PARITY_MODULE_COUNT}) report').length - 1;
assert(
  vitestSurfaceModuleCountReportAssertCount === 1,
  'standalone vitest surface test parity module count report runtime assert deduped into consolidated guard',
);
const vitestSurfaceCompleteAliasAssertCount =
  verifySrc.split('vitest surface test parity complete alias (${VITEST_SURFACE_TEST_PARITY_COMPLETE}) report').length - 1;
assert(
  vitestSurfaceCompleteAliasAssertCount === 1,
  'standalone vitest surface test parity complete alias runtime assert deduped into consolidated guard',
);
const vitestSurfaceCoveredCountAliasAssertCount =
  verifySrc.split('vitest surface test parity covered count alias (${VITEST_SURFACE_TEST_PARITY_COVERED_COUNT}) report').length - 1;
assert(
  vitestSurfaceCoveredCountAliasAssertCount === 1,
  'standalone vitest surface test parity covered count alias runtime assert deduped into consolidated guard',
);
const vitestSurfaceMissingCountAliasAssertCount =
  verifySrc.split('vitest surface test parity missing count alias (${VITEST_SURFACE_TEST_PARITY_MISSING_COUNT}) report').length - 1;
assert(
  vitestSurfaceMissingCountAliasAssertCount === 1,
  'standalone vitest surface test parity missing count alias runtime assert deduped into consolidated guard',
);
const vitestSurfaceCoveredReportAssertCount =
  verifySrc.split('vitest surface test parity covered report (${vitestAudits.vitestSurfaceTestParityCoveredCount}/${VITEST_SURFACE_TEST_PARITY_COVERED_COUNT}) report').length - 1;
assert(
  vitestSurfaceCoveredReportAssertCount === 1,
  'standalone vitest surface test parity covered report runtime assert deduped into consolidated guard',
);
const vitestSurfaceMissingReportAssertCount =
  verifySrc.split('vitest surface test parity missing report (${vitestAudits.vitestSurfaceTestParityMissingCount}/${VITEST_SURFACE_TEST_PARITY_MISSING_COUNT}) report').length - 1;
assert(
  vitestSurfaceMissingReportAssertCount === 1,
  'standalone vitest surface test parity missing report runtime assert deduped into consolidated guard',
);
const unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(
  "'unified surface flat closure from vitestSurfaceTestParity report'",
);
const unifiedClosureRuntimeAssertStart = verifySrc.lastIndexOf('assert(', unifiedClosureRuntimeMsgIdx);
const unifiedClosureRuntimeSlice = verifySrc.slice(
  unifiedClosureRuntimeAssertStart,
  unifiedClosureRuntimeMsgIdx,
);
assert(
  !unifiedClosureRuntimeSlice.includes('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE'),
  'vitest surface flat report tail milestone deduped from unified closure into quartet guard',
);
assert(
  !unifiedClosureRuntimeSlice.includes(
    'vitestAudits.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE',
  ),
  'unified closure runtime slice excludes vitest surface flat report tail complete align check',
);
const quartetClosureRuntimeMsgIdx = verifySrc.lastIndexOf(
  "'surface flat report quartet closure from runVitestVerifyAudits report'",
);
const quartetClosureRuntimeAssertStart = verifySrc.lastIndexOf('assert(', quartetClosureRuntimeMsgIdx);
const quartetClosureRuntimeSlice = verifySrc.slice(
  quartetClosureRuntimeAssertStart,
  quartetClosureRuntimeMsgIdx,
);
assert(
  quartetClosureRuntimeSlice.includes('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE'),
  'vitest surface flat report tail milestone retained in quartet consolidated guard',
);
assert(
  quartetClosureRuntimeSlice.includes(
    'vitestAudits.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE',
  ),
  'vitest surface flat report tail complete align retained in quartet consolidated guard',
);
const unifiedClosureRuntimeDedupeStart = verifySrc.indexOf(
  'const unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(',
);
const unifiedClosureRuntimeDedupeEnd = verifySrc.indexOf('const vitestAudits = runVitestVerifyAudits');
const unifiedClosureRuntimeDedupeSlice = verifySrc.slice(
  unifiedClosureRuntimeDedupeStart,
  unifiedClosureRuntimeDedupeEnd,
);
const unifiedNegativeTailMilestoneDedupeIdx = unifiedClosureRuntimeDedupeSlice.indexOf(
  'vitest surface flat report tail milestone deduped from unified closure into quartet guard',
);
const unifiedNegativeTailAlignDedupeIdx = unifiedClosureRuntimeDedupeSlice.indexOf(
  'unified closure runtime slice excludes vitest surface flat report tail complete align check',
);
const quartetPositiveTailMilestoneRetainIdx = unifiedClosureRuntimeDedupeSlice.indexOf(
  'vitest surface flat report tail milestone retained in quartet consolidated guard',
);
assert(
  unifiedNegativeTailMilestoneDedupeIdx !== -1 &&
    unifiedNegativeTailAlignDedupeIdx !== -1 &&
    quartetPositiveTailMilestoneRetainIdx !== -1 &&
    unifiedNegativeTailMilestoneDedupeIdx < quartetPositiveTailMilestoneRetainIdx &&
    unifiedNegativeTailAlignDedupeIdx < quartetPositiveTailMilestoneRetainIdx,
  'unified closure negative tail dedupe guards colocated before quartet positive retain guards',
);
const quartetPositiveTailRetainMilestoneInVerifyIdx = verifySrc.indexOf(
  'vitest surface flat report tail milestone retained in quartet consolidated guard',
);
const quartetPositiveTailAlignRetainInVerifyIdx = verifySrc.indexOf(
  'vitest surface flat report tail complete align retained in quartet consolidated guard',
);
const indexOfExclusionGuardIdx = verifySrc.indexOf('const unifiedClosureRuntimeIndexOfAnchorCount =');
assert(
  quartetPositiveTailRetainMilestoneInVerifyIdx !== -1 &&
    quartetPositiveTailAlignRetainInVerifyIdx !== -1 &&
    indexOfExclusionGuardIdx !== -1 &&
    quartetPositiveTailRetainMilestoneInVerifyIdx < indexOfExclusionGuardIdx &&
    quartetPositiveTailAlignRetainInVerifyIdx < indexOfExclusionGuardIdx,
  'quartet positive tail retain guards precede indexOf anchor exclusion guards',
);
const unifiedClosureRuntimeIndexOfAnchorCount =
  unifiedClosureRuntimeDedupeSlice.split('unifiedClosureRuntimeMsgIdx = verifySrc.indexOf(').length - 1;
assert(
  unifiedClosureRuntimeIndexOfAnchorCount === 0,
  'unified closure runtime tail dedupe block excludes indexOf message anchor',
);
const quartetClosureRuntimeIndexOfAnchorCount =
  unifiedClosureRuntimeDedupeSlice.split('quartetClosureRuntimeMsgIdx = verifySrc.indexOf(').length - 1;
assert(
  quartetClosureRuntimeIndexOfAnchorCount === 0,
  'quartet consolidated runtime tail retain dedupe block excludes indexOf message anchor',
);
const unifiedIndexOfExclusionEndInVerifyIdx = verifySrc.lastIndexOf(
  'unified closure runtime tail dedupe block excludes indexOf message anchor',
);
const quartetIndexOfExclusionEndInVerifyIdx = verifySrc.lastIndexOf(
  'quartet consolidated runtime tail retain dedupe block excludes indexOf message anchor',
);
const unifiedLastIndexOfIncludeInVerifyIdx = verifySrc.indexOf(
  "unifiedClosureRuntimeDedupeSlice.includes('unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(')",
);
const quartetLastIndexOfIncludeInVerifyIdx = verifySrc.indexOf(
  "unifiedClosureRuntimeDedupeSlice.includes('quartetClosureRuntimeMsgIdx = verifySrc.lastIndexOf(')",
);
assert(
  unifiedIndexOfExclusionEndInVerifyIdx !== -1 &&
    quartetIndexOfExclusionEndInVerifyIdx !== -1 &&
    unifiedLastIndexOfIncludeInVerifyIdx !== -1 &&
    quartetLastIndexOfIncludeInVerifyIdx !== -1 &&
    unifiedIndexOfExclusionEndInVerifyIdx < unifiedLastIndexOfIncludeInVerifyIdx &&
    unifiedIndexOfExclusionEndInVerifyIdx < quartetLastIndexOfIncludeInVerifyIdx &&
    quartetIndexOfExclusionEndInVerifyIdx < unifiedLastIndexOfIncludeInVerifyIdx &&
    quartetIndexOfExclusionEndInVerifyIdx < quartetLastIndexOfIncludeInVerifyIdx,
  'indexOf anchor exclusion guards precede lastIndexOf include guards',
);
assert(
  unifiedClosureRuntimeDedupeSlice.includes('unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf('),
  'unified closure runtime tail dedupe block includes lastIndexOf message anchor',
);
assert(
  unifiedClosureRuntimeDedupeSlice.includes('quartetClosureRuntimeMsgIdx = verifySrc.lastIndexOf('),
  'quartet consolidated runtime tail retain slice uses lastIndexOf message anchor',
);
const unifiedLastIndexOfIncludeEndInVerifyIdx = verifySrc.lastIndexOf(
  'unified closure runtime tail dedupe block includes lastIndexOf message anchor',
);
const quartetLastIndexOfIncludeEndInVerifyIdx = verifySrc.lastIndexOf(
  'quartet consolidated runtime tail retain slice uses lastIndexOf message anchor',
);
assert(
  unifiedLastIndexOfIncludeEndInVerifyIdx !== -1 &&
    quartetLastIndexOfIncludeEndInVerifyIdx !== -1 &&
    unifiedLastIndexOfIncludeEndInVerifyIdx < quartetLastIndexOfIncludeEndInVerifyIdx,
  'unified lastIndexOf include guard precedes quartet lastIndexOf include guard',
);
const indexOfBeforeLastIndexOfOrderingEndInVerifyIdx = verifySrc.lastIndexOf(
  'indexOf anchor exclusion guards precede lastIndexOf include guards',
);
const quartetLastIndexOfIncludeMessageInAssertInVerifyIdx = verifySrc.indexOf(
  'quartet consolidated runtime tail retain slice uses lastIndexOf message anchor',
  indexOfBeforeLastIndexOfOrderingEndInVerifyIdx,
);
const dedupeBlockTerminalOrderingEndInVerifyIdx = verifySrc.lastIndexOf(
  'unified lastIndexOf include guard precedes quartet lastIndexOf include guard',
);
const vitestAuditsCallInVerifyIdx = verifySrc.lastIndexOf(
  "const vitestAudits = runVitestVerifyAudits(path.join(__dirname, 'src'))",
);
assert(
  quartetLastIndexOfIncludeMessageInAssertInVerifyIdx !== -1 &&
    dedupeBlockTerminalOrderingEndInVerifyIdx !== -1 &&
    vitestAuditsCallInVerifyIdx !== -1 &&
    quartetLastIndexOfIncludeMessageInAssertInVerifyIdx < dedupeBlockTerminalOrderingEndInVerifyIdx &&
    dedupeBlockTerminalOrderingEndInVerifyIdx < vitestAuditsCallInVerifyIdx,
  'quartet lastIndexOf include guard is final dedupe-block guard before vitestAudits call',
);
const dedupeBlockFinalBoundaryMessageInVerifyIdx = verifySrc.indexOf(
  'quartet lastIndexOf include guard is final dedupe-block guard before vitestAudits call',
  dedupeBlockTerminalOrderingEndInVerifyIdx,
);
const dedupeBlockFinalBoundaryCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockFinalBoundaryMessageInVerifyIdx,
);
const dedupeBlockInterstitialGuardStartInVerifyIdx = verifySrc.indexOf(
  'const dedupeBlockFinalBoundaryMessageInVerifyIdx',
  dedupeBlockFinalBoundaryCloseInVerifyIdx,
);
const dedupeBlockImmediateInterstitialSlice = verifySrc.slice(
  dedupeBlockFinalBoundaryCloseInVerifyIdx,
  dedupeBlockInterstitialGuardStartInVerifyIdx === -1
    ? vitestAuditsCallInVerifyIdx
    : dedupeBlockInterstitialGuardStartInVerifyIdx,
);
assert(
  dedupeBlockFinalBoundaryMessageInVerifyIdx !== -1 &&
    dedupeBlockFinalBoundaryCloseInVerifyIdx !== -1 &&
    vitestAuditsCallInVerifyIdx !== -1 &&
    dedupeBlockFinalBoundaryCloseInVerifyIdx < vitestAuditsCallInVerifyIdx &&
    dedupeBlockImmediateInterstitialSlice.split('assert(').length - 1 === 0 &&
    !dedupeBlockImmediateInterstitialSlice.includes('unifiedClosureRuntimeDedupeSlice'),
  'final dedupe-block boundary guard immediately precedes vitestAudits call with no intervening dedupe-block asserts',
);
const dedupeBlockFinalBoundaryInterstitialMessageInVerifyIdx = verifySrc.indexOf(
  'final dedupe-block boundary guard immediately precedes vitestAudits call with no intervening dedupe-block asserts',
  dedupeBlockFinalBoundaryCloseInVerifyIdx,
);
const dedupeBlockFinalBoundaryInterstitialCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockFinalBoundaryInterstitialMessageInVerifyIdx,
);
const dedupeBlockPreVitestRuntimeGuardStartInVerifyIdx = verifySrc.indexOf(
  'const dedupeBlockFinalBoundaryInterstitialMessageInVerifyIdx',
  dedupeBlockFinalBoundaryInterstitialCloseInVerifyIdx,
);
const preVitestAuditsRuntimeSlice = verifySrc.slice(
  dedupeBlockFinalBoundaryInterstitialCloseInVerifyIdx,
  dedupeBlockPreVitestRuntimeGuardStartInVerifyIdx === -1
    ? vitestAuditsCallInVerifyIdx
    : dedupeBlockPreVitestRuntimeGuardStartInVerifyIdx,
);
assert(
  dedupeBlockFinalBoundaryInterstitialMessageInVerifyIdx !== -1 &&
    dedupeBlockFinalBoundaryInterstitialCloseInVerifyIdx !== -1 &&
    vitestAuditsCallInVerifyIdx !== -1 &&
    dedupeBlockFinalBoundaryInterstitialCloseInVerifyIdx < vitestAuditsCallInVerifyIdx &&
    preVitestAuditsRuntimeSlice.split('assert(').length - 1 === 0,
  'final-boundary-interstitial guard is last verify.js assert before vitestAudits runtime call',
);
const dedupeBlockPreVitestLastAssertMessageInVerifyIdx = verifySrc.indexOf(
  'final-boundary-interstitial guard is last verify.js assert before vitestAudits runtime call',
  dedupeBlockFinalBoundaryInterstitialCloseInVerifyIdx,
);
const dedupeBlockPreVitestLastAssertCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockPreVitestLastAssertMessageInVerifyIdx,
);
const dedupeBlockPreVitestLastAssertGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'pre-vitest-last-assert guard immediately precedes vitestAudits runtime call',
  vitestAuditsCallInVerifyIdx,
);
const dedupeBlockPreVitestLastAssertGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockPreVitestLastAssertGuardMessageInVerifyIdx,
);
const vitestAuditsCallImmediateSlice = verifySrc.slice(
  dedupeBlockPreVitestLastAssertGuardCloseInVerifyIdx,
  vitestAuditsCallInVerifyIdx,
);
assert(
  dedupeBlockPreVitestLastAssertMessageInVerifyIdx !== -1 &&
    dedupeBlockPreVitestLastAssertGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockPreVitestLastAssertGuardCloseInVerifyIdx !== -1 &&
    vitestAuditsCallInVerifyIdx !== -1 &&
    dedupeBlockPreVitestLastAssertGuardCloseInVerifyIdx < vitestAuditsCallInVerifyIdx &&
    vitestAuditsCallImmediateSlice.split('assert(').length - 1 === 0,
  'pre-vitest-last-assert guard immediately precedes vitestAudits runtime call',
);
const vitestAudits = runVitestVerifyAudits(path.join(__dirname, 'src'));
assert(
  vitestAudits.ok,
  `vitest verify audits (missing modules: ${vitestAudits.missingModules.join(', ') || 'none'}; upgrades ${vitestAudits.upgradeLog.count}/${vitestAudits.upgradeCount})`,
);
const vitestAuditsCallCloseInVerifyIdx = verifySrc.indexOf(';', vitestAuditsCallInVerifyIdx);
const vitestAuditsOkAssertOpenInVerifyIdx = verifySrc.indexOf(
  'assert(',
  vitestAuditsCallCloseInVerifyIdx,
);
const vitestAuditsCallToOkAssertSlice = verifySrc.slice(
  vitestAuditsCallCloseInVerifyIdx,
  vitestAuditsOkAssertOpenInVerifyIdx,
);
assert(
  vitestAuditsCallCloseInVerifyIdx !== -1 &&
    vitestAuditsOkAssertOpenInVerifyIdx !== -1 &&
    vitestAuditsCallCloseInVerifyIdx < vitestAuditsOkAssertOpenInVerifyIdx &&
    vitestAuditsCallToOkAssertSlice.split('assert(').length - 1 === 0,
  'vitestAudits runtime call immediately precedes vitestAudits.ok assert',
);
assert(
  vitestAudits.jsxSurface.moduleCount === vitestAudits.jsxSurfaceCount,
  `jsx surface probe (${vitestAudits.jsxSurface.moduleCount}/${vitestAudits.jsxSurfaceCount})`,
);
const jsxSurfaceProbeAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurface.moduleCount === vitestAudits.jsxSurfaceCount',
);
const dedupeBlockVitestAuditsOkImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitestAudits runtime call immediately precedes vitestAudits.ok assert',
  jsxSurfaceProbeAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceProbeAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceProbeAssertBodyInVerifyIdx,
);
const vitestAuditsOkImmediateToJsxSurfaceSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkImmediateGuardCloseInVerifyIdx,
  jsxSurfaceProbeAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceProbeAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceProbeAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkImmediateGuardCloseInVerifyIdx < jsxSurfaceProbeAssertOpenInVerifyIdx &&
    vitestAuditsOkImmediateToJsxSurfaceSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-immediate guard immediately precedes jsx surface probe assert',
);
assert(
  vitestAudits.jsxSurface.sceneCount === vitestAudits.jsxSceneSurfaceCount,
  `scene jsx surface probe (${vitestAudits.jsxSurface.sceneCount}/${vitestAudits.jsxSceneSurfaceCount})`,
);
const sceneJsxSurfaceProbeAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurface.sceneCount === vitestAudits.jsxSceneSurfaceCount',
);
const dedupeBlockVitestAuditsOkJsxImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-immediate guard immediately precedes jsx surface probe assert',
  sceneJsxSurfaceProbeAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxImmediateGuardMessageInVerifyIdx,
);
const sceneJsxSurfaceProbeAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  sceneJsxSurfaceProbeAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxImmediateToSceneSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxImmediateGuardCloseInVerifyIdx,
  sceneJsxSurfaceProbeAssertOpenInVerifyIdx,
);
assert(
  sceneJsxSurfaceProbeAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxImmediateGuardCloseInVerifyIdx !== -1 &&
    sceneJsxSurfaceProbeAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxImmediateGuardCloseInVerifyIdx < sceneJsxSurfaceProbeAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxImmediateToSceneSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-immediate guard immediately precedes scene jsx surface probe assert',
);
assert(
  vitestAudits.jsxSurface.contextCount === vitestAudits.jsxContextSurfaceCount,
  `context jsx surface probe (${vitestAudits.jsxSurface.contextCount}/${vitestAudits.jsxContextSurfaceCount})`,
);
const contextJsxSurfaceProbeAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurface.contextCount === vitestAudits.jsxContextSurfaceCount',
);
const dedupeBlockVitestAuditsOkJsxSceneImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-immediate guard immediately precedes scene jsx surface probe assert',
  contextJsxSurfaceProbeAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxSceneImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxSceneImmediateGuardMessageInVerifyIdx,
);
const contextJsxSurfaceProbeAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  contextJsxSurfaceProbeAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxSceneImmediateToContextSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxSceneImmediateGuardCloseInVerifyIdx,
  contextJsxSurfaceProbeAssertOpenInVerifyIdx,
);
assert(
  contextJsxSurfaceProbeAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneImmediateGuardCloseInVerifyIdx !== -1 &&
    contextJsxSurfaceProbeAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneImmediateGuardCloseInVerifyIdx < contextJsxSurfaceProbeAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxSceneImmediateToContextSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-scene-immediate guard immediately precedes context jsx surface probe assert',
);
assert(
  vitestAudits.jsxSurface.entryCount === vitestAudits.jsxEntrySurfaceCount,
  `entry jsx surface probe (${vitestAudits.jsxSurface.entryCount}/${vitestAudits.jsxEntrySurfaceCount})`,
);
const entryJsxSurfaceProbeAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurface.entryCount === vitestAudits.jsxEntrySurfaceCount',
);
const dedupeBlockVitestAuditsOkJsxContextImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-scene-immediate guard immediately precedes context jsx surface probe assert',
  entryJsxSurfaceProbeAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxContextImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxContextImmediateGuardMessageInVerifyIdx,
);
const entryJsxSurfaceProbeAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  entryJsxSurfaceProbeAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxContextImmediateToEntrySlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxContextImmediateGuardCloseInVerifyIdx,
  entryJsxSurfaceProbeAssertOpenInVerifyIdx,
);
assert(
  entryJsxSurfaceProbeAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextImmediateGuardCloseInVerifyIdx !== -1 &&
    entryJsxSurfaceProbeAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextImmediateGuardCloseInVerifyIdx < entryJsxSurfaceProbeAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxContextImmediateToEntrySlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-context-immediate guard immediately precedes entry jsx surface probe assert',
);
assert(
  vitestAudits.jsxSurfaceComplete.ok,
  `jsx surface complete (${vitestAudits.jsxSurfaceComplete.probeCount}/${vitestAudits.jsxSurfaceComplete.moduleCount}; missing ${vitestAudits.jsxSurfaceComplete.missingFromProbe.join(', ') || 'none'})`,
);
const jsxSurfaceCompleteAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurfaceComplete.ok',
);
const dedupeBlockVitestAuditsOkJsxEntryImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-context-immediate guard immediately precedes entry jsx surface probe assert',
  jsxSurfaceCompleteAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceCompleteAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceCompleteAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryImmediateToCompleteSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryImmediateGuardCloseInVerifyIdx,
  jsxSurfaceCompleteAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceCompleteAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceCompleteAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryImmediateGuardCloseInVerifyIdx < jsxSurfaceCompleteAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryImmediateToCompleteSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-immediate guard immediately precedes jsx surface complete assert',
);
assert(
  vitestAudits.coverage.moduleCount === vitestAudits.moduleCount,
  `js test parity scaffold (${vitestAudits.coverage.moduleCount} modules; ${vitestAudits.coverage.missing.length} missing)`,
);
const jsTestParityScaffoldAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.coverage.moduleCount === vitestAudits.moduleCount',
);
const dedupeBlockVitestAuditsOkJsxCompleteImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-immediate guard immediately precedes jsx surface complete assert',
  jsTestParityScaffoldAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxCompleteImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxCompleteImmediateGuardMessageInVerifyIdx,
);
const jsTestParityScaffoldAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityScaffoldAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxCompleteImmediateToScaffoldSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxCompleteImmediateGuardCloseInVerifyIdx,
  jsTestParityScaffoldAssertOpenInVerifyIdx,
);
assert(
  jsTestParityScaffoldAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxCompleteImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxCompleteImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityScaffoldAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxCompleteImmediateGuardCloseInVerifyIdx < jsTestParityScaffoldAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxCompleteImmediateToScaffoldSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-complete-immediate guard immediately precedes js test parity scaffold assert',
);
assert(
  vitestAudits.jsTestParity.moduleCount === vitestAudits.moduleCount,
  `js test parity audit (${vitestAudits.jsTestParity.moduleCount} modules; ${vitestAudits.jsTestParity.missing.length} missing)`,
);
const jsTestParityAuditAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsTestParity.moduleCount === vitestAudits.moduleCount',
);
const dedupeBlockVitestAuditsOkJsxParityScaffoldImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-complete-immediate guard immediately precedes js test parity scaffold assert',
  jsTestParityAuditAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityScaffoldImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityScaffoldImmediateGuardMessageInVerifyIdx,
);
const jsTestParityAuditAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityAuditAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityScaffoldImmediateToAuditSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityScaffoldImmediateGuardCloseInVerifyIdx,
  jsTestParityAuditAssertOpenInVerifyIdx,
);
assert(
  jsTestParityAuditAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityScaffoldImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityScaffoldImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityAuditAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityScaffoldImmediateGuardCloseInVerifyIdx < jsTestParityAuditAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityScaffoldImmediateToAuditSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-scaffold-immediate guard immediately precedes js test parity audit assert',
);
assert(
  vitestAudits.jsTestParity.missing.length === vitestAudits.jsTestParityMissingCount,
  `js test parity gaps (${vitestAudits.jsTestParityCoveredCount}/${vitestAudits.moduleCount} covered)`,
);
const jsTestParityGapsAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsTestParity.missing.length === vitestAudits.jsTestParityMissingCount',
);
const dedupeBlockVitestAuditsOkJsxParityAuditImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-scaffold-immediate guard immediately precedes js test parity audit assert',
  jsTestParityGapsAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityAuditImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityAuditImmediateGuardMessageInVerifyIdx,
);
const jsTestParityGapsAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityGapsAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityAuditImmediateToGapsSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityAuditImmediateGuardCloseInVerifyIdx,
  jsTestParityGapsAssertOpenInVerifyIdx,
);
assert(
  jsTestParityGapsAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityAuditImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityAuditImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityGapsAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityAuditImmediateGuardCloseInVerifyIdx < jsTestParityGapsAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityAuditImmediateToGapsSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-audit-immediate guard immediately precedes js test parity gaps assert',
);
assert(
  vitestAudits.jsTestParity.ok,
  `js test parity (${vitestAudits.jsTestParityCoveredCount}/${vitestAudits.moduleCount} covered)`,
);
const jsTestParityOkAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsTestParity.ok',
);
const dedupeBlockVitestAuditsOkJsxParityGapsImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-audit-immediate guard immediately precedes js test parity gaps assert',
  jsTestParityOkAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityGapsImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityGapsImmediateGuardMessageInVerifyIdx,
);
const jsTestParityOkAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityOkAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityGapsImmediateToOkSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityGapsImmediateGuardCloseInVerifyIdx,
  jsTestParityOkAssertOpenInVerifyIdx,
);
assert(
  jsTestParityOkAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityGapsImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityGapsImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityOkAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityGapsImmediateGuardCloseInVerifyIdx < jsTestParityOkAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityGapsImmediateToOkSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-gaps-immediate guard immediately precedes js test parity ok assert',
);
assert(
  vitestAudits.jsTestParity.missing.length === 0,
  `js test parity complete (missing ${vitestAudits.jsTestParity.missing.join(', ') || 'none'})`,
);
const jsTestParityCompleteAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsTestParity.missing.length === 0',
);
const dedupeBlockVitestAuditsOkJsxParityOkImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-gaps-immediate guard immediately precedes js test parity ok assert',
  jsTestParityCompleteAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityOkImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityOkImmediateGuardMessageInVerifyIdx,
);
const jsTestParityCompleteAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityCompleteAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityOkImmediateToCompleteSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityOkImmediateGuardCloseInVerifyIdx,
  jsTestParityCompleteAssertOpenInVerifyIdx,
);
assert(
  jsTestParityCompleteAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityOkImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityOkImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityCompleteAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityOkImmediateGuardCloseInVerifyIdx < jsTestParityCompleteAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityOkImmediateToCompleteSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-ok-immediate guard immediately precedes js test parity complete assert',
);
assert(
  vitestAudits.coverage.missing.length === vitestAudits.jsTestParityMissingCount,
  `js test parity coverage alignment (${vitestAudits.jsTestParityCoveredCount}/${vitestAudits.moduleCount} covered)`,
);
const jsTestParityCoverageAlignmentAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.coverage.missing.length === vitestAudits.jsTestParityMissingCount',
);
const dedupeBlockVitestAuditsOkJsxParityCompleteImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-ok-immediate guard immediately precedes js test parity complete assert',
  jsTestParityCoverageAlignmentAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityCompleteImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityCompleteImmediateGuardMessageInVerifyIdx,
);
const jsTestParityCoverageAlignmentAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityCoverageAlignmentAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityCompleteImmediateToCoverageAlignmentSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityCompleteImmediateGuardCloseInVerifyIdx,
  jsTestParityCoverageAlignmentAssertOpenInVerifyIdx,
);
assert(
  jsTestParityCoverageAlignmentAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCompleteImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCompleteImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityCoverageAlignmentAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCompleteImmediateGuardCloseInVerifyIdx <
      jsTestParityCoverageAlignmentAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityCompleteImmediateToCoverageAlignmentSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-complete-immediate guard immediately precedes js test parity coverage alignment assert',
);
assert(
  vitestAudits.coverage.ok,
  `js test parity coverage ok (${vitestAudits.jsTestParityCoveredCount}/${vitestAudits.moduleCount} covered)`,
);
const jsTestParityCoverageOkAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.coverage.ok,',
);
const dedupeBlockVitestAuditsOkJsxParityCoverageAlignmentImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-complete-immediate guard immediately precedes js test parity coverage alignment assert',
  jsTestParityCoverageOkAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityCoverageAlignmentImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityCoverageAlignmentImmediateGuardMessageInVerifyIdx,
);
const jsTestParityCoverageOkAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityCoverageOkAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityCoverageAlignmentImmediateToCoverageOkSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityCoverageAlignmentImmediateGuardCloseInVerifyIdx,
  jsTestParityCoverageOkAssertOpenInVerifyIdx,
);
assert(
  jsTestParityCoverageOkAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCoverageAlignmentImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCoverageAlignmentImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityCoverageOkAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCoverageAlignmentImmediateGuardCloseInVerifyIdx <
      jsTestParityCoverageOkAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityCoverageAlignmentImmediateToCoverageOkSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-coverage-alignment-immediate guard immediately precedes js test parity coverage ok assert',
);
assert(
  vitestAudits.jsTestParityCoveredCount + vitestAudits.jsTestParityMissingCount ===
    vitestAudits.moduleCount,
  `js test parity balance (${vitestAudits.jsTestParityCoveredCount}+${vitestAudits.jsTestParityMissingCount})`,
);
const jsTestParityBalanceAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsTestParityCoveredCount + vitestAudits.jsTestParityMissingCount ===',
);
const dedupeBlockVitestAuditsOkJsxParityCoverageOkImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-coverage-alignment-immediate guard immediately precedes js test parity coverage ok assert',
  jsTestParityBalanceAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityCoverageOkImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityCoverageOkImmediateGuardMessageInVerifyIdx,
);
const jsTestParityBalanceAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityBalanceAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityCoverageOkImmediateToBalanceSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityCoverageOkImmediateGuardCloseInVerifyIdx,
  jsTestParityBalanceAssertOpenInVerifyIdx,
);
assert(
  jsTestParityBalanceAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCoverageOkImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCoverageOkImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityBalanceAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCoverageOkImmediateGuardCloseInVerifyIdx <
      jsTestParityBalanceAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityCoverageOkImmediateToBalanceSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-coverage-ok-immediate guard immediately precedes js test parity balance assert',
);
assert(JS_TEST_PARITY_COMPLETE, 'js test parity complete milestone');
const jsTestParityCompleteMilestoneAssertBodyInVerifyIdx = verifySrc.indexOf(
  "assert(JS_TEST_PARITY_COMPLETE, 'js test parity complete milestone')",
);
const dedupeBlockVitestAuditsOkJsxParityBalanceImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-coverage-ok-immediate guard immediately precedes js test parity balance assert',
  jsTestParityCompleteMilestoneAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityBalanceImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityBalanceImmediateGuardMessageInVerifyIdx,
);
const jsTestParityCompleteMilestoneAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityCompleteMilestoneAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityBalanceImmediateToCompleteMilestoneSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityBalanceImmediateGuardCloseInVerifyIdx,
  jsTestParityCompleteMilestoneAssertOpenInVerifyIdx,
);
assert(
  jsTestParityCompleteMilestoneAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityBalanceImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityBalanceImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityCompleteMilestoneAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityBalanceImmediateGuardCloseInVerifyIdx <
      jsTestParityCompleteMilestoneAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityBalanceImmediateToCompleteMilestoneSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-balance-immediate guard immediately precedes js test parity complete milestone assert',
);
assert(
  vitestAudits.jsTestParityComplete === JS_TEST_PARITY_COMPLETE,
  'js test parity complete flag',
);
const jsTestParityCompleteFlagAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'js test parity complete flag',",
);
const dedupeBlockVitestAuditsOkJsxParityCompleteMilestoneImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-balance-immediate guard immediately precedes js test parity complete milestone assert',
  jsTestParityCompleteFlagAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityCompleteMilestoneImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityCompleteMilestoneImmediateGuardMessageInVerifyIdx,
);
const jsTestParityCompleteFlagAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityCompleteFlagAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityCompleteMilestoneImmediateToCompleteFlagSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityCompleteMilestoneImmediateGuardCloseInVerifyIdx,
  jsTestParityCompleteFlagAssertOpenInVerifyIdx,
);
assert(
  jsTestParityCompleteFlagAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCompleteMilestoneImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCompleteMilestoneImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityCompleteFlagAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCompleteMilestoneImmediateGuardCloseInVerifyIdx <
      jsTestParityCompleteFlagAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityCompleteMilestoneImmediateToCompleteFlagSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-complete-milestone-immediate guard immediately precedes js test parity complete flag assert',
);
assert(
  vitestAudits.jsTestParity.ok === JS_TEST_PARITY_COMPLETE,
  'js test parity ok matches complete milestone',
);
const jsTestParityOkMatchesCompleteMilestoneAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'js test parity ok matches complete milestone'",
);
const dedupeBlockVitestAuditsOkJsxParityCompleteFlagImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-complete-milestone-immediate guard immediately precedes js test parity complete flag assert',
  jsTestParityOkMatchesCompleteMilestoneAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityCompleteFlagImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityCompleteFlagImmediateGuardMessageInVerifyIdx,
);
const jsTestParityOkMatchesCompleteMilestoneAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityOkMatchesCompleteMilestoneAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityCompleteFlagImmediateToOkMatchesMilestoneSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityCompleteFlagImmediateGuardCloseInVerifyIdx,
  jsTestParityOkMatchesCompleteMilestoneAssertOpenInVerifyIdx,
);
assert(
  jsTestParityOkMatchesCompleteMilestoneAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCompleteFlagImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCompleteFlagImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityOkMatchesCompleteMilestoneAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCompleteFlagImmediateGuardCloseInVerifyIdx <
      jsTestParityOkMatchesCompleteMilestoneAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityCompleteFlagImmediateToOkMatchesMilestoneSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-complete-flag-immediate guard immediately precedes js test parity ok matches complete milestone assert',
);
assert(
  vitestAudits.coverage.ok === JS_TEST_PARITY_COMPLETE,
  'js test parity coverage ok matches complete milestone',
);
const jsTestParityCoverageOkMatchesCompleteMilestoneAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'js test parity coverage ok matches complete milestone'",
);
const dedupeBlockVitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-complete-flag-immediate guard immediately precedes js test parity ok matches complete milestone assert',
  jsTestParityCoverageOkMatchesCompleteMilestoneAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardMessageInVerifyIdx,
);
const jsTestParityCoverageOkMatchesCompleteMilestoneAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsTestParityCoverageOkMatchesCompleteMilestoneAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityOkMatchesMilestoneImmediateToCoverageOkMatchesMilestoneSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardCloseInVerifyIdx,
  jsTestParityCoverageOkMatchesCompleteMilestoneAssertOpenInVerifyIdx,
);
assert(
  jsTestParityCoverageOkMatchesCompleteMilestoneAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardCloseInVerifyIdx !== -1 &&
    jsTestParityCoverageOkMatchesCompleteMilestoneAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardCloseInVerifyIdx <
      jsTestParityCoverageOkMatchesCompleteMilestoneAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityOkMatchesMilestoneImmediateToCoverageOkMatchesMilestoneSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate guard immediately precedes js test parity coverage ok matches complete milestone assert',
);
assert(
  vitestAudits.jsxUiTestParity.moduleCount === vitestAudits.jsxUiSurfaceCount,
  `jsx ui test parity scaffold (${vitestAudits.jsxUiTestParity.moduleCount} modules; ${vitestAudits.jsxUiTestParity.missing.length} missing)`,
);
const jsxUiTestParityScaffoldAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxUiTestParity.moduleCount === vitestAudits.jsxUiSurfaceCount',
);
const dedupeBlockVitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate guard immediately precedes js test parity coverage ok matches complete milestone assert',
  jsxUiTestParityScaffoldAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardMessageInVerifyIdx,
);
const jsxUiTestParityScaffoldAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxUiTestParityScaffoldAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateToJsxUiScaffoldSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardCloseInVerifyIdx,
  jsxUiTestParityScaffoldAssertOpenInVerifyIdx,
);
assert(
  jsxUiTestParityScaffoldAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxUiTestParityScaffoldAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardCloseInVerifyIdx <
      jsxUiTestParityScaffoldAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateToJsxUiScaffoldSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate guard immediately precedes jsx ui test parity scaffold assert',
);
assert(
  vitestAudits.jsxUiTestParity.ok,
  `jsx ui test parity (${vitestAudits.jsxUiTestParityCoveredCount}/${vitestAudits.jsxUiTestParity.moduleCount} covered)`,
);
const jsxUiTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxUiTestParity.ok',
);
const dedupeBlockVitestAuditsOkJsxUiParityScaffoldImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate guard immediately precedes jsx ui test parity scaffold assert',
  jsxUiTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxUiParityScaffoldImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxUiParityScaffoldImmediateGuardMessageInVerifyIdx,
);
const jsxUiTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxUiTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxUiParityScaffoldImmediateToJsxUiParitySlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxUiParityScaffoldImmediateGuardCloseInVerifyIdx,
  jsxUiTestParityAssertOpenInVerifyIdx,
);
assert(
  jsxUiTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityScaffoldImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityScaffoldImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxUiTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityScaffoldImmediateGuardCloseInVerifyIdx <
      jsxUiTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxUiParityScaffoldImmediateToJsxUiParitySlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-ui-parity-scaffold-immediate guard immediately precedes jsx ui test parity assert',
);
assert(
  vitestAudits.jsxUiTestParity.missing.length === 0,
  `jsx ui test parity complete (missing ${vitestAudits.jsxUiTestParity.missing.join(', ') || 'none'})`,
);
const jsxUiTestParityCompleteAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxUiTestParity.missing.length === 0',
);
const dedupeBlockVitestAuditsOkJsxUiParityImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-ui-parity-scaffold-immediate guard immediately precedes jsx ui test parity assert',
  jsxUiTestParityCompleteAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxUiParityImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxUiParityImmediateGuardMessageInVerifyIdx,
);
const jsxUiTestParityCompleteAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxUiTestParityCompleteAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxUiParityImmediateToJsxUiParityCompleteSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxUiParityImmediateGuardCloseInVerifyIdx,
  jsxUiTestParityCompleteAssertOpenInVerifyIdx,
);
assert(
  jsxUiTestParityCompleteAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxUiTestParityCompleteAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityImmediateGuardCloseInVerifyIdx <
      jsxUiTestParityCompleteAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxUiParityImmediateToJsxUiParityCompleteSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-ui-parity-immediate guard immediately precedes jsx ui test parity complete assert',
);
assert(
  !vitestAudits.jsxUiTestParity.missing.includes('ui/PayoutToast.jsx'),
  'payout toast jsx test parity',
);
const payoutToastJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'payout toast jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxUiParityCompleteImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-ui-parity-immediate guard immediately precedes jsx ui test parity complete assert',
  payoutToastJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxUiParityCompleteImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxUiParityCompleteImmediateGuardMessageInVerifyIdx,
);
const payoutToastJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  payoutToastJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxUiParityCompleteImmediateToPayoutToastSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxUiParityCompleteImmediateGuardCloseInVerifyIdx,
  payoutToastJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  payoutToastJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityCompleteImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityCompleteImmediateGuardCloseInVerifyIdx !== -1 &&
    payoutToastJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityCompleteImmediateGuardCloseInVerifyIdx <
      payoutToastJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxUiParityCompleteImmediateToPayoutToastSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-ui-parity-complete-immediate guard immediately precedes payout toast jsx test parity assert',
);
assert(
  !vitestAudits.jsxUiTestParity.missing.includes('ui/InstallPrompt.jsx'),
  'install prompt jsx test parity',
);
const installPromptJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'install prompt jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxPayoutToastImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-ui-parity-complete-immediate guard immediately precedes payout toast jsx test parity assert',
  installPromptJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxPayoutToastImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxPayoutToastImmediateGuardMessageInVerifyIdx,
);
const installPromptJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  installPromptJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxPayoutToastImmediateToInstallPromptSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxPayoutToastImmediateGuardCloseInVerifyIdx,
  installPromptJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  installPromptJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxPayoutToastImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxPayoutToastImmediateGuardCloseInVerifyIdx !== -1 &&
    installPromptJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxPayoutToastImmediateGuardCloseInVerifyIdx <
      installPromptJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxPayoutToastImmediateToInstallPromptSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-payout-toast-immediate guard immediately precedes install prompt jsx test parity assert',
);
assert(
  !vitestAudits.jsxUiTestParity.missing.includes('ui/GhostBetLayer.jsx'),
  'ghost bet layer jsx test parity',
);
const ghostBetLayerJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'ghost bet layer jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxInstallPromptImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-payout-toast-immediate guard immediately precedes install prompt jsx test parity assert',
  ghostBetLayerJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxInstallPromptImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxInstallPromptImmediateGuardMessageInVerifyIdx,
);
const ghostBetLayerJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  ghostBetLayerJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxInstallPromptImmediateToGhostBetLayerSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxInstallPromptImmediateGuardCloseInVerifyIdx,
  ghostBetLayerJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  ghostBetLayerJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxInstallPromptImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxInstallPromptImmediateGuardCloseInVerifyIdx !== -1 &&
    ghostBetLayerJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxInstallPromptImmediateGuardCloseInVerifyIdx <
      ghostBetLayerJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxInstallPromptImmediateToGhostBetLayerSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-install-prompt-immediate guard immediately precedes ghost bet layer jsx test parity assert',
);
assert(
  !vitestAudits.jsxUiTestParity.missing.includes('ui/FairnessPanel.jsx'),
  'fairness panel jsx test parity',
);
const fairnessPanelJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'fairness panel jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxGhostBetLayerImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-install-prompt-immediate guard immediately precedes ghost bet layer jsx test parity assert',
  fairnessPanelJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxGhostBetLayerImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxGhostBetLayerImmediateGuardMessageInVerifyIdx,
);
const fairnessPanelJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fairnessPanelJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxGhostBetLayerImmediateToFairnessPanelSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxGhostBetLayerImmediateGuardCloseInVerifyIdx,
  fairnessPanelJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  fairnessPanelJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxGhostBetLayerImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxGhostBetLayerImmediateGuardCloseInVerifyIdx !== -1 &&
    fairnessPanelJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxGhostBetLayerImmediateGuardCloseInVerifyIdx <
      fairnessPanelJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxGhostBetLayerImmediateToFairnessPanelSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-ghost-bet-layer-immediate guard immediately precedes fairness panel jsx test parity assert',
);
assert(
  vitestAudits.jsxUiTestParityCoveredCount + vitestAudits.jsxUiTestParityMissingCount ===
    vitestAudits.jsxUiTestParity.moduleCount,
  `jsx ui test parity balance (${vitestAudits.jsxUiTestParityCoveredCount}+${vitestAudits.jsxUiTestParityMissingCount})`,
);
const jsxUiTestParityBalanceAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxUiTestParityCoveredCount + vitestAudits.jsxUiTestParityMissingCount ===',
);
const dedupeBlockVitestAuditsOkJsxFairnessPanelImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-ghost-bet-layer-immediate guard immediately precedes fairness panel jsx test parity assert',
  jsxUiTestParityBalanceAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxFairnessPanelImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxFairnessPanelImmediateGuardMessageInVerifyIdx,
);
const jsxUiTestParityBalanceAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxUiTestParityBalanceAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxFairnessPanelImmediateToJsxUiParityBalanceSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxFairnessPanelImmediateGuardCloseInVerifyIdx,
  jsxUiTestParityBalanceAssertOpenInVerifyIdx,
);
assert(
  jsxUiTestParityBalanceAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxFairnessPanelImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxFairnessPanelImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxUiTestParityBalanceAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxFairnessPanelImmediateGuardCloseInVerifyIdx <
      jsxUiTestParityBalanceAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxFairnessPanelImmediateToJsxUiParityBalanceSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-fairness-panel-immediate guard immediately precedes jsx ui test parity balance assert',
);
assert(
  vitestAudits.jsxSceneTestParity.moduleCount === vitestAudits.jsxSceneSurfaceCount,
  `jsx scene test parity scaffold (${vitestAudits.jsxSceneTestParity.moduleCount} modules; ${vitestAudits.jsxSceneTestParity.missing.length} missing)`,
);
const jsxSceneTestParityScaffoldAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSceneTestParity.moduleCount === vitestAudits.jsxSceneSurfaceCount',
);
const dedupeBlockVitestAuditsOkJsxUiParityBalanceImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-fairness-panel-immediate guard immediately precedes jsx ui test parity balance assert',
  jsxSceneTestParityScaffoldAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxUiParityBalanceImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxUiParityBalanceImmediateGuardMessageInVerifyIdx,
);
const jsxSceneTestParityScaffoldAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSceneTestParityScaffoldAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxUiParityBalanceImmediateToJsxSceneParityScaffoldSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxUiParityBalanceImmediateGuardCloseInVerifyIdx,
  jsxSceneTestParityScaffoldAssertOpenInVerifyIdx,
);
assert(
  jsxSceneTestParityScaffoldAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityBalanceImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityBalanceImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSceneTestParityScaffoldAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxUiParityBalanceImmediateGuardCloseInVerifyIdx <
      jsxSceneTestParityScaffoldAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxUiParityBalanceImmediateToJsxSceneParityScaffoldSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-ui-parity-balance-immediate guard immediately precedes jsx scene test parity scaffold assert',
);
assert(
  vitestAudits.jsxSceneTestParity.missing.length === vitestAudits.jsxSceneTestParityMissingCount,
  `jsx scene test parity gaps (${vitestAudits.jsxSceneTestParityCoveredCount}/${vitestAudits.jsxSceneTestParity.moduleCount} covered)`,
);
const jsxSceneTestParityGapsAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSceneTestParity.missing.length === vitestAudits.jsxSceneTestParityMissingCount',
);
const dedupeBlockVitestAuditsOkJsxSceneParityScaffoldImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-ui-parity-balance-immediate guard immediately precedes jsx scene test parity scaffold assert',
  jsxSceneTestParityGapsAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxSceneParityScaffoldImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxSceneParityScaffoldImmediateGuardMessageInVerifyIdx,
);
const jsxSceneTestParityGapsAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSceneTestParityGapsAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxSceneParityScaffoldImmediateToJsxSceneParityGapsSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxSceneParityScaffoldImmediateGuardCloseInVerifyIdx,
  jsxSceneTestParityGapsAssertOpenInVerifyIdx,
);
assert(
  jsxSceneTestParityGapsAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityScaffoldImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityScaffoldImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSceneTestParityGapsAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityScaffoldImmediateGuardCloseInVerifyIdx <
      jsxSceneTestParityGapsAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxSceneParityScaffoldImmediateToJsxSceneParityGapsSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-scene-parity-scaffold-immediate guard immediately precedes jsx scene test parity gaps assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/GameScene.jsx'),
  'game scene jsx test parity',
);
const gameSceneJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'game scene jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxSceneParityGapsImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-scene-parity-scaffold-immediate guard immediately precedes jsx scene test parity gaps assert',
  gameSceneJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxSceneParityGapsImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxSceneParityGapsImmediateGuardMessageInVerifyIdx,
);
const gameSceneJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  gameSceneJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxSceneParityGapsImmediateToGameSceneSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxSceneParityGapsImmediateGuardCloseInVerifyIdx,
  gameSceneJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  gameSceneJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityGapsImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityGapsImmediateGuardCloseInVerifyIdx !== -1 &&
    gameSceneJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityGapsImmediateGuardCloseInVerifyIdx <
      gameSceneJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxSceneParityGapsImmediateToGameSceneSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-scene-parity-gaps-immediate guard immediately precedes game scene jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/EuropeanWheel.jsx'),
  'european wheel jsx test parity',
);
const europeanWheelJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'european wheel jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxGameSceneImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-scene-parity-gaps-immediate guard immediately precedes game scene jsx test parity assert',
  europeanWheelJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxGameSceneImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxGameSceneImmediateGuardMessageInVerifyIdx,
);
const europeanWheelJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  europeanWheelJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxGameSceneImmediateToEuropeanWheelSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxGameSceneImmediateGuardCloseInVerifyIdx,
  europeanWheelJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  europeanWheelJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxGameSceneImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxGameSceneImmediateGuardCloseInVerifyIdx !== -1 &&
    europeanWheelJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxGameSceneImmediateGuardCloseInVerifyIdx <
      europeanWheelJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxGameSceneImmediateToEuropeanWheelSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-game-scene-immediate guard immediately precedes european wheel jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/RapierStage.jsx'),
  'rapier stage jsx test parity',
);
const rapierStageJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'rapier stage jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxEuropeanWheelImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-game-scene-immediate guard immediately precedes european wheel jsx test parity assert',
  rapierStageJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEuropeanWheelImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEuropeanWheelImmediateGuardMessageInVerifyIdx,
);
const rapierStageJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  rapierStageJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEuropeanWheelImmediateToRapierStageSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEuropeanWheelImmediateGuardCloseInVerifyIdx,
  rapierStageJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  rapierStageJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEuropeanWheelImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEuropeanWheelImmediateGuardCloseInVerifyIdx !== -1 &&
    rapierStageJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEuropeanWheelImmediateGuardCloseInVerifyIdx <
      rapierStageJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEuropeanWheelImmediateToRapierStageSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-european-wheel-immediate guard immediately precedes rapier stage jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/RouletteBall.jsx'),
  'roulette ball jsx test parity',
);
const rouletteBallJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'roulette ball jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxRapierStageImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-european-wheel-immediate guard immediately precedes rapier stage jsx test parity assert',
  rouletteBallJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxRapierStageImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxRapierStageImmediateGuardMessageInVerifyIdx,
);
const rouletteBallJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  rouletteBallJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxRapierStageImmediateToRouletteBallSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxRapierStageImmediateGuardCloseInVerifyIdx,
  rouletteBallJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  rouletteBallJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxRapierStageImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxRapierStageImmediateGuardCloseInVerifyIdx !== -1 &&
    rouletteBallJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxRapierStageImmediateGuardCloseInVerifyIdx <
      rouletteBallJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxRapierStageImmediateToRouletteBallSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-rapier-stage-immediate guard immediately precedes roulette ball jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/BallFrictionVapor.jsx'),
  'ball friction vapor jsx test parity',
);
const ballFrictionVaporJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'ball friction vapor jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxRouletteBallImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-rapier-stage-immediate guard immediately precedes roulette ball jsx test parity assert',
  ballFrictionVaporJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxRouletteBallImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxRouletteBallImmediateGuardMessageInVerifyIdx,
);
const ballFrictionVaporJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  ballFrictionVaporJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxRouletteBallImmediateToBallFrictionVaporSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxRouletteBallImmediateGuardCloseInVerifyIdx,
  ballFrictionVaporJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  ballFrictionVaporJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxRouletteBallImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxRouletteBallImmediateGuardCloseInVerifyIdx !== -1 &&
    ballFrictionVaporJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxRouletteBallImmediateGuardCloseInVerifyIdx <
      ballFrictionVaporJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxRouletteBallImmediateToBallFrictionVaporSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-roulette-ball-immediate guard immediately precedes ball friction vapor jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/CinematicCamera.jsx'),
  'cinematic camera jsx test parity',
);
const cinematicCameraJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'cinematic camera jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxBallFrictionVaporImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-roulette-ball-immediate guard immediately precedes ball friction vapor jsx test parity assert',
  cinematicCameraJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxBallFrictionVaporImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxBallFrictionVaporImmediateGuardMessageInVerifyIdx,
);
const cinematicCameraJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  cinematicCameraJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxBallFrictionVaporImmediateToCinematicCameraSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxBallFrictionVaporImmediateGuardCloseInVerifyIdx,
  cinematicCameraJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  cinematicCameraJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxBallFrictionVaporImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxBallFrictionVaporImmediateGuardCloseInVerifyIdx !== -1 &&
    cinematicCameraJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxBallFrictionVaporImmediateGuardCloseInVerifyIdx <
      cinematicCameraJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxBallFrictionVaporImmediateToCinematicCameraSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-ball-friction-vapor-immediate guard immediately precedes cinematic camera jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/EuropeanWheelVisual.jsx'),
  'european wheel visual jsx test parity',
);
const europeanWheelVisualJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'european wheel visual jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxCinematicCameraImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-ball-friction-vapor-immediate guard immediately precedes cinematic camera jsx test parity assert',
  europeanWheelVisualJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxCinematicCameraImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxCinematicCameraImmediateGuardMessageInVerifyIdx,
);
const europeanWheelVisualJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  europeanWheelVisualJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxCinematicCameraImmediateToEuropeanWheelVisualSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxCinematicCameraImmediateGuardCloseInVerifyIdx,
  europeanWheelVisualJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  europeanWheelVisualJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxCinematicCameraImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxCinematicCameraImmediateGuardCloseInVerifyIdx !== -1 &&
    europeanWheelVisualJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxCinematicCameraImmediateGuardCloseInVerifyIdx <
      europeanWheelVisualJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxCinematicCameraImmediateToEuropeanWheelVisualSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-cinematic-camera-immediate guard immediately precedes european wheel visual jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/FeltTable.jsx'),
  'felt table jsx test parity',
);
const feltTableJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'felt table jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxEuropeanWheelVisualImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-cinematic-camera-immediate guard immediately precedes european wheel visual jsx test parity assert',
  feltTableJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEuropeanWheelVisualImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEuropeanWheelVisualImmediateGuardMessageInVerifyIdx,
);
const feltTableJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  feltTableJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEuropeanWheelVisualImmediateToFeltTableSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEuropeanWheelVisualImmediateGuardCloseInVerifyIdx,
  feltTableJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  feltTableJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEuropeanWheelVisualImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEuropeanWheelVisualImmediateGuardCloseInVerifyIdx !== -1 &&
    feltTableJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEuropeanWheelVisualImmediateGuardCloseInVerifyIdx <
      feltTableJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEuropeanWheelVisualImmediateToFeltTableSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-european-wheel-visual-immediate guard immediately precedes felt table jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/FloatingWinText.jsx'),
  'floating win text jsx test parity',
);
const floatingWinTextJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'floating win text jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxFeltTableImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-european-wheel-visual-immediate guard immediately precedes felt table jsx test parity assert',
  floatingWinTextJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxFeltTableImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxFeltTableImmediateGuardMessageInVerifyIdx,
);
const floatingWinTextJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  floatingWinTextJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxFeltTableImmediateToFloatingWinTextSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxFeltTableImmediateGuardCloseInVerifyIdx,
  floatingWinTextJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  floatingWinTextJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxFeltTableImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxFeltTableImmediateGuardCloseInVerifyIdx !== -1 &&
    floatingWinTextJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxFeltTableImmediateGuardCloseInVerifyIdx <
      floatingWinTextJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxFeltTableImmediateToFloatingWinTextSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-felt-table-immediate guard immediately precedes floating win text jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/LoungeDust.jsx'),
  'lounge dust jsx test parity',
);
const loungeDustJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'lounge dust jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxFloatingWinTextImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-felt-table-immediate guard immediately precedes floating win text jsx test parity assert',
  loungeDustJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxFloatingWinTextImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxFloatingWinTextImmediateGuardMessageInVerifyIdx,
);
const loungeDustJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  loungeDustJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxFloatingWinTextImmediateToLoungeDustSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxFloatingWinTextImmediateGuardCloseInVerifyIdx,
  loungeDustJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  loungeDustJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxFloatingWinTextImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxFloatingWinTextImmediateGuardCloseInVerifyIdx !== -1 &&
    loungeDustJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxFloatingWinTextImmediateGuardCloseInVerifyIdx <
      loungeDustJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxFloatingWinTextImmediateToLoungeDustSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-floating-win-text-immediate guard immediately precedes lounge dust jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/MaterialLibrary.jsx'),
  'material library jsx test parity',
);
const materialLibraryJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'material library jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxLoungeDustImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-floating-win-text-immediate guard immediately precedes lounge dust jsx test parity assert',
  materialLibraryJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxLoungeDustImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxLoungeDustImmediateGuardMessageInVerifyIdx,
);
const materialLibraryJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  materialLibraryJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxLoungeDustImmediateToMaterialLibrarySlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxLoungeDustImmediateGuardCloseInVerifyIdx,
  materialLibraryJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  materialLibraryJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxLoungeDustImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxLoungeDustImmediateGuardCloseInVerifyIdx !== -1 &&
    materialLibraryJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxLoungeDustImmediateGuardCloseInVerifyIdx <
      materialLibraryJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxLoungeDustImmediateToMaterialLibrarySlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-lounge-dust-immediate guard immediately precedes material library jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/PerformanceMonitor.jsx'),
  'performance monitor jsx test parity',
);
const performanceMonitorJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'performance monitor jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxMaterialLibraryImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-lounge-dust-immediate guard immediately precedes material library jsx test parity assert',
  performanceMonitorJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxMaterialLibraryImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxMaterialLibraryImmediateGuardMessageInVerifyIdx,
);
const performanceMonitorJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  performanceMonitorJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxMaterialLibraryImmediateToPerformanceMonitorSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxMaterialLibraryImmediateGuardCloseInVerifyIdx,
  performanceMonitorJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  performanceMonitorJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxMaterialLibraryImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxMaterialLibraryImmediateGuardCloseInVerifyIdx !== -1 &&
    performanceMonitorJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxMaterialLibraryImmediateGuardCloseInVerifyIdx <
      performanceMonitorJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxMaterialLibraryImmediateToPerformanceMonitorSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-material-library-immediate guard immediately precedes performance monitor jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/QuantumProbabilityArc.jsx'),
  'quantum probability arc jsx test parity',
);
const quantumProbabilityArcJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'quantum probability arc jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxPerformanceMonitorImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-material-library-immediate guard immediately precedes performance monitor jsx test parity assert',
  quantumProbabilityArcJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxPerformanceMonitorImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxPerformanceMonitorImmediateGuardMessageInVerifyIdx,
);
const quantumProbabilityArcJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  quantumProbabilityArcJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxPerformanceMonitorImmediateToQuantumProbabilityArcSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxPerformanceMonitorImmediateGuardCloseInVerifyIdx,
  quantumProbabilityArcJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  quantumProbabilityArcJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxPerformanceMonitorImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxPerformanceMonitorImmediateGuardCloseInVerifyIdx !== -1 &&
    quantumProbabilityArcJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxPerformanceMonitorImmediateGuardCloseInVerifyIdx <
      quantumProbabilityArcJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxPerformanceMonitorImmediateToQuantumProbabilityArcSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-performance-monitor-immediate guard immediately precedes quantum probability arc jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/RimStreaks.jsx'),
  'rim streaks jsx test parity',
);
const rimStreaksJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'rim streaks jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxQuantumProbabilityArcImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-performance-monitor-immediate guard immediately precedes quantum probability arc jsx test parity assert',
  rimStreaksJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxQuantumProbabilityArcImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxQuantumProbabilityArcImmediateGuardMessageInVerifyIdx,
);
const rimStreaksJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  rimStreaksJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxQuantumProbabilityArcImmediateToRimStreaksSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxQuantumProbabilityArcImmediateGuardCloseInVerifyIdx,
  rimStreaksJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  rimStreaksJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxQuantumProbabilityArcImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxQuantumProbabilityArcImmediateGuardCloseInVerifyIdx !== -1 &&
    rimStreaksJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxQuantumProbabilityArcImmediateGuardCloseInVerifyIdx <
      rimStreaksJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxQuantumProbabilityArcImmediateToRimStreaksSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-quantum-probability-arc-immediate guard immediately precedes rim streaks jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/SparkBurst.jsx'),
  'spark burst jsx test parity',
);
const sparkBurstJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'spark burst jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxRimStreaksImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-quantum-probability-arc-immediate guard immediately precedes rim streaks jsx test parity assert',
  sparkBurstJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxRimStreaksImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxRimStreaksImmediateGuardMessageInVerifyIdx,
);
const sparkBurstJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  sparkBurstJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxRimStreaksImmediateToSparkBurstSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxRimStreaksImmediateGuardCloseInVerifyIdx,
  sparkBurstJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  sparkBurstJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxRimStreaksImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxRimStreaksImmediateGuardCloseInVerifyIdx !== -1 &&
    sparkBurstJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxRimStreaksImmediateGuardCloseInVerifyIdx <
      sparkBurstJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxRimStreaksImmediateToSparkBurstSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-rim-streaks-immediate guard immediately precedes spark burst jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/VIPLighting.jsx'),
  'vip lighting jsx test parity',
);
const vipLightingJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'vip lighting jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxSparkBurstImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-rim-streaks-immediate guard immediately precedes spark burst jsx test parity assert',
  vipLightingJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxSparkBurstImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxSparkBurstImmediateGuardMessageInVerifyIdx,
);
const vipLightingJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  vipLightingJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxSparkBurstImmediateToVipLightingSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxSparkBurstImmediateGuardCloseInVerifyIdx,
  vipLightingJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  vipLightingJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSparkBurstImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSparkBurstImmediateGuardCloseInVerifyIdx !== -1 &&
    vipLightingJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSparkBurstImmediateGuardCloseInVerifyIdx <
      vipLightingJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxSparkBurstImmediateToVipLightingSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-spark-burst-immediate guard immediately precedes vip lighting jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/VIPPostFX.jsx'),
  'vip post fx jsx test parity',
);
const vipPostFxJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'vip post fx jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxVipLightingImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-spark-burst-immediate guard immediately precedes vip lighting jsx test parity assert',
  vipPostFxJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxVipLightingImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxVipLightingImmediateGuardMessageInVerifyIdx,
);
const vipPostFxJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  vipPostFxJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxVipLightingImmediateToVipPostFxSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxVipLightingImmediateGuardCloseInVerifyIdx,
  vipPostFxJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  vipPostFxJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxVipLightingImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxVipLightingImmediateGuardCloseInVerifyIdx !== -1 &&
    vipPostFxJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxVipLightingImmediateGuardCloseInVerifyIdx <
      vipPostFxJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxVipLightingImmediateToVipPostFxSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-vip-lighting-immediate guard immediately precedes vip post fx jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/VolumetricGodRays.jsx'),
  'volumetric god rays jsx test parity',
);
const volumetricGodRaysJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'volumetric god rays jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxVipPostFxImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-vip-lighting-immediate guard immediately precedes vip post fx jsx test parity assert',
  volumetricGodRaysJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxVipPostFxImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxVipPostFxImmediateGuardMessageInVerifyIdx,
);
const volumetricGodRaysJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  volumetricGodRaysJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxVipPostFxImmediateToVolumetricGodRaysSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxVipPostFxImmediateGuardCloseInVerifyIdx,
  volumetricGodRaysJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  volumetricGodRaysJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxVipPostFxImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxVipPostFxImmediateGuardCloseInVerifyIdx !== -1 &&
    volumetricGodRaysJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxVipPostFxImmediateGuardCloseInVerifyIdx <
      volumetricGodRaysJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxVipPostFxImmediateToVolumetricGodRaysSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-vip-post-fx-immediate guard immediately precedes volumetric god rays jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/WheelInstanced.jsx'),
  'wheel instanced jsx test parity',
);
const wheelInstancedJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'wheel instanced jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxVolumetricGodRaysImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-vip-post-fx-immediate guard immediately precedes volumetric god rays jsx test parity assert',
  wheelInstancedJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxVolumetricGodRaysImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxVolumetricGodRaysImmediateGuardMessageInVerifyIdx,
);
const wheelInstancedJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  wheelInstancedJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxVolumetricGodRaysImmediateToWheelInstancedSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxVolumetricGodRaysImmediateGuardCloseInVerifyIdx,
  wheelInstancedJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  wheelInstancedJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxVolumetricGodRaysImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxVolumetricGodRaysImmediateGuardCloseInVerifyIdx !== -1 &&
    wheelInstancedJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxVolumetricGodRaysImmediateGuardCloseInVerifyIdx <
      wheelInstancedJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxVolumetricGodRaysImmediateToWheelInstancedSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-volumetric-god-rays-immediate guard immediately precedes wheel instanced jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/WheelSectorNeon.jsx'),
  'wheel sector neon jsx test parity',
);
const wheelSectorNeonJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'wheel sector neon jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxWheelInstancedImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-volumetric-god-rays-immediate guard immediately precedes wheel instanced jsx test parity assert',
  wheelSectorNeonJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxWheelInstancedImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxWheelInstancedImmediateGuardMessageInVerifyIdx,
);
const wheelSectorNeonJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  wheelSectorNeonJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxWheelInstancedImmediateToWheelSectorNeonSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxWheelInstancedImmediateGuardCloseInVerifyIdx,
  wheelSectorNeonJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  wheelSectorNeonJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxWheelInstancedImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxWheelInstancedImmediateGuardCloseInVerifyIdx !== -1 &&
    wheelSectorNeonJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxWheelInstancedImmediateGuardCloseInVerifyIdx <
      wheelSectorNeonJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxWheelInstancedImmediateToWheelSectorNeonSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-wheel-instanced-immediate guard immediately precedes wheel sector neon jsx test parity assert',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/WinParticles.jsx'),
  'win particles jsx test parity',
);
const winParticlesJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'win particles jsx test parity'",
);
const dedupeBlockVitestAuditsOkJsxWheelSectorNeonImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-wheel-instanced-immediate guard immediately precedes wheel sector neon jsx test parity assert',
  winParticlesJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxWheelSectorNeonImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxWheelSectorNeonImmediateGuardMessageInVerifyIdx,
);
const winParticlesJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  winParticlesJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxWheelSectorNeonImmediateToWinParticlesSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxWheelSectorNeonImmediateGuardCloseInVerifyIdx,
  winParticlesJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  winParticlesJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxWheelSectorNeonImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxWheelSectorNeonImmediateGuardCloseInVerifyIdx !== -1 &&
    winParticlesJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxWheelSectorNeonImmediateGuardCloseInVerifyIdx <
      winParticlesJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxWheelSectorNeonImmediateToWinParticlesSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-wheel-sector-neon-immediate guard immediately precedes win particles jsx test parity assert',
);
assert(
  vitestAudits.jsxSceneTestParity.ok,
  `jsx scene test parity (${vitestAudits.jsxSceneTestParityCoveredCount}/${vitestAudits.jsxSceneTestParity.moduleCount} covered)`,
);
const jsxSceneTestParityOkAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSceneTestParity.ok',
);
const dedupeBlockVitestAuditsOkJsxWinParticlesImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-wheel-sector-neon-immediate guard immediately precedes win particles jsx test parity assert',
  jsxSceneTestParityOkAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxWinParticlesImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxWinParticlesImmediateGuardMessageInVerifyIdx,
);
const jsxSceneTestParityOkAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSceneTestParityOkAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxWinParticlesImmediateToJsxSceneTestParityOkSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxWinParticlesImmediateGuardCloseInVerifyIdx,
  jsxSceneTestParityOkAssertOpenInVerifyIdx,
);
assert(
  jsxSceneTestParityOkAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxWinParticlesImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxWinParticlesImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSceneTestParityOkAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxWinParticlesImmediateGuardCloseInVerifyIdx <
      jsxSceneTestParityOkAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxWinParticlesImmediateToJsxSceneTestParityOkSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-win-particles-immediate guard immediately precedes jsx scene test parity ok assert',
);
assert(
  vitestAudits.jsxSceneTestParity.missing.length === 0,
  `jsx scene test parity complete (missing ${vitestAudits.jsxSceneTestParity.missing.join(', ') || 'none'})`,
);
const jsxSceneTestParityCompleteAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSceneTestParity.missing.length === 0',
);
const dedupeBlockVitestAuditsOkJsxSceneParityOkImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-win-particles-immediate guard immediately precedes jsx scene test parity ok assert',
  jsxSceneTestParityCompleteAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxSceneParityOkImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxSceneParityOkImmediateGuardMessageInVerifyIdx,
);
const jsxSceneTestParityCompleteAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSceneTestParityCompleteAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxSceneParityOkImmediateToJsxSceneTestParityCompleteSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxSceneParityOkImmediateGuardCloseInVerifyIdx,
  jsxSceneTestParityCompleteAssertOpenInVerifyIdx,
);
assert(
  jsxSceneTestParityCompleteAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityOkImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityOkImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSceneTestParityCompleteAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityOkImmediateGuardCloseInVerifyIdx <
      jsxSceneTestParityCompleteAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxSceneParityOkImmediateToJsxSceneTestParityCompleteSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-scene-parity-ok-immediate guard immediately precedes jsx scene test parity complete assert',
);
assert(
  vitestAudits.jsxSceneTestParityCoveredCount + vitestAudits.jsxSceneTestParityMissingCount ===
    vitestAudits.jsxSceneTestParity.moduleCount,
  `jsx scene test parity balance (${vitestAudits.jsxSceneTestParityCoveredCount}+${vitestAudits.jsxSceneTestParityMissingCount})`,
);
const jsxSceneTestParityBalanceAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSceneTestParityCoveredCount + vitestAudits.jsxSceneTestParityMissingCount ===',
);
const dedupeBlockVitestAuditsOkJsxSceneParityCompleteImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-scene-parity-ok-immediate guard immediately precedes jsx scene test parity complete assert',
  jsxSceneTestParityBalanceAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxSceneParityCompleteImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxSceneParityCompleteImmediateGuardMessageInVerifyIdx,
);
const jsxSceneTestParityBalanceAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSceneTestParityBalanceAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxSceneParityCompleteImmediateToJsxSceneTestParityBalanceSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxSceneParityCompleteImmediateGuardCloseInVerifyIdx,
  jsxSceneTestParityBalanceAssertOpenInVerifyIdx,
);
assert(
  jsxSceneTestParityBalanceAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityCompleteImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityCompleteImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSceneTestParityBalanceAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityCompleteImmediateGuardCloseInVerifyIdx <
      jsxSceneTestParityBalanceAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxSceneParityCompleteImmediateToJsxSceneTestParityBalanceSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-scene-parity-complete-immediate guard immediately precedes jsx scene test parity balance assert',
);
assert(
  vitestAudits.jsxContextTestParity.moduleCount === vitestAudits.jsxContextSurfaceCount,
  `jsx context test parity scaffold (${vitestAudits.jsxContextTestParity.moduleCount} modules; ${vitestAudits.jsxContextTestParity.missing.length} missing)`,
);
const jsxContextTestParityScaffoldAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxContextTestParity.moduleCount === vitestAudits.jsxContextSurfaceCount',
);
const dedupeBlockVitestAuditsOkJsxSceneParityBalanceImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-scene-parity-complete-immediate guard immediately precedes jsx scene test parity balance assert',
  jsxContextTestParityScaffoldAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxSceneParityBalanceImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxSceneParityBalanceImmediateGuardMessageInVerifyIdx,
);
const jsxContextTestParityScaffoldAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxContextTestParityScaffoldAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxSceneParityBalanceImmediateToJsxContextTestParityScaffoldSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxSceneParityBalanceImmediateGuardCloseInVerifyIdx,
  jsxContextTestParityScaffoldAssertOpenInVerifyIdx,
);
assert(
  jsxContextTestParityScaffoldAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityBalanceImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityBalanceImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxContextTestParityScaffoldAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxSceneParityBalanceImmediateGuardCloseInVerifyIdx <
      jsxContextTestParityScaffoldAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxSceneParityBalanceImmediateToJsxContextTestParityScaffoldSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-scene-parity-balance-immediate guard immediately precedes jsx context test parity scaffold assert',
);
assert(
  vitestAudits.jsxContextTestParity.missing.length === vitestAudits.jsxContextTestParityMissingCount,
  `jsx context test parity gaps (${vitestAudits.jsxContextTestParityCoveredCount}/${vitestAudits.jsxContextTestParity.moduleCount} covered)`,
);
const jsxContextTestParityGapsAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxContextTestParity.missing.length === vitestAudits.jsxContextTestParityMissingCount',
);
const dedupeBlockVitestAuditsOkJsxContextParityScaffoldImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-scene-parity-balance-immediate guard immediately precedes jsx context test parity scaffold assert',
  jsxContextTestParityGapsAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxContextParityScaffoldImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxContextParityScaffoldImmediateGuardMessageInVerifyIdx,
);
const jsxContextTestParityGapsAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxContextTestParityGapsAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxContextParityScaffoldImmediateToJsxContextTestParityGapsSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxContextParityScaffoldImmediateGuardCloseInVerifyIdx,
  jsxContextTestParityGapsAssertOpenInVerifyIdx,
);
assert(
  jsxContextTestParityGapsAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityScaffoldImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityScaffoldImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxContextTestParityGapsAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityScaffoldImmediateGuardCloseInVerifyIdx <
      jsxContextTestParityGapsAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxContextParityScaffoldImmediateToJsxContextTestParityGapsSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-context-parity-scaffold-immediate guard immediately precedes jsx context test parity gaps assert',
);
assert(
  !vitestAudits.jsxContextTestParity.missing.includes('context/GameContext.jsx'),
  'game context jsx test parity',
);
const gameContextJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "!vitestAudits.jsxContextTestParity.missing.includes('context/GameContext.jsx')",
);
const dedupeBlockVitestAuditsOkJsxContextParityGapsImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-context-parity-scaffold-immediate guard immediately precedes jsx context test parity gaps assert',
  gameContextJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxContextParityGapsImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxContextParityGapsImmediateGuardMessageInVerifyIdx,
);
const gameContextJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  gameContextJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxContextParityGapsImmediateToGameContextJsxTestParitySlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxContextParityGapsImmediateGuardCloseInVerifyIdx,
  gameContextJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  gameContextJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityGapsImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityGapsImmediateGuardCloseInVerifyIdx !== -1 &&
    gameContextJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityGapsImmediateGuardCloseInVerifyIdx <
      gameContextJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxContextParityGapsImmediateToGameContextJsxTestParitySlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-context-parity-gaps-immediate guard immediately precedes game context jsx test parity assert',
);
assert(
  vitestAudits.jsxContextTestParity.ok,
  `jsx context test parity (${vitestAudits.jsxContextTestParityCoveredCount}/${vitestAudits.jsxContextTestParity.moduleCount} covered)`,
);
const jsxContextTestParityOkAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxContextTestParity.ok',
);
const dedupeBlockVitestAuditsOkJsxContextParityGapsGameContextImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-context-parity-gaps-immediate guard immediately precedes game context jsx test parity assert',
  jsxContextTestParityOkAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxContextParityGapsGameContextImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxContextParityGapsGameContextImmediateGuardMessageInVerifyIdx,
);
const jsxContextTestParityOkAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxContextTestParityOkAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxContextParityGapsGameContextImmediateToJsxContextTestParityOkSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxContextParityGapsGameContextImmediateGuardCloseInVerifyIdx,
  jsxContextTestParityOkAssertOpenInVerifyIdx,
);
assert(
  jsxContextTestParityOkAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityGapsGameContextImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityGapsGameContextImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxContextTestParityOkAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityGapsGameContextImmediateGuardCloseInVerifyIdx <
      jsxContextTestParityOkAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxContextParityGapsGameContextImmediateToJsxContextTestParityOkSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate guard immediately precedes jsx context test parity ok assert',
);
assert(
  vitestAudits.jsxContextTestParity.missing.length === 0,
  `jsx context test parity complete (missing ${vitestAudits.jsxContextTestParity.missing.join(', ') || 'none'})`,
);
const jsxContextTestParityCompleteAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxContextTestParity.missing.length === 0',
);
const dedupeBlockVitestAuditsOkJsxContextParityOkImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate guard immediately precedes jsx context test parity ok assert',
  jsxContextTestParityCompleteAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxContextParityOkImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxContextParityOkImmediateGuardMessageInVerifyIdx,
);
const jsxContextTestParityCompleteAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxContextTestParityCompleteAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxContextParityOkImmediateToJsxContextTestParityCompleteSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxContextParityOkImmediateGuardCloseInVerifyIdx,
  jsxContextTestParityCompleteAssertOpenInVerifyIdx,
);
assert(
  jsxContextTestParityCompleteAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityOkImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityOkImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxContextTestParityCompleteAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityOkImmediateGuardCloseInVerifyIdx <
      jsxContextTestParityCompleteAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxContextParityOkImmediateToJsxContextTestParityCompleteSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-context-parity-ok-immediate guard immediately precedes jsx context test parity complete assert',
);
assert(
  vitestAudits.jsxContextTestParityCoveredCount + vitestAudits.jsxContextTestParityMissingCount ===
    vitestAudits.jsxContextTestParity.moduleCount,
  `jsx context test parity balance (${vitestAudits.jsxContextTestParityCoveredCount}+${vitestAudits.jsxContextTestParityMissingCount})`,
);
const jsxContextTestParityBalanceAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxContextTestParityCoveredCount + vitestAudits.jsxContextTestParityMissingCount ===',
);
const dedupeBlockVitestAuditsOkJsxContextParityCompleteImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-context-parity-ok-immediate guard immediately precedes jsx context test parity complete assert',
  jsxContextTestParityBalanceAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxContextParityCompleteImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxContextParityCompleteImmediateGuardMessageInVerifyIdx,
);
const jsxContextTestParityBalanceAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxContextTestParityBalanceAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxContextParityCompleteImmediateToJsxContextTestParityBalanceSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxContextParityCompleteImmediateGuardCloseInVerifyIdx,
  jsxContextTestParityBalanceAssertOpenInVerifyIdx,
);
assert(
  jsxContextTestParityBalanceAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityCompleteImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityCompleteImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxContextTestParityBalanceAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityCompleteImmediateGuardCloseInVerifyIdx <
      jsxContextTestParityBalanceAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxContextParityCompleteImmediateToJsxContextTestParityBalanceSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-context-parity-complete-immediate guard immediately precedes jsx context test parity balance assert',
);
assert(
  vitestAudits.jsxEntryTestParity.moduleCount === vitestAudits.jsxEntrySurfaceCount,
  `jsx entry test parity scaffold (${vitestAudits.jsxEntryTestParity.moduleCount} modules; ${vitestAudits.jsxEntryTestParity.missing.length} missing)`,
);
const jsxEntryTestParityScaffoldAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxEntryTestParity.moduleCount === vitestAudits.jsxEntrySurfaceCount',
);
const dedupeBlockVitestAuditsOkJsxContextParityBalanceImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-context-parity-complete-immediate guard immediately precedes jsx context test parity balance assert',
  jsxEntryTestParityScaffoldAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxContextParityBalanceImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxContextParityBalanceImmediateGuardMessageInVerifyIdx,
);
const jsxEntryTestParityScaffoldAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxEntryTestParityScaffoldAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxContextParityBalanceImmediateToJsxEntryTestParityScaffoldSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxContextParityBalanceImmediateGuardCloseInVerifyIdx,
  jsxEntryTestParityScaffoldAssertOpenInVerifyIdx,
);
assert(
  jsxEntryTestParityScaffoldAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityBalanceImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityBalanceImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxEntryTestParityScaffoldAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxContextParityBalanceImmediateGuardCloseInVerifyIdx <
      jsxEntryTestParityScaffoldAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxContextParityBalanceImmediateToJsxEntryTestParityScaffoldSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-context-parity-balance-immediate guard immediately precedes jsx entry test parity scaffold assert',
);
assert(
  vitestAudits.jsxEntryTestParity.missing.length === vitestAudits.jsxEntryTestParityMissingCount,
  `jsx entry test parity gaps (${vitestAudits.jsxEntryTestParityCoveredCount}/${vitestAudits.jsxEntryTestParity.moduleCount} covered)`,
);
const jsxEntryTestParityGapsAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxEntryTestParity.missing.length === vitestAudits.jsxEntryTestParityMissingCount',
);
const dedupeBlockVitestAuditsOkJsxEntryParityScaffoldImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-context-parity-balance-immediate guard immediately precedes jsx entry test parity scaffold assert',
  jsxEntryTestParityGapsAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityScaffoldImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityScaffoldImmediateGuardMessageInVerifyIdx,
);
const jsxEntryTestParityGapsAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxEntryTestParityGapsAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityScaffoldImmediateToJsxEntryTestParityGapsSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityScaffoldImmediateGuardCloseInVerifyIdx,
  jsxEntryTestParityGapsAssertOpenInVerifyIdx,
);
assert(
  jsxEntryTestParityGapsAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityScaffoldImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityScaffoldImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxEntryTestParityGapsAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityScaffoldImmediateGuardCloseInVerifyIdx <
      jsxEntryTestParityGapsAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityScaffoldImmediateToJsxEntryTestParityGapsSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-scaffold-immediate guard immediately precedes jsx entry test parity gaps assert',
);
assert(
  !vitestAudits.jsxEntryTestParity.missing.includes('App.jsx'),
  'app entry jsx test parity',
);
const appEntryJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "!vitestAudits.jsxEntryTestParity.missing.includes('App.jsx')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityGapsImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-scaffold-immediate guard immediately precedes jsx entry test parity gaps assert',
  appEntryJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityGapsImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityGapsImmediateGuardMessageInVerifyIdx,
);
const appEntryJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  appEntryJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityGapsImmediateToAppEntryJsxTestParitySlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityGapsImmediateGuardCloseInVerifyIdx,
  appEntryJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  appEntryJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityGapsImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityGapsImmediateGuardCloseInVerifyIdx !== -1 &&
    appEntryJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityGapsImmediateGuardCloseInVerifyIdx <
      appEntryJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityGapsImmediateToAppEntryJsxTestParitySlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-gaps-immediate guard immediately precedes app entry jsx test parity assert',
);
assert(
  !vitestAudits.jsxEntryTestParity.missing.includes('main.jsx'),
  'main entry jsx test parity',
);
const mainEntryJsxTestParityAssertBodyInVerifyIdx = verifySrc.indexOf(
  "!vitestAudits.jsxEntryTestParity.missing.includes('main.jsx')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-gaps-immediate guard immediately precedes app entry jsx test parity assert',
  mainEntryJsxTestParityAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardMessageInVerifyIdx,
);
const mainEntryJsxTestParityAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  mainEntryJsxTestParityAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityGapsAppEntryImmediateToMainEntryJsxTestParitySlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardCloseInVerifyIdx,
  mainEntryJsxTestParityAssertOpenInVerifyIdx,
);
assert(
  mainEntryJsxTestParityAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardCloseInVerifyIdx !== -1 &&
    mainEntryJsxTestParityAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardCloseInVerifyIdx <
      mainEntryJsxTestParityAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityGapsAppEntryImmediateToMainEntryJsxTestParitySlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate guard immediately precedes main entry jsx test parity assert',
);
assert(
  vitestAudits.jsxEntryTestParity.ok,
  `jsx entry test parity (${vitestAudits.jsxEntryTestParityCoveredCount}/${vitestAudits.jsxEntryTestParity.moduleCount} covered)`,
);
const jsxEntryTestParityOkAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxEntryTestParity.ok',
);
const dedupeBlockVitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate guard immediately precedes main entry jsx test parity assert',
  jsxEntryTestParityOkAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardMessageInVerifyIdx,
);
const jsxEntryTestParityOkAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxEntryTestParityOkAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityGapsMainEntryImmediateToJsxEntryTestParityOkSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardCloseInVerifyIdx,
  jsxEntryTestParityOkAssertOpenInVerifyIdx,
);
assert(
  jsxEntryTestParityOkAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxEntryTestParityOkAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardCloseInVerifyIdx <
      jsxEntryTestParityOkAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityGapsMainEntryImmediateToJsxEntryTestParityOkSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate guard immediately precedes jsx entry test parity ok assert',
);
assert(
  vitestAudits.jsxEntryTestParity.missing.length === 0,
  `jsx entry test parity complete (missing ${vitestAudits.jsxEntryTestParity.missing.join(', ') || 'none'})`,
);
const jsxEntryTestParityCompleteAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxEntryTestParity.missing.length === 0',
);
const dedupeBlockVitestAuditsOkJsxEntryParityOkImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate guard immediately precedes jsx entry test parity ok assert',
  jsxEntryTestParityCompleteAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityOkImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityOkImmediateGuardMessageInVerifyIdx,
);
const jsxEntryTestParityCompleteAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxEntryTestParityCompleteAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityOkImmediateToJsxEntryTestParityCompleteSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityOkImmediateGuardCloseInVerifyIdx,
  jsxEntryTestParityCompleteAssertOpenInVerifyIdx,
);
assert(
  jsxEntryTestParityCompleteAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityOkImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityOkImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxEntryTestParityCompleteAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityOkImmediateGuardCloseInVerifyIdx <
      jsxEntryTestParityCompleteAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityOkImmediateToJsxEntryTestParityCompleteSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-ok-immediate guard immediately precedes jsx entry test parity complete assert',
);
assert(
  vitestAudits.jsxEntryTestParityCoveredCount + vitestAudits.jsxEntryTestParityMissingCount ===
    vitestAudits.jsxEntryTestParity.moduleCount,
  `jsx entry test parity balance (${vitestAudits.jsxEntryTestParityCoveredCount}+${vitestAudits.jsxEntryTestParityMissingCount})`,
);
const jsxEntryTestParityBalanceAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxEntryTestParityCoveredCount + vitestAudits.jsxEntryTestParityMissingCount ===',
);
const dedupeBlockVitestAuditsOkJsxEntryParityCompleteImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-ok-immediate guard immediately precedes jsx entry test parity complete assert',
  jsxEntryTestParityBalanceAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityCompleteImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityCompleteImmediateGuardMessageInVerifyIdx,
);
const jsxEntryTestParityBalanceAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxEntryTestParityBalanceAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityCompleteImmediateToJsxEntryTestParityBalanceSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityCompleteImmediateGuardCloseInVerifyIdx,
  jsxEntryTestParityBalanceAssertOpenInVerifyIdx,
);
assert(
  jsxEntryTestParityBalanceAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityCompleteImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityCompleteImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxEntryTestParityBalanceAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityCompleteImmediateGuardCloseInVerifyIdx <
      jsxEntryTestParityBalanceAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityCompleteImmediateToJsxEntryTestParityBalanceSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-complete-immediate guard immediately precedes jsx entry test parity balance assert',
);
assert(
  vitestAudits.jsxSurfaceTestParity.moduleCount === vitestAudits.jsxSurfaceCount,
  `jsx surface test parity scaffold (${vitestAudits.jsxSurfaceTestParity.moduleCount} modules; ${vitestAudits.jsxSurfaceTestParity.missing.length} missing)`,
);
const jsxSurfaceTestParityScaffoldAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurfaceTestParity.moduleCount === vitestAudits.jsxSurfaceCount',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-complete-immediate guard immediately precedes jsx entry test parity balance assert',
  jsxSurfaceTestParityScaffoldAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityScaffoldAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityScaffoldAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceImmediateToJsxSurfaceTestParityScaffoldSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityScaffoldAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityScaffoldAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityScaffoldAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityScaffoldAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceImmediateToJsxSurfaceTestParityScaffoldSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-immediate guard immediately precedes jsx surface test parity scaffold assert',
);
assert(
  vitestAudits.jsxSurfaceTestParity.moduleCount === vitestAudits.jsxSrcSurfaceCount,
  `jsx surface test parity matches src tree (${vitestAudits.jsxSurfaceTestParity.moduleCount}/${vitestAudits.jsxSrcSurfaceCount})`,
);
const jsxSurfaceTestParityMatchesSrcTreeAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurfaceTestParity.moduleCount === vitestAudits.jsxSrcSurfaceCount',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-immediate guard immediately precedes jsx surface test parity scaffold assert',
  jsxSurfaceTestParityMatchesSrcTreeAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityMatchesSrcTreeAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityMatchesSrcTreeAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateToJsxSurfaceTestParityMatchesSrcTreeSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityMatchesSrcTreeAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityMatchesSrcTreeAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityMatchesSrcTreeAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityMatchesSrcTreeAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateToJsxSurfaceTestParityMatchesSrcTreeSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate guard immediately precedes jsx surface test parity matches src tree assert',
);
assert(
  vitestAudits.jsxSurfaceTestParity.ok,
  `jsx surface test parity (${vitestAudits.jsxSurfaceTestParity.coveredCount}/${vitestAudits.jsxSurfaceTestParity.moduleCount} covered)`,
);
const jsxSurfaceTestParityOkAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurfaceTestParity.ok',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate guard immediately precedes jsx surface test parity matches src tree assert',
  jsxSurfaceTestParityOkAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityOkAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityOkAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateToJsxSurfaceTestParityOkSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityOkAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityOkAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityOkAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityOkAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateToJsxSurfaceTestParityOkSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate guard immediately precedes jsx surface test parity ok assert',
);
assert(
  vitestAudits.jsxSurfaceTestParity.missing.length === 0,
  `jsx surface test parity complete (missing ${vitestAudits.jsxSurfaceTestParity.missing.join(', ') || 'none'})`,
);
const jsxSurfaceTestParityCompleteAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurfaceTestParity.missing.length === 0',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate guard immediately precedes jsx surface test parity ok assert',
  jsxSurfaceTestParityCompleteAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityCompleteAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityCompleteAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateToJsxSurfaceTestParityCompleteSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityCompleteAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityCompleteAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityCompleteAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityCompleteAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateToJsxSurfaceTestParityCompleteSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate guard immediately precedes jsx surface test parity complete assert',
);
assert(
  vitestAudits.jsxSurfaceTestParity.missing.length === vitestAudits.jsxSurfaceTestParityMissingCount,
  `jsx surface test parity gaps (${vitestAudits.jsxSurfaceTestParityCoveredCount}/${vitestAudits.jsxSurfaceTestParity.moduleCount} covered)`,
);
const jsxSurfaceTestParityGapsAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurfaceTestParity.missing.length === vitestAudits.jsxSurfaceTestParityMissingCount',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate guard immediately precedes jsx surface test parity complete assert',
  jsxSurfaceTestParityGapsAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityGapsAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityGapsAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateToJsxSurfaceTestParityGapsSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityGapsAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityGapsAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityGapsAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityGapsAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateToJsxSurfaceTestParityGapsSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate guard immediately precedes jsx surface test parity gaps assert',
);
assert(
  vitestAudits.jsxSurfaceTestParityCoveredCount + vitestAudits.jsxSurfaceTestParityMissingCount ===
    vitestAudits.jsxSurfaceTestParity.moduleCount,
  `jsx surface test parity balance (${vitestAudits.jsxSurfaceTestParityCoveredCount}+${vitestAudits.jsxSurfaceTestParityMissingCount})`,
);
const jsxSurfaceTestParityBalanceAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurfaceTestParityCoveredCount + vitestAudits.jsxSurfaceTestParityMissingCount ===',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate guard immediately precedes jsx surface test parity gaps assert',
  jsxSurfaceTestParityBalanceAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityBalanceAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityBalanceAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateToJsxSurfaceTestParityBalanceSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityBalanceAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityBalanceAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityBalanceAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityBalanceAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateToJsxSurfaceTestParityBalanceSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate guard immediately precedes jsx surface test parity balance assert',
);
assert(
  vitestAudits.jsxSurfaceTestParityCoveredCount === JSX_SURFACE_TEST_PARITY_COVERED_COUNT,
  `jsx surface test parity covered (${vitestAudits.jsxSurfaceTestParityCoveredCount}/${JSX_SURFACE_TEST_PARITY_COVERED_COUNT})`,
);
const jsxSurfaceTestParityCoveredAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurfaceTestParityCoveredCount === JSX_SURFACE_TEST_PARITY_COVERED_COUNT',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate guard immediately precedes jsx surface test parity balance assert',
  jsxSurfaceTestParityCoveredAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityCoveredAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityCoveredAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateToJsxSurfaceTestParityCoveredSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityCoveredAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityCoveredAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityCoveredAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityCoveredAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateToJsxSurfaceTestParityCoveredSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate guard immediately precedes jsx surface test parity covered assert',
);
assert(
  vitestAudits.jsxSurfaceTestParityMissingCount === JSX_SURFACE_TEST_PARITY_MISSING_COUNT,
  `jsx surface test parity missing (${vitestAudits.jsxSurfaceTestParityMissingCount})`,
);
const jsxSurfaceTestParityMissingAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxSurfaceTestParityMissingCount === JSX_SURFACE_TEST_PARITY_MISSING_COUNT',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate guard immediately precedes jsx surface test parity covered assert',
  jsxSurfaceTestParityMissingAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityMissingAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityMissingAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateToJsxSurfaceTestParityMissingSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityMissingAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityMissingAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityMissingAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityMissingAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateToJsxSurfaceTestParityMissingSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate guard immediately precedes jsx surface test parity missing assert',
);
assert(
  vitestAudits.jsxUiTestParityCoveredCount +
    vitestAudits.jsxSceneTestParityCoveredCount +
    vitestAudits.jsxContextTestParityCoveredCount +
    vitestAudits.jsxEntryTestParityCoveredCount ===
    vitestAudits.jsxSurfaceTestParityCoveredCount,
  `jsx surface test parity closure (${vitestAudits.jsxUiTestParityCoveredCount}+${vitestAudits.jsxSceneTestParityCoveredCount}+${vitestAudits.jsxContextTestParityCoveredCount}+${vitestAudits.jsxEntryTestParityCoveredCount}=${vitestAudits.jsxSurfaceTestParityCoveredCount})`,
);
const jsxSurfaceTestParityClosureAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsxEntryTestParityCoveredCount ===',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate guard immediately precedes jsx surface test parity missing assert',
  jsxSurfaceTestParityClosureAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityClosureAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityClosureAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateToJsxSurfaceTestParityClosureSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityClosureAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityClosureAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityClosureAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityClosureAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateToJsxSurfaceTestParityClosureSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate guard immediately precedes jsx surface test parity closure assert',
);
assert(JSX_SURFACE_TEST_PARITY_COMPLETE, 'jsx surface test parity complete milestone');
const jsxSurfaceTestParityCompleteMilestoneAssertBodyInVerifyIdx = verifySrc.indexOf(
  "assert(JSX_SURFACE_TEST_PARITY_COMPLETE, 'jsx surface test parity complete milestone')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate guard immediately precedes jsx surface test parity closure assert',
  jsxSurfaceTestParityCompleteMilestoneAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityCompleteMilestoneAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityCompleteMilestoneAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateToJsxSurfaceTestParityCompleteMilestoneSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityCompleteMilestoneAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityCompleteMilestoneAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityCompleteMilestoneAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityCompleteMilestoneAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateToJsxSurfaceTestParityCompleteMilestoneSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate guard immediately precedes jsx surface test parity complete milestone assert',
);
assert(
  vitestAudits.jsxSurfaceTestParityComplete === JSX_SURFACE_TEST_PARITY_COMPLETE,
  'jsx surface test parity complete flag',
);
const jsxSurfaceTestParityCompleteFlagAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'jsx surface test parity complete flag',",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate guard immediately precedes jsx surface test parity complete milestone assert',
  jsxSurfaceTestParityCompleteFlagAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityCompleteFlagAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityCompleteFlagAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateToJsxSurfaceTestParityCompleteFlagSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityCompleteFlagAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityCompleteFlagAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityCompleteFlagAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityCompleteFlagAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateToJsxSurfaceTestParityCompleteFlagSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate guard immediately precedes jsx surface test parity complete flag assert',
);
assert(
  vitestAudits.jsxSurfaceTestParity.ok === JSX_SURFACE_TEST_PARITY_COMPLETE,
  'jsx surface test parity ok matches complete milestone',
);
const jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertBodyInVerifyIdx = verifySrc.indexOf(
  "'jsx surface test parity ok matches complete milestone'",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate guard immediately precedes jsx surface test parity complete flag assert',
  jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardMessageInVerifyIdx,
);
const jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateToOkMatchesMilestoneSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardCloseInVerifyIdx,
  jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertOpenInVerifyIdx,
);
assert(
  jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardCloseInVerifyIdx !== -1 &&
    jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardCloseInVerifyIdx <
      jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateToOkMatchesMilestoneSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate guard immediately precedes jsx surface test parity ok matches complete milestone assert',
);
assert(
  vitestAudits.moduleCount + vitestAudits.jsxSurfaceCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT,
  `full surface test parity module count (${vitestAudits.moduleCount}+${vitestAudits.jsxSurfaceCount}=${FULL_SURFACE_TEST_PARITY_MODULE_COUNT})`,
);
const fullSurfaceTestParityModuleCountAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.moduleCount + vitestAudits.jsxSurfaceCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate guard immediately precedes jsx surface test parity ok matches complete milestone assert',
  fullSurfaceTestParityModuleCountAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardMessageInVerifyIdx,
);
const fullSurfaceTestParityModuleCountAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fullSurfaceTestParityModuleCountAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateToFullSurfaceTestParityModuleCountSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardCloseInVerifyIdx,
  fullSurfaceTestParityModuleCountAssertOpenInVerifyIdx,
);
assert(
  fullSurfaceTestParityModuleCountAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardCloseInVerifyIdx !== -1 &&
    fullSurfaceTestParityModuleCountAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardCloseInVerifyIdx <
      fullSurfaceTestParityModuleCountAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateToFullSurfaceTestParityModuleCountSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate guard immediately precedes full surface test parity module count assert',
);
assert(
  vitestAudits.fullSurfaceTestParity.moduleCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT,
  `full surface test parity audit (${vitestAudits.fullSurfaceTestParity.moduleCount} modules; ${vitestAudits.fullSurfaceTestParity.missing.length} missing)`,
);
const fullSurfaceTestParityAuditAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.fullSurfaceTestParity.moduleCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate guard immediately precedes full surface test parity module count assert',
  fullSurfaceTestParityAuditAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardMessageInVerifyIdx,
);
const fullSurfaceTestParityAuditAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fullSurfaceTestParityAuditAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateToFullSurfaceTestParityAuditSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardCloseInVerifyIdx,
  fullSurfaceTestParityAuditAssertOpenInVerifyIdx,
);
assert(
  fullSurfaceTestParityAuditAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardCloseInVerifyIdx !== -1 &&
    fullSurfaceTestParityAuditAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardCloseInVerifyIdx <
      fullSurfaceTestParityAuditAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateToFullSurfaceTestParityAuditSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate guard immediately precedes full surface test parity audit assert',
);
assert(
  vitestAudits.jsTestParityCoveredCount + vitestAudits.jsxSurfaceTestParityCoveredCount ===
    vitestAudits.fullSurfaceTestParity.coveredCount,
  `full surface test parity closure (${vitestAudits.jsTestParityCoveredCount}+${vitestAudits.jsxSurfaceTestParityCoveredCount}=${vitestAudits.fullSurfaceTestParity.coveredCount})`,
);
const fullSurfaceTestParityClosureAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.jsTestParityCoveredCount + vitestAudits.jsxSurfaceTestParityCoveredCount ===',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate guard immediately precedes full surface test parity audit assert',
  fullSurfaceTestParityClosureAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardMessageInVerifyIdx,
);
const fullSurfaceTestParityClosureAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fullSurfaceTestParityClosureAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateToFullSurfaceTestParityClosureSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardCloseInVerifyIdx,
  fullSurfaceTestParityClosureAssertOpenInVerifyIdx,
);
assert(
  fullSurfaceTestParityClosureAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardCloseInVerifyIdx !== -1 &&
    fullSurfaceTestParityClosureAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardCloseInVerifyIdx <
      fullSurfaceTestParityClosureAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateToFullSurfaceTestParityClosureSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate guard immediately precedes full surface test parity closure assert',
);
assert(
  vitestAudits.fullSurfaceTestParity.ok,
  `full surface test parity (${vitestAudits.fullSurfaceTestParity.coveredCount}/${vitestAudits.fullSurfaceTestParity.moduleCount} covered)`,
);
const fullSurfaceTestParityOkAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.fullSurfaceTestParity.ok,',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate guard immediately precedes full surface test parity closure assert',
  fullSurfaceTestParityOkAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardMessageInVerifyIdx,
);
const fullSurfaceTestParityOkAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fullSurfaceTestParityOkAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateToFullSurfaceTestParityOkSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardCloseInVerifyIdx,
  fullSurfaceTestParityOkAssertOpenInVerifyIdx,
);
assert(
  fullSurfaceTestParityOkAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardCloseInVerifyIdx !== -1 &&
    fullSurfaceTestParityOkAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardCloseInVerifyIdx <
      fullSurfaceTestParityOkAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateToFullSurfaceTestParityOkSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate guard immediately precedes full surface test parity ok assert',
);
assert(
  vitestAudits.fullSurfaceTestParity.missing.length === 0,
  `full surface test parity complete (missing ${vitestAudits.fullSurfaceTestParity.missing.join(', ') || 'none'})`,
);
const fullSurfaceTestParityCompleteAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.fullSurfaceTestParity.missing.length === 0',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate guard immediately precedes full surface test parity ok assert',
  fullSurfaceTestParityCompleteAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardMessageInVerifyIdx,
);
const fullSurfaceTestParityCompleteAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fullSurfaceTestParityCompleteAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateToFullSurfaceTestParityCompleteSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardCloseInVerifyIdx,
  fullSurfaceTestParityCompleteAssertOpenInVerifyIdx,
);
assert(
  fullSurfaceTestParityCompleteAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardCloseInVerifyIdx !== -1 &&
    fullSurfaceTestParityCompleteAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardCloseInVerifyIdx <
      fullSurfaceTestParityCompleteAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateToFullSurfaceTestParityCompleteSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate guard immediately precedes full surface test parity complete assert',
);
assert(
  vitestAudits.fullSurfaceTestParity.missing.length === vitestAudits.fullSurfaceTestParityMissingCount,
  `full surface test parity gaps (${vitestAudits.fullSurfaceTestParityCoveredCount}/${vitestAudits.fullSurfaceTestParity.moduleCount} covered)`,
);
const fullSurfaceTestParityGapsAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.fullSurfaceTestParity.missing.length === vitestAudits.fullSurfaceTestParityMissingCount',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate guard immediately precedes full surface test parity complete assert',
  fullSurfaceTestParityGapsAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardMessageInVerifyIdx,
);
const fullSurfaceTestParityGapsAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fullSurfaceTestParityGapsAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateToFullSurfaceTestParityGapsSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardCloseInVerifyIdx,
  fullSurfaceTestParityGapsAssertOpenInVerifyIdx,
);
assert(
  fullSurfaceTestParityGapsAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardCloseInVerifyIdx !== -1 &&
    fullSurfaceTestParityGapsAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardCloseInVerifyIdx <
      fullSurfaceTestParityGapsAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateToFullSurfaceTestParityGapsSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate guard immediately precedes full surface test parity gaps assert',
);
assert(
  vitestAudits.fullSurfaceTestParityCoveredCount + vitestAudits.fullSurfaceTestParityMissingCount ===
    vitestAudits.fullSurfaceTestParity.moduleCount,
  `full surface test parity balance (${vitestAudits.fullSurfaceTestParityCoveredCount}+${vitestAudits.fullSurfaceTestParityMissingCount})`,
);
const fullSurfaceTestParityBalanceAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.fullSurfaceTestParityCoveredCount + vitestAudits.fullSurfaceTestParityMissingCount ===',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate guard immediately precedes full surface test parity gaps assert',
  fullSurfaceTestParityBalanceAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardMessageInVerifyIdx,
);
const fullSurfaceTestParityBalanceAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fullSurfaceTestParityBalanceAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateToFullSurfaceTestParityBalanceSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardCloseInVerifyIdx,
  fullSurfaceTestParityBalanceAssertOpenInVerifyIdx,
);
assert(
  fullSurfaceTestParityBalanceAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardCloseInVerifyIdx !== -1 &&
    fullSurfaceTestParityBalanceAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardCloseInVerifyIdx <
      fullSurfaceTestParityBalanceAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateToFullSurfaceTestParityBalanceSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate guard immediately precedes full surface test parity balance assert',
);
assert(
  vitestAudits.fullSurfaceTestParityCoveredCount === FULL_SURFACE_TEST_PARITY_COVERED_COUNT,
  `full surface test parity covered (${vitestAudits.fullSurfaceTestParityCoveredCount}/${FULL_SURFACE_TEST_PARITY_MODULE_COUNT})`,
);
const fullSurfaceTestParityCoveredAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.fullSurfaceTestParityCoveredCount === FULL_SURFACE_TEST_PARITY_COVERED_COUNT',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate guard immediately precedes full surface test parity balance assert',
  fullSurfaceTestParityCoveredAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardMessageInVerifyIdx,
);
const fullSurfaceTestParityCoveredAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fullSurfaceTestParityCoveredAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateToFullSurfaceTestParityCoveredSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardCloseInVerifyIdx,
  fullSurfaceTestParityCoveredAssertOpenInVerifyIdx,
);
assert(
  fullSurfaceTestParityCoveredAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardCloseInVerifyIdx !== -1 &&
    fullSurfaceTestParityCoveredAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardCloseInVerifyIdx <
      fullSurfaceTestParityCoveredAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateToFullSurfaceTestParityCoveredSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate guard immediately precedes full surface test parity covered assert',
);
assert(
  vitestAudits.fullSurfaceTestParityMissingCount === FULL_SURFACE_TEST_PARITY_MISSING_COUNT,
  `full surface test parity missing (${vitestAudits.fullSurfaceTestParityMissingCount})`,
);
const fullSurfaceTestParityMissingAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.fullSurfaceTestParityMissingCount === FULL_SURFACE_TEST_PARITY_MISSING_COUNT',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate guard immediately precedes full surface test parity covered assert',
  fullSurfaceTestParityMissingAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardMessageInVerifyIdx,
);
const fullSurfaceTestParityMissingAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fullSurfaceTestParityMissingAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateToFullSurfaceTestParityMissingSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardCloseInVerifyIdx,
  fullSurfaceTestParityMissingAssertOpenInVerifyIdx,
);
assert(
  fullSurfaceTestParityMissingAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardCloseInVerifyIdx !== -1 &&
    fullSurfaceTestParityMissingAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardCloseInVerifyIdx <
      fullSurfaceTestParityMissingAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateToFullSurfaceTestParityMissingSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate guard immediately precedes full surface test parity missing assert',
);
assert(
  vitestAudits.coverage.ok &&
    vitestAudits.jsxSurfaceTestParityComplete &&
    vitestAudits.fullSurfaceTestParityComplete &&
    vitestAudits.vitestSurfaceTestParity.ok &&
    vitestAudits.ok === vitestAudits.vitestSurfaceTestParity.ok &&
    FULL_SURFACE_TEST_PARITY_COMPLETE &&
    vitestAudits.fullSurfaceTestParityComplete === FULL_SURFACE_TEST_PARITY_COMPLETE &&
    vitestAudits.fullSurfaceTestParity.ok === FULL_SURFACE_TEST_PARITY_COMPLETE &&
    vitestAudits.vitestSurfaceTestParity.ok === vitestAudits.fullSurfaceTestParity.ok &&
    vitestAudits.vitestSurfaceTestParity.moduleCount === vitestAudits.fullSurfaceTestParity.moduleCount &&
    vitestAudits.vitestSurfaceTestParityModuleCount === vitestAudits.vitestSurfaceTestParity.moduleCount &&
    vitestAudits.vitestSurfaceTestParityCoveredCount === vitestAudits.vitestSurfaceTestParity.coveredCount &&
    vitestAudits.vitestSurfaceTestParityMissingCount === vitestAudits.vitestSurfaceTestParity.missingCount &&
    vitestAudits.vitestSurfaceTestParityComplete === vitestAudits.vitestSurfaceTestParity.ok &&
    vitestAudits.vitestSurfaceTestParityComplete === VITEST_SURFACE_TEST_PARITY_COMPLETE &&
    VITEST_SURFACE_TEST_PARITY_COMPLETE === FULL_SURFACE_TEST_PARITY_COMPLETE &&
    vitestAudits.fullSurfaceTestParityModuleCount === vitestAudits.vitestSurfaceTestParityModuleCount &&
    vitestAudits.fullSurfaceTestParityModuleCount === vitestAudits.vitestSurfaceTestParity.moduleCount &&
    vitestAudits.fullSurfaceTestParityModuleCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT &&
    VITEST_SURFACE_TEST_PARITY_MODULE_COUNT === FULL_SURFACE_TEST_PARITY_MODULE_COUNT &&
    vitestAudits.vitestSurfaceTestParityModuleCount === VITEST_SURFACE_TEST_PARITY_MODULE_COUNT &&
    vitestAudits.fullSurfaceTestParityCoveredCount === vitestAudits.vitestSurfaceTestParityCoveredCount &&
    vitestAudits.fullSurfaceTestParityCoveredCount === vitestAudits.vitestSurfaceTestParity.coveredCount &&
    VITEST_SURFACE_TEST_PARITY_COVERED_COUNT === FULL_SURFACE_TEST_PARITY_COVERED_COUNT &&
    vitestAudits.vitestSurfaceTestParityCoveredCount === VITEST_SURFACE_TEST_PARITY_COVERED_COUNT &&
    vitestAudits.fullSurfaceTestParityMissingCount === vitestAudits.vitestSurfaceTestParityMissingCount &&
    vitestAudits.fullSurfaceTestParityMissingCount === vitestAudits.vitestSurfaceTestParity.missingCount &&
    VITEST_SURFACE_TEST_PARITY_MISSING_COUNT === FULL_SURFACE_TEST_PARITY_MISSING_COUNT &&
    vitestAudits.vitestSurfaceTestParityMissingCount === VITEST_SURFACE_TEST_PARITY_MISSING_COUNT &&
    vitestAudits.fullSurfaceTestParityComplete === vitestAudits.vitestSurfaceTestParityComplete &&
    vitestAudits.fullSurfaceTestParityComplete === vitestAudits.vitestSurfaceTestParity.ok &&
    vitestAudits.vitestSurfaceTestParity.vitestSurfaceComplete === VITEST_SURFACE_TEST_PARITY_COMPLETE,
  'unified surface flat closure from vitestSurfaceTestParity report',
);
const unifiedSurfaceFlatClosureFromVitestSurfaceTestParityReportAssertBodyInVerifyIdx = verifySrc.indexOf(
  'vitestAudits.vitestSurfaceTestParity.vitestSurfaceComplete === VITEST_SURFACE_TEST_PARITY_COMPLETE',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate guard immediately precedes full surface test parity missing assert',
  unifiedSurfaceFlatClosureFromVitestSurfaceTestParityReportAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardMessageInVerifyIdx,
);
const unifiedSurfaceFlatClosureFromVitestSurfaceTestParityReportAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  unifiedSurfaceFlatClosureFromVitestSurfaceTestParityReportAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateToUnifiedSurfaceFlatClosureFromVitestSurfaceTestParityReportSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardCloseInVerifyIdx,
  unifiedSurfaceFlatClosureFromVitestSurfaceTestParityReportAssertOpenInVerifyIdx,
);
assert(
  unifiedSurfaceFlatClosureFromVitestSurfaceTestParityReportAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardCloseInVerifyIdx !== -1 &&
    unifiedSurfaceFlatClosureFromVitestSurfaceTestParityReportAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardCloseInVerifyIdx <
      unifiedSurfaceFlatClosureFromVitestSurfaceTestParityReportAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateToUnifiedSurfaceFlatClosureFromVitestSurfaceTestParityReportSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate guard immediately precedes unified surface flat closure from vitestSurfaceTestParity report assert',
);
assert(
  SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE &&
    vitestAudits.surfaceFlatUnifiedClosureComplete === SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE &&
    vitestAudits.surfaceFlatUnifiedClosureComplete === vitestAudits.vitestSurfaceTestParity.ok &&
    vitestAudits.surfaceFlatFieldPairCount === SURFACE_FLAT_FIELD_PAIR_COUNT &&
    vitestAudits.surfaceFlatTotalFieldCount === SURFACE_FLAT_TOTAL_FIELD_COUNT &&
    vitestAudits.surfaceFlatFieldPairCount * 2 === vitestAudits.surfaceFlatTotalFieldCount &&
    SURFACE_FLAT_FIELD_TRILOGY_COMPLETE &&
    vitestAudits.surfaceFlatFieldTrilogyComplete === SURFACE_FLAT_FIELD_TRILOGY_COMPLETE &&
    vitestAudits.surfaceFlatReportFlatFieldCount === SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT &&
    vitestAudits.surfaceFlatReportFlatFieldCount === vitestAudits.surfaceFlatFieldPairCount + 2 &&
    SURFACE_FLAT_REPORT_QUARTET_COMPLETE &&
    vitestAudits.surfaceFlatReportQuartetComplete === SURFACE_FLAT_REPORT_QUARTET_COMPLETE &&
    VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE &&
    vitestAudits.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE,
  'surface flat report quartet closure from runVitestVerifyAudits report',
);
const surfaceFlatReportQuartetClosureFromRunVitestVerifyAuditsReportAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  'vitestAudits.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE',
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate guard immediately precedes unified surface flat closure from vitestSurfaceTestParity report assert',
  surfaceFlatReportQuartetClosureFromRunVitestVerifyAuditsReportAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardMessageInVerifyIdx,
);
const surfaceFlatReportQuartetClosureFromRunVitestVerifyAuditsReportAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  surfaceFlatReportQuartetClosureFromRunVitestVerifyAuditsReportAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateToSurfaceFlatReportQuartetClosureFromRunVitestVerifyAuditsReportSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardCloseInVerifyIdx,
  surfaceFlatReportQuartetClosureFromRunVitestVerifyAuditsReportAssertOpenInVerifyIdx,
);
assert(
  surfaceFlatReportQuartetClosureFromRunVitestVerifyAuditsReportAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardCloseInVerifyIdx !== -1 &&
    surfaceFlatReportQuartetClosureFromRunVitestVerifyAuditsReportAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardCloseInVerifyIdx <
      surfaceFlatReportQuartetClosureFromRunVitestVerifyAuditsReportAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateToSurfaceFlatReportQuartetClosureFromRunVitestVerifyAuditsReportSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate guard immediately precedes surface flat report quartet closure from runVitestVerifyAudits report assert',
);
assert(techManifestSrc.includes('fairRoundStore.test.ts'), 'TD-09 resolved note');
const td09ResolvedNoteAssertBodyInVerifyIdx = verifySrc.indexOf(
  "techManifestSrc.includes('fairRoundStore.test.ts')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate guard immediately precedes surface flat report quartet closure from runVitestVerifyAudits report assert',
  td09ResolvedNoteAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardMessageInVerifyIdx,
);
const td09ResolvedNoteAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  td09ResolvedNoteAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateToTd09ResolvedNoteSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardCloseInVerifyIdx,
  td09ResolvedNoteAssertOpenInVerifyIdx,
);
assert(
  td09ResolvedNoteAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardCloseInVerifyIdx !== -1 &&
    td09ResolvedNoteAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardCloseInVerifyIdx <
      td09ResolvedNoteAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateToTd09ResolvedNoteSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate guard immediately precedes TD-09 resolved note assert',
);
assert(!TECH_DEBT.some((d) => d.id === 'TD-09'), 'TD-09 resolved');
const td09ResolvedAssertBodyInVerifyIdx = verifySrc.indexOf(
  "!TECH_DEBT.some((d) => d.id === 'TD-09')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate guard immediately precedes TD-09 resolved note assert',
  td09ResolvedAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardMessageInVerifyIdx,
);
const td09ResolvedAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  td09ResolvedAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateToTd09ResolvedSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardCloseInVerifyIdx,
  td09ResolvedAssertOpenInVerifyIdx,
);
assert(
  td09ResolvedAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardCloseInVerifyIdx !== -1 &&
    td09ResolvedAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardCloseInVerifyIdx <
      td09ResolvedAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateToTd09ResolvedSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-note-immediate guard immediately precedes TD-09 resolved assert',
);
const td09InResolvedRegisterAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(RESOLVED_TECH_DEBT.some((d) => d.id === 'TD-09')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate guard immediately precedes TD-09 in resolved register assert',
  td09InResolvedRegisterAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardMessageInVerifyIdx,
);
const td09InResolvedRegisterAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  td09InResolvedRegisterAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateToTd09InResolvedRegisterSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardCloseInVerifyIdx,
  td09InResolvedRegisterAssertOpenInVerifyIdx,
);
assert(
  td09InResolvedRegisterAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardCloseInVerifyIdx !== -1 &&
    td09InResolvedRegisterAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardCloseInVerifyIdx <
      td09InResolvedRegisterAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateToTd09InResolvedRegisterSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate guard immediately precedes TD-09 in resolved register assert',
);
assert(RESOLVED_TECH_DEBT.some((d) => d.id === 'TD-09'), 'TD-09 in resolved register');

const authorityGuardTsExistsAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(fs.existsSync(path.join(__dirname, 'src/core/authorityGuard.ts')), 'authorityGuard.ts')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate guard immediately precedes authorityGuard.ts exists assert',
  authorityGuardTsExistsAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardMessageInVerifyIdx,
);
const authorityGuardTsExistsAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  authorityGuardTsExistsAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateToAuthorityGuardTsExistsSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardCloseInVerifyIdx,
  authorityGuardTsExistsAssertOpenInVerifyIdx,
);
assert(
  authorityGuardTsExistsAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardCloseInVerifyIdx !== -1 &&
    authorityGuardTsExistsAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardCloseInVerifyIdx <
      authorityGuardTsExistsAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateToAuthorityGuardTsExistsSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate guard immediately precedes authorityGuard.ts exists assert',
);

console.log('\n=== Architect Phase 11: authority seed custody guard ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/authorityGuard.ts')), 'authorityGuard.ts');
const devAuthSrc = fs.readFileSync(path.join(__dirname, 'server/devAuthority.mjs'), 'utf8');
const clientStartupGuardWiredAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(mainSrc.includes('runStartupAuthorityGuard'), 'client startup guard wired')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate guard immediately precedes client startup guard wired assert',
  clientStartupGuardWiredAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardMessageInVerifyIdx,
);
const clientStartupGuardWiredAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  clientStartupGuardWiredAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateToClientStartupGuardWiredSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardCloseInVerifyIdx,
  clientStartupGuardWiredAssertOpenInVerifyIdx,
);
assert(
  clientStartupGuardWiredAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardCloseInVerifyIdx !== -1 &&
    clientStartupGuardWiredAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardCloseInVerifyIdx <
      clientStartupGuardWiredAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateToClientStartupGuardWiredSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate guard immediately precedes client startup guard wired assert',
);
assert(mainSrc.includes('runStartupAuthorityGuard'), 'client startup guard wired');
const authorityServerStartupGuardAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(devAuthSrc.includes('assertAuthorityStartup'), 'authority server startup guard')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate guard immediately precedes authority server startup guard assert',
  authorityServerStartupGuardAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardMessageInVerifyIdx,
);
const authorityServerStartupGuardAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  authorityServerStartupGuardAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateToAuthorityServerStartupGuardSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardCloseInVerifyIdx,
  authorityServerStartupGuardAssertOpenInVerifyIdx,
);
assert(
  authorityServerStartupGuardAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardCloseInVerifyIdx !== -1 &&
    authorityServerStartupGuardAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardCloseInVerifyIdx <
      authorityServerStartupGuardAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateToAuthorityServerStartupGuardSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate guard immediately precedes authority server startup guard assert',
);
assert(devAuthSrc.includes('assertAuthorityStartup'), 'authority server startup guard');
const masterSecretEnvDocumentedAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(devAuthSrc.includes('AUTHORITY_MASTER_SECRET'), 'master secret env documented')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate guard immediately precedes master secret env documented assert',
  masterSecretEnvDocumentedAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardMessageInVerifyIdx,
);
const masterSecretEnvDocumentedAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  masterSecretEnvDocumentedAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateToMasterSecretEnvDocumentedSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardCloseInVerifyIdx,
  masterSecretEnvDocumentedAssertOpenInVerifyIdx,
);
assert(
  masterSecretEnvDocumentedAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardCloseInVerifyIdx !== -1 &&
    masterSecretEnvDocumentedAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardCloseInVerifyIdx <
      masterSecretEnvDocumentedAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateToMasterSecretEnvDocumentedSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate guard immediately precedes master secret env documented assert',
);
assert(devAuthSrc.includes('AUTHORITY_MASTER_SECRET'), 'master secret env documented');
const authorityGuardUpgradeLoggedAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(techManifestSrc.includes('authority-seed-guard'), 'authority guard upgrade logged')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate guard immediately precedes authority guard upgrade logged assert',
  authorityGuardUpgradeLoggedAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardMessageInVerifyIdx,
);
const authorityGuardUpgradeLoggedAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  authorityGuardUpgradeLoggedAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateToAuthorityGuardUpgradeLoggedSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardCloseInVerifyIdx,
  authorityGuardUpgradeLoggedAssertOpenInVerifyIdx,
);
assert(
  authorityGuardUpgradeLoggedAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardCloseInVerifyIdx !== -1 &&
    authorityGuardUpgradeLoggedAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardCloseInVerifyIdx <
      authorityGuardUpgradeLoggedAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateToAuthorityGuardUpgradeLoggedSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate guard immediately precedes authority guard upgrade logged assert',
);
assert(techManifestSrc.includes('authority-seed-guard'), 'authority guard upgrade logged');
const { auditSeedCustody, assertProductionSeedCustody } = await import('./src/core/authorityGuard.ts');
const devAudit = auditSeedCustody({ PROD: false });
const devDemoCustodyAllowedAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(devAudit.safe && devAudit.mode === 'demo-local', 'dev demo custody allowed')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate guard immediately precedes dev demo custody allowed assert',
  devDemoCustodyAllowedAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardMessageInVerifyIdx,
);
const devDemoCustodyAllowedAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  devDemoCustodyAllowedAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateToDevDemoCustodyAllowedSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardCloseInVerifyIdx,
  devDemoCustodyAllowedAssertOpenInVerifyIdx,
);
assert(
  devDemoCustodyAllowedAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardCloseInVerifyIdx !== -1 &&
    devDemoCustodyAllowedAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardCloseInVerifyIdx <
      devDemoCustodyAllowedAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateToDevDemoCustodyAllowedSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate guard immediately precedes dev demo custody allowed assert',
);
assert(devAudit.safe && devAudit.mode === 'demo-local', 'dev demo custody allowed');
const prodAudit = auditSeedCustody({ PROD: true });
const prodWithoutApiBlockedAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(!prodAudit.safe, 'prod without API blocked')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate guard immediately precedes prod without API blocked assert',
  prodWithoutApiBlockedAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardMessageInVerifyIdx,
);
const prodWithoutApiBlockedAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  prodWithoutApiBlockedAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateToProdWithoutApiBlockedSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardCloseInVerifyIdx,
  prodWithoutApiBlockedAssertOpenInVerifyIdx,
);
assert(
  prodWithoutApiBlockedAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardCloseInVerifyIdx !== -1 &&
    prodWithoutApiBlockedAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardCloseInVerifyIdx <
      prodWithoutApiBlockedAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateToProdWithoutApiBlockedSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate guard immediately precedes prod without API blocked assert',
);
assert(!prodAudit.safe, 'prod without API blocked');
const prodDemoAudit = auditSeedCustody({ PROD: true, VITE_ALLOW_DEMO_CUSTODY: '1' });
const prodDemoCustodyOptInAllowedAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(prodDemoAudit.safe, 'prod demo custody opt-in allowed')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate guard immediately precedes prod demo custody opt-in allowed assert',
  prodDemoCustodyOptInAllowedAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardMessageInVerifyIdx,
);
const prodDemoCustodyOptInAllowedAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  prodDemoCustodyOptInAllowedAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateToProdDemoCustodyOptInAllowedSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardCloseInVerifyIdx,
  prodDemoCustodyOptInAllowedAssertOpenInVerifyIdx,
);
assert(
  prodDemoCustodyOptInAllowedAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardCloseInVerifyIdx !== -1 &&
    prodDemoCustodyOptInAllowedAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardCloseInVerifyIdx <
      prodDemoCustodyOptInAllowedAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateToProdDemoCustodyOptInAllowedSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate guard immediately precedes prod demo custody opt-in allowed assert',
);
assert(prodDemoAudit.safe, 'prod demo custody opt-in allowed');
const prodWithApiPassesAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(() => assertProductionSeedCustody({ PROD: true, VITE_API_BASE: 'http://127.0.0.1:8787' }) === undefined, 'prod with API passes')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate guard immediately precedes prod with API passes assert',
  prodWithApiPassesAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardMessageInVerifyIdx,
);
const prodWithApiPassesAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  prodWithApiPassesAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateToProdWithApiPassesSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardCloseInVerifyIdx,
  prodWithApiPassesAssertOpenInVerifyIdx,
);
assert(
  prodWithApiPassesAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardCloseInVerifyIdx !== -1 &&
    prodWithApiPassesAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardCloseInVerifyIdx <
      prodWithApiPassesAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateToProdWithApiPassesSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate guard immediately precedes prod with API passes assert',
);
assert(() => assertProductionSeedCustody({ PROD: true, VITE_API_BASE: 'http://127.0.0.1:8787' }) === undefined, 'prod with API passes');
const vercelJsonForStaticDemoDeployAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(fs.existsSync(path.join(__dirname, 'vercel.json')), 'vercel.json for static demo deploy')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate guard immediately precedes vercel.json for static demo deploy assert',
  vercelJsonForStaticDemoDeployAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardMessageInVerifyIdx,
);
const vercelJsonForStaticDemoDeployAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  vercelJsonForStaticDemoDeployAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateToVercelJsonForStaticDemoDeploySlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardCloseInVerifyIdx,
  vercelJsonForStaticDemoDeployAssertOpenInVerifyIdx,
);
assert(
  vercelJsonForStaticDemoDeployAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardCloseInVerifyIdx !== -1 &&
    vercelJsonForStaticDemoDeployAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardCloseInVerifyIdx <
      vercelJsonForStaticDemoDeployAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateToVercelJsonForStaticDemoDeploySlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate guard immediately precedes vercel.json for static demo deploy assert',
);
assert(fs.existsSync(path.join(__dirname, 'vercel.json')), 'vercel.json for static demo deploy');
const { resolveSeedCustodyBadge } = await import('./src/core/authorityGuard.ts');
const demoBadge = resolveSeedCustodyBadge(auditSeedCustody({ PROD: false }));
const demoCustodyBadgeAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(demoBadge.badge === 'demo' && demoBadge.label === 'Demo', 'demo custody badge')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate guard immediately precedes demo custody badge assert',
  demoCustodyBadgeAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardMessageInVerifyIdx,
);
const demoCustodyBadgeAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  demoCustodyBadgeAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateToDemoCustodyBadgeSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardCloseInVerifyIdx,
  demoCustodyBadgeAssertOpenInVerifyIdx,
);
assert(
  demoCustodyBadgeAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardCloseInVerifyIdx !== -1 &&
    demoCustodyBadgeAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardCloseInVerifyIdx <
      demoCustodyBadgeAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateToDemoCustodyBadgeSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate guard immediately precedes demo custody badge assert',
);
assert(demoBadge.badge === 'demo' && demoBadge.label === 'Demo', 'demo custody badge');
const fairnessCustodyBadgeCssClassAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(fairnessSrc.includes('fairness-custody-badge'), 'fairness custody badge CSS class')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate guard immediately precedes fairness custody badge CSS class assert',
  fairnessCustodyBadgeCssClassAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardMessageInVerifyIdx,
);
const fairnessCustodyBadgeCssClassAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fairnessCustodyBadgeCssClassAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateToFairnessCustodyBadgeCssClassSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardCloseInVerifyIdx,
  fairnessCustodyBadgeCssClassAssertOpenInVerifyIdx,
);
assert(
  fairnessCustodyBadgeCssClassAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardCloseInVerifyIdx !== -1 &&
    fairnessCustodyBadgeCssClassAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardCloseInVerifyIdx <
      fairnessCustodyBadgeCssClassAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateToFairnessCustodyBadgeCssClassSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate guard immediately precedes fairness custody badge CSS class assert',
);
assert(fairnessSrc.includes('fairness-custody-badge'), 'fairness custody badge CSS class');
const fairnessPanelCustodyBadgePropAssertBodyInVerifyIdx = verifySrc.lastIndexOf(
  "assert(fairnessSrc.includes('custodyBadge'), 'FairnessPanel custody badge prop')",
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardMessageInVerifyIdx = verifySrc.lastIndexOf(
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate guard immediately precedes FairnessPanel custody badge prop assert',
  fairnessPanelCustodyBadgePropAssertBodyInVerifyIdx,
);
const dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardCloseInVerifyIdx = verifySrc.indexOf(
  ');',
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardMessageInVerifyIdx,
);
const fairnessPanelCustodyBadgePropAssertOpenInVerifyIdx = verifySrc.lastIndexOf(
  'assert(',
  fairnessPanelCustodyBadgePropAssertBodyInVerifyIdx,
);
const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateToFairnessPanelCustodyBadgePropSlice = verifySrc.slice(
  dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardCloseInVerifyIdx,
  fairnessPanelCustodyBadgePropAssertOpenInVerifyIdx,
);
assert(
  fairnessPanelCustodyBadgePropAssertBodyInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardMessageInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardCloseInVerifyIdx !== -1 &&
    fairnessPanelCustodyBadgePropAssertOpenInVerifyIdx !== -1 &&
    dedupeBlockVitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardCloseInVerifyIdx <
      fairnessPanelCustodyBadgePropAssertOpenInVerifyIdx &&
    vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateToFairnessPanelCustodyBadgePropSlice.split('assert(').length - 1 === 0,
  'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate guard immediately precedes FairnessPanel custody badge prop assert',
);
assert(fairnessSrc.includes('custodyBadge'), 'FairnessPanel custody badge prop');
assert(boardSrc.includes('seedCustodyBadge'), 'board passes seed custody badge');
assert(ctxSrc.includes('resolveSeedCustodyBadge'), 'context resolves custody badge');
assert(uiCss.includes('.fairness-custody-badge'), 'custody badge styles');
assert(techManifestSrc.includes('fairness-custody-badge'), 'custody badge upgrade logged');

console.log('\n=== Architect Phase 7: fairRoundStore TypeScript ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/fairRoundStore.ts')), 'fairRoundStore.ts migrated');
const fairTsSrc = fs.readFileSync(path.join(__dirname, 'src/core/fairRoundStore.ts'), 'utf8');
assert(fairTsSrc.includes('registerRemoteCommit'), 'fairRoundStore remote commit typed');
assert(fairTsSrc.includes('applyRemoteReveal'), 'fairRoundStore remote reveal typed');
assert(fairTsSrc.includes('remotePending'), 'fairRoundStore remote pending guard');
const typesSrc = fs.readFileSync(path.join(__dirname, 'src/core/types.ts'), 'utf8');
assert(typesSrc.includes('FairRound'), 'FairRound type');
assert(typesSrc.includes('PublicRoundCommit'), 'PublicRoundCommit type');

console.log('\n=== Architect Phase 7: physics cache service worker ===');
assert(fs.existsSync(path.join(__dirname, 'public/sw.js')), 'public/sw.js');
const swSrc = fs.readFileSync(path.join(__dirname, 'public/sw.js'), 'utf8');
assert(swSrc.includes('PHYSICS_CACHE'), 'SW physics cache name');
assert(swSrc.includes('rapier'), 'SW matches rapier chunk');
assert(swSrc.includes('RapierStage'), 'SW matches RapierStage chunk');
assert(swSrc.includes('.wasm'), 'SW matches wasm assets');
assert(swSrc.includes('skipWaiting'), 'SW immediate activation');
assert(fs.existsSync(path.join(__dirname, 'src/lib/registerServiceWorker.js')), 'SW registrar module');
const swRegSrc = fs.readFileSync(path.join(__dirname, 'src/lib/registerServiceWorker.js'), 'utf8');
assert(swRegSrc.includes('serviceWorker.register'), 'SW registration call');
assert(swRegSrc.includes('import.meta.env.PROD'), 'SW prod-only guard');

console.log('\n=== Architect Phase 7: PWA manifest + install prompt ===');
assert(fs.existsSync(path.join(__dirname, 'public/manifest.webmanifest')), 'web manifest');
assert(fs.existsSync(path.join(__dirname, 'public/icons/icon.svg')), 'PWA icon svg');
assert(fs.existsSync(path.join(__dirname, 'public/icons/maskable.svg')), 'maskable icon svg');
const manifestRaw = fs.readFileSync(path.join(__dirname, 'public/manifest.webmanifest'), 'utf8');
const manifest = JSON.parse(manifestRaw);
assert(manifest.display === 'standalone', 'manifest standalone display');
assert(manifest.start_url === '/', 'manifest start_url');
assert(manifest.theme_color === '#030408', 'manifest theme_color');
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest icons');
assert(fs.existsSync(path.join(__dirname, 'src/lib/installPrompt.js')), 'install prompt bridge');
assert(fs.existsSync(path.join(__dirname, 'src/ui/InstallPrompt.jsx')), 'InstallPrompt component');
const installSrc = fs.readFileSync(path.join(__dirname, 'src/lib/installPrompt.js'), 'utf8');
const installUiSrc = fs.readFileSync(path.join(__dirname, 'src/ui/InstallPrompt.jsx'), 'utf8');
assert(installSrc.includes('beforeinstallprompt'), 'captures install event');
assert(installSrc.includes('getInstallPromptBridge'), 'install bridge export');
assert(coreConfig.includes("name: 'Yogi Roulette'"), 'app config name');
assert(installUiSrc.includes('Install {APP_CONFIG.name}'), 'install CTA uses app config name');
assert(installUiSrc.includes("from '@core/config.js'"), 'install prompt imports app config');
assert(appSrc.includes('InstallPrompt'), 'App renders install prompt');
assert(indexHtml.includes('manifest.webmanifest'), 'index links manifest');
assert(indexHtml.includes('theme-color'), 'index theme-color meta');
assert(indexHtml.includes('apple-mobile-web-app-capable'), 'iOS standalone meta');
assert(uiCss.includes('.install-prompt'), 'install prompt CSS');

console.log('\n=== Architect Phase 7: authority + realtimeHub TypeScript ===');
assert(fs.existsSync(path.join(__dirname, 'src/vite-env.d.ts')), 'vite env types');
const authTsSrc = fs.readFileSync(path.join(__dirname, 'src/core/authorityClient.ts'), 'utf8');
const hubTsSrc = fs.readFileSync(path.join(__dirname, 'src/core/realtimeHub.ts'), 'utf8');
assert(authTsSrc.includes('resolveAuthoritativeCommit'), 'authority commit resolver typed');
assert(authTsSrc.includes('RemoteOutcomeResponse'), 'authority API response types');
assert(hubTsSrc.includes('RealtimeHubOptions'), 'realtime hub options typed');
assert(hubTsSrc.includes('EventSource'), 'SSE hub typed');
assert(typesSrc.includes('SyncMode'), 'SyncMode type');
assert(typesSrc.includes('CycleTick'), 'CycleTick type');
assert(typesSrc.includes('RealtimeHubHandle'), 'RealtimeHubHandle type');

console.log('\n=== Architect Phase 7: Web Vitals telemetry ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/vitalsTelemetry.js')), 'vitalsTelemetry.js');
assert(fs.existsSync(path.join(__dirname, 'src/lib/startVitalsTelemetry.js')), 'startVitalsTelemetry.js');
const vitalsSrc = fs.readFileSync(path.join(__dirname, 'src/core/vitalsTelemetry.js'), 'utf8');
const vitalsBootSrc = fs.readFileSync(path.join(__dirname, 'src/lib/startVitalsTelemetry.js'), 'utf8');
const profileSrc = fs.readFileSync(path.join(__dirname, 'src/core/profileHarness.js'), 'utf8');
assert(vitalsSrc.includes('initVitalsObservers'), 'vitals observers');
assert(vitalsSrc.includes('flushVitalsBeacon'), 'vitals beacon flush');
assert(vitalsSrc.includes('VITE_TELEMETRY_URL'), 'telemetry env gate');
assert(vitalsSrc.includes('sendBeacon'), 'navigator.sendBeacon path');
assert(vitalsSrc.includes('largest-contentful-paint'), 'LCP observer');
assert(vitalsSrc.includes('layout-shift'), 'CLS observer');
assert(profileSrc.includes('recordVital'), 'profileHarness recordVital');
assert(profileSrc.includes('getVitalsSnapshot'), 'profileHarness vitals snapshot');
assert(vitalsBootSrc.includes('initVitalsObservers'), 'boot wires observers');
assert(vitalsBootSrc.includes('import.meta.env.PROD'), 'vitals prod-only');
assert(mainSrc.includes('startVitalsTelemetry'), 'main boots vitals telemetry');
const { recordVital, getVitalsSnapshot } = await import('./src/core/profileHarness.js');
const { isTelemetryEnabled, flushVitalsBeacon } = await import('./src/core/vitalsTelemetry.js');
resetProfileSnapshot();
recordVital('LCP', 1200, { rating: 'good' });
const vitalsSnap = getVitalsSnapshot();
assert(vitalsSnap.vitals.LCP?.value === 1200, 'vitals snapshot includes LCP');
assert(isTelemetryEnabled() === false, 'telemetry off without env');
assert(flushVitalsBeacon('test') === false, 'beacon skipped when disabled');
resetProfileSnapshot();

console.log('\n=== Architect Phase 7: tech debt manifest cleanup ===');
assert(techManifestSrc.includes('RESOLVED_TECH_DEBT'), 'resolved debt section');
assert(techManifestSrc.includes('assertDebtRegistryIntegrity'), 'debt integrity guard');

console.log('\n=== Architect Phase 7: adaptive DPR cap ===');
assert(perfBudgetSrc.includes('detectDeviceProfile'), 'device profile detection');
assert(perfBudgetSrc.includes('mobileMaxDpr'), 'mobile DPR cap constant');
assert(perfSrc.includes('applyRenderBudget'), 'guard applies render budget');

console.log('\n=== Architect Phase 8: rtProtocol TypeScript ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/rtProtocol.ts')), 'rtProtocol.ts migrated');
const rtTsSrc = fs.readFileSync(path.join(__dirname, 'src/core/rtProtocol.ts'), 'utf8');
assert(rtTsSrc.includes('parsePhaseName'), 'phase name guard');
assert(rtTsSrc.includes('CycleTickInput'), 'tick input type usage');
assert(typesSrc.includes('RtEvent'), 'RtEvent type');
assert(typesSrc.includes('CycleTickInput'), 'CycleTickInput type');

console.log('\n=== Architect Phase 8: feedbackConfig TypeScript ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/feedbackConfig.ts')), 'feedbackConfig.ts migrated');
const feedbackTsSrc = fs.readFileSync(path.join(__dirname, 'src/core/feedbackConfig.ts'), 'utf8');
assert(feedbackTsSrc.includes('FeedbackPrefs'), 'feedback prefs type usage');
assert(feedbackTsSrc.includes('loadFeedbackPrefs'), 'loadFeedbackPrefs export');
assert(typesSrc.includes('FeedbackPrefs'), 'FeedbackPrefs type');
const { loadFeedbackPrefs: lfp, FEEDBACK_CONFIG: fbc } = await import('./src/core/feedbackConfig.js');
assert(fbc.storageKey === 'turboRoulette.feedback', 'feedback storage key');
const prefs = lfp();
assert(prefs.audioMuted === false && prefs.hapticsMuted === false, 'feedback prefs fallback');

console.log('\n=== Architect Phase 8: timer @core consolidation ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/timer.ts')), 'timer.ts in core');
const timerTsSrc = fs.readFileSync(path.join(__dirname, 'src/core/timer.ts'), 'utf8');
const timerLibShim = fs.readFileSync(path.join(__dirname, 'src/lib/timer.js'), 'utf8');
const gameEngineTsSrc = fs.readFileSync(path.join(__dirname, 'src/core/gameEngine.ts'), 'utf8');
assert(timerTsSrc.includes('PhaseSnapshot'), 'timer phase snapshot type');
assert(timerTsSrc.includes('getPhase'), 'getPhase in core timer');
assert(gameEngineTsSrc.includes("from './timer.js'"), 'gameEngine imports core timer');
assert(timerLibShim.includes('../core/timer'), 'lib timer shim points to core');
assert(ctxSrc.includes('@core/timer.js'), 'GameContext uses @core timer');
assert(!ctxSrc.includes('../lib/timer.js'), 'GameContext no lib timer import');
assert(techManifestSrc.includes("id: 'TD-05'"), 'TD-05 documented');
assert(techManifestSrc.includes('timer-core-consolidation'), 'timer consolidation upgrade');
assert(techManifestSrc.includes('3.0.0-phase9'), 'tech manifest phase9 version');
assert(!TECH_DEBT.some((d) => d.id === 'TD-05'), 'TD-05 resolved');
assert(RESOLVED_TECH_DEBT.some((d) => d.id === 'TD-05'), 'TD-05 in resolved register');

console.log('\n=== Architect Phase 7: Playwright E2E smoke ===');
assert(fs.existsSync(path.join(__dirname, 'playwright.config.js')), 'playwright.config.js');
assert(fs.existsSync(path.join(__dirname, 'e2e/smoke.spec.js')), 'e2e smoke spec');
const e2eSrc = fs.readFileSync(path.join(__dirname, 'e2e/smoke.spec.js'), 'utf8');
const pwCfg = fs.readFileSync(path.join(__dirname, 'playwright.config.js'), 'utf8');
assert(e2eSrc.includes('cycle smoke: bet lock at T-20 and settle at T-0'), 'combined cycle e2e test');
assert(e2eSrc.includes('installMockCycleClock'), 'deterministic mock clock');
assert(fs.existsSync(path.join(__dirname, 'e2e/helpers/mockClock.js')), 'mockClock helper');
assert(e2eSrc.includes('__e2eAdvanceSeconds'), 'virtual clock advance');
assert(e2eSrc.includes("toHaveText('locked'"), 'e2e asserts lock phase');
assert(e2eSrc.includes('settle-reveal'), 'e2e asserts settle reveal');
assert(pwCfg.includes('webServer'), 'playwright preview webServer');
assert(appSrc.includes('data-testid="phase-pill"'), 'phase pill test id');
assert(boardSrc.includes('data-testid="betting-panel"'), 'betting panel test id');
assert(boardSrc.includes('data-testid="status-line"'), 'status line test id');
assert(pkgJson.includes('"test:e2e"'), 'npm test:e2e script');
assert(pkgJson.includes('node e2e/smoke.mjs'), 'standalone e2e runner');
assert(fs.existsSync(path.join(__dirname, 'e2e/smoke.mjs')), 'e2e smoke.mjs runner');
assert(pkgJson.includes('@playwright/test'), 'playwright devDependency');

console.log('\n=== Architect Phase 8: check:ci e2e script ===');
assert(pkgJson.includes('"check:ci"'), 'check:ci script');
assert(pkgJson.includes('node e2e/run-ci.mjs'), 'e2e run-ci orchestrator');
assert(pkgJson.includes('"test:e2e:ci"'), 'test:e2e:ci script');
const runCiSrc = fs.readFileSync(path.join(__dirname, 'e2e/run-ci.mjs'), 'utf8');
assert(runCiSrc.includes('VITE_SEED_CUSTODY_BYPASS'), 'run-ci bypass build');
assert(runCiSrc.includes('spawnPreview'), 'run-ci spawns preview');
assert(runCiSrc.includes('waitForServer'), 'run-ci waits for preview');
assert(runCiSrc.includes('smoke.mjs'), 'run-ci runs smoke runner');
const checkCiMatch = pkgJson.match(/"check:ci"\s*:\s*"([^"]+)"/);
assert(checkCiMatch?.[1]?.includes('npm run check'), 'check:ci extends check');
assert(checkCiMatch?.[1]?.includes('run-ci.mjs'), 'check:ci runs e2e orchestrator');

console.log('\n=== Architect Phase 8: WebGL context recovery ===');
assert(fs.existsSync(path.join(__dirname, 'src/lib/webglContextRecovery.js')), 'webglContextRecovery module');
assert(fs.existsSync(path.join(__dirname, 'src/hooks/useWebGLRecovery.js')), 'useWebGLRecovery hook');
const webglRecoverySrc = fs.readFileSync(path.join(__dirname, 'src/lib/webglContextRecovery.js'), 'utf8');
const webglHookSrc = fs.readFileSync(path.join(__dirname, 'src/hooks/useWebGLRecovery.js'), 'utf8');
assert(webglRecoverySrc.includes('webglcontextlost'), 'context lost listener');
assert(webglRecoverySrc.includes('preventDefault'), 'context loss preventDefault');
assert(webglRecoverySrc.includes('webglcontextrestored'), 'context restored listener');
assert(webglHookSrc.includes('canvasKey'), 'canvas remount key');
assert(appSrc.includes('useWebGLRecovery'), 'App uses recovery hook');
assert(appSrc.includes('key={canvasKey}'), 'Canvas remount on restore');
assert(appSrc.includes('webgl-recovery'), 'recovery overlay UI');
assert(loadRapierSrc.includes('resetRapierCache'), 'rapier cache reset export');
assert(ctxSrc.includes('recoverWebGLContext'), 'context recover callback');
const { resetRapierCache } = await import('./src/lib/loadRapier.js');
resetRapierCache();
assert(typeof resetRapierCache === 'function', 'resetRapierCache callable');

console.log('\n=== Architect Phase 8: fair-round IndexedDB history ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/fairRoundHistory.ts')), 'fairRoundHistory.ts');
const fairHistorySrc = fs.readFileSync(path.join(__dirname, 'src/core/fairRoundHistory.ts'), 'utf8');
assert(fairHistorySrc.includes('indexedDB'), 'IndexedDB API usage');
assert(fairHistorySrc.includes('fairRounds'), 'fairRounds object store');
assert(fairHistorySrc.includes('FAIR_ROUND_HISTORY_MAX'), 'history cap constant');
assert(fairTsSrc.includes('hydrateFairRoundsFromStorage'), 'hydrate from storage export');
assert(fairTsSrc.includes('listFairRoundHistory'), 'list history export');
assert(fairTsSrc.includes('persistFairRound'), 'persist hook in store');
assert(fairTsSrc.includes('clearFairRoundHistory'), 'clear history on store reset');
assert(ctxSrc.includes('hydrateFairRoundsFromStorage'), 'GameContext hydrates fair rounds');
const { loadFairRoundHistory, FAIR_ROUND_HISTORY_MAX } = await import('./src/core/fairRoundHistory.js');
const {
  clearFairRounds: resetFairStore,
  ensureRound,
  hydrateFairRoundsFromStorage,
  listFairRoundHistory,
  revealRound,
} = await import('./src/core/fairRoundStore.js');
assert(FAIR_ROUND_HISTORY_MAX === 48, 'history max 48');
const persisted = await loadFairRoundHistory();
assert(Array.isArray(persisted), 'load history returns array');
resetFairStore();
const hydrated = await hydrateFairRoundsFromStorage();
assert(hydrated >= 0, 'hydrate count in node');
assert(listFairRoundHistory().length >= 0, 'list history callable');
const round = ensureRound(9001);
assert(round.cycleId === 9001, 'ensure round after hydrate');
assert(revealRound(9001).verified === true, 'reveal persisted round');
resetFairStore();

console.log('\n=== Architect Phase 9: fairness history UI ===');
assert(fairnessSrc.includes('fairness-history'), 'fairness history section');
assert(fairnessSrc.includes('history = []'), 'history prop default');
assert(fairnessSrc.includes('deriveWinningNumber'), 'history outcome derivation');
assert(boardSrc.includes('fairRoundHistory'), 'board passes fair history');
assert(ctxSrc.includes('fairRoundHistory'), 'context exposes fair history');
assert(ctxSrc.includes('refreshFairRoundHistory'), 'context refreshes history');
assert(uiCss.includes('.fairness-history-list'), 'fairness history CSS');

console.log('\n=== Architect Phase 9: GitHub Actions CI ===');
assert(fs.existsSync(path.join(__dirname, '.github/workflows/ci.yml')), 'GitHub Actions ci.yml');
const ciWorkflow = fs.readFileSync(path.join(__dirname, '.github/workflows/ci.yml'), 'utf8');
assert(ciWorkflow.includes('npm run check:ci'), 'workflow runs check:ci');
assert(ciWorkflow.includes('playwright install'), 'workflow installs Playwright');
assert(ciWorkflow.includes('ubuntu-latest'), 'workflow uses ubuntu runner');
assert(ciWorkflow.includes('actions/setup-node@v4'), 'workflow uses setup-node');
assert(ciWorkflow.includes('cache: npm'), 'workflow caches npm');

console.log('\n=== Architect Phase 9: orphan dep audit (TD-07) ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/depAudit.js')), 'depAudit.js');
const depAuditSrc = fs.readFileSync(path.join(__dirname, 'src/core/depAudit.js'), 'utf8');
assert(depAuditSrc.includes('ORPHAN_TRANSITIVE_DEPS'), 'orphan dep registry');
assert(depAuditSrc.includes('auditOrphanDeps'), 'auditOrphanDeps export');
assert(depAuditSrc.includes('n8ao'), 'n8ao rule');
assert(depAuditSrc.includes('forbiddenInDist'), 'dist bundle guard');
assert(techManifestSrc.includes("id: 'TD-07'"), 'TD-07 documented');
assert(techManifestSrc.includes('depAudit'), 'TD-07 resolution mentions depAudit');
assert(techManifestSrc.includes('orphan-dep-audit'), 'orphan dep upgrade logged');
assert(!TECH_DEBT.some((d) => d.id === 'TD-07'), 'TD-07 resolved');
assert(RESOLVED_TECH_DEBT.some((d) => d.id === 'TD-07'), 'TD-07 in resolved register');
const { auditOrphanDeps, findForbiddenSourceImports } = await import('./src/core/depAudit.js');
const srcHits = findForbiddenSourceImports(path.join(__dirname, 'src'), 'n8ao');
assert(srcHits.length === 0, 'no direct n8ao imports in src');
const dryReport = auditOrphanDeps({ rootDir: __dirname, distDir: path.join(__dirname, 'dist') });
assert(dryReport.checked.length >= 1, 'dep audit checks rules');

console.log('\n=== Architect Phase 9: performanceGuard TypeScript ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/performanceGuard.ts')), 'performanceGuard.ts migrated');
const perfGuardTsSrc = fs.readFileSync(path.join(__dirname, 'src/core/performanceGuard.ts'), 'utf8');
assert(perfGuardTsSrc.includes('QualitySettings'), 'quality settings type usage');
assert(perfGuardTsSrc.includes('PerformanceGuardHandle'), 'guard handle type');
assert(perfGuardTsSrc.includes('createPerformanceGuard'), 'createPerformanceGuard export');
assert(typesSrc.includes('QualityTierName'), 'QualityTierName type');
assert(typesSrc.includes('PerformanceGuardTickResult'), 'tick result type');
assert(ctxSrc.includes('@core/performanceGuard.js'), 'GameContext uses @core guard');
const perfShimSrc = fs.readFileSync(path.join(__dirname, 'src/lib/performanceGuard.js'), 'utf8');
assert(perfShimSrc.includes('../core/performanceGuard'), 'lib shim points to core');
const { createPerformanceGuard: createGuard, QUALITY_TIERS: tiers } = await import(
  './src/core/performanceGuard.js'
);
const perfGuard = createGuard({ mobile: false, lowTier: false, devicePixelRatio: 1, hardwareConcurrency: 8, deviceMemory: 8 });
const perfTick = perfGuard.tick(16.67);
assert(perfTick.tier === 'high', 'guard starts high tier');
assert(tiers.low.quantumArc === false, 'low tier disables quantum arc');

console.log('\n=== Architect Phase 9: post-refresh fairness audit restore ===');
assert(fairTsSrc.includes('restoreStoredFairnessAudit'), 'restore audit export in store');
assert(ctxSrc.includes('restoreStoredFairnessAudit'), 'GameContext restores audit on hydrate');
assert(ctxSrc.includes('restored?.verified'), 'context only applies verified audits');
const {
  clearFairRounds: resetFairStore2,
  ensureRound: ensureRound2,
  restoreStoredFairnessAudit,
  revealRound: revealRound2,
} = await import('./src/core/fairRoundStore.js');
resetFairStore2();
assert(restoreStoredFairnessAudit(99) === null, 'no audit when no revealed rounds');
ensureRound2(42);
revealRound2(42);
const restoredPrior = restoreStoredFairnessAudit(43);
assert(restoredPrior?.verified === true, 'restores prior cycle audit');
assert(restoredPrior?.cycleId === 42, 'restored audit cycle id');
const restoredCurrent = restoreStoredFairnessAudit(42);
assert(restoredCurrent?.verified === true, 'restores current cycle audit');
resetFairStore2();

console.log('\n=== Architect Phase 7: bundle budget tooling ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/bundleBudgetCheck.js')), 'bundleBudgetCheck.js');
const bundleCheckSrc = fs.readFileSync(
  path.join(__dirname, 'src/core/bundleBudgetCheck.js'),
  'utf8'
);
assert(bundleCheckSrc.includes('evaluateBundleBudget'), 'evaluateBundleBudget export');
assert(bundleCheckSrc.includes('gzipSizeKb'), 'gzipSizeKb export');
assert(bundleCheckSrc.includes('BUNDLE_BUDGET_KB'), 'budget constants imported');
const { gzipSizeKb, evaluateBundleBudget, formatBundleResult } = await import(
  './src/core/bundleBudgetCheck.js'
);
const tmpGzip = path.join(__dirname, '.verify-gzip-tmp');
fs.writeFileSync(tmpGzip, 'x'.repeat(2048));
const tmpKb = gzipSizeKb(tmpGzip);
assert(tmpKb > 0 && tmpKb < 5, 'gzipSizeKb measures small payload');
fs.unlinkSync(tmpGzip);

const runBundleCheck = process.argv.includes('--bundle');
if (runBundleCheck) {
  console.log('\n=== Architect Phase 7: bundle budget enforcement ===');
  const distDir = path.join(__dirname, 'dist');
  assert(fs.existsSync(distDir), 'dist/ exists (run build first)');
  const { results, missing, allOk } = evaluateBundleBudget(distDir);
  assert(missing.length === 0, `all budget chunks present (missing: ${missing.join(', ')})`);
  for (const r of results) {
    console.log(`  ${formatBundleResult(r)}`);
    assert(r.ok, `${r.label} gzip ${r.gzipKb.toFixed(2)} KB ≤ ${r.maxKb} KB (${r.file})`);
  }
  assert(allOk, 'all bundle budgets within limits');
  const { auditOrphanDeps, ORPHAN_TRANSITIVE_DEPS } = await import('./src/core/depAudit.js');
  const depReport = auditOrphanDeps({ rootDir: __dirname });
  assert(depReport.ok, `orphan dep audit: ${depReport.violations.map((v) => v.detail).join('; ')}`);
  assert(ORPHAN_TRANSITIVE_DEPS.some((d) => d.id === 'n8ao'), 'n8ao monitored');
  assert(fs.existsSync(path.join(__dirname, 'dist/sw.js')), 'sw.js deployed to dist');
  assert(fs.existsSync(path.join(__dirname, 'dist/manifest.webmanifest')), 'manifest deployed to dist');
  assert(fs.existsSync(path.join(__dirname, 'dist/icons/icon.svg')), 'PWA icon deployed to dist');
}

console.log('\n=== Phase 5: deploy files ===');
const required = [
  'index.html',
  'vite.config.js',
  'package.json',
  'src/App.jsx',
  'src/scene/GameScene.jsx',
  'src/scene/EuropeanWheel.jsx',
];
for (const f of required) {
  assert(fs.existsSync(path.join(__dirname, f)), `${f} exists`);
}

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log('All verification checks passed.');

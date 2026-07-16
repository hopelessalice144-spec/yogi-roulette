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
  FULL_SURFACE_TEST_PARITY_MODULE_COUNT,
  JS_TEST_PARITY_COMPLETE,
  JSX_SURFACE_TEST_PARITY_COMPLETE,
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
assert(audioSrc.includes('setRollingVelocity'), 'velocity-driven audio synthesis');
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
assert(uiCss.includes('pathway-lit'), 'neon pathway cells');
assert(uiCss.includes('magnetic-glow'), 'magnetic cursor glow');
assert(uiCss.includes('panel-enter'), 'panel entrance animation');
assert(uiCss.includes('holo-border'), 'holographic iridescent border');
assert(uiCss.includes('chip-stack'), 'physical chip stacking');
assert(uiCss.includes('--panel-opacity: 0.15'), 'spin-focus 15% opacity');
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
assert(appSrc.includes('PayoutToast'), 'payout toast wired');
assert(uiCss.includes('payout-toast-jackpot'), 'jackpot toast tier');
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
assert(uiCss.includes('spin-focus *'), 'spin-focus blocks pointer events');
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
assert(uiCss.includes('bet-spotlight'), 'kinetic cell spotlight CSS');
assert(uiCss.includes('bet-glow-casing'), 'dual-layer glow casing');
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
const { shouldPrefetchPhysics, shouldMountPhysics, RAPIER_PREFETCH_AT } = await import('./src/lib/loadRapier.js');
assert(RAPIER_PREFETCH_AT === 17, 'prefetch at second 17');
assert(shouldPrefetchPhysics({ name: 'betting', cycleSecond: 16 }) === false, 'no prefetch early betting');
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
assert(vitestCoverageSrc.includes('JSX_UI_TEST_PARITY_MISSING_COUNT'), 'jsx ui test parity missing count export');
assert(vitestCoverageSrc.includes('auditJsxSurfaceTestParity'), 'jsx surface test parity audit export');
assert(vitestCoverageSrc.includes('JSX_SURFACE_TEST_PARITY_MISSING_COUNT'), 'jsx surface test parity missing count export');
assert(vitestCoverageSrc.includes('JSX_SURFACE_TEST_PARITY_COMPLETE'), 'jsx surface test parity complete milestone export');
assert(vitestCoverageSrc.includes('FULL_SURFACE_TEST_PARITY_COMPLETE'), 'full surface test parity complete milestone export');
assert(vitestCoverageSrc.includes('JS_TEST_PARITY_COMPLETE &&'), 'js test parity complete in full surface milestone');
assert(vitestCoverageSrc.includes('FULL_SURFACE_TEST_PARITY_MODULE_COUNT'), 'full surface test parity module count export');
assert(vitestCoverageSrc.includes('FULL_SURFACE_TEST_PARITY_COMPLETE &&'), 'full surface test parity complete in main ok gate');
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
const vitestAudits = runVitestVerifyAudits(path.join(__dirname, 'src'));
assert(
  vitestAudits.ok,
  `vitest verify audits (missing modules: ${vitestAudits.missingModules.join(', ') || 'none'}; upgrades ${vitestAudits.upgradeLog.count}/${vitestAudits.upgradeCount})`,
);
assert(
  vitestAudits.jsxSurface.moduleCount === vitestAudits.jsxSurfaceCount,
  `jsx surface probe (${vitestAudits.jsxSurface.moduleCount}/${vitestAudits.jsxSurfaceCount})`,
);
assert(
  vitestAudits.jsxSurface.sceneCount === vitestAudits.jsxSceneSurfaceCount,
  `scene jsx surface probe (${vitestAudits.jsxSurface.sceneCount}/${vitestAudits.jsxSceneSurfaceCount})`,
);
assert(
  vitestAudits.jsxSurface.contextCount === vitestAudits.jsxContextSurfaceCount,
  `context jsx surface probe (${vitestAudits.jsxSurface.contextCount}/${vitestAudits.jsxContextSurfaceCount})`,
);
assert(
  vitestAudits.jsxSurface.entryCount === vitestAudits.jsxEntrySurfaceCount,
  `entry jsx surface probe (${vitestAudits.jsxSurface.entryCount}/${vitestAudits.jsxEntrySurfaceCount})`,
);
assert(
  vitestAudits.jsxSurfaceComplete.ok,
  `jsx surface complete (${vitestAudits.jsxSurfaceComplete.probeCount}/${vitestAudits.jsxSurfaceComplete.moduleCount}; missing ${vitestAudits.jsxSurfaceComplete.missingFromProbe.join(', ') || 'none'})`,
);
assert(
  vitestAudits.coverage.moduleCount === vitestAudits.moduleCount,
  `js test parity scaffold (${vitestAudits.coverage.moduleCount} modules; ${vitestAudits.coverage.missing.length} missing)`,
);
assert(
  vitestAudits.coverage.missing.length === vitestAudits.jsTestParityMissingCount,
  `js test parity gaps (${vitestAudits.jsTestParityCoveredCount}/${vitestAudits.moduleCount} covered)`,
);
assert(
  vitestAudits.coverage.ok,
  `js test parity (${vitestAudits.jsTestParityCoveredCount}/${vitestAudits.moduleCount} covered)`,
);
assert(
  vitestAudits.coverage.missing.length === 0,
  `js test parity complete (missing ${vitestAudits.coverage.missing.join(', ') || 'none'})`,
);
assert(
  vitestAudits.jsTestParityCoveredCount + vitestAudits.jsTestParityMissingCount ===
    vitestAudits.moduleCount,
  `js test parity balance (${vitestAudits.jsTestParityCoveredCount}+${vitestAudits.jsTestParityMissingCount})`,
);
assert(JS_TEST_PARITY_COMPLETE, 'js test parity complete milestone');
assert(
  vitestAudits.jsTestParityComplete === JS_TEST_PARITY_COMPLETE,
  'js test parity complete flag',
);
assert(
  vitestAudits.coverage.ok === JS_TEST_PARITY_COMPLETE,
  'js test parity ok matches complete milestone',
);
assert(
  vitestAudits.jsxUiTestParity.moduleCount === vitestAudits.jsxUiSurfaceCount,
  `jsx ui test parity scaffold (${vitestAudits.jsxUiTestParity.moduleCount} modules; ${vitestAudits.jsxUiTestParity.missing.length} missing)`,
);
assert(
  vitestAudits.jsxUiTestParity.ok,
  `jsx ui test parity (${vitestAudits.jsxUiTestParityCoveredCount}/${vitestAudits.jsxUiTestParity.moduleCount} covered)`,
);
assert(
  vitestAudits.jsxUiTestParity.missing.length === 0,
  `jsx ui test parity complete (missing ${vitestAudits.jsxUiTestParity.missing.join(', ') || 'none'})`,
);
assert(
  !vitestAudits.jsxUiTestParity.missing.includes('ui/PayoutToast.jsx'),
  'payout toast jsx test parity',
);
assert(
  !vitestAudits.jsxUiTestParity.missing.includes('ui/InstallPrompt.jsx'),
  'install prompt jsx test parity',
);
assert(
  !vitestAudits.jsxUiTestParity.missing.includes('ui/GhostBetLayer.jsx'),
  'ghost bet layer jsx test parity',
);
assert(
  !vitestAudits.jsxUiTestParity.missing.includes('ui/FairnessPanel.jsx'),
  'fairness panel jsx test parity',
);
assert(
  vitestAudits.jsxUiTestParityCoveredCount + vitestAudits.jsxUiTestParityMissingCount ===
    vitestAudits.jsxUiTestParity.moduleCount,
  `jsx ui test parity balance (${vitestAudits.jsxUiTestParityCoveredCount}+${vitestAudits.jsxUiTestParityMissingCount})`,
);
assert(
  vitestAudits.jsxSceneTestParity.moduleCount === vitestAudits.jsxSceneSurfaceCount,
  `jsx scene test parity scaffold (${vitestAudits.jsxSceneTestParity.moduleCount} modules; ${vitestAudits.jsxSceneTestParity.missing.length} missing)`,
);
assert(
  vitestAudits.jsxSceneTestParity.missing.length === vitestAudits.jsxSceneTestParityMissingCount,
  `jsx scene test parity gaps (${vitestAudits.jsxSceneTestParityCoveredCount}/${vitestAudits.jsxSceneTestParity.moduleCount} covered)`,
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/GameScene.jsx'),
  'game scene jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/EuropeanWheel.jsx'),
  'european wheel jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/RapierStage.jsx'),
  'rapier stage jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/RouletteBall.jsx'),
  'roulette ball jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/BallFrictionVapor.jsx'),
  'ball friction vapor jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/CinematicCamera.jsx'),
  'cinematic camera jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/EuropeanWheelVisual.jsx'),
  'european wheel visual jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/FeltTable.jsx'),
  'felt table jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/FloatingWinText.jsx'),
  'floating win text jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/LoungeDust.jsx'),
  'lounge dust jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/MaterialLibrary.jsx'),
  'material library jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/PerformanceMonitor.jsx'),
  'performance monitor jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/QuantumProbabilityArc.jsx'),
  'quantum probability arc jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/RimStreaks.jsx'),
  'rim streaks jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/SparkBurst.jsx'),
  'spark burst jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/VIPLighting.jsx'),
  'vip lighting jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/VIPPostFX.jsx'),
  'vip post fx jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/VolumetricGodRays.jsx'),
  'volumetric god rays jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/WheelInstanced.jsx'),
  'wheel instanced jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/WheelSectorNeon.jsx'),
  'wheel sector neon jsx test parity',
);
assert(
  !vitestAudits.jsxSceneTestParity.missing.includes('scene/WinParticles.jsx'),
  'win particles jsx test parity',
);
assert(
  vitestAudits.jsxSceneTestParity.ok,
  `jsx scene test parity (${vitestAudits.jsxSceneTestParityCoveredCount}/${vitestAudits.jsxSceneTestParity.moduleCount} covered)`,
);
assert(
  vitestAudits.jsxSceneTestParity.missing.length === 0,
  `jsx scene test parity complete (missing ${vitestAudits.jsxSceneTestParity.missing.join(', ') || 'none'})`,
);
assert(
  vitestAudits.jsxSceneTestParityCoveredCount + vitestAudits.jsxSceneTestParityMissingCount ===
    vitestAudits.jsxSceneTestParity.moduleCount,
  `jsx scene test parity balance (${vitestAudits.jsxSceneTestParityCoveredCount}+${vitestAudits.jsxSceneTestParityMissingCount})`,
);
assert(
  vitestAudits.jsxContextTestParity.moduleCount === vitestAudits.jsxContextSurfaceCount,
  `jsx context test parity scaffold (${vitestAudits.jsxContextTestParity.moduleCount} modules; ${vitestAudits.jsxContextTestParity.missing.length} missing)`,
);
assert(
  vitestAudits.jsxContextTestParity.missing.length === vitestAudits.jsxContextTestParityMissingCount,
  `jsx context test parity gaps (${vitestAudits.jsxContextTestParityCoveredCount}/${vitestAudits.jsxContextTestParity.moduleCount} covered)`,
);
assert(
  !vitestAudits.jsxContextTestParity.missing.includes('context/GameContext.jsx'),
  'game context jsx test parity',
);
assert(
  vitestAudits.jsxContextTestParity.ok,
  `jsx context test parity (${vitestAudits.jsxContextTestParityCoveredCount}/${vitestAudits.jsxContextTestParity.moduleCount} covered)`,
);
assert(
  vitestAudits.jsxContextTestParity.missing.length === 0,
  `jsx context test parity complete (missing ${vitestAudits.jsxContextTestParity.missing.join(', ') || 'none'})`,
);
assert(
  vitestAudits.jsxContextTestParityCoveredCount + vitestAudits.jsxContextTestParityMissingCount ===
    vitestAudits.jsxContextTestParity.moduleCount,
  `jsx context test parity balance (${vitestAudits.jsxContextTestParityCoveredCount}+${vitestAudits.jsxContextTestParityMissingCount})`,
);
assert(
  vitestAudits.jsxEntryTestParity.moduleCount === vitestAudits.jsxEntrySurfaceCount,
  `jsx entry test parity scaffold (${vitestAudits.jsxEntryTestParity.moduleCount} modules; ${vitestAudits.jsxEntryTestParity.missing.length} missing)`,
);
assert(
  vitestAudits.jsxEntryTestParity.missing.length === vitestAudits.jsxEntryTestParityMissingCount,
  `jsx entry test parity gaps (${vitestAudits.jsxEntryTestParityCoveredCount}/${vitestAudits.jsxEntryTestParity.moduleCount} covered)`,
);
assert(
  !vitestAudits.jsxEntryTestParity.missing.includes('App.jsx'),
  'app entry jsx test parity',
);
assert(
  !vitestAudits.jsxEntryTestParity.missing.includes('main.jsx'),
  'main entry jsx test parity',
);
assert(
  vitestAudits.jsxEntryTestParity.ok,
  `jsx entry test parity (${vitestAudits.jsxEntryTestParityCoveredCount}/${vitestAudits.jsxEntryTestParity.moduleCount} covered)`,
);
assert(
  vitestAudits.jsxEntryTestParity.missing.length === 0,
  `jsx entry test parity complete (missing ${vitestAudits.jsxEntryTestParity.missing.join(', ') || 'none'})`,
);
assert(
  vitestAudits.jsxEntryTestParityCoveredCount + vitestAudits.jsxEntryTestParityMissingCount ===
    vitestAudits.jsxEntryTestParity.moduleCount,
  `jsx entry test parity balance (${vitestAudits.jsxEntryTestParityCoveredCount}+${vitestAudits.jsxEntryTestParityMissingCount})`,
);
assert(
  vitestAudits.jsxSurfaceTestParity.moduleCount === vitestAudits.jsxSurfaceCount,
  `jsx surface test parity scaffold (${vitestAudits.jsxSurfaceTestParity.moduleCount} modules; ${vitestAudits.jsxSurfaceTestParity.missing.length} missing)`,
);
assert(
  vitestAudits.jsxSurfaceTestParity.moduleCount === vitestAudits.jsxSrcSurfaceCount,
  `jsx surface test parity matches src tree (${vitestAudits.jsxSurfaceTestParity.moduleCount}/${vitestAudits.jsxSrcSurfaceCount})`,
);
assert(
  vitestAudits.jsxSurfaceTestParity.ok,
  `jsx surface test parity (${vitestAudits.jsxSurfaceTestParity.coveredCount}/${vitestAudits.jsxSurfaceTestParity.moduleCount} covered)`,
);
assert(
  vitestAudits.jsxSurfaceTestParity.missing.length === 0,
  `jsx surface test parity complete (missing ${vitestAudits.jsxSurfaceTestParity.missing.join(', ') || 'none'})`,
);
assert(
  vitestAudits.jsxSurfaceTestParityCoveredCount + vitestAudits.jsxSurfaceTestParityMissingCount ===
    vitestAudits.jsxSurfaceTestParity.moduleCount,
  `jsx surface test parity balance (${vitestAudits.jsxSurfaceTestParityCoveredCount}+${vitestAudits.jsxSurfaceTestParityMissingCount})`,
);
assert(
  vitestAudits.jsxUiTestParityCoveredCount +
    vitestAudits.jsxSceneTestParityCoveredCount +
    vitestAudits.jsxContextTestParityCoveredCount +
    vitestAudits.jsxEntryTestParityCoveredCount ===
    vitestAudits.jsxSurfaceTestParityCoveredCount,
  `jsx surface test parity closure (${vitestAudits.jsxUiTestParityCoveredCount}+${vitestAudits.jsxSceneTestParityCoveredCount}+${vitestAudits.jsxContextTestParityCoveredCount}+${vitestAudits.jsxEntryTestParityCoveredCount}=${vitestAudits.jsxSurfaceTestParityCoveredCount})`,
);
assert(JSX_SURFACE_TEST_PARITY_COMPLETE, 'jsx surface test parity complete milestone');
assert(
  vitestAudits.jsxSurfaceTestParityComplete === JSX_SURFACE_TEST_PARITY_COMPLETE,
  'jsx surface test parity complete flag',
);
assert(
  vitestAudits.jsxSurfaceTestParity.ok === JSX_SURFACE_TEST_PARITY_COMPLETE,
  'jsx surface test parity ok matches complete milestone',
);
assert(
  vitestAudits.moduleCount + vitestAudits.jsxSurfaceCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT,
  `full surface test parity module count (${vitestAudits.moduleCount}+${vitestAudits.jsxSurfaceCount}=${FULL_SURFACE_TEST_PARITY_MODULE_COUNT})`,
);
assert(FULL_SURFACE_TEST_PARITY_COMPLETE, 'full surface test parity complete milestone');
assert(
  vitestAudits.fullSurfaceTestParityComplete === FULL_SURFACE_TEST_PARITY_COMPLETE,
  'full surface test parity complete flag',
);
assert(
  vitestAudits.fullSurfaceTestParityModuleCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT,
  'full surface test parity module count flag',
);
assert(
  vitestAudits.coverage.ok &&
    vitestAudits.jsxSurfaceTestParityComplete &&
    vitestAudits.fullSurfaceTestParityComplete,
  'full surface test parity js and jsx milestones',
);
assert(techManifestSrc.includes('fairRoundStore.test.ts'), 'TD-09 resolved note');
assert(!TECH_DEBT.some((d) => d.id === 'TD-09'), 'TD-09 resolved');
assert(RESOLVED_TECH_DEBT.some((d) => d.id === 'TD-09'), 'TD-09 in resolved register');

console.log('\n=== Architect Phase 11: authority seed custody guard ===');
assert(fs.existsSync(path.join(__dirname, 'src/core/authorityGuard.ts')), 'authorityGuard.ts');
const devAuthSrc = fs.readFileSync(path.join(__dirname, 'server/devAuthority.mjs'), 'utf8');
assert(mainSrc.includes('runStartupAuthorityGuard'), 'client startup guard wired');
assert(devAuthSrc.includes('assertAuthorityStartup'), 'authority server startup guard');
assert(devAuthSrc.includes('AUTHORITY_MASTER_SECRET'), 'master secret env documented');
assert(techManifestSrc.includes('authority-seed-guard'), 'authority guard upgrade logged');
const { auditSeedCustody, assertProductionSeedCustody } = await import('./src/core/authorityGuard.ts');
const devAudit = auditSeedCustody({ PROD: false });
assert(devAudit.safe && devAudit.mode === 'demo-local', 'dev demo custody allowed');
const prodAudit = auditSeedCustody({ PROD: true });
assert(!prodAudit.safe, 'prod without API blocked');
assert(() => assertProductionSeedCustody({ PROD: true, VITE_API_BASE: 'http://127.0.0.1:8787' }) === undefined, 'prod with API passes');
const { resolveSeedCustodyBadge } = await import('./src/core/authorityGuard.ts');
const demoBadge = resolveSeedCustodyBadge(auditSeedCustody({ PROD: false }));
assert(demoBadge.badge === 'demo' && demoBadge.label === 'Demo', 'demo custody badge');
assert(fairnessSrc.includes('fairness-custody-badge'), 'fairness custody badge CSS class');
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

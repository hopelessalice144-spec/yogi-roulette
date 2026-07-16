/**
 * Machine-readable technology decisions — consumed by verify.js and tooling.
 * DO NOT duplicate stack rationale here; see ARCHITECTURE.md + docs/UPGRADE_AUDIT.md.
 */

export const TECH_MANIFEST_VERSION = '3.0.0-phase9';

export const STACK = Object.freeze({
  build: { name: 'vite', version: '6.x', verdict: 'keep' },
  ui: { name: 'react', version: '19.x', verdict: 'keep' },
  renderer: { name: 'three', version: '0.175', verdict: 'keep' },
  r3f: { name: '@react-three/fiber', version: '9.x', verdict: 'keep' },
  physics: { name: '@react-three/rapier', version: '2.x', verdict: 'keep' },
  postfx: { name: 'postprocessing', version: '6.x', verdict: 'keep' },
  state: { name: 'react-context-refs', version: 'native', verdict: 'keep' },
  rng: { name: 'core/provablyFair', version: 'hmac-sha256-mod37', verdict: 'upgraded' },
});

export const REJECTED_STACK = Object.freeze([
  'babylonjs',
  'cannon-es',
  'nextjs',
  'unity-webgl',
  'howler-sprites',
]);

export const DEFERRED_UPGRADES = Object.freeze([
  { id: 'zustand-state', phase: 4, reason: 'Only if WebSocket multi-table requires it' },
]);

export const COMPLETED_UPGRADES = Object.freeze([
  { id: 'typescript-core', phase: 6, reason: 'config, provablyFair, gameEngine migrated to .ts' },
  { id: 'rapier-lazy-load', phase: 6, reason: 'Deferred WASM until T-13 prefetch / lock mount' },
  { id: 'server-authoritative-pf', phase: 4, reason: 'dev authority server + API client' },
  { id: 'typescript-core-expand', phase: 7, reason: 'betGate, fairRoundStore, authorityClient, realtimeHub → .ts' },
  { id: 'pwa-physics-cache', phase: 7, reason: 'manifest + SW rapier cache + install prompt' },
  { id: 'vitals-telemetry', phase: 7, reason: 'profileHarness vitals + optional VITE_TELEMETRY_URL beacon' },
  { id: 'e2e-smoke', phase: 7, reason: 'Playwright mock-clock smoke — bet lock T-20, settle T-0' },
  { id: 'adaptive-dpr-cap', phase: 7, reason: 'mobile + low-tier DPR caps via performanceBudget' },
  { id: 'timer-core-consolidation', phase: 8, reason: 'timer.ts in @core; lib shim + consumers migrated' },
  { id: 'check-ci-e2e', phase: 8, reason: 'check:ci extends check with preview-orchestrated e2e smoke' },
  { id: 'webgl-context-recovery', phase: 8, reason: 'context loss overlay + Canvas remount + rapier cache reset' },
  { id: 'fair-round-idb-history', phase: 8, reason: 'IndexedDB fairRounds store + hydrate on boot + 48-round cap' },
  { id: 'fairness-history-ui', phase: 9, reason: 'FairnessPanel verified history strip from listFairRoundHistory' },
  { id: 'github-actions-ci', phase: 9, reason: '.github/workflows/ci.yml runs npm run check:ci on push/PR' },
  { id: 'orphan-dep-audit', phase: 9, reason: 'depAudit.ts — n8ao src/dist monitor on bundle CI pass' },
  { id: 'performance-guard-ts', phase: 9, reason: 'performanceGuard.ts in @core; lib shim + typed quality tiers' },
  { id: 'fairness-audit-restore', phase: 9, reason: 'restoreStoredFairnessAudit hydrates verified badge after refresh' },
  { id: 'vitest-core-suite', phase: 9, reason: 'vitest minimal suite — provablyFair + betGate (TD-09 partial)' },
  { id: 'vitest-core-expand', phase: 10, reason: 'vitest gameEngine + fairRoundStore — TD-09 resolved' },
  { id: 'vitest-timer-idb', phase: 10, reason: 'vitest timer + fairRoundHistory with fake-indexeddb mock' },
  { id: 'authority-seed-guard', phase: 11, reason: 'authorityGuard.ts prod startup block + devAuthority master-secret guard' },
  { id: 'fairness-custody-badge', phase: 11, reason: 'FairnessPanel seed-custody badge — Authority / Demo / CI' },
  { id: 'vitest-authority-client', phase: 12, reason: 'authorityClient.test.ts — fetch mock + resolver fallbacks' },
  { id: 'vitest-realtime-hub', phase: 12, reason: 'rtProtocol + realtimeHub.test.ts — SSE tick parsing + EventSource mock' },
  { id: 'vitest-feedback-config', phase: 13, reason: 'feedbackConfig.test.ts — prefs localStorage mock + matchMedia guard' },
  { id: 'vitest-performance-budget', phase: 14, reason: 'performanceBudget.test.ts — DPR cap + device profile detection' },
  { id: 'vitest-performance-guard', phase: 14, reason: 'performanceGuard.test.ts — tier downgrade + god-mode FPS watchdog' },
  { id: 'vitest-bundle-budget', phase: 15, reason: 'bundleBudgetCheck.test.ts — gzip measure + budget evaluation' },
  { id: 'vitest-dep-audit', phase: 16, reason: 'depAudit.test.ts — orphan transitive dep src + dist scan' },
  { id: 'vitest-vitals-telemetry', phase: 16, reason: 'vitalsTelemetry.test.ts — telemetry gate + beacon payload' },
  { id: 'vitest-profile-harness', phase: 17, reason: 'profileHarness.test.ts — marks, vitals snapshot, reset' },
  { id: 'vitest-config', phase: 18, reason: 'config.test.ts — APP_CONFIG invariants + wallet/cycle guards' },
  { id: 'vitest-tech-manifest', phase: 19, reason: 'techManifest.test.ts — stack/debt registry integrity guards' },
  { id: 'vitest-core-barrel', phase: 20, reason: 'index.test.ts — public @core barrel export smoke + alignment' },
  { id: 'vitest-lib-math', phase: 21, reason: 'math.test.ts — payout evaluation + hover highlight alignment' },
  { id: 'vitest-lib-highlight', phase: 22, reason: 'highlight.test.ts — pocket/divider hover mapping + board glow helpers' },
  { id: 'vitest-lib-wheel', phase: 23, reason: 'wheel.test.ts — European sequence + pocket angle/index math' },
  { id: 'vitest-lib-bets', phase: 24, reason: 'bets.test.ts — chip placement, stacking caps, settlement' },
  { id: 'vitest-lib-bet-schema', phase: 25, reason: 'betSchema.test.ts — chip whitelist + bet sanitization guards' },
  { id: 'vitest-lib-hover-bridge', phase: 26, reason: 'hoverBridge.test.ts — rAF-batched hover ref/state bridge' },
  { id: 'vitest-lib-integrity-digest', phase: 27, reason: 'integrityDigest.test.ts — salted SHA-256 wallet checksum vectors' },
  { id: 'vitest-lib-state-integrity', phase: 28, reason: 'stateIntegrity.test.ts — wallet tamper guard freeze/revert' },
  { id: 'vitest-lib-secure-storage', phase: 29, reason: 'secureStorage.test.ts — tamper-evident localStorage checksum wrapper' },
  { id: 'vitest-lib-dom-sanitize', phase: 30, reason: 'domSanitize.test.ts — XSS escape + plain-text guard' },
  { id: 'vitest-lib-storage', phase: 31, reason: 'storage.test.ts — balance/bets persistence facade + faucet' },
  { id: 'vitest-lib-game-phase', phase: 32, reason: 'gamePhase.test.ts — cycle-second spin state resolver' },
  { id: 'vitest-lib-cycle-resync', phase: 33, reason: 'cycleResync.test.ts — wall-clock ball kinematic sync' },
  { id: 'vitest-lib-trajectory', phase: 34, reason: 'trajectory.test.ts — orbital spline + descent kinematics' },
  { id: 'vitest-lib-ball-physics', phase: 35, reason: 'ballPhysics.test.ts — rolling handoff + pocket capture' },
  { id: 'vitest-lib-fixed-timestep', phase: 36, reason: 'fixedTimestep.test.ts — fixed-step physics accumulator' },
  { id: 'vitest-lib-physics-watchdog', phase: 37, reason: 'physicsWatchdog.test.ts — OOB recovery + settle watchdog' },
  { id: 'vitest-lib-dispose-utils', phase: 38, reason: 'disposeUtils.test.ts — Three.js GPU resource disposal' },
  { id: 'vitest-lib-webgl-context-recovery', phase: 39, reason: 'webglContextRecovery.test.ts — context loss/restore handlers' },
  { id: 'vitest-lib-frame-buster', phase: 40, reason: 'frameBuster.test.ts — anti-clickjacking frame breakout' },
  { id: 'vitest-lib-haptics', phase: 41, reason: 'haptics.test.ts — vibration patterns + rate limits' },
  { id: 'vitest-lib-feedback-bridge', phase: 42, reason: 'feedbackBridge.test.ts — audio + haptics facade' },
  { id: 'vitest-lib-chip-visual', phase: 43, reason: 'chipVisual.test.ts — chip stack breakdown + overflow' },
  { id: 'vitest-lib-spatial-ux', phase: 44, reason: 'spatialUx.test.ts — chip magnet + cell spotlight DOM helpers' },
  { id: 'vitest-lib-ghost-players', phase: 45, reason: 'ghostPlayers.test.ts — deterministic VIP ghost bets + cycle sync' },
  { id: 'vitest-lib-noise', phase: 46, reason: 'noise.test.ts — simplex3 + operatorBreathing camera displacement' },
  { id: 'vitest-lib-camera-rig', phase: 47, reason: 'cameraRig.test.ts — adaptive look lag + cinematic handheld rig' },
  { id: 'vitest-lib-quantum-trajectory', phase: 48, reason: 'quantumTrajectory.test.ts — probability arc pocket weighting' },
  { id: 'vitest-lib-install-prompt', phase: 49, reason: 'installPrompt.test.ts — PWA beforeinstallprompt bridge' },
  { id: 'vitest-lib-register-service-worker', phase: 50, reason: 'registerServiceWorker.test.ts — physics-cache SW registration' },
  { id: 'vitest-lib-start-vitals-telemetry', phase: 51, reason: 'startVitalsTelemetry.test.ts — production Web Vitals boot hook' },
  { id: 'vitest-lib-camera-director', phase: 52, reason: 'cameraDirector.test.ts — Hollywood camera state machine + EMA look-at' },
  { id: 'vitest-lib-load-rapier', phase: 53, reason: 'loadRapier.test.ts — lazy WASM prefetch + stage loader' },
  { id: 'vitest-lib-audio-synth', phase: 54, reason: 'audioSynth.test.ts — RouletteAudioEngine Web Audio graph' },
  { id: 'vitest-lib-shims', phase: 55, reason: 'libShims.test.ts — timer + performanceGuard legacy re-export parity' },
  { id: 'vitest-scene-materials', phase: 56, reason: 'materials.test.ts — VIP casino PBR presets + kinematic helpers' },
  { id: 'vitest-scene-ivory-sss', phase: 57, reason: 'createIvorySSSMaterial.test.ts — ivory subsurface scatter material factory' },
  { id: 'vitest-shaders-plasma-ribbon', phase: 58, reason: 'plasmaRibbon.test.ts — quantum arc GLSL uniforms + shader strings' },
  { id: 'vitest-shaders-god-rays', phase: 59, reason: 'godRays.test.ts — volumetric god-ray GLSL + mode factory' },
  { id: 'vitest-core-coverage-gate', phase: 60, reason: 'vitestCoverage.test.ts — lib/scene/shaders test-file parity gate' },
  { id: 'vitest-hooks-live-clock', phase: 61, reason: 'useLiveClock.test.ts — live phase clock hook with timer mocks' },
  { id: 'vitest-hooks-webgl-recovery', phase: 62, reason: 'useWebGLRecovery.test.ts — WebGL context loss/restore canvas remount hook' },
  { id: 'vitest-core-coverage-hooks', phase: 63, reason: 'vitestCoverage.ts — hooks/ directory added to parity gate' },
  { id: 'vitest-verify-coverage-audit', phase: 64, reason: 'verify.js — runtime auditVitestCoverage CI gate (42 modules)' },
  { id: 'vitest-core-coverage-core', phase: 65, reason: 'vitestCoverage.ts — core/ directory added to parity gate (62 modules)' },
  { id: 'vitest-core-coverage-module-count', phase: 66, reason: 'vitestCoverage.ts — VITEST_COVERAGE_MODULE_COUNT export; verify deduped' },
  { id: 'vitest-verify-trim-exists-sync', phase: 67, reason: 'verify.js — dropped 60 per-module existsSync; auditVitestCoverage is sole parity gate' },
  { id: 'vitest-verify-trim-manifest', phase: 68, reason: 'verify.js — dropped per-id vitest manifest asserts; auditVitestUpgradeLog is sole gate' },
  { id: 'vitest-core-upgrade-count', phase: 69, reason: 'techManifest.js — VITEST_COMPLETED_UPGRADE_COUNT export; verify deduped' },
  { id: 'vitest-verify-merge-manifest-import', phase: 70, reason: 'verify.js — single techManifest.js dynamic import for debt + vitest audits' },
  { id: 'vitest-verify-hoist-audit-imports', phase: 71, reason: 'verify.js — techManifest + vitestCoverage audit imports hoisted to top-level' },
  { id: 'vitest-verify-audit-runner', phase: 72, reason: 'vitestCoverage.ts — runVitestVerifyAudits() collapses verify runtime checks' },
  { id: 'vitest-jsx-surface-probe', phase: 73, reason: 'vitestCoverage.ts — auditJsxSurface inventory probe for src/ui/*.jsx' },
  { id: 'vitest-jsx-scene-probe', phase: 74, reason: 'vitestCoverage.ts — JSX_SCENE_SURFACE_MODULE_COUNT for src/scene/*.jsx' },
  { id: 'vitest-jsx-context-probe', phase: 75, reason: 'vitestCoverage.ts — JSX_CONTEXT_SURFACE_MODULE_COUNT for src/context/*.jsx' },
  { id: 'vitest-jsx-entry-probe', phase: 76, reason: 'vitestCoverage.ts — JSX_ENTRY_SURFACE_MODULE_COUNT for src/App.jsx + main.jsx' },
  { id: 'vitest-jsx-surface-complete', phase: 77, reason: 'vitestCoverage.ts — auditJsxSurfaceComplete closure vs all src/**/*.jsx' },
  { id: 'vitest-jsx-ui-test-parity-scaffold', phase: 78, reason: 'vitestCoverage.ts — findJsxModulesMissingTests + moduleTestPath for ui/*.jsx' },
  { id: 'vitest-jsx-ui-icons-test', phase: 79, reason: 'ui/icons.test.tsx — first ui jsx parity smoke test (1/6 covered)' },
  { id: 'vitest-jsx-ui-payout-toast-test', phase: 80, reason: 'ui/PayoutToast.test.tsx — ui jsx parity smoke test (2/6 covered)' },
  { id: 'vitest-jsx-ui-install-prompt-test', phase: 81, reason: 'ui/InstallPrompt.test.tsx — ui jsx parity smoke test (3/6 covered)' },
  { id: 'vitest-jsx-ui-ghost-bet-layer-test', phase: 82, reason: 'ui/GhostBetLayer.test.tsx — ui jsx parity smoke test (4/6 covered)' },
  { id: 'vitest-jsx-ui-fairness-panel-test', phase: 83, reason: 'ui/FairnessPanel.test.tsx — ui jsx parity smoke test (5/6 covered)' },
  { id: 'vitest-jsx-ui-betting-board-test', phase: 84, reason: 'ui/BettingBoard.test.tsx — ui jsx parity complete; auditJsxUiTestParity in main ok gate' },
  { id: 'vitest-jsx-scene-test-parity-scaffold', phase: 85, reason: 'vitestCoverage.ts — findJsxSceneModulesMissingTests + auditJsxSceneTestParity for scene/*.jsx' },
  { id: 'vitest-jsx-scene-game-scene-test', phase: 86, reason: 'scene/GameScene.test.tsx — first scene jsx parity smoke test (1/21 covered)' },
  { id: 'vitest-jsx-scene-european-wheel-test', phase: 87, reason: 'scene/EuropeanWheel.test.tsx — scene jsx parity smoke test (2/21 covered)' },
  { id: 'vitest-jsx-scene-rapier-stage-test', phase: 88, reason: 'scene/RapierStage.test.tsx — scene jsx parity smoke test (3/21 covered)' },
  { id: 'vitest-jsx-scene-roulette-ball-test', phase: 89, reason: 'scene/RouletteBall.test.tsx — scene jsx parity smoke test (4/21 covered)' },
  { id: 'vitest-jsx-scene-ball-friction-vapor-test', phase: 90, reason: 'scene/BallFrictionVapor.test.tsx — scene jsx parity smoke test (5/21 covered)' },
  { id: 'vitest-jsx-scene-cinematic-camera-test', phase: 91, reason: 'scene/CinematicCamera.test.tsx — scene jsx parity smoke test (6/21 covered)' },
  { id: 'vitest-jsx-scene-european-wheel-visual-test', phase: 92, reason: 'scene/EuropeanWheelVisual.test.tsx — scene jsx parity smoke test (7/21 covered)' },
  { id: 'vitest-jsx-scene-felt-table-test', phase: 93, reason: 'scene/FeltTable.test.tsx — scene jsx parity smoke test (8/21 covered)' },
  { id: 'vitest-jsx-scene-floating-win-text-test', phase: 94, reason: 'scene/FloatingWinText.test.tsx — scene jsx parity smoke test (9/21 covered)' },
  { id: 'vitest-jsx-scene-lounge-dust-test', phase: 95, reason: 'scene/LoungeDust.test.tsx — scene jsx parity smoke test (10/21 covered)' },
  { id: 'vitest-jsx-scene-material-library-test', phase: 96, reason: 'scene/MaterialLibrary.test.tsx — scene jsx parity smoke test (11/21 covered)' },
  { id: 'vitest-jsx-scene-performance-monitor-test', phase: 97, reason: 'scene/PerformanceMonitor.test.tsx — scene jsx parity smoke test (12/21 covered)' },
  { id: 'vitest-jsx-scene-quantum-probability-arc-test', phase: 98, reason: 'scene/QuantumProbabilityArc.test.tsx — scene jsx parity smoke test (13/21 covered)' },
  { id: 'vitest-jsx-scene-rim-streaks-test', phase: 99, reason: 'scene/RimStreaks.test.tsx — scene jsx parity smoke test (14/21 covered)' },
  { id: 'vitest-jsx-scene-spark-burst-test', phase: 100, reason: 'scene/SparkBurst.test.tsx — scene jsx parity smoke test (15/21 covered)' },
  { id: 'vitest-jsx-scene-vip-lighting-test', phase: 101, reason: 'scene/VIPLighting.test.tsx — scene jsx parity smoke test (16/21 covered)' },
  { id: 'vitest-jsx-scene-vip-post-fx-test', phase: 102, reason: 'scene/VIPPostFX.test.tsx — scene jsx parity smoke test (17/21 covered)' },
  { id: 'vitest-jsx-scene-volumetric-god-rays-test', phase: 103, reason: 'scene/VolumetricGodRays.test.tsx — scene jsx parity smoke test (18/21 covered)' },
  { id: 'vitest-jsx-scene-wheel-instanced-test', phase: 104, reason: 'scene/WheelInstanced.test.tsx — scene jsx parity smoke test (19/21 covered)' },
  { id: 'vitest-jsx-scene-wheel-sector-neon-test', phase: 105, reason: 'scene/WheelSectorNeon.test.tsx — scene jsx parity smoke test (20/21 covered)' },
  { id: 'vitest-jsx-scene-win-particles-test', phase: 106, reason: 'scene/WinParticles.test.tsx — scene jsx parity closure (21/21 covered); jsxSceneTestParity.ok in main gate' },
  { id: 'vitest-jsx-context-game-context-test', phase: 107, reason: 'context/GameContext.test.tsx — context jsx parity closure (1/1 covered); jsxContextTestParity.ok in main gate' },
  { id: 'vitest-jsx-entry-app-test', phase: 108, reason: 'App.test.tsx — entry jsx parity smoke test (1/2 covered)' },
  { id: 'vitest-jsx-entry-main-test', phase: 109, reason: 'main.test.tsx — entry jsx parity closure (2/2 covered); jsxEntryTestParity.ok in main gate' },
  { id: 'vitest-jsx-surface-test-parity', phase: 110, reason: 'auditJsxSurfaceTestParity — combined 30/30 jsx test parity closure; jsxSurfaceTestParity.ok in main gate' },
  { id: 'vitest-jsx-surface-test-parity-complete', phase: 111, reason: 'JSX_SURFACE_TEST_PARITY_COMPLETE milestone constant; wired into runVitestVerifyAudits.ok' },
  { id: 'vitest-full-surface-test-parity-complete', phase: 112, reason: 'FULL_SURFACE_TEST_PARITY_COMPLETE milestone (62 JS + 30 JSX); consolidated runVitestVerifyAudits.ok gate' },
  { id: 'vitest-js-test-parity-complete', phase: 113, reason: 'JS_TEST_PARITY_COMPLETE standalone verify + vitest guards (62/62 JS milestone visibility)' },
]);

/** Completed upgrades whose id starts with `vitest-`. */
export const VITEST_COMPLETED_UPGRADES = Object.freeze(
  COMPLETED_UPGRADES.filter((item) => item.id.startsWith('vitest-')),
);

/** Canonical vitest milestone count (avoids magic numbers in verify/tests). */
export const VITEST_COMPLETED_UPGRADE_COUNT = VITEST_COMPLETED_UPGRADES.length;

/** Audit vitest milestone registry — unique ids with at least one entry. */
export function auditVitestUpgradeLog() {
  const ids = VITEST_COMPLETED_UPGRADES.map((item) => item.id);
  const unique = new Set(ids);
  return {
    ok: ids.length > 0 && unique.size === ids.length,
    count: ids.length,
    ids,
  };
}

/** Closed tech-debt items — do not re-open without new audit. */
export const RESOLVED_TECH_DEBT = Object.freeze([
  {
    id: 'TD-02',
    severity: 'medium',
    phase: 3,
    topic: 'emoji audio icons',
    resolution: 'src/ui/icons.jsx — IconVolumeOn / IconVolumeOff in App.jsx',
  },
  {
    id: 'TD-03',
    severity: 'medium',
    phase: 3,
    topic: 'fairness HUD panel',
    resolution: 'FairnessPanel.jsx — live commit hash + T-0 reveal audit',
  },
  {
    id: 'TD-04',
    severity: 'low',
    phase: 6,
    topic: 'resolveHudPhase duplicate in Context',
    resolution: 'resolveHudPhaseFromClock imported from @core/gameEngine only',
  },
  {
    id: 'TD-06',
    severity: 'low',
    phase: 6,
    topic: 'rapier chunk eager load',
    resolution: 'loadRapier.js prefetch + RapierStage async chunk + EuropeanWheelVisual idle',
  },
  {
    id: 'TD-05',
    severity: 'low',
    phase: 8,
    topic: 'lib/ vs core/ timer phase overlap',
    resolution: 'timer.ts in @core; gameEngine imports ./timer; lib shim for legacy',
  },
  {
    id: 'TD-07',
    severity: 'low',
    phase: 9,
    topic: 'orphan n8ao transitive dep',
    resolution: 'depAudit.ts monitors src/dist; n8ao tree-shaken from postfx chunk',
  },
  {
    id: 'TD-09',
    severity: 'low',
    phase: 10,
    topic: 'no jest/vitest unit suite for core/',
    resolution: 'vitest run — provablyFair, betGate, gameEngine, fairRoundStore.test.ts',
  },
]);

/** Mitigated — acceptable for demo; production path documented. */
export const MITIGATED_TECH_DEBT = Object.freeze([
  {
    id: 'TD-01',
    severity: 'high',
    phase: 4,
    topic: 'client-side server seed (demo mode)',
    mitigation: 'authorityClient + devAuthority.mjs when VITE_API_BASE set; local fallback otherwise',
  },
  {
    id: 'TD-08',
    severity: 'medium',
    phase: 4,
    topic: 'no authoritative cycle broadcast',
    mitigation: 'realtimeHub.js SSE /api/v1/cycle/stream with wall-clock fallback',
  },
]);

/** Open items — next architect cycles. */
export const TECH_DEBT = Object.freeze([]);

export function assertStackIntegrity() {
  const kept = Object.values(STACK).filter((s) => s.verdict === 'keep' || s.verdict === 'upgraded');
  if (kept.length < 7) throw new Error('stack manifest incomplete');
  return true;
}

/** @param {readonly { id: string }[]} list */
function debtIds(list) {
  return new Set(list.map((d) => d.id));
}

export function assertDebtRegistryIntegrity() {
  const open = debtIds(TECH_DEBT);
  const resolved = debtIds(RESOLVED_TECH_DEBT);
  const mitigated = debtIds(MITIGATED_TECH_DEBT);
  for (const id of open) {
    if (resolved.has(id) || mitigated.has(id)) {
      throw new Error(`tech debt id collision: ${id}`);
    }
  }
  return true;
}

assertStackIntegrity();
assertDebtRegistryIntegrity();

console.assert(RESOLVED_TECH_DEBT.some((d) => d.id === 'TD-02'), 'TD-02 resolved');
console.assert(RESOLVED_TECH_DEBT.some((d) => d.id === 'TD-03'), 'TD-03 resolved');
console.assert(!TECH_DEBT.some((d) => d.id === 'TD-02'), 'TD-02 not open');
console.assert(!TECH_DEBT.some((d) => d.id === 'TD-03'), 'TD-03 not open');

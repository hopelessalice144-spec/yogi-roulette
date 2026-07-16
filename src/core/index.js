/**
 * Core engine barrel — import via @core
 */
export { APP_CONFIG, default as config } from './config.js';
export {
  commitServerSeed,
  deriveWinningNumber,
  verifyRound,
  generateServerSeed,
  normalizeClientSeed,
  buildFairnessAudit,
} from './provablyFair.js';
export {
  PHASE,
  createGameClock,
  bettingLockTimestampMs,
  canPlaceBet,
  resolveCycleOutcome,
  resolveHudPhaseFromClock,
  secondsUntilSpin,
} from './gameEngine.js';
export {
  bettingLockMs,
  isBettingOpen,
  betRejectionReason,
  createBetMutex,
} from './betGate.js';
export {
  loadClientSeed,
  saveClientSeed,
  ensureRound,
  publicRoundCommit,
  outcomeForCycle,
  fairContextForCycle,
  revealRound,
  clearFairRounds,
  hydrateFairRoundsFromStorage,
  listFairRoundHistory,
  restoreStoredFairnessAudit,
} from './fairRoundStore.js';
export {
  CYCLE_SECONDS,
  PHASES,
  BALL_DROP_AT,
  BALL_PHYSICS_AT,
  BALL_MAGNET_AT,
  BALL_SETTLE_AT,
  getCycleSecond,
  getSecondsRemaining,
  getPhase,
  getCycleId,
  getSecondsToBallDrop,
} from './timer.js';
export { RT_EVENTS, SYNC_MODES, parseCycleTick } from './rtProtocol.js';
export {
  FEEDBACK_CONFIG,
  loadFeedbackPrefs,
  saveFeedbackPrefs,
  prefersReducedFeedback,
} from './feedbackConfig.js';
export {
  TECH_MANIFEST_VERSION,
  STACK,
  REJECTED_STACK,
  DEFERRED_UPGRADES,
  COMPLETED_UPGRADES,
  RESOLVED_TECH_DEBT,
  MITIGATED_TECH_DEBT,
  TECH_DEBT,
} from './techManifest.js';
export {
  FPS_BUDGET,
  BUNDLE_BUDGET_KB,
  RENDER_BUDGET,
  fpsTier,
  detectDeviceProfile,
  resolveDprCap,
  applyRenderBudget,
} from './performanceBudget.js';
export {
  QUALITY_TIERS,
  resolveGodModeSettings,
  createPerformanceGuard,
} from './performanceGuard.js';
export {
  auditSeedCustody,
  assertProductionSeedCustody,
  resolveSeedCustodyBadge,
  runStartupAuthorityGuard,
} from './authorityGuard.js';
/** Type-only symbols — import from `@core/types.js` in TypeScript sources. */

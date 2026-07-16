import { describe, expect, it } from 'vitest';
import * as core from './index.js';
import { APP_CONFIG } from './index.js';

describe('@core barrel (index)', () => {
  it('re-exports config under APP_CONFIG and default alias', () => {
    expect(core.APP_CONFIG).toBe(APP_CONFIG);
    expect(core.config).toBe(APP_CONFIG);
    expect(core.APP_CONFIG.variant).toBe('european');
  });

  it('re-exports provably-fair primitives', () => {
    expect(typeof core.commitServerSeed).toBe('function');
    expect(typeof core.deriveWinningNumber).toBe('function');
    expect(typeof core.verifyRound).toBe('function');
    expect(typeof core.generateServerSeed).toBe('function');
    expect(typeof core.normalizeClientSeed).toBe('function');
    expect(typeof core.buildFairnessAudit).toBe('function');
  });

  it('re-exports game engine clock and phase helpers', () => {
    expect(core.PHASE).toBeDefined();
    expect(typeof core.createGameClock).toBe('function');
    expect(typeof core.canPlaceBet).toBe('function');
    expect(typeof core.resolveCycleOutcome).toBe('function');
    expect(typeof core.resolveHudPhaseFromClock).toBe('function');
    expect(typeof core.bettingLockTimestampMs).toBe('function');
    expect(typeof core.secondsUntilSpin).toBe('function');
  });

  it('re-exports atomic bet gate surface', () => {
    expect(typeof core.bettingLockMs).toBe('function');
    expect(typeof core.isBettingOpen).toBe('function');
    expect(typeof core.betRejectionReason).toBe('function');
    expect(typeof core.createBetMutex).toBe('function');
  });

  it('re-exports fair round store lifecycle', () => {
    expect(typeof core.loadClientSeed).toBe('function');
    expect(typeof core.saveClientSeed).toBe('function');
    expect(typeof core.ensureRound).toBe('function');
    expect(typeof core.publicRoundCommit).toBe('function');
    expect(typeof core.revealRound).toBe('function');
    expect(typeof core.listFairRoundHistory).toBe('function');
    expect(typeof core.restoreStoredFairnessAudit).toBe('function');
  });

  it('re-exports timer constants aligned with APP_CONFIG cycle', () => {
    expect(core.CYCLE_SECONDS).toBe(APP_CONFIG.cycle.seconds);
    expect(core.PHASES).toBeDefined();
    expect(core.BALL_DROP_AT).toBeLessThan(core.BALL_SETTLE_AT);
    expect(typeof core.getCycleSecond).toBe('function');
    expect(typeof core.getPhase).toBe('function');
  });

  it('re-exports realtime protocol helpers', () => {
    expect(core.RT_EVENTS).toBeDefined();
    expect(core.SYNC_MODES).toBeDefined();
    expect(typeof core.parseCycleTick).toBe('function');
  });

  it('re-exports feedback, performance, and authority modules', () => {
    expect(core.FEEDBACK_CONFIG).toBeDefined();
    expect(typeof core.loadFeedbackPrefs).toBe('function');
    expect(core.FPS_BUDGET).toBeDefined();
    expect(core.BUNDLE_BUDGET_KB).toBeDefined();
    expect(core.QUALITY_TIERS).toBeDefined();
    expect(typeof core.createPerformanceGuard).toBe('function');
    expect(typeof core.resolveSeedCustodyBadge).toBe('function');
    expect(typeof core.runStartupAuthorityGuard).toBe('function');
  });

  it('re-exports tech manifest registers', () => {
    expect(core.TECH_MANIFEST_VERSION).toMatch(/^3\.0\.0-phase\d+$/);
    expect(core.STACK).toBeDefined();
    expect(core.REJECTED_STACK.length).toBeGreaterThan(0);
    expect(core.COMPLETED_UPGRADES.length).toBeGreaterThan(0);
    expect(core.TECH_DEBT).toHaveLength(0);
  });

  it('wires provably-fair through the barrel', () => {
    const seed = 'b'.repeat(32);
    const hash = core.commitServerSeed(seed);
    const n = core.deriveWinningNumber(seed, 'guest', 7);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThan(37);
    expect(core.verifyRound(seed, hash, 'guest', 7, n)).toBe(true);
  });
});

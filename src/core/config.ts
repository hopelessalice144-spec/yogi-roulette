/**
 * Central application configuration — single source of truth for tunables.
 */

export const APP_CONFIG = Object.freeze({
  name: 'Yogi Roulette',
  version: '3.0.0',
  variant: 'european' as const,
  pockets: 37,

  cycle: Object.freeze({
    seconds: 30,
    bettingEnd: 20,
    lockEnd: 25,
    spinEnd: 30,
  }),

  physics: Object.freeze({
    targetFps: 60,
    fixedTimestep: 1 / 60,
    maxSubSteps: 4,
  }),

  wallet: Object.freeze({
    faucetAmount: 1_000,
    maxBalance: 1_000_000,
    maxBetPerCell: 50_000,
    maxTotalStaked: 200_000,
  }),

  provablyFair: Object.freeze({
    enabled: true,
    algorithm: 'hmac-sha256-mod37',
    digestPrefixHexChars: 8,
  }),

  performance: Object.freeze({
    lowFpsThreshold: 45,
    pausePhysicsBelowFps: 30,
  }),

  hud: Object.freeze({
    spinFocusScale: 0.95,
    spinFocusOpacity: 0.15,
    touchTargetPx: 44,
  }),
});

export default APP_CONFIG;

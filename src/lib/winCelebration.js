/**
 * Win celebration tiers — shake impulse, particle scale, toast styling by net P/L.
 */

export const WIN_TIER_ORDER = Object.freeze([
  'small',
  'medium',
  'big',
  'mega',
  'legendary',
]);

export const WIN_TIERS = Object.freeze({
  none: Object.freeze({
    id: 'none',
    minNet: 0,
    label: '',
    shakeImpulse: 0,
    particleScale: 0,
    sparkPower: 1,
    toastClass: '',
    flashMs: 0,
    textColor: '#ffd700',
  }),
  small: Object.freeze({
    id: 'small',
    minNet: 1,
    label: 'WIN',
    shakeImpulse: 0.48,
    particleScale: 0.7,
    sparkPower: 1.1,
    toastClass: '',
    flashMs: 280,
    textColor: '#ffd700',
  }),
  medium: Object.freeze({
    id: 'medium',
    minNet: 75,
    label: 'NICE WIN',
    shakeImpulse: 0.68,
    particleScale: 1,
    sparkPower: 1.25,
    toastClass: 'payout-toast-medium',
    flashMs: 360,
    textColor: '#ffe566',
  }),
  big: Object.freeze({
    id: 'big',
    minNet: 250,
    label: 'BIG WIN',
    shakeImpulse: 0.92,
    particleScale: 1.35,
    sparkPower: 1.45,
    toastClass: 'payout-toast-big',
    flashMs: 480,
    textColor: '#fff4b0',
  }),
  mega: Object.freeze({
    id: 'mega',
    minNet: 600,
    label: 'JACKPOT',
    shakeImpulse: 1.18,
    particleScale: 1.75,
    sparkPower: 1.7,
    toastClass: 'payout-toast-jackpot',
    flashMs: 620,
    textColor: '#fff9d6',
  }),
  legendary: Object.freeze({
    id: 'legendary',
    minNet: 2000,
    label: 'LEGENDARY',
    shakeImpulse: 1.45,
    particleScale: 2.2,
    sparkPower: 2,
    toastClass: 'payout-toast-legendary',
    flashMs: 820,
    textColor: '#ffffff',
  }),
});

/** Resolve celebration tier from net session win on a round. */
export function winCelebrationTier(netWin) {
  if (!Number.isFinite(netWin) || netWin <= 0) return WIN_TIERS.none;
  let tier = WIN_TIERS.small;
  for (const id of WIN_TIER_ORDER) {
    const candidate = WIN_TIERS[id];
    if (netWin >= candidate.minNet) tier = candidate;
  }
  return tier;
}

/** Particle count cap for a tier scale multiplier. */
export function celebrationParticleCount(baseCount, tierScale) {
  const scale = Math.max(0, tierScale);
  return Math.min(260, Math.max(24, Math.round(baseCount * scale)));
}

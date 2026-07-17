import { FAUCET_TRIGGER_BALANCE } from './storage.js';

/** Subtle refill-button pulse when free faucet is available. */
export function shouldFaucetReadyGlow(balance, { securityFrozen = false } = {}) {
  if (securityFrozen) return false;
  return Math.floor(Number(balance) || 0) <= FAUCET_TRIGGER_BALANCE;
}

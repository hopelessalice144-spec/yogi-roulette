import { describe, expect, it, vi } from 'vitest';
import { StateIntegrityGuard } from './stateIntegrity.js';

describe('StateIntegrityGuard', () => {
  it('starts unfrozen with zero trusted stake', () => {
    const guard = new StateIntegrityGuard();
    expect(guard.isFrozen()).toBe(false);
    expect(guard.getTrustedStake()).toBe(0);
  });

  it('signWallet sanitizes balance and bets', () => {
    const guard = new StateIntegrityGuard();
    const signed = guard.signWallet(1000, [{ type: 'red', amount: 25 }]);
    expect(signed.balance).toBe(1000);
    expect(signed.bets).toEqual([{ type: 'red', amount: 25 }]);
  });

  it('verifyWallet passes when balance and bets match signature', () => {
    const guard = new StateIntegrityGuard();
    const bets = [{ type: 'red', amount: 25 }];
    guard.signWallet(1000, bets);
    const result = guard.verifyWallet(1000, bets);
    expect(result.ok).toBe(true);
    expect(result.frozen).toBe(false);
    expect(result.balance).toBe(1000);
    expect(result.bets).toEqual(bets);
  });

  it('detects balance tampering, freezes, and reverts to trusted snapshot', () => {
    const guard = new StateIntegrityGuard();
    const bets = [{ type: 'red', amount: 25 }];
    guard.signWallet(1000, bets);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = guard.verifyWallet(999999, bets);
    expect(result.ok).toBe(false);
    expect(result.frozen).toBe(true);
    expect(result.balance).toBe(1000);
    expect(result.bets).toEqual(bets);
    expect(guard.isFrozen()).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      '[SEC] State integrity violation — wallet memory tamper detected',
    );
    errorSpy.mockRestore();
  });

  it('detects bet tampering and keeps signed stake', () => {
    const guard = new StateIntegrityGuard();
    const bets = [{ type: 'red', amount: 25 }];
    guard.signWallet(1000, bets);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = guard.verifyWallet(1000, [{ type: 'red', amount: 100 }]);
    expect(result.ok).toBe(false);
    expect(result.frozen).toBe(true);
    expect(result.bets).toEqual(bets);
    expect(guard.getTrustedStake()).toBe(25);
    vi.restoreAllMocks();
  });

  it('returns frozen snapshot on subsequent verify calls', () => {
    const guard = new StateIntegrityGuard();
    const bets = [{ type: 'red', amount: 25 }];
    guard.signWallet(1000, bets);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    guard.verifyWallet(999999, bets);
    const second = guard.verifyWallet(1000, bets);
    expect(second.ok).toBe(false);
    expect(second.frozen).toBe(true);
    expect(second.balance).toBe(1000);
    vi.restoreAllMocks();
  });

  it('signWallet clears freeze and re-signs trusted state', () => {
    const guard = new StateIntegrityGuard();
    guard.signWallet(1000, []);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    guard.verifyWallet(500, []);
    expect(guard.isFrozen()).toBe(true);
    const bets = [{ type: 'straight', value: 7, amount: 5 }];
    guard.signWallet(800, bets);
    expect(guard.isFrozen()).toBe(false);
    const ok = guard.verifyWallet(800, bets);
    expect(ok.ok).toBe(true);
    expect(guard.getTrustedStake()).toBe(5);
    vi.restoreAllMocks();
  });

  it('clamps balance during sign and verify', () => {
    const guard = new StateIntegrityGuard();
    const signed = guard.signWallet(9e15, []);
    expect(signed.balance).toBe(1_000_000);
    const ok = guard.verifyWallet(9e15, []);
    expect(ok.ok).toBe(true);
    expect(ok.balance).toBe(1_000_000);
  });
});

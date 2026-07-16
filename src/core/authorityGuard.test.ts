import { describe, expect, it } from 'vitest';
import {
  assertProductionSeedCustody,
  auditSeedCustody,
  runStartupAuthorityGuard,
  resolveSeedCustodyBadge,
} from './authorityGuard.js';

describe('authorityGuard', () => {
  it('allows demo-local custody in development', () => {
    const audit = auditSeedCustody({ PROD: false, DEV: true });
    expect(audit.mode).toBe('demo-local');
    expect(audit.safe).toBe(true);
    expect(audit.authorityEnabled).toBe(false);
    expect(audit.warnings[0]).toContain('Demo mode');
  });

  it('blocks demo-local custody in production', () => {
    const audit = auditSeedCustody({ PROD: true });
    expect(audit.mode).toBe('demo-local');
    expect(audit.safe).toBe(false);
    expect(audit.custody).toContain('BLOCKED');
  });

  it('marks authoritative custody when API base is set', () => {
    const audit = auditSeedCustody({
      PROD: true,
      VITE_API_BASE: 'https://api.example.com/',
    });
    expect(audit.mode).toBe('authoritative');
    expect(audit.safe).toBe(true);
    expect(audit.apiBase).toBe('https://api.example.com');
    expect(audit.warnings).toHaveLength(0);
  });

  it('throws assertProductionSeedCustody in insecure production', () => {
    expect(() => assertProductionSeedCustody({ PROD: true })).toThrow(/VITE_API_BASE/);
  });

  it('passes assertProductionSeedCustody with API base', () => {
    expect(() =>
      assertProductionSeedCustody({ PROD: true, VITE_API_BASE: 'http://127.0.0.1:8787' })
    ).not.toThrow();
  });

  it('runStartupAuthorityGuard returns audit in safe environments', () => {
    const audit = runStartupAuthorityGuard({ PROD: false, DEV: true });
    expect(audit.safe).toBe(true);
  });

  it('allows explicit demo custody in production when opted in', () => {
    const audit = auditSeedCustody({ PROD: true, VITE_ALLOW_DEMO_CUSTODY: '1' });
    expect(audit.safe).toBe(true);
    expect(audit.custody).toContain('production demo build');
    expect(() => runStartupAuthorityGuard({ PROD: true, VITE_ALLOW_DEMO_CUSTODY: '1' })).not.toThrow();
  });

  it('allows CI e2e bypass in production-like builds', () => {
    const audit = auditSeedCustody({ PROD: true, VITE_SEED_CUSTODY_BYPASS: 'ci-e2e' });
    expect(audit.safe).toBe(true);
    expect(audit.ciBypass).toBe(true);
    expect(audit.warnings.some((w) => w.includes('CI e2e bypass'))).toBe(true);
    expect(() => runStartupAuthorityGuard({ PROD: true, VITE_SEED_CUSTODY_BYPASS: 'ci-e2e' })).not.toThrow();
  });

  describe('resolveSeedCustodyBadge', () => {
    it('returns Authority for API-backed custody', () => {
      const audit = auditSeedCustody({ PROD: true, VITE_API_BASE: 'https://api.example.com' });
      const badge = resolveSeedCustodyBadge(audit);
      expect(badge.badge).toBe('authoritative');
      expect(badge.label).toBe('Authority');
    });

    it('returns Demo for development local seeds', () => {
      const badge = resolveSeedCustodyBadge(auditSeedCustody({ PROD: false }));
      expect(badge.badge).toBe('demo');
      expect(badge.label).toBe('Demo');
    });

    it('returns CI for e2e bypass builds', () => {
      const badge = resolveSeedCustodyBadge(
        auditSeedCustody({ PROD: true, VITE_SEED_CUSTODY_BYPASS: 'ci-e2e' })
      );
      expect(badge.badge).toBe('ci');
      expect(badge.label).toBe('CI');
    });
  });
});

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  COMPLETED_UPGRADES,
  DEFERRED_UPGRADES,
  MITIGATED_TECH_DEBT,
  REJECTED_STACK,
  RESOLVED_TECH_DEBT,
  STACK,
  TECH_DEBT,
  TECH_MANIFEST_VERSION,
  VITEST_COMPLETED_UPGRADES,
  VITEST_COMPLETED_UPGRADE_COUNT,
  assertDebtRegistryIntegrity,
  assertStackIntegrity,
  auditVitestUpgradeLog,
} from './techManifest.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function uniqueIds(list: readonly { id: string }[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const item of list) {
    if (seen.has(item.id)) dupes.push(item.id);
    seen.add(item.id);
  }
  return dupes;
}

describe('techManifest', () => {
  it('exports a phase-tagged manifest version', () => {
    expect(TECH_MANIFEST_VERSION).toMatch(/^3\.0\.0-phase\d+$/);
  });

  describe('STACK', () => {
    it('passes stack integrity guard', () => {
      expect(assertStackIntegrity()).toBe(true);
    });

    it('keeps core runtime choices on keep or upgraded verdicts', () => {
      expect(STACK.build.name).toBe('vite');
      expect(STACK.ui.name).toBe('react');
      expect(STACK.renderer.name).toBe('three');
      expect(STACK.physics.name).toBe('@react-three/rapier');
      expect(STACK.rng.verdict).toBe('upgraded');
      for (const entry of Object.values(STACK)) {
        expect(['keep', 'upgraded']).toContain(entry.verdict);
      }
    });
  });

  describe('REJECTED_STACK', () => {
    it('lists rejected alternatives without overlapping current stack names', () => {
      const active = new Set(Object.values(STACK).map((entry) => entry.name.toLowerCase()));
      for (const rejected of REJECTED_STACK) {
        expect(rejected.length).toBeGreaterThan(0);
        expect(active.has(rejected.toLowerCase())).toBe(false);
      }
    });
  });

  describe('COMPLETED_UPGRADES', () => {
    it('uses unique upgrade ids', () => {
      expect(uniqueIds(COMPLETED_UPGRADES)).toEqual([]);
    });

    it('tracks recent vitest and authority milestones', () => {
      const ids = new Set(COMPLETED_UPGRADES.map((item) => item.id));
      expect(ids.has('vitest-config')).toBe(true);
      expect(ids.has('authority-seed-guard')).toBe(true);
      expect(ids.has('orphan-dep-audit')).toBe(true);
    });
  });

  describe('VITEST_COMPLETED_UPGRADES', () => {
    it('passes vitest upgrade log audit with unique vitest-* ids', () => {
      const report = auditVitestUpgradeLog();
      expect(report.ok).toBe(true);
      expect(report.count).toBe(VITEST_COMPLETED_UPGRADES.length);
      expect(report.count).toBe(VITEST_COMPLETED_UPGRADE_COUNT);
      expect(report.ids.every((id) => id.startsWith('vitest-'))).toBe(true);
      expect(report.ids).toContain('vitest-core-suite');
      expect(report.ids).toContain('vitest-verify-trim-manifest');
    });

    it('exports a canonical upgrade count matching the vitest log', () => {
      expect(VITEST_COMPLETED_UPGRADE_COUNT).toBeGreaterThan(0);
      expect(auditVitestUpgradeLog().count).toBe(VITEST_COMPLETED_UPGRADE_COUNT);
    });

    it('verify.js uses a single techManifest.js dynamic import', () => {
      const verifySrc = fs.readFileSync(path.join(REPO_ROOT, 'verify.js'), 'utf8');
      const preVitest = verifySrc.slice(0, verifySrc.indexOf('=== Architect Phase 9: vitest core unit suite'));
      const imports =
        preVitest.match(/await import\('\.\/src\/core\/techManifest\.js'\)/g) ?? [];
      expect(imports).toHaveLength(1);
    });

    it('verify.js hoists vitest audit imports before phase checks', () => {
      const verifySrc = fs.readFileSync(path.join(REPO_ROOT, 'verify.js'), 'utf8');
      const phase2Idx = verifySrc.indexOf("console.log('=== Phase 2:");
      expect(phase2Idx).toBeGreaterThan(0);
      const preamble = verifySrc.slice(0, phase2Idx);
      expect(preamble).toContain('runVitestVerifyAudits');
      const preVitest = verifySrc.slice(0, verifySrc.indexOf('=== Architect Phase 9: vitest core unit suite'));
      expect(preVitest.match(/await import\('\.\/src\/core\/vitestCoverage\.ts'\)/g)).toHaveLength(1);
    });
  });

  describe('DEFERRED_UPGRADES', () => {
    it('does not collide with completed upgrade ids', () => {
      const completed = new Set(COMPLETED_UPGRADES.map((item) => item.id));
      for (const deferred of DEFERRED_UPGRADES) {
        expect(completed.has(deferred.id)).toBe(false);
      }
    });
  });

  describe('tech debt registry', () => {
    it('passes debt registry integrity guard', () => {
      expect(assertDebtRegistryIntegrity()).toBe(true);
    });

    it('has no open tech debt items', () => {
      expect(TECH_DEBT).toHaveLength(0);
    });

    it('documents resolved and mitigated items without id collisions', () => {
      const resolvedIds = new Set(RESOLVED_TECH_DEBT.map((item) => item.id));
      const mitigatedIds = new Set(MITIGATED_TECH_DEBT.map((item) => item.id));
      expect(resolvedIds.has('TD-02')).toBe(true);
      expect(resolvedIds.has('TD-09')).toBe(true);
      expect(mitigatedIds.has('TD-01')).toBe(true);
      expect(mitigatedIds.has('TD-08')).toBe(true);
      for (const id of resolvedIds) {
        expect(mitigatedIds.has(id)).toBe(false);
      }
    });
  });
});

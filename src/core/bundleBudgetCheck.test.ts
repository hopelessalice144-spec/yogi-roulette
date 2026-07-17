import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BUNDLE_BUDGET_KB } from './performanceBudget.js';
import {
  evaluateBundleBudget,
  formatBundleResult,
  gzipSizeKb,
  measureDistBundles,
} from './bundleBudgetCheck.js';

describe('bundleBudgetCheck', () => {
  const tmpDirs: string[] = [];

  function makeDist(files: Record<string, string | Buffer>): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'turbo-budget-'));
    tmpDirs.push(root);
    const assets = path.join(root, 'assets');
    fs.mkdirSync(assets, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(assets, name), content);
    }
    return root;
  }

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  describe('gzipSizeKb', () => {
    it('measures gzip-compressed size in kilobytes', () => {
      const file = path.join(os.tmpdir(), `gzip-test-${Date.now()}.bin`);
      fs.writeFileSync(file, 'x'.repeat(2048));
      try {
        const kb = gzipSizeKb(file);
        expect(kb).toBeGreaterThan(0);
        expect(kb).toBeLessThan(5);
      } finally {
        fs.unlinkSync(file);
      }
    });
  });

  describe('measureDistBundles', () => {
    it('maps dist assets to budget labels', () => {
      const dist = makeDist({
        'index-abc123.js': 'console.log("app")',
        'index-abc123.css': '.game { color: red; }',
        'rapier-DSQP.js': 'rapier',
        'three-Db5n.js': 'three',
        'r3f-G7jB.js': 'r3f',
        'postfx-extra.js': 'ignored',
      });

      const measured = measureDistBundles(dist);
      expect(measured).toHaveLength(5);
      expect(measured.map((m) => m.label).sort()).toEqual(['app', 'css', 'r3f', 'rapier', 'three']);
      for (const row of measured) {
        expect(row.gzipKb).toBeGreaterThan(0);
        expect(row.maxKb).toBeGreaterThan(0);
      }
    });

    it('throws when assets directory is missing', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'turbo-budget-empty-'));
      tmpDirs.push(root);
      expect(() => measureDistBundles(root)).toThrow(/dist assets missing/);
    });
  });

  describe('evaluateBundleBudget', () => {
    it('passes when all chunks are within budget', () => {
      const dist = makeDist({
        'index-test.js': 'small app bundle',
        'index-test.css': '.x{}',
        'rapier-x.js': 'r',
        'three-x.js': 't',
        'r3f-x.js': 'f',
      });
      const report = evaluateBundleBudget(dist);
      expect(report.missing).toHaveLength(0);
      expect(report.allOk).toBe(true);
      expect(report.results.every((r) => r.ok)).toBe(true);
    });

    it('fails when a chunk exceeds its budget', () => {
      const dist = makeDist({ 'index-fat.js': randomBytes(120_000) });
      const app = measureDistBundles(dist).find((row) => row.budgetKey === 'appJsGzipMax');
      expect(app).toBeDefined();
      expect(app!.gzipKb).toBeGreaterThan(BUNDLE_BUDGET_KB.appJsGzipMax);

      const report = evaluateBundleBudget(dist, BUNDLE_BUDGET_KB);
      expect(report.results[0]?.ok).toBe(false);
      expect(report.allOk).toBe(false);
    });

    it('reports missing budget keys', () => {
      const dist = makeDist({ 'index-only.js': 'app' });
      const report = evaluateBundleBudget(dist);
      expect(report.missing.length).toBeGreaterThan(0);
      expect(report.missing).toContain('rapierGzipMax');
      expect(report.allOk).toBe(false);
    });
  });

  describe('formatBundleResult', () => {
    it('formats OK and OVER statuses', () => {
      const okLine = formatBundleResult({
        label: 'app',
        gzipKb: 40,
        maxKb: 50,
        ok: true,
      });
      expect(okLine).toContain('app: 40.00 KB / 50 KB');
      expect(okLine).toContain('[OK]');

      const overLine = formatBundleResult({
        label: 'rapier',
        gzipKb: 950,
        maxKb: 900,
        ok: false,
      });
      expect(overLine).toContain('[OVER]');
    });
  });
});

/**
 * Post-build bundle budget enforcement — gzip sizes vs BUNDLE_BUDGET_KB.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { BUNDLE_BUDGET_KB } from './performanceBudget.js';

/** Map dist asset filename → budget key (aligned with vite manualChunks). */
const CHUNK_RULES = Object.freeze([
  { test: (name) => /^rapier-/.test(name), budgetKey: 'rapierGzipMax', label: 'rapier' },
  { test: (name) => /^three-/.test(name), budgetKey: 'threeGzipMax', label: 'three' },
  { test: (name) => /^r3f-/.test(name), budgetKey: 'r3fGzipMax', label: 'r3f' },
  { test: (name) => /^index-.*\.js$/.test(name), budgetKey: 'appJsGzipMax', label: 'app' },
  { test: (name) => /^index-.*\.css$/.test(name), budgetKey: 'cssGzipMax', label: 'css' },
]);

/** Gzip-compress a file and return size in kilobytes. */
export function gzipSizeKb(filePath) {
  const raw = fs.readFileSync(filePath);
  const gz = zlib.gzipSync(raw);
  return gz.length / 1024;
}

/** Measure budgeted chunks under dist/assets. */
export function measureDistBundles(distDir) {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    throw new Error(`dist assets missing: ${assetsDir}`);
  }

  const measured = [];
  for (const file of fs.readdirSync(assetsDir)) {
    const rule = CHUNK_RULES.find((r) => r.test(file));
    if (!rule) continue;
    const gzipKb = gzipSizeKb(path.join(assetsDir, file));
    measured.push({
      file,
      label: rule.label,
      budgetKey: rule.budgetKey,
      gzipKb,
      maxKb: BUNDLE_BUDGET_KB[rule.budgetKey],
    });
  }
  return measured;
}

/**
 * Evaluate all budgeted chunks against BUNDLE_BUDGET_KB.
 * @returns {{ results: Array, missing: string[], allOk: boolean }}
 */
export function evaluateBundleBudget(distDir, budgets = BUNDLE_BUDGET_KB) {
  const results = measureDistBundles(distDir).map((m) => ({
    ...m,
    ok: m.gzipKb <= m.maxKb,
  }));
  const missing = Object.keys(budgets).filter(
    (key) => !results.some((r) => r.budgetKey === key)
  );
  return {
    results,
    missing,
    allOk: results.every((r) => r.ok) && missing.length === 0,
  };
}

/** Format a single result line for CI logs. */
export function formatBundleResult(r) {
  const pct = ((r.gzipKb / r.maxKb) * 100).toFixed(1);
  const status = r.ok ? 'OK' : 'OVER';
  return `${r.label}: ${r.gzipKb.toFixed(2)} KB / ${r.maxKb} KB (${pct}%) [${status}]`;
}

console.assert(CHUNK_RULES.length === 5, 'five chunk budget rules');
console.assert(
  CHUNK_RULES.some((r) => r.test('rapier-DHa6W1u_.js')),
  'rapier chunk rule'
);
console.assert(
  CHUNK_RULES.some((r) => r.test('index-abc123.js')),
  'app chunk rule'
);

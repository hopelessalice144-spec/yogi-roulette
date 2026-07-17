import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { VITEST_COMPLETED_UPGRADE_COUNT } from './techManifest.js';
import {
  FULL_SURFACE_TEST_PARITY_COMPLETE,
  FULL_SURFACE_TEST_PARITY_COVERED_COUNT,
  FULL_SURFACE_TEST_PARITY_MISSING_COUNT,
  FULL_SURFACE_TEST_PARITY_MODULE_COUNT,
  JSX_CONTEXT_SURFACE_MODULE_COUNT,
  JSX_CONTEXT_TEST_PARITY_COVERED_COUNT,
  JSX_CONTEXT_TEST_PARITY_MISSING_COUNT,
  JSX_ENTRY_SURFACE_MODULE_COUNT,
  JSX_ENTRY_TEST_PARITY_COVERED_COUNT,
  JSX_ENTRY_TEST_PARITY_MISSING_COUNT,
  JSX_SCENE_SURFACE_MODULE_COUNT,
  JSX_SCENE_TEST_PARITY_COVERED_COUNT,
  JSX_SCENE_TEST_PARITY_MISSING_COUNT,
  JSX_SRC_SURFACE_MODULE_COUNT,
  JSX_SURFACE_MODULE_COUNT,
  JSX_SURFACE_TEST_PARITY_COMPLETE,
  JSX_SURFACE_TEST_PARITY_COVERED_COUNT,
  JSX_SURFACE_TEST_PARITY_MISSING_COUNT,
  JSX_UI_SURFACE_MODULE_COUNT,
  JSX_UI_TEST_PARITY_COVERED_COUNT,
  JSX_UI_TEST_PARITY_MISSING_COUNT,
  JS_TEST_PARITY_COMPLETE,
  JS_TEST_PARITY_COVERED_COUNT,
  JS_TEST_PARITY_MISSING_COUNT,
  SHARED_MODULE_TESTS,
  VITEST_COVERAGE_DIRS,
  VITEST_COVERAGE_MODULE_COUNT,
  VITEST_SURFACE_TEST_PARITY_MODULE_COUNT,
  VITEST_SURFACE_TEST_PARITY_COVERED_COUNT,
  VITEST_SURFACE_TEST_PARITY_MISSING_COUNT,
  VITEST_SURFACE_TEST_PARITY_COMPLETE,
  SURFACE_FLAT_FIELD_PAIR_COUNT,
  SURFACE_FLAT_TOTAL_FIELD_COUNT,
  SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE,
  SURFACE_FLAT_FIELD_TRILOGY_COMPLETE,
  SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT,
  SURFACE_FLAT_REPORT_QUARTET_COMPLETE,
  VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE,
  auditJsxSurface,
  auditJsxSurfaceComplete,
  auditJsxContextTestParity,
  auditJsxEntryTestParity,
  auditJsxSceneTestParity,
  auditJsxSurfaceTestParity,
  auditJsxUiTestParity,
  auditFullSurfaceTestParity,
  auditVitestSurfaceTestParity,
  auditJsTestParity,
  auditVitestCoverage,
  findJsxContextModulesMissingTests,
  findJsxEntryModulesMissingTests,
  findJsxModulesMissingTests,
  findJsxSceneModulesMissingTests,
  findModulesMissingTests,
  listAllSrcJsxModules,
  listJsModules,
  listJsxEntryModules,
  listJsxModules,
  moduleTestPath,
  runVitestVerifyAudits,
} from './vitestCoverage.js';

const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('vitestCoverage', () => {
  const tmpDirs: string[] = [];

  function makeSrcTree(files: Record<string, string>): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'turbo-vitest-cov-'));
    tmpDirs.push(root);
    const src = path.join(root, 'src');
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(src, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content);
    }
    return src;
  }

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  describe('moduleTestPath', () => {
    it('covers core, lib, scene, shaders, and hooks directories', () => {
      expect([...VITEST_COVERAGE_DIRS]).toEqual(['core', 'lib', 'scene', 'shaders', 'hooks']);
    });

    it('maps .js modules to sibling .test.ts files', () => {
      expect(moduleTestPath('core/timer.js')).toBe('core/timer.test.ts');
      expect(moduleTestPath('lib/math.js')).toBe('lib/math.test.ts');
      expect(moduleTestPath('scene/materials.js')).toBe('scene/materials.test.ts');
      expect(moduleTestPath('shaders/godRays.js')).toBe('shaders/godRays.test.ts');
      expect(moduleTestPath('hooks/useLiveClock.js')).toBe('hooks/useLiveClock.test.ts');
    });

    it('maps .jsx modules to sibling .test.tsx files', () => {
      expect(moduleTestPath('ui/BettingBoard.jsx')).toBe('ui/BettingBoard.test.tsx');
      expect(moduleTestPath('ui/icons.jsx')).toBe('ui/icons.test.tsx');
    });

    it('routes legacy lib shims through libShims.test.ts', () => {
      expect(moduleTestPath('lib/timer.js')).toBe(SHARED_MODULE_TESTS['lib/timer.js']);
      expect(moduleTestPath('lib/performanceGuard.js')).toBe(
        SHARED_MODULE_TESTS['lib/performanceGuard.js'],
      );
    });
  });

  describe('listJsModules', () => {
    it('lists only .js files in configured coverage roots', () => {
      const src = makeSrcTree({
        'lib/a.js': 'export const a = 1;',
        'lib/a.test.ts': 'test',
        'lib/ignore.jsx': '<x />',
        'scene/b.js': 'export const b = 1;',
        'hooks/c.js': 'export const c = 1;',
        'ui/skip.js': 'export const skip = 1;',
      });
      expect(listJsModules(src)).toEqual(['hooks/c.js', 'lib/a.js', 'scene/b.js']);
    });
  });

  describe('findModulesMissingTests', () => {
    it('flags modules without a mapped vitest file', () => {
      const src = makeSrcTree({
        'lib/covered.js': 'export const ok = 1;',
        'lib/covered.test.ts': "import './covered.js';",
        'lib/gap.js': 'export const gap = 1;',
        'lib/timer.js': 'export * from "../core/timer.ts";',
        'lib/libShims.test.ts': "import './timer.js';",
      });
      expect(findModulesMissingTests(src)).toEqual(['lib/gap.js']);
    });
  });

  describe('findJsxModulesMissingTests', () => {
    it('flags ui jsx modules without a mapped vitest file', () => {
      const src = makeSrcTree({
        'ui/covered.jsx': '<covered />',
        'ui/covered.test.tsx': "import './covered.jsx';",
        'ui/gap.jsx': '<gap />',
      });
      expect(findJsxModulesMissingTests(src)).toEqual(['ui/gap.jsx']);
    });

    it('passes ui jsx test parity for the production tree', () => {
      const report = auditJsxUiTestParity(SRC_ROOT);
      expect(report.moduleCount).toBe(JSX_UI_SURFACE_MODULE_COUNT);
      expect(report.ok).toBe(true);
      expect(report.missing).toEqual([]);
      expect(JSX_UI_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_UI_TEST_PARITY_COVERED_COUNT).toBe(JSX_UI_SURFACE_MODULE_COUNT);
    });
  });

  describe('findJsxSceneModulesMissingTests', () => {
    it('flags scene jsx modules without a mapped vitest file', () => {
      const src = makeSrcTree({
        'scene/covered.jsx': '<covered />',
        'scene/covered.test.tsx': "import './covered.jsx';",
        'scene/gap.jsx': '<gap />',
      });
      expect(findJsxSceneModulesMissingTests(src)).toEqual(['scene/gap.jsx']);
    });

    it('passes scene jsx test parity for the production tree', () => {
      const report = auditJsxSceneTestParity(SRC_ROOT);
      expect(report.moduleCount).toBe(JSX_SCENE_SURFACE_MODULE_COUNT);
      expect(report.ok).toBe(true);
      expect(report.missing).toEqual([]);
      expect(JSX_SCENE_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_SCENE_TEST_PARITY_COVERED_COUNT).toBe(JSX_SCENE_SURFACE_MODULE_COUNT);
    });
  });

  describe('findJsxContextModulesMissingTests', () => {
    it('flags context jsx modules without a mapped vitest file', () => {
      const src = makeSrcTree({
        'context/covered.jsx': '<covered />',
        'context/covered.test.tsx': "import './covered.jsx';",
        'context/gap.jsx': '<gap />',
      });
      expect(findJsxContextModulesMissingTests(src)).toEqual(['context/gap.jsx']);
    });

    it('passes context jsx test parity for the production tree', () => {
      const report = auditJsxContextTestParity(SRC_ROOT);
      expect(report.moduleCount).toBe(JSX_CONTEXT_SURFACE_MODULE_COUNT);
      expect(report.ok).toBe(true);
      expect(report.missing).toEqual([]);
      expect(JSX_CONTEXT_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_CONTEXT_TEST_PARITY_COVERED_COUNT).toBe(JSX_CONTEXT_SURFACE_MODULE_COUNT);
    });
  });

  describe('findJsxEntryModulesMissingTests', () => {
    it('flags entry jsx modules without a mapped vitest file', () => {
      const src = makeSrcTree({
        'App.jsx': '<app />',
        'App.test.tsx': "import './App.jsx';",
        'main.jsx': '<main />',
      });
      expect(findJsxEntryModulesMissingTests(src)).toEqual(['main.jsx']);
    });

    it('passes entry jsx test parity for the production tree', () => {
      const report = auditJsxEntryTestParity(SRC_ROOT);
      expect(report.moduleCount).toBe(JSX_ENTRY_SURFACE_MODULE_COUNT);
      expect(report.ok).toBe(true);
      expect(report.missing).toEqual([]);
      expect(JSX_ENTRY_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_ENTRY_TEST_PARITY_COVERED_COUNT).toBe(JSX_ENTRY_SURFACE_MODULE_COUNT);
    });
  });

  describe('auditJsxSurfaceTestParity', () => {
    it('passes combined jsx surface test parity for the production tree', () => {
      const report = auditJsxSurfaceTestParity(SRC_ROOT);
      expect(report.moduleCount).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(report.moduleCount).toBe(JSX_SRC_SURFACE_MODULE_COUNT);
      expect(report.ok).toBe(true);
      expect(report.missing).toEqual([]);
      expect(report.coveredCount).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(report.missingCount).toBe(0);
      expect(JSX_SURFACE_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_SURFACE_TEST_PARITY_COVERED_COUNT).toBe(JSX_SURFACE_MODULE_COUNT);
    });
  });

  describe('JS_TEST_PARITY_COMPLETE', () => {
    it('is true when all gated JS modules have vitest siblings in the production tree', () => {
      expect(JS_TEST_PARITY_COMPLETE).toBe(true);
      expect(JS_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JS_TEST_PARITY_COVERED_COUNT).toBe(VITEST_COVERAGE_MODULE_COUNT);
      expect(auditVitestCoverage(SRC_ROOT).ok).toBe(JS_TEST_PARITY_COMPLETE);
      expect(auditJsTestParity(SRC_ROOT).ok).toBe(JS_TEST_PARITY_COMPLETE);
      expect(findModulesMissingTests(SRC_ROOT)).toEqual([]);
    });
  });

  describe('auditJsTestParity', () => {
    it('passes JS test parity for the production tree', () => {
      const report = auditJsTestParity(SRC_ROOT);
      expect(report.moduleCount).toBe(VITEST_COVERAGE_MODULE_COUNT);
      expect(report.ok).toBe(true);
      expect(report.missing).toEqual([]);
      expect(report.coveredCount).toBe(VITEST_COVERAGE_MODULE_COUNT);
      expect(report.missingCount).toBe(0);
      expect(JS_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JS_TEST_PARITY_COVERED_COUNT).toBe(VITEST_COVERAGE_MODULE_COUNT);
    });
  });

  describe('JSX_SURFACE_TEST_PARITY_COMPLETE', () => {
    it('is true when all jsx surfaces have vitest siblings in the production tree', () => {
      expect(JSX_SURFACE_TEST_PARITY_COMPLETE).toBe(true);
      expect(JSX_UI_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_SCENE_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_CONTEXT_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_ENTRY_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_SURFACE_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_SURFACE_TEST_PARITY_COVERED_COUNT).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(JSX_SURFACE_MODULE_COUNT).toBe(JSX_SRC_SURFACE_MODULE_COUNT);
      expect(auditJsxUiTestParity(SRC_ROOT).ok).toBe(JSX_SURFACE_TEST_PARITY_COMPLETE);
      expect(auditJsxSceneTestParity(SRC_ROOT).ok).toBe(JSX_SURFACE_TEST_PARITY_COMPLETE);
      expect(auditJsxContextTestParity(SRC_ROOT).ok).toBe(JSX_SURFACE_TEST_PARITY_COMPLETE);
      expect(auditJsxEntryTestParity(SRC_ROOT).ok).toBe(JSX_SURFACE_TEST_PARITY_COMPLETE);
      expect(auditJsxSurfaceTestParity(SRC_ROOT).ok).toBe(JSX_SURFACE_TEST_PARITY_COMPLETE);
      expect(auditJsxSurfaceTestParity(SRC_ROOT).missing).toEqual([]);
    });
  });

  describe('VITEST_SURFACE_TEST_PARITY_MODULE_COUNT', () => {
    it('aliases the combined JS + JSX surface parity gate (92/92)', () => {
      expect(VITEST_SURFACE_TEST_PARITY_MODULE_COUNT).toBe(FULL_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(VITEST_SURFACE_TEST_PARITY_MODULE_COUNT).toBe(
        VITEST_COVERAGE_MODULE_COUNT + JSX_SURFACE_MODULE_COUNT,
      );
    });
  });

  describe('VITEST_SURFACE_TEST_PARITY_COVERED_COUNT', () => {
    it('aliases the combined JS + JSX surface parity covered count (92/92)', () => {
      expect(VITEST_SURFACE_TEST_PARITY_COVERED_COUNT).toBe(FULL_SURFACE_TEST_PARITY_COVERED_COUNT);
      expect(VITEST_SURFACE_TEST_PARITY_COVERED_COUNT).toBe(VITEST_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(VITEST_SURFACE_TEST_PARITY_MISSING_COUNT).toBe(0);
    });
  });

  describe('VITEST_SURFACE_TEST_PARITY_COMPLETE', () => {
    it('aliases the combined JS + JSX surface parity complete milestone (92/92)', () => {
      expect(VITEST_SURFACE_TEST_PARITY_COMPLETE).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
      expect(VITEST_SURFACE_TEST_PARITY_COMPLETE).toBe(true);
      expect(auditFullSurfaceTestParity(SRC_ROOT).ok).toBe(VITEST_SURFACE_TEST_PARITY_COMPLETE);
    });
  });

  describe('FULL_SURFACE_TEST_PARITY_COMPLETE', () => {
    it('is true when all gated JS and JSX surfaces have vitest siblings', () => {
      expect(FULL_SURFACE_TEST_PARITY_COMPLETE).toBe(true);
      expect(JS_TEST_PARITY_COMPLETE).toBe(true);
      expect(JSX_SURFACE_TEST_PARITY_COMPLETE).toBe(true);
      expect(JS_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JS_TEST_PARITY_COVERED_COUNT).toBe(VITEST_COVERAGE_MODULE_COUNT);
      expect(JSX_SURFACE_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_SURFACE_TEST_PARITY_COVERED_COUNT).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(FULL_SURFACE_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(FULL_SURFACE_TEST_PARITY_COVERED_COUNT).toBe(FULL_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(FULL_SURFACE_TEST_PARITY_MODULE_COUNT).toBe(
        VITEST_COVERAGE_MODULE_COUNT + JSX_SURFACE_MODULE_COUNT,
      );
      expect(auditVitestCoverage(SRC_ROOT).ok).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
      expect(auditJsxSurfaceTestParity(SRC_ROOT).ok).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
      expect(auditFullSurfaceTestParity(SRC_ROOT).ok).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
      expect(findModulesMissingTests(SRC_ROOT)).toEqual([]);
    });
  });

  describe('SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE', () => {
    it('is true when unified surface flat closure milestones align', () => {
      expect(SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE).toBe(true);
      expect(SURFACE_FLAT_FIELD_PAIR_COUNT).toBe(4);
      expect(SURFACE_FLAT_TOTAL_FIELD_COUNT).toBe(8);
      expect(SURFACE_FLAT_TOTAL_FIELD_COUNT).toBe(SURFACE_FLAT_FIELD_PAIR_COUNT * 2);
      expect(VITEST_SURFACE_TEST_PARITY_COMPLETE).toBe(true);
      expect(FULL_SURFACE_TEST_PARITY_COMPLETE).toBe(true);
      const report = runVitestVerifyAudits(SRC_ROOT);
      expect(report.fullSurfaceTestParityComplete).toBe(SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE);
      expect(report.vitestSurfaceTestParityComplete).toBe(SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE);
      expect(report.surfaceFlatUnifiedClosureComplete).toBe(SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE);
      expect(report.surfaceFlatUnifiedClosureComplete).toBe(report.vitestSurfaceTestParity.ok);
      expect(report.surfaceFlatUnifiedClosureComplete).toBe(report.fullSurfaceTestParityComplete);
      expect(report.surfaceFlatUnifiedClosureComplete).toBe(report.vitestSurfaceTestParityComplete);
      expect(report.surfaceFlatFieldPairCount).toBe(SURFACE_FLAT_FIELD_PAIR_COUNT);
      expect(report.surfaceFlatTotalFieldCount).toBe(SURFACE_FLAT_TOTAL_FIELD_COUNT);
      expect(report.surfaceFlatTotalFieldCount).toBe(report.surfaceFlatFieldPairCount * 2);
      expect(report.fullSurfaceTestParityModuleCount).toBe(report.vitestSurfaceTestParityModuleCount);
      expect(report.fullSurfaceTestParityCoveredCount).toBe(report.vitestSurfaceTestParityCoveredCount);
      expect(report.fullSurfaceTestParityMissingCount).toBe(report.vitestSurfaceTestParityMissingCount);
      expect(report.fullSurfaceTestParityComplete).toBe(report.vitestSurfaceTestParityComplete);
    });
  });

  describe('SURFACE_FLAT_TOTAL_FIELD_COUNT', () => {
    it('equals dual flat field sets (4 pairs × 2)', () => {
      expect(SURFACE_FLAT_TOTAL_FIELD_COUNT).toBe(8);
      expect(SURFACE_FLAT_TOTAL_FIELD_COUNT).toBe(SURFACE_FLAT_FIELD_PAIR_COUNT * 2);
      const report = runVitestVerifyAudits(SRC_ROOT);
      expect(report.surfaceFlatTotalFieldCount).toBe(SURFACE_FLAT_TOTAL_FIELD_COUNT);
      expect(report.surfaceFlatTotalFieldCount).toBe(report.surfaceFlatFieldPairCount * 2);
    });
  });

  describe('SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT', () => {
    it('equals six report flat fields on runVitestVerifyAudits', () => {
      expect(SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT).toBe(6);
      expect(SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT).toBe(SURFACE_FLAT_FIELD_PAIR_COUNT + 2);
      const report = runVitestVerifyAudits(SRC_ROOT);
      expect(report.surfaceFlatUnifiedClosureComplete).toBeDefined();
      expect(report.surfaceFlatFieldPairCount).toBeDefined();
      expect(report.surfaceFlatTotalFieldCount).toBeDefined();
      expect(report.surfaceFlatFieldTrilogyComplete).toBeDefined();
      expect(report.surfaceFlatReportQuartetComplete).toBeDefined();
      expect(report.vitestSurfaceFlatReportTailComplete).toBeDefined();
      expect(report.surfaceFlatReportFlatFieldCount).toBe(SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT);
      expect(report.surfaceFlatReportFlatFieldCount).toBe(report.surfaceFlatFieldPairCount + 2);
    });
  });

  describe('surface flat report quartet closure', () => {
    it('aligns closure, pair count, total count, trilogy complete, report flat field count, quartet complete, and tail complete on runVitestVerifyAudits report', () => {
      const report = runVitestVerifyAudits(SRC_ROOT);
      expect(
        report.surfaceFlatUnifiedClosureComplete === report.vitestSurfaceTestParity.ok &&
          report.surfaceFlatFieldPairCount === SURFACE_FLAT_FIELD_PAIR_COUNT &&
          report.surfaceFlatTotalFieldCount === SURFACE_FLAT_TOTAL_FIELD_COUNT &&
          report.surfaceFlatFieldPairCount * 2 === report.surfaceFlatTotalFieldCount &&
          report.surfaceFlatFieldTrilogyComplete === SURFACE_FLAT_FIELD_TRILOGY_COMPLETE &&
          report.surfaceFlatReportFlatFieldCount === SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT &&
          report.surfaceFlatReportFlatFieldCount === report.surfaceFlatFieldPairCount + 2 &&
          report.surfaceFlatReportQuartetComplete === SURFACE_FLAT_REPORT_QUARTET_COMPLETE &&
          report.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE,
      ).toBe(true);
      expect(report.surfaceFlatFieldTrilogyComplete).toBe(SURFACE_FLAT_FIELD_TRILOGY_COMPLETE);
      expect(report.surfaceFlatReportFlatFieldCount).toBe(SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT);
    });
  });

  describe('SURFACE_FLAT_FIELD_TRILOGY_COMPLETE', () => {
    it('is true when closure, pair count, and total count milestones align', () => {
      expect(SURFACE_FLAT_FIELD_TRILOGY_COMPLETE).toBe(true);
      expect(SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE).toBe(true);
      expect(SURFACE_FLAT_FIELD_PAIR_COUNT).toBe(4);
      expect(SURFACE_FLAT_TOTAL_FIELD_COUNT).toBe(8);
      expect(SURFACE_FLAT_TOTAL_FIELD_COUNT).toBe(SURFACE_FLAT_FIELD_PAIR_COUNT * 2);
      const report = runVitestVerifyAudits(SRC_ROOT);
      expect(report.surfaceFlatUnifiedClosureComplete).toBe(SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE);
      expect(report.surfaceFlatFieldPairCount).toBe(SURFACE_FLAT_FIELD_PAIR_COUNT);
      expect(report.surfaceFlatTotalFieldCount).toBe(SURFACE_FLAT_TOTAL_FIELD_COUNT);
      expect(report.surfaceFlatFieldPairCount * 2).toBe(report.surfaceFlatTotalFieldCount);
      expect(report.surfaceFlatFieldTrilogyComplete).toBe(SURFACE_FLAT_FIELD_TRILOGY_COMPLETE);
      expect(
        report.surfaceFlatUnifiedClosureComplete === report.vitestSurfaceTestParity.ok &&
          report.surfaceFlatFieldPairCount === SURFACE_FLAT_FIELD_PAIR_COUNT &&
          report.surfaceFlatTotalFieldCount === SURFACE_FLAT_TOTAL_FIELD_COUNT &&
          report.surfaceFlatFieldPairCount * 2 === report.surfaceFlatTotalFieldCount,
      ).toBe(SURFACE_FLAT_FIELD_TRILOGY_COMPLETE);
    });
  });

  describe('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE', () => {
    it('is true when quartet milestone and vitest surface alias/report tail align', () => {
      expect(VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE).toBe(true);
      expect(SURFACE_FLAT_REPORT_QUARTET_COMPLETE).toBe(true);
      expect(VITEST_SURFACE_TEST_PARITY_MODULE_COUNT).toBe(FULL_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(VITEST_SURFACE_TEST_PARITY_COMPLETE).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
      const report = runVitestVerifyAudits(SRC_ROOT);
      expect(report.vitestSurfaceFlatReportTailComplete).toBe(VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE);
      expect(report.surfaceFlatReportQuartetComplete).toBe(SURFACE_FLAT_REPORT_QUARTET_COMPLETE);
    });
  });

  describe('SURFACE_FLAT_REPORT_QUARTET_COMPLETE', () => {
    it('is true when closure, pair, total, trilogy, and quartet report flat fields align', () => {
      expect(SURFACE_FLAT_REPORT_QUARTET_COMPLETE).toBe(true);
      expect(SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE).toBe(true);
      expect(SURFACE_FLAT_FIELD_TRILOGY_COMPLETE).toBe(true);
      expect(SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT).toBe(6);
      expect(SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT).toBe(SURFACE_FLAT_FIELD_PAIR_COUNT + 2);
      const report = runVitestVerifyAudits(SRC_ROOT);
      expect(report.surfaceFlatUnifiedClosureComplete).toBe(SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE);
      expect(report.surfaceFlatFieldPairCount).toBe(SURFACE_FLAT_FIELD_PAIR_COUNT);
      expect(report.surfaceFlatTotalFieldCount).toBe(SURFACE_FLAT_TOTAL_FIELD_COUNT);
      expect(report.surfaceFlatFieldTrilogyComplete).toBe(SURFACE_FLAT_FIELD_TRILOGY_COMPLETE);
      expect(report.surfaceFlatReportFlatFieldCount).toBe(SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT);
      expect(report.surfaceFlatReportQuartetComplete).toBe(SURFACE_FLAT_REPORT_QUARTET_COMPLETE);
      expect(report.vitestSurfaceFlatReportTailComplete).toBe(VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE);
      expect(
        report.surfaceFlatUnifiedClosureComplete === report.vitestSurfaceTestParity.ok &&
          report.surfaceFlatFieldPairCount === SURFACE_FLAT_FIELD_PAIR_COUNT &&
          report.surfaceFlatTotalFieldCount === SURFACE_FLAT_TOTAL_FIELD_COUNT &&
          report.surfaceFlatFieldTrilogyComplete === SURFACE_FLAT_FIELD_TRILOGY_COMPLETE,
      ).toBe(SURFACE_FLAT_REPORT_QUARTET_COMPLETE);
    });
  });

  describe('auditFullSurfaceTestParity', () => {
    it('passes combined JS + JSX surface test parity for the production tree', () => {
      const report = auditFullSurfaceTestParity(SRC_ROOT);
      expect(report.moduleCount).toBe(FULL_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(report.ok).toBe(true);
      expect(report.missing).toEqual([]);
      expect(report.coveredCount).toBe(FULL_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(report.missingCount).toBe(0);
      expect(report.ok).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
    });
  });

  describe('auditVitestSurfaceTestParity', () => {
    it('wraps full surface runtime audit with VITEST_SURFACE_* alias visibility', () => {
      const report = auditVitestSurfaceTestParity(SRC_ROOT);
      const full = auditFullSurfaceTestParity(SRC_ROOT);
      expect(report.ok).toBe(full.ok);
      expect(report.missing).toEqual(full.missing);
      expect(report.moduleCount).toBe(full.moduleCount);
      expect(report.coveredCount).toBe(full.coveredCount);
      expect(report.missingCount).toBe(full.missingCount);
      expect(report.vitestSurfaceModuleCount).toBe(VITEST_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(report.vitestSurfaceCoveredCount).toBe(VITEST_SURFACE_TEST_PARITY_COVERED_COUNT);
      expect(report.vitestSurfaceMissingCount).toBe(VITEST_SURFACE_TEST_PARITY_MISSING_COUNT);
      expect(report.vitestSurfaceComplete).toBe(VITEST_SURFACE_TEST_PARITY_COMPLETE);
      expect(report.ok).toBe(VITEST_SURFACE_TEST_PARITY_COMPLETE);
    });
  });

  describe('listJsxModules', () => {
    it('lists only .jsx files in configured probe roots', () => {
      const src = makeSrcTree({
        'ui/Panel.jsx': '<panel />',
        'ui/ignore.js': 'export const skip = 1;',
        'scene/Game.jsx': '<game />',
        'context/GameContext.jsx': '<ctx />',
        'lib/skip.jsx': '<skip />',
      });
      expect(listJsxModules(src)).toEqual([
        'context/GameContext.jsx',
        'scene/Game.jsx',
        'ui/Panel.jsx',
      ]);
    });
  });

  describe('listJsxEntryModules', () => {
    it('lists only configured root entry .jsx files', () => {
      const src = makeSrcTree({
        'App.jsx': '<app />',
        'main.jsx': '<main />',
        'ui/Panel.jsx': '<panel />',
        'extra.jsx': '<extra />',
      });
      expect(listJsxEntryModules(src)).toEqual(['App.jsx', 'main.jsx']);
    });
  });

  describe('auditJsxSurface', () => {
    it('inventories ui, scene, context, and entry jsx modules in the production tree', () => {
      const report = auditJsxSurface(SRC_ROOT);
      expect(report.moduleCount).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(report.uiCount).toBe(JSX_UI_SURFACE_MODULE_COUNT);
      expect(report.sceneCount).toBe(JSX_SCENE_SURFACE_MODULE_COUNT);
      expect(report.contextCount).toBe(JSX_CONTEXT_SURFACE_MODULE_COUNT);
      expect(report.entryCount).toBe(JSX_ENTRY_SURFACE_MODULE_COUNT);
      expect(report.modules).toContain('ui/BettingBoard.jsx');
      expect(report.modules).toContain('ui/icons.jsx');
      expect(report.modules).toContain('scene/GameScene.jsx');
      expect(report.modules).toContain('scene/EuropeanWheel.jsx');
      expect(report.modules).toContain('context/GameContext.jsx');
      expect(report.modules).toContain('App.jsx');
      expect(report.modules).toContain('main.jsx');
    });
  });

  describe('auditJsxSurfaceComplete', () => {
    it('lists every .jsx file under src in the production tree', () => {
      expect(listAllSrcJsxModules(SRC_ROOT).length).toBe(JSX_SRC_SURFACE_MODULE_COUNT);
      expect(JSX_SRC_SURFACE_MODULE_COUNT).toBe(JSX_SURFACE_MODULE_COUNT);
    });

    it('passes when probe inventory matches all src jsx files', () => {
      const report = auditJsxSurfaceComplete(SRC_ROOT);
      expect(report.ok).toBe(true);
      expect(report.moduleCount).toBe(JSX_SRC_SURFACE_MODULE_COUNT);
      expect(report.probeCount).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(report.missingFromProbe).toEqual([]);
      expect(report.extraInProbe).toEqual([]);
    });

    it('flags jsx files outside the probe inventory', () => {
      const src = makeSrcTree({
        'ui/Panel.jsx': '<panel />',
        'lib/Orphan.jsx': '<orphan />',
      });
      const report = auditJsxSurfaceComplete(src);
      expect(report.ok).toBe(false);
      expect(report.missingFromProbe).toEqual(['lib/Orphan.jsx']);
    });
  });

  describe('auditVitestCoverage', () => {
    it('passes for the production src tree', () => {
      const report = auditVitestCoverage(SRC_ROOT);
      expect(report.ok).toBe(true);
      expect(report.missing).toEqual([]);
      expect(report.moduleCount).toBe(VITEST_COVERAGE_MODULE_COUNT);
    });

    it('runVitestVerifyAudits combines upgrade log and module parity', () => {
      const report = runVitestVerifyAudits(SRC_ROOT);
      expect(report.ok).toBe(true);
      expect(report.upgradeLog.ok).toBe(true);
      expect(report.coverage.ok).toBe(true);
      expect(report.jsTestParity.moduleCount).toBe(VITEST_COVERAGE_MODULE_COUNT);
      expect(report.jsTestParity.ok).toBe(true);
      expect(report.jsTestParity.missing).toEqual([]);
      expect(report.jsTestParity.coveredCount).toBe(VITEST_COVERAGE_MODULE_COUNT);
      expect(report.jsTestParity.missingCount).toBe(0);
      expect(report.jsTestParity.ok).toBe(JS_TEST_PARITY_COMPLETE);
      expect(report.jsTestParityCoveredCount).toBe(VITEST_COVERAGE_MODULE_COUNT);
      expect(report.jsTestParityMissingCount).toBe(0);
      expect(report.jsTestParityComplete).toBe(true);
      expect(report.jsTestParityComplete).toBe(JS_TEST_PARITY_COMPLETE);
      expect(report.upgradeCount).toBe(VITEST_COMPLETED_UPGRADE_COUNT);
      expect(report.moduleCount).toBe(VITEST_COVERAGE_MODULE_COUNT);
      expect(report.missingModules).toEqual([]);
      expect(report.jsxSurface.moduleCount).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(report.jsxSurfaceCount).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(report.jsxUiSurfaceCount).toBe(JSX_UI_SURFACE_MODULE_COUNT);
      expect(report.jsxSceneSurfaceCount).toBe(JSX_SCENE_SURFACE_MODULE_COUNT);
      expect(report.jsxContextSurfaceCount).toBe(JSX_CONTEXT_SURFACE_MODULE_COUNT);
      expect(report.jsxEntrySurfaceCount).toBe(JSX_ENTRY_SURFACE_MODULE_COUNT);
      expect(report.jsxSurface.sceneCount).toBe(JSX_SCENE_SURFACE_MODULE_COUNT);
      expect(report.jsxSurface.contextCount).toBe(JSX_CONTEXT_SURFACE_MODULE_COUNT);
      expect(report.jsxSurface.entryCount).toBe(JSX_ENTRY_SURFACE_MODULE_COUNT);
      expect(report.jsxSurfaceComplete.ok).toBe(true);
      expect(report.jsxSrcSurfaceCount).toBe(JSX_SRC_SURFACE_MODULE_COUNT);
      expect(report.jsxUiTestParity.moduleCount).toBe(JSX_UI_SURFACE_MODULE_COUNT);
      expect(report.jsxUiTestParity.ok).toBe(true);
      expect(report.jsxUiTestParityCoveredCount).toBe(JSX_UI_SURFACE_MODULE_COUNT);
      expect(report.jsxUiTestParityMissingCount).toBe(0);
      expect(report.jsxSceneTestParity.moduleCount).toBe(JSX_SCENE_SURFACE_MODULE_COUNT);
      expect(report.jsxSceneTestParity.ok).toBe(true);
      expect(report.jsxSceneTestParityCoveredCount).toBe(JSX_SCENE_SURFACE_MODULE_COUNT);
      expect(report.jsxSceneTestParityMissingCount).toBe(0);
      expect(report.jsxContextTestParity.moduleCount).toBe(JSX_CONTEXT_SURFACE_MODULE_COUNT);
      expect(report.jsxContextTestParity.ok).toBe(true);
      expect(report.jsxContextTestParityCoveredCount).toBe(JSX_CONTEXT_SURFACE_MODULE_COUNT);
      expect(report.jsxContextTestParityMissingCount).toBe(0);
      expect(report.jsxEntryTestParity.moduleCount).toBe(JSX_ENTRY_SURFACE_MODULE_COUNT);
      expect(report.jsxEntryTestParity.ok).toBe(true);
      expect(report.jsxEntryTestParityCoveredCount).toBe(JSX_ENTRY_SURFACE_MODULE_COUNT);
      expect(report.jsxEntryTestParityMissingCount).toBe(0);
      expect(report.jsxSurfaceTestParity.moduleCount).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(report.jsxSurfaceTestParity.ok).toBe(true);
      expect(report.jsxSurfaceTestParity.ok).toBe(JSX_SURFACE_TEST_PARITY_COMPLETE);
      expect(report.jsxSurfaceTestParity.missing).toEqual([]);
      expect(report.jsxSurfaceTestParity.coveredCount).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(report.jsxSurfaceTestParity.missingCount).toBe(0);
      expect(report.jsxSurfaceTestParityCoveredCount).toBe(JSX_SURFACE_TEST_PARITY_COVERED_COUNT);
      expect(report.jsxSurfaceTestParityMissingCount).toBe(JSX_SURFACE_TEST_PARITY_MISSING_COUNT);
      expect(report.jsxSurfaceTestParityComplete).toBe(JSX_SURFACE_TEST_PARITY_COMPLETE);
      expect(report.fullSurfaceTestParity.moduleCount).toBe(FULL_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(report.fullSurfaceTestParity.ok).toBe(true);
      expect(report.fullSurfaceTestParity.missing).toEqual([]);
      expect(report.fullSurfaceTestParity.coveredCount).toBe(FULL_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(report.fullSurfaceTestParity.missingCount).toBe(0);
      expect(report.fullSurfaceTestParity.ok).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
      expect(report.ok).toBe(report.vitestSurfaceTestParity.ok);
      expect(report.fullSurfaceTestParityCoveredCount).toBe(FULL_SURFACE_TEST_PARITY_COVERED_COUNT);
      expect(report.fullSurfaceTestParityMissingCount).toBe(0);
      expect(report.fullSurfaceTestParityMissingCount).toBe(FULL_SURFACE_TEST_PARITY_MISSING_COUNT);
      expect(report.fullSurfaceTestParityModuleCount).toBe(FULL_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(report.fullSurfaceTestParityCoveredCount).toBe(report.vitestSurfaceTestParity.coveredCount);
      expect(report.fullSurfaceTestParityMissingCount).toBe(report.vitestSurfaceTestParity.missingCount);
      expect(report.fullSurfaceTestParityModuleCount).toBe(report.vitestSurfaceTestParity.moduleCount);
      expect(report.fullSurfaceTestParityComplete).toBe(report.vitestSurfaceTestParity.ok);
      expect(report.vitestSurfaceTestParityModuleCount).toBe(report.vitestSurfaceTestParity.moduleCount);
      expect(report.vitestSurfaceTestParityCoveredCount).toBe(report.vitestSurfaceTestParity.coveredCount);
      expect(report.vitestSurfaceTestParityMissingCount).toBe(report.vitestSurfaceTestParity.missingCount);
      expect(report.vitestSurfaceTestParityComplete).toBe(report.vitestSurfaceTestParity.ok);
      expect(report.vitestSurfaceTestParity.moduleCount).toBe(report.fullSurfaceTestParity.moduleCount);
      expect(report.vitestSurfaceTestParity.ok).toBe(report.fullSurfaceTestParity.ok);
      expect(report.vitestSurfaceTestParity.vitestSurfaceModuleCount).toBe(VITEST_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(report.vitestSurfaceTestParity.vitestSurfaceComplete).toBe(VITEST_SURFACE_TEST_PARITY_COMPLETE);
      expect(report.vitestSurfaceTestParityModuleCount).toBe(report.fullSurfaceTestParityModuleCount);
      expect(report.vitestSurfaceTestParityCoveredCount).toBe(VITEST_SURFACE_TEST_PARITY_COVERED_COUNT);
      expect(report.vitestSurfaceTestParityMissingCount).toBe(VITEST_SURFACE_TEST_PARITY_MISSING_COUNT);
      expect(report.vitestSurfaceTestParityCoveredCount).toBe(report.fullSurfaceTestParityCoveredCount);
      expect(report.vitestSurfaceTestParityMissingCount).toBe(report.fullSurfaceTestParityMissingCount);
      expect(report.vitestSurfaceTestParityComplete).toBe(VITEST_SURFACE_TEST_PARITY_COMPLETE);
      expect(report.vitestSurfaceTestParityComplete).toBe(report.fullSurfaceTestParityComplete);
      expect(report.surfaceFlatUnifiedClosureComplete).toBe(report.vitestSurfaceTestParity.ok);
      expect(report.surfaceFlatFieldPairCount).toBe(SURFACE_FLAT_FIELD_PAIR_COUNT);
      expect(report.surfaceFlatTotalFieldCount).toBe(SURFACE_FLAT_TOTAL_FIELD_COUNT);
      expect(report.surfaceFlatFieldTrilogyComplete).toBe(SURFACE_FLAT_FIELD_TRILOGY_COMPLETE);
      expect(report.surfaceFlatReportFlatFieldCount).toBe(SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT);
      expect(report.surfaceFlatReportQuartetComplete).toBe(SURFACE_FLAT_REPORT_QUARTET_COMPLETE);
      expect(report.vitestSurfaceFlatReportTailComplete).toBe(VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE);
      expect(report.fullSurfaceTestParityComplete).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
    });

    it('unified surface flat closure derives both flat field sets from vitestSurfaceTestParity report', () => {
      const report = runVitestVerifyAudits(SRC_ROOT);
      const vs = report.vitestSurfaceTestParity;
      expect(report.fullSurfaceTestParityModuleCount).toBe(vs.moduleCount);
      expect(report.vitestSurfaceTestParityModuleCount).toBe(vs.moduleCount);
      expect(report.fullSurfaceTestParityCoveredCount).toBe(vs.coveredCount);
      expect(report.vitestSurfaceTestParityCoveredCount).toBe(vs.coveredCount);
      expect(report.fullSurfaceTestParityMissingCount).toBe(vs.missingCount);
      expect(report.vitestSurfaceTestParityMissingCount).toBe(vs.missingCount);
      expect(report.fullSurfaceTestParityComplete).toBe(vs.ok);
      expect(report.vitestSurfaceTestParityComplete).toBe(vs.ok);
      expect(report.fullSurfaceTestParityModuleCount).toBe(report.vitestSurfaceTestParityModuleCount);
      expect(report.fullSurfaceTestParityCoveredCount).toBe(report.vitestSurfaceTestParityCoveredCount);
      expect(report.fullSurfaceTestParityMissingCount).toBe(report.vitestSurfaceTestParityMissingCount);
      expect(report.fullSurfaceTestParityComplete).toBe(report.vitestSurfaceTestParityComplete);
    });

    it('runVitestVerifyAudits fails when module parity breaks', () => {
      const src = makeSrcTree({
        'shaders/gap.js': 'export const gap = 1;',
      });
      const report = runVitestVerifyAudits(src);
      expect(report.ok).toBe(false);
      expect(report.coverage.ok).toBe(false);
      expect(report.jsTestParity.ok).toBe(false);
      expect(report.fullSurfaceTestParity.ok).toBe(false);
      expect(report.missingModules).toEqual(['shaders/gap.js']);
    });

    it('exports a canonical module count matching the production tree', () => {
      expect(VITEST_COVERAGE_MODULE_COUNT).toBe(listJsModules(SRC_ROOT).length);
      expect(VITEST_COVERAGE_MODULE_COUNT).toBeGreaterThan(0);
    });

    it('includes core modules in the parity gate', () => {
      const core = listJsModules(SRC_ROOT, ['core']);
      expect(core.length).toBe(20);
      expect(findModulesMissingTests(SRC_ROOT, ['core'])).toEqual([]);
    });

    it('includes hooks modules in the parity gate', () => {
      const hooks = listJsModules(SRC_ROOT, ['hooks']);
      expect(hooks).toEqual([
        'hooks/useBetShortcuts.js',
        'hooks/useLiveClock.js',
        'hooks/usePortraitMobile.js',
        'hooks/useRoundSync.js',
        'hooks/useWebGLRecovery.js',
      ]);
      expect(findModulesMissingTests(SRC_ROOT, ['hooks'])).toEqual([]);
    });

    it('reports missing modules in synthetic trees', () => {
      const src = makeSrcTree({
        'shaders/only.js': 'export const only = 1;',
      });
      const report = auditVitestCoverage(src);
      expect(report.ok).toBe(false);
      expect(report.missing).toEqual(['shaders/only.js']);
      expect(report.moduleCount).toBe(1);
    });

    it('is wired into verify.js bundle CI gate', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain('runVitestVerifyAudits');
      expect(verifySrc).toContain('vitest audit imports hoisted before phase checks');
    });

    it('verify.js includes unified surface flat closure runtime assertion', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain('unified surface flat closure from vitestSurfaceTestParity report');
    });

    it('verify.js unified surface flat closure consolidated includes fullSurface flat fields', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain(
        'fullSurfaceTestParityCoveredCount === vitestAudits.vitestSurfaceTestParity.coveredCount',
      );
      expect(verifySrc).toContain(
        'fullSurfaceTestParityMissingCount === vitestAudits.vitestSurfaceTestParity.missingCount',
      );
      expect(verifySrc).toContain(
        'fullSurfaceTestParityModuleCount === vitestAudits.vitestSurfaceTestParity.moduleCount',
      );
      expect(verifySrc).toContain(
        'fullSurfaceTestParityComplete === vitestAudits.vitestSurfaceTestParity.ok',
      );
    });

    it('verify.js unified surface flat closure consolidated includes vitestSurface flat fields', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain(
        'vitestSurfaceTestParityModuleCount === vitestAudits.vitestSurfaceTestParity.moduleCount',
      );
      expect(verifySrc).toContain(
        'vitestSurfaceTestParityCoveredCount === vitestAudits.vitestSurfaceTestParity.coveredCount',
      );
      expect(verifySrc).toContain(
        'vitestSurfaceTestParityMissingCount === vitestAudits.vitestSurfaceTestParity.missingCount',
      );
      expect(verifySrc).toContain(
        'vitestSurfaceTestParityComplete === vitestAudits.vitestSurfaceTestParity.ok',
      );
    });

    it('verify.js unified surface flat closure consolidated includes vitest surface ok gates', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain('vitestAudits.vitestSurfaceTestParity.ok &&');
      expect(verifySrc).toContain('vitestAudits.ok === vitestAudits.vitestSurfaceTestParity.ok');
    });

    it('verify.js dedupes standalone vitest surface ok gate asserts into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity runtime ok is sole surface closure gate report').length - 1,
      ).toBe(1);
      expect(
        verifySrc.split('runVitestVerifyAudits ok gated by vitestSurfaceTestParity.ok report').length - 1,
      ).toBe(1);
    });

    it('verify.js dedupes standalone full surface parity complete milestone assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc.split('full surface test parity complete milestone report').length - 1).toBe(1);
      expect(verifySrc).toContain('FULL_SURFACE_TEST_PARITY_COMPLETE &&');
      expect(verifySrc).toContain('fullSurfaceTestParityComplete === FULL_SURFACE_TEST_PARITY_COMPLETE');
    });

    it('verify.js dedupes standalone full surface parity ok align assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc.split('full surface test parity ok matches complete milestone report').length - 1).toBe(1);
      expect(verifySrc).toContain('fullSurfaceTestParity.ok === FULL_SURFACE_TEST_PARITY_COMPLETE');
    });

    it('verify.js dedupes standalone vitest full surface ok cross align assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity ok aligns with fullSurfaceTestParity.ok report').length - 1,
      ).toBe(1);
      expect(verifySrc).toContain('vitestSurfaceTestParity.ok === vitestAudits.fullSurfaceTestParity.ok');
    });

    it('verify.js dedupes standalone vitest surface audit ok assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split(
          'vitest surface test parity audit (${vitestAudits.vitestSurfaceTestParity.coveredCount}/${vitestAudits.vitestSurfaceTestParity.moduleCount} covered) report',
        ).length - 1,
      ).toBe(1);
      expect(verifySrc).toContain('vitestAudits.vitestSurfaceTestParity.ok &&');
    });

    it('verify.js dedupes standalone vitest surface audit module count assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split(
          'vitest surface test parity audit module count (${vitestAudits.vitestSurfaceTestParity.moduleCount}/${vitestAudits.fullSurfaceTestParity.moduleCount}) report',
        ).length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'vitestSurfaceTestParity.moduleCount === vitestAudits.fullSurfaceTestParity.moduleCount',
      );
    });

    it('verify.js dedupes standalone vitest surface alias complete milestone assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc.split('vitest surface test parity alias complete milestone report').length - 1).toBe(1);
      expect(verifySrc).toContain(
        'vitestSurfaceTestParity.vitestSurfaceComplete === VITEST_SURFACE_TEST_PARITY_COMPLETE',
      );
    });

    it('verify.js dedupes standalone vitest surface complete report flag assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc.split('vitest surface test parity complete report flag report').length - 1).toBe(1);
      expect(verifySrc).toContain('vitestSurfaceTestParityComplete === VITEST_SURFACE_TEST_PARITY_COMPLETE');
    });

    it('verify.js dedupes standalone vitest surface complete cross align assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity complete aligns with fullSurfaceTestParityComplete report')
          .length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'fullSurfaceTestParityComplete === vitestAudits.vitestSurfaceTestParityComplete',
      );
    });

    it('verify.js dedupes standalone vitest surface covered cross align assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity covered aligns with fullSurfaceTestParityCoveredCount report')
          .length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'fullSurfaceTestParityCoveredCount === vitestAudits.vitestSurfaceTestParityCoveredCount',
      );
    });

    it('verify.js dedupes standalone vitest surface missing cross align assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity missing aligns with fullSurfaceTestParityMissingCount report')
          .length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'fullSurfaceTestParityMissingCount === vitestAudits.vitestSurfaceTestParityMissingCount',
      );
    });

    it('verify.js dedupes standalone full surface js and jsx milestones assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('full surface test parity js and jsx milestones report').length - 1,
      ).toBe(1);
      expect(verifySrc).toContain('vitestAudits.coverage.ok &&');
      expect(verifySrc).toContain('vitestAudits.jsxSurfaceTestParityComplete &&');
      expect(verifySrc).toContain('vitestAudits.fullSurfaceTestParityComplete &&');
    });

    it('verify.js dedupes standalone full surface module count flag assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('full surface test parity module count flag report').length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'fullSurfaceTestParityModuleCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT',
      );
    });

    it('verify.js dedupes standalone vitest surface module count alias assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity module count alias (${VITEST_SURFACE_TEST_PARITY_MODULE_COUNT}) report')
          .length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'VITEST_SURFACE_TEST_PARITY_MODULE_COUNT === FULL_SURFACE_TEST_PARITY_MODULE_COUNT',
      );
    });

    it('verify.js dedupes standalone vitest surface module count report assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity module count report (${vitestAudits.vitestSurfaceTestParityModuleCount}/${VITEST_SURFACE_TEST_PARITY_MODULE_COUNT}) report')
          .length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'vitestAudits.vitestSurfaceTestParityModuleCount === VITEST_SURFACE_TEST_PARITY_MODULE_COUNT',
      );
    });

    it('verify.js dedupes standalone vitest surface complete alias assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity complete alias (${VITEST_SURFACE_TEST_PARITY_COMPLETE}) report')
          .length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'VITEST_SURFACE_TEST_PARITY_COMPLETE === FULL_SURFACE_TEST_PARITY_COMPLETE',
      );
    });

    it('verify.js dedupes standalone vitest surface covered count alias assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity covered count alias (${VITEST_SURFACE_TEST_PARITY_COVERED_COUNT}) report')
          .length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'VITEST_SURFACE_TEST_PARITY_COVERED_COUNT === FULL_SURFACE_TEST_PARITY_COVERED_COUNT',
      );
    });

    it('verify.js dedupes standalone vitest surface missing count alias assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity missing count alias (${VITEST_SURFACE_TEST_PARITY_MISSING_COUNT}) report')
          .length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'VITEST_SURFACE_TEST_PARITY_MISSING_COUNT === FULL_SURFACE_TEST_PARITY_MISSING_COUNT',
      );
    });

    it('verify.js dedupes standalone vitest surface covered report assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity covered report (${vitestAudits.vitestSurfaceTestParityCoveredCount}/${VITEST_SURFACE_TEST_PARITY_COVERED_COUNT}) report')
          .length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'vitestAudits.vitestSurfaceTestParityCoveredCount === VITEST_SURFACE_TEST_PARITY_COVERED_COUNT',
      );
    });

    it('verify.js dedupes standalone vitest surface missing report assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface test parity missing report (${vitestAudits.vitestSurfaceTestParityMissingCount}/${VITEST_SURFACE_TEST_PARITY_MISSING_COUNT}) report')
          .length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'vitestAudits.vitestSurfaceTestParityMissingCount === VITEST_SURFACE_TEST_PARITY_MISSING_COUNT',
      );
    });

    it('verify.js includes unified surface flat closure structural symmetry assertion', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain(
        'unified surface flat closure structural symmetry from vitestSurfaceTestParity report',
      );
    });

    it('verify.js consolidated quartet closure assertion includes surfaceFlatUnifiedClosureComplete', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain(
        'surfaceFlatUnifiedClosureComplete === vitestAudits.vitestSurfaceTestParity.ok',
      );
      expect(verifySrc).toContain(
        'surfaceFlatUnifiedClosureComplete === SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE',
      );
      expect(verifySrc).toContain('SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE &&');
    });

    it('verify.js dedupes standalone unified closure milestone assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc.split('surface flat unified closure complete milestone report').length - 1).toBe(1);
      expect(verifySrc).toContain('SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE &&');
    });

    it('verify.js includes surface flat report quartet closure runtime assertion', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain('surface flat report quartet closure from runVitestVerifyAudits report');
      const trilogyClosureRenameAssertCount =
        verifySrc.split('surface flat field trilogy from runVitestVerifyAudits report').length - 1;
      expect(trilogyClosureRenameAssertCount).toBe(1);
    });

    it('verify.js guards surface flat report quartet closure vitest describe block', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const testSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.test.ts'),
        'utf8',
      );
      expect(testSrc).toContain("describe('surface flat report quartet closure'");
      expect(verifySrc).toContain('surface flat report quartet closure vitest describe block');
    });

    it('verify.js consolidated quartet closure assertion includes surfaceFlatFieldTrilogyComplete', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain('surfaceFlatFieldTrilogyComplete === SURFACE_FLAT_FIELD_TRILOGY_COMPLETE');
      expect(verifySrc).toContain('SURFACE_FLAT_FIELD_TRILOGY_COMPLETE &&');
    });

    it('verify.js dedupes standalone trilogy complete milestone assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc.split('surface flat field trilogy complete milestone report').length - 1).toBe(1);
      expect(verifySrc).toContain('SURFACE_FLAT_FIELD_TRILOGY_COMPLETE &&');
    });

    it('verify.js consolidated quartet closure assertion includes surfaceFlatFieldPairCount', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain('surfaceFlatFieldPairCount === SURFACE_FLAT_FIELD_PAIR_COUNT');
    });

    it('verify.js consolidated quartet closure assertion includes surfaceFlatTotalFieldCount', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain('surfaceFlatTotalFieldCount === SURFACE_FLAT_TOTAL_FIELD_COUNT');
      expect(verifySrc).toContain(
        'surfaceFlatFieldPairCount * 2 === vitestAudits.surfaceFlatTotalFieldCount',
      );
    });

    it('verify.js consolidated quartet closure assertion includes surfaceFlatReportFlatFieldCount', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain('surfaceFlatReportFlatFieldCount === SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT');
    });

    it('verify.js consolidated quartet closure assertion includes report flat field pair-plus-quartet align', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain(
        'surfaceFlatReportFlatFieldCount === vitestAudits.surfaceFlatFieldPairCount + 2',
      );
    });

    it('verify.js dedupes vitest surface flat report tail milestone from unified closure into quartet guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      ).replace(/\r\n/g, '\n');
      const unifiedClosureMsgIdx = verifySrc.lastIndexOf(
        "'unified surface flat closure from vitestSurfaceTestParity report'",
      );
      const unifiedClosureRuntimeAssertStart = verifySrc.lastIndexOf('assert(', unifiedClosureMsgIdx);
      const unifiedClosureRuntimeSlice = verifySrc.slice(
        unifiedClosureRuntimeAssertStart,
        unifiedClosureMsgIdx,
      );
      expect(unifiedClosureRuntimeSlice).not.toContain('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE');
      expect(unifiedClosureRuntimeSlice).not.toContain(
        'vitestAudits.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE',
      );
      expect(verifySrc).toContain(
        'unified closure runtime slice excludes vitest surface flat report tail complete align check',
      );
      expect(verifySrc).toContain(
        'vitestAudits.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE',
      );
    });

    it('verify.js dedupe-block positive slice guard confirms quartet consolidated runtime retains tail complete milestone', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      ).replace(/\r\n/g, '\n');
      const dedupeStart = verifySrc.indexOf(
        'const unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(',
      );
      const dedupeEnd = verifySrc.indexOf('const vitestAudits = runVitestVerifyAudits');
      const dedupeSlice = verifySrc.slice(dedupeStart, dedupeEnd);
      expect(dedupeSlice).toContain('quartetClosureRuntimeMsgIdx = verifySrc.lastIndexOf(');
      expect(dedupeSlice).toContain(
        'vitest surface flat report tail milestone retained in quartet consolidated guard',
      );
      const quartetClosureMsgIdx = verifySrc.lastIndexOf(
        "'surface flat report quartet closure from runVitestVerifyAudits report'",
      );
      const quartetClosureRuntimeAssertStart = verifySrc.lastIndexOf('assert(', quartetClosureMsgIdx);
      const quartetClosureRuntimeSlice = verifySrc.slice(
        quartetClosureRuntimeAssertStart,
        quartetClosureMsgIdx,
      );
      expect(quartetClosureRuntimeSlice).toContain('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE');
      expect(quartetClosureRuntimeSlice).toContain(
        'vitestAudits.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE',
      );
      expect(dedupeSlice).toContain(
        'vitest surface flat report tail complete align retained in quartet consolidated guard',
      );
    });

    it('verify.js unified closure structural section excludes vitest surface flat report tail milestone guards', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split(
          'verify unified surface flat closure consolidated includes vitest surface flat report tail complete milestone',
        ).length - 1,
      ).toBe(1);
      expect(
        verifySrc.split(
          'verify unified surface flat closure consolidated includes vitest surface flat report tail complete align',
        ).length - 1,
      ).toBe(1);
    });

    it('verify.js dedupes file-level lastIndexOf anchor structural guard into dedupe-block include guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('unified closure runtime tail dedupe guard uses lastIndexOf runtime message anchor').length - 1,
      ).toBe(1);
      expect(verifySrc).toContain('unified closure runtime tail dedupe block includes lastIndexOf message anchor');
    });

    it('verify.js dedupe-block lastIndexOf include message is sole file-level lastIndexOf anchor structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('unified closure runtime tail dedupe block includes lastIndexOf message anchor').length - 1,
      ).toBe(3);
    });

    it('verify.js quartet consolidated runtime tail retain lastIndexOf include message is sole file-level quartet lastIndexOf anchor structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('quartet consolidated runtime tail retain slice uses lastIndexOf message anchor').length - 1,
      ).toBe(4);
    });

    it('verify.js quartet consolidated runtime tail complete align retain message is sole file-level align retain structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface flat report tail complete align retained in quartet consolidated guard').length - 1,
      ).toBe(3);
    });

    it('verify.js quartet consolidated runtime tail milestone retain message is sole file-level milestone retain structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface flat report tail milestone retained in quartet consolidated guard').length - 1,
      ).toBe(4);
    });

    it('verify.js unified closure runtime tail milestone dedupe message is sole file-level milestone dedupe structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface flat report tail milestone deduped from unified closure into quartet guard').length - 1,
      ).toBe(3);
    });

    it('verify.js unified closure runtime tail align dedupe message is sole file-level align dedupe structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('unified closure runtime slice excludes vitest surface flat report tail complete align check').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block colocates unified negative tail dedupe guards before quartet positive retain guards', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const dedupeStart = verifySrc.indexOf(
        'const unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(',
      );
      const dedupeEnd = verifySrc.indexOf('const vitestAudits = runVitestVerifyAudits');
      const dedupeSlice = verifySrc.slice(dedupeStart, dedupeEnd);
      const unifiedMilestoneDedupeIdx = dedupeSlice.indexOf(
        'vitest surface flat report tail milestone deduped from unified closure into quartet guard',
      );
      const unifiedAlignDedupeIdx = dedupeSlice.indexOf(
        'unified closure runtime slice excludes vitest surface flat report tail complete align check',
      );
      const quartetMilestoneRetainIdx = dedupeSlice.indexOf(
        'vitest surface flat report tail milestone retained in quartet consolidated guard',
      );
      expect(unifiedMilestoneDedupeIdx).toBeGreaterThan(-1);
      expect(unifiedAlignDedupeIdx).toBeGreaterThan(-1);
      expect(quartetMilestoneRetainIdx).toBeGreaterThan(-1);
      expect(unifiedMilestoneDedupeIdx).toBeLessThan(quartetMilestoneRetainIdx);
      expect(unifiedAlignDedupeIdx).toBeLessThan(quartetMilestoneRetainIdx);
      expect(verifySrc).toContain(
        'unified closure negative tail dedupe guards colocated before quartet positive retain guards',
      );
    });

    it('verify.js dedupe-block colocation message is sole file-level negative-before-positive structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('unified closure negative tail dedupe guards colocated before quartet positive retain guards').length - 1,
      ).toBe(2);
    });

    it('verify.js dedupe-block orders quartet positive tail retain guards before indexOf anchor exclusion guards', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const dedupeStart = verifySrc.indexOf(
        'const unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(',
      );
      const dedupeEnd = verifySrc.indexOf('const vitestAudits = runVitestVerifyAudits');
      const dedupeSlice = verifySrc.slice(dedupeStart, dedupeEnd);
      const quartetMilestoneRetainIdx = verifySrc.indexOf(
        'vitest surface flat report tail milestone retained in quartet consolidated guard',
      );
      const quartetAlignRetainIdx = verifySrc.indexOf(
        'vitest surface flat report tail complete align retained in quartet consolidated guard',
      );
      const indexOfExclusionGuardIdx = verifySrc.indexOf('const unifiedClosureRuntimeIndexOfAnchorCount =');
      expect(quartetMilestoneRetainIdx).toBeGreaterThan(-1);
      expect(quartetAlignRetainIdx).toBeGreaterThan(-1);
      expect(indexOfExclusionGuardIdx).toBeGreaterThan(-1);
      expect(quartetMilestoneRetainIdx).toBeLessThan(indexOfExclusionGuardIdx);
      expect(quartetAlignRetainIdx).toBeLessThan(indexOfExclusionGuardIdx);
      expect(verifySrc).toContain(
        'quartet positive tail retain guards precede indexOf anchor exclusion guards',
      );
    });

    it('verify.js dedupe-block positive-before-indexof ordering message is sole file-level positive-before-indexof structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('quartet positive tail retain guards precede indexOf anchor exclusion guards').length - 1,
      ).toBe(2);
    });

    it('verify.js unified closure runtime indexOf exclusion message is sole file-level indexOf exclusion structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('unified closure runtime tail dedupe block excludes indexOf message anchor').length - 1,
      ).toBe(3);
    });

    it('verify.js quartet consolidated runtime indexOf exclusion message is sole file-level indexOf exclusion structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('quartet consolidated runtime tail retain dedupe block excludes indexOf message anchor').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block orders indexOf anchor exclusion guards before lastIndexOf include guards', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const unifiedIndexOfExclusionEndIdx = verifySrc.lastIndexOf(
        'unified closure runtime tail dedupe block excludes indexOf message anchor',
      );
      const quartetIndexOfExclusionEndIdx = verifySrc.lastIndexOf(
        'quartet consolidated runtime tail retain dedupe block excludes indexOf message anchor',
      );
      const unifiedLastIndexOfIncludeIdx = verifySrc.indexOf(
        "unifiedClosureRuntimeDedupeSlice.includes('unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(')",
      );
      const quartetLastIndexOfIncludeIdx = verifySrc.indexOf(
        "unifiedClosureRuntimeDedupeSlice.includes('quartetClosureRuntimeMsgIdx = verifySrc.lastIndexOf(')",
      );
      expect(unifiedIndexOfExclusionEndIdx).toBeGreaterThan(-1);
      expect(quartetIndexOfExclusionEndIdx).toBeGreaterThan(-1);
      expect(unifiedLastIndexOfIncludeIdx).toBeGreaterThan(-1);
      expect(quartetLastIndexOfIncludeIdx).toBeGreaterThan(-1);
      expect(unifiedIndexOfExclusionEndIdx).toBeLessThan(unifiedLastIndexOfIncludeIdx);
      expect(unifiedIndexOfExclusionEndIdx).toBeLessThan(quartetLastIndexOfIncludeIdx);
      expect(quartetIndexOfExclusionEndIdx).toBeLessThan(unifiedLastIndexOfIncludeIdx);
      expect(quartetIndexOfExclusionEndIdx).toBeLessThan(quartetLastIndexOfIncludeIdx);
      expect(verifySrc).toContain('indexOf anchor exclusion guards precede lastIndexOf include guards');
    });

    it('verify.js dedupe-block indexof-before-lastindexof ordering message is sole file-level indexof-before-lastindexof structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('indexOf anchor exclusion guards precede lastIndexOf include guards').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block orders unified lastIndexOf include guard before quartet lastIndexOf include guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const unifiedLastIndexOfIncludeEndIdx = verifySrc.lastIndexOf(
        'unified closure runtime tail dedupe block includes lastIndexOf message anchor',
      );
      const quartetLastIndexOfIncludeEndIdx = verifySrc.lastIndexOf(
        'quartet consolidated runtime tail retain slice uses lastIndexOf message anchor',
      );
      expect(unifiedLastIndexOfIncludeEndIdx).toBeGreaterThan(-1);
      expect(quartetLastIndexOfIncludeEndIdx).toBeGreaterThan(-1);
      expect(unifiedLastIndexOfIncludeEndIdx).toBeLessThan(quartetLastIndexOfIncludeEndIdx);
      expect(verifySrc).toContain('unified lastIndexOf include guard precedes quartet lastIndexOf include guard');
    });

    it('verify.js dedupe-block unified-before-quartet lastindexof ordering message is sole file-level unified-before-quartet lastindexof structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('unified lastIndexOf include guard precedes quartet lastIndexOf include guard').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block quartet lastIndexOf include guard is final guard before vitestAudits call', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const indexOfBeforeLastIndexOfOrderingEndIdx = verifySrc.lastIndexOf(
        'indexOf anchor exclusion guards precede lastIndexOf include guards',
      );
      const quartetLastIndexOfIncludeMessageInAssertIdx = verifySrc.indexOf(
        'quartet consolidated runtime tail retain slice uses lastIndexOf message anchor',
        indexOfBeforeLastIndexOfOrderingEndIdx,
      );
      const dedupeBlockTerminalOrderingEndIdx = verifySrc.lastIndexOf(
        'unified lastIndexOf include guard precedes quartet lastIndexOf include guard',
      );
      const vitestAuditsCallIdx = verifySrc.lastIndexOf(
        "const vitestAudits = runVitestVerifyAudits(path.join(__dirname, 'src'))",
      );
      expect(quartetLastIndexOfIncludeMessageInAssertIdx).toBeGreaterThan(-1);
      expect(dedupeBlockTerminalOrderingEndIdx).toBeGreaterThan(-1);
      expect(vitestAuditsCallIdx).toBeGreaterThan(-1);
      expect(quartetLastIndexOfIncludeMessageInAssertIdx).toBeLessThan(dedupeBlockTerminalOrderingEndIdx);
      expect(dedupeBlockTerminalOrderingEndIdx).toBeLessThan(vitestAuditsCallIdx);
      expect(verifySrc).toContain(
        'quartet lastIndexOf include guard is final dedupe-block guard before vitestAudits call',
      );
    });

    it('verify.js dedupe-block final boundary guard immediately precedes vitestAudits with no intervening dedupe-block asserts', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const terminalOrderingEndIdx = verifySrc.lastIndexOf(
        'unified lastIndexOf include guard precedes quartet lastIndexOf include guard',
      );
      const finalBoundaryMessageIdx = verifySrc.indexOf(
        'quartet lastIndexOf include guard is final dedupe-block guard before vitestAudits call',
        terminalOrderingEndIdx,
      );
      const finalBoundaryCloseIdx = verifySrc.indexOf(');', finalBoundaryMessageIdx);
      const interstitialGuardStartIdx = verifySrc.indexOf(
        'const dedupeBlockFinalBoundaryMessageInVerifyIdx',
        finalBoundaryCloseIdx,
      );
      const vitestAuditsCallIdx = verifySrc.lastIndexOf(
        "const vitestAudits = runVitestVerifyAudits(path.join(__dirname, 'src'))",
      );
      const immediateInterstitialSlice = verifySrc.slice(
        finalBoundaryCloseIdx,
        interstitialGuardStartIdx === -1 ? vitestAuditsCallIdx : interstitialGuardStartIdx,
      );
      expect(finalBoundaryMessageIdx).toBeGreaterThan(-1);
      expect(finalBoundaryCloseIdx).toBeGreaterThan(-1);
      expect(vitestAuditsCallIdx).toBeGreaterThan(-1);
      expect(finalBoundaryCloseIdx).toBeLessThan(vitestAuditsCallIdx);
      expect(immediateInterstitialSlice.split('assert(').length - 1).toBe(0);
      expect(immediateInterstitialSlice.includes('unifiedClosureRuntimeDedupeSlice')).toBe(false);
      expect(verifySrc).toContain(
        'final dedupe-block boundary guard immediately precedes vitestAudits call with no intervening dedupe-block asserts',
      );
    });

    it('verify.js dedupe-block quartet-lastindexof-final message is sole file-level quartet-lastindexof-final structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('quartet lastIndexOf include guard is final dedupe-block guard before vitestAudits call').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block final-boundary-interstitial message is sole file-level final-boundary-interstitial structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('final dedupe-block boundary guard immediately precedes vitestAudits call with no intervening dedupe-block asserts').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block final-boundary-interstitial guard is last assert before vitestAudits runtime call', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const terminalOrderingEndIdx = verifySrc.lastIndexOf(
        'unified lastIndexOf include guard precedes quartet lastIndexOf include guard',
      );
      const finalBoundaryCloseIdx = verifySrc.indexOf(');', verifySrc.indexOf(
        'quartet lastIndexOf include guard is final dedupe-block guard before vitestAudits call',
        terminalOrderingEndIdx,
      ));
      const interstitialMessageIdx = verifySrc.indexOf(
        'final dedupe-block boundary guard immediately precedes vitestAudits call with no intervening dedupe-block asserts',
        finalBoundaryCloseIdx,
      );
      const interstitialCloseIdx = verifySrc.indexOf(');', interstitialMessageIdx);
      const preVitestRuntimeGuardStartIdx = verifySrc.indexOf(
        'const dedupeBlockFinalBoundaryInterstitialMessageInVerifyIdx',
        interstitialCloseIdx,
      );
      const vitestAuditsCallIdx = verifySrc.lastIndexOf(
        "const vitestAudits = runVitestVerifyAudits(path.join(__dirname, 'src'))",
      );
      const preVitestRuntimeSlice = verifySrc.slice(
        interstitialCloseIdx,
        preVitestRuntimeGuardStartIdx === -1 ? vitestAuditsCallIdx : preVitestRuntimeGuardStartIdx,
      );
      expect(interstitialMessageIdx).toBeGreaterThan(-1);
      expect(interstitialCloseIdx).toBeGreaterThan(-1);
      expect(vitestAuditsCallIdx).toBeGreaterThan(-1);
      expect(interstitialCloseIdx).toBeLessThan(vitestAuditsCallIdx);
      expect(preVitestRuntimeSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'final-boundary-interstitial guard is last verify.js assert before vitestAudits runtime call',
      );
    });

    it('verify.js dedupe-block pre-vitest-last-assert message is sole file-level pre-vitest-last-assert structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('final-boundary-interstitial guard is last verify.js assert before vitestAudits runtime call').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block pre-vitest-immediate message is sole file-level pre-vitest-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('pre-vitest-last-assert guard immediately precedes vitestAudits runtime call').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block pre-vitest-last-assert guard immediately precedes vitestAudits runtime call', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const interstitialCloseIdx = verifySrc.indexOf(');', verifySrc.indexOf(
        'final dedupe-block boundary guard immediately precedes vitestAudits call with no intervening dedupe-block asserts',
        verifySrc.lastIndexOf('unified lastIndexOf include guard precedes quartet lastIndexOf include guard'),
      ));
      const preVitestLastAssertCloseIdx = verifySrc.indexOf(');', verifySrc.indexOf(
        'final-boundary-interstitial guard is last verify.js assert before vitestAudits runtime call',
        interstitialCloseIdx,
      ));
      const vitestAuditsCallIdx = verifySrc.lastIndexOf(
        "const vitestAudits = runVitestVerifyAudits(path.join(__dirname, 'src'))",
      );
      const preVitestLastAssertGuardMessageIdx = verifySrc.lastIndexOf(
        'pre-vitest-last-assert guard immediately precedes vitestAudits runtime call',
        vitestAuditsCallIdx,
      );
      const preVitestLastAssertGuardCloseIdx = verifySrc.indexOf(');', preVitestLastAssertGuardMessageIdx);
      const vitestAuditsCallImmediateSlice = verifySrc.slice(
        preVitestLastAssertGuardCloseIdx,
        vitestAuditsCallIdx,
      );
      expect(preVitestLastAssertGuardMessageIdx).toBeGreaterThan(-1);
      expect(preVitestLastAssertGuardCloseIdx).toBeGreaterThan(-1);
      expect(vitestAuditsCallIdx).toBeGreaterThan(-1);
      expect(preVitestLastAssertGuardCloseIdx).toBeLessThan(vitestAuditsCallIdx);
      expect(vitestAuditsCallImmediateSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'pre-vitest-last-assert guard immediately precedes vitestAudits runtime call',
      );
    });

    it('verify.js dedupe-block vitestAudits runtime call immediately precedes vitestAudits.ok assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const vitestAuditsCallIdx = verifySrc.lastIndexOf(
        "const vitestAudits = runVitestVerifyAudits(path.join(__dirname, 'src'))",
      );
      const vitestAuditsCallCloseIdx = verifySrc.indexOf(';', vitestAuditsCallIdx);
      const vitestAuditsOkAssertOpenIdx = verifySrc.indexOf('assert(', vitestAuditsCallCloseIdx);
      const vitestAuditsCallToOkAssertSlice = verifySrc.slice(
        vitestAuditsCallCloseIdx,
        vitestAuditsOkAssertOpenIdx,
      );
      expect(vitestAuditsCallIdx).toBeGreaterThan(-1);
      expect(vitestAuditsCallCloseIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsCallCloseIdx).toBeLessThan(vitestAuditsOkAssertOpenIdx);
      expect(vitestAuditsCallToOkAssertSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitestAudits runtime call immediately precedes vitestAudits.ok assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-immediate message is sole file-level vitest-audits-ok-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitestAudits runtime call immediately precedes vitestAudits.ok assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-immediate guard immediately precedes jsx surface probe assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceProbeAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurface.moduleCount === vitestAudits.jsxSurfaceCount',
      );
      const vitestAuditsOkImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitestAudits runtime call immediately precedes vitestAudits.ok assert',
        jsxSurfaceProbeAssertBodyIdx,
      );
      const vitestAuditsOkImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkImmediateGuardMessageIdx,
      );
      const jsxSurfaceProbeAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceProbeAssertBodyIdx,
      );
      const vitestAuditsOkImmediateToJsxSurfaceSlice = verifySrc.slice(
        vitestAuditsOkImmediateGuardCloseIdx,
        jsxSurfaceProbeAssertOpenIdx,
      );
      expect(jsxSurfaceProbeAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceProbeAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkImmediateGuardCloseIdx).toBeLessThan(jsxSurfaceProbeAssertOpenIdx);
      expect(vitestAuditsOkImmediateToJsxSurfaceSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-immediate guard immediately precedes jsx surface probe assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-immediate message is sole file-level vitest-audits-ok-jsx-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-immediate guard immediately precedes jsx surface probe assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-immediate guard immediately precedes scene jsx surface probe assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const sceneJsxSurfaceProbeAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurface.sceneCount === vitestAudits.jsxSceneSurfaceCount',
      );
      const vitestAuditsOkJsxImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-immediate guard immediately precedes jsx surface probe assert',
        sceneJsxSurfaceProbeAssertBodyIdx,
      );
      const vitestAuditsOkJsxImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxImmediateGuardMessageIdx,
      );
      const sceneJsxSurfaceProbeAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        sceneJsxSurfaceProbeAssertBodyIdx,
      );
      const vitestAuditsOkJsxImmediateToSceneSlice = verifySrc.slice(
        vitestAuditsOkJsxImmediateGuardCloseIdx,
        sceneJsxSurfaceProbeAssertOpenIdx,
      );
      expect(sceneJsxSurfaceProbeAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(sceneJsxSurfaceProbeAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxImmediateGuardCloseIdx).toBeLessThan(sceneJsxSurfaceProbeAssertOpenIdx);
      expect(vitestAuditsOkJsxImmediateToSceneSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-immediate guard immediately precedes scene jsx surface probe assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-immediate message is sole file-level vitest-audits-ok-jsx-scene-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-immediate guard immediately precedes scene jsx surface probe assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-immediate guard immediately precedes context jsx surface probe assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const contextJsxSurfaceProbeAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurface.contextCount === vitestAudits.jsxContextSurfaceCount',
      );
      const vitestAuditsOkJsxSceneImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-immediate guard immediately precedes scene jsx surface probe assert',
        contextJsxSurfaceProbeAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxSceneImmediateGuardMessageIdx,
      );
      const contextJsxSurfaceProbeAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        contextJsxSurfaceProbeAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneImmediateToContextSlice = verifySrc.slice(
        vitestAuditsOkJsxSceneImmediateGuardCloseIdx,
        contextJsxSurfaceProbeAssertOpenIdx,
      );
      expect(contextJsxSurfaceProbeAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(contextJsxSurfaceProbeAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneImmediateGuardCloseIdx).toBeLessThan(contextJsxSurfaceProbeAssertOpenIdx);
      expect(vitestAuditsOkJsxSceneImmediateToContextSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-scene-immediate guard immediately precedes context jsx surface probe assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-immediate message is sole file-level vitest-audits-ok-jsx-context-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-scene-immediate guard immediately precedes context jsx surface probe assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-immediate guard immediately precedes entry jsx surface probe assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const entryJsxSurfaceProbeAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurface.entryCount === vitestAudits.jsxEntrySurfaceCount',
      );
      const vitestAuditsOkJsxContextImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-scene-immediate guard immediately precedes context jsx surface probe assert',
        entryJsxSurfaceProbeAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxContextImmediateGuardMessageIdx,
      );
      const entryJsxSurfaceProbeAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        entryJsxSurfaceProbeAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextImmediateToEntrySlice = verifySrc.slice(
        vitestAuditsOkJsxContextImmediateGuardCloseIdx,
        entryJsxSurfaceProbeAssertOpenIdx,
      );
      expect(entryJsxSurfaceProbeAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(entryJsxSurfaceProbeAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextImmediateGuardCloseIdx).toBeLessThan(entryJsxSurfaceProbeAssertOpenIdx);
      expect(vitestAuditsOkJsxContextImmediateToEntrySlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-context-immediate guard immediately precedes entry jsx surface probe assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-immediate message is sole file-level vitest-audits-ok-jsx-entry-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-context-immediate guard immediately precedes entry jsx surface probe assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-immediate guard immediately precedes jsx surface complete assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceCompleteAssertBodyIdx = verifySrc.indexOf('vitestAudits.jsxSurfaceComplete.ok');
      const vitestAuditsOkJsxEntryImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-context-immediate guard immediately precedes entry jsx surface probe assert',
        jsxSurfaceCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryImmediateGuardMessageIdx,
      );
      const jsxSurfaceCompleteAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryImmediateToCompleteSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryImmediateGuardCloseIdx,
        jsxSurfaceCompleteAssertOpenIdx,
      );
      expect(jsxSurfaceCompleteAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceCompleteAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryImmediateGuardCloseIdx).toBeLessThan(jsxSurfaceCompleteAssertOpenIdx);
      expect(vitestAuditsOkJsxEntryImmediateToCompleteSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-immediate guard immediately precedes jsx surface complete assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-complete-immediate message is sole file-level vitest-audits-ok-jsx-complete-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-immediate guard immediately precedes jsx surface complete assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-complete-immediate guard immediately precedes js test parity scaffold assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityScaffoldAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.coverage.moduleCount === vitestAudits.moduleCount',
      );
      const vitestAuditsOkJsxCompleteImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-immediate guard immediately precedes jsx surface complete assert',
        jsTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxCompleteImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxCompleteImmediateGuardMessageIdx,
      );
      const jsTestParityScaffoldAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxCompleteImmediateToScaffoldSlice = verifySrc.slice(
        vitestAuditsOkJsxCompleteImmediateGuardCloseIdx,
        jsTestParityScaffoldAssertOpenIdx,
      );
      expect(jsTestParityScaffoldAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxCompleteImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxCompleteImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityScaffoldAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxCompleteImmediateGuardCloseIdx).toBeLessThan(jsTestParityScaffoldAssertOpenIdx);
      expect(vitestAuditsOkJsxCompleteImmediateToScaffoldSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-complete-immediate guard immediately precedes js test parity scaffold assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-parity-scaffold-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-complete-immediate guard immediately precedes js test parity scaffold assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-scaffold-immediate guard immediately precedes js test parity audit assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityAuditAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsTestParity.moduleCount === vitestAudits.moduleCount',
      );
      const vitestAuditsOkJsxParityScaffoldImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-complete-immediate guard immediately precedes js test parity scaffold assert',
        jsTestParityAuditAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityScaffoldImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityScaffoldImmediateGuardMessageIdx,
      );
      const jsTestParityAuditAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityAuditAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityScaffoldImmediateToAuditSlice = verifySrc.slice(
        vitestAuditsOkJsxParityScaffoldImmediateGuardCloseIdx,
        jsTestParityAuditAssertOpenIdx,
      );
      expect(jsTestParityAuditAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityScaffoldImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityScaffoldImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityAuditAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityScaffoldImmediateGuardCloseIdx).toBeLessThan(jsTestParityAuditAssertOpenIdx);
      expect(vitestAuditsOkJsxParityScaffoldImmediateToAuditSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-scaffold-immediate guard immediately precedes js test parity audit assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-audit-immediate message is sole file-level vitest-audits-ok-jsx-parity-audit-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-scaffold-immediate guard immediately precedes js test parity audit assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-audit-immediate guard immediately precedes js test parity gaps assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityGapsAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsTestParity.missing.length === vitestAudits.jsTestParityMissingCount',
      );
      const vitestAuditsOkJsxParityAuditImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-scaffold-immediate guard immediately precedes js test parity audit assert',
        jsTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityAuditImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityAuditImmediateGuardMessageIdx,
      );
      const jsTestParityGapsAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityAuditImmediateToGapsSlice = verifySrc.slice(
        vitestAuditsOkJsxParityAuditImmediateGuardCloseIdx,
        jsTestParityGapsAssertOpenIdx,
      );
      expect(jsTestParityGapsAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityAuditImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityAuditImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityGapsAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityAuditImmediateGuardCloseIdx).toBeLessThan(jsTestParityGapsAssertOpenIdx);
      expect(vitestAuditsOkJsxParityAuditImmediateToGapsSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-audit-immediate guard immediately precedes js test parity gaps assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-gaps-immediate message is sole file-level vitest-audits-ok-jsx-parity-gaps-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-audit-immediate guard immediately precedes js test parity gaps assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-gaps-immediate guard immediately precedes js test parity ok assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityOkAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsTestParity.ok',
      );
      const vitestAuditsOkJsxParityGapsImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-audit-immediate guard immediately precedes js test parity gaps assert',
        jsTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityGapsImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityGapsImmediateGuardMessageIdx,
      );
      const jsTestParityOkAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityGapsImmediateToOkSlice = verifySrc.slice(
        vitestAuditsOkJsxParityGapsImmediateGuardCloseIdx,
        jsTestParityOkAssertOpenIdx,
      );
      expect(jsTestParityOkAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityGapsImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityGapsImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityOkAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityGapsImmediateGuardCloseIdx).toBeLessThan(jsTestParityOkAssertOpenIdx);
      expect(vitestAuditsOkJsxParityGapsImmediateToOkSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-gaps-immediate guard immediately precedes js test parity ok assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-ok-immediate message is sole file-level vitest-audits-ok-jsx-parity-ok-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-gaps-immediate guard immediately precedes js test parity ok assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-ok-immediate guard immediately precedes js test parity complete assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityCompleteAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsTestParity.missing.length === 0',
      );
      const vitestAuditsOkJsxParityOkImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-gaps-immediate guard immediately precedes js test parity ok assert',
        jsTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityOkImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityOkImmediateGuardMessageIdx,
      );
      const jsTestParityCompleteAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityOkImmediateToCompleteSlice = verifySrc.slice(
        vitestAuditsOkJsxParityOkImmediateGuardCloseIdx,
        jsTestParityCompleteAssertOpenIdx,
      );
      expect(jsTestParityCompleteAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityOkImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityOkImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityCompleteAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityOkImmediateGuardCloseIdx).toBeLessThan(jsTestParityCompleteAssertOpenIdx);
      expect(vitestAuditsOkJsxParityOkImmediateToCompleteSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-ok-immediate guard immediately precedes js test parity complete assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-complete-immediate message is sole file-level vitest-audits-ok-jsx-parity-complete-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-ok-immediate guard immediately precedes js test parity complete assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-complete-immediate guard immediately precedes js test parity coverage alignment assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityCoverageAlignmentAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.coverage.missing.length === vitestAudits.jsTestParityMissingCount',
      );
      const vitestAuditsOkJsxParityCompleteImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-ok-immediate guard immediately precedes js test parity complete assert',
        jsTestParityCoverageAlignmentAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCompleteImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityCompleteImmediateGuardMessageIdx,
      );
      const jsTestParityCoverageAlignmentAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityCoverageAlignmentAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCompleteImmediateToCoverageAlignmentSlice = verifySrc.slice(
        vitestAuditsOkJsxParityCompleteImmediateGuardCloseIdx,
        jsTestParityCoverageAlignmentAssertOpenIdx,
      );
      expect(jsTestParityCoverageAlignmentAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCompleteImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCompleteImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityCoverageAlignmentAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCompleteImmediateGuardCloseIdx).toBeLessThan(
        jsTestParityCoverageAlignmentAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxParityCompleteImmediateToCoverageAlignmentSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-complete-immediate guard immediately precedes js test parity coverage alignment assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-coverage-alignment-immediate message is sole file-level vitest-audits-ok-jsx-parity-coverage-alignment-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-complete-immediate guard immediately precedes js test parity coverage alignment assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-coverage-alignment-immediate guard immediately precedes js test parity coverage ok assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityCoverageOkAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.coverage.ok,',
      );
      const vitestAuditsOkJsxParityCoverageAlignmentImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-complete-immediate guard immediately precedes js test parity coverage alignment assert',
        jsTestParityCoverageOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCoverageAlignmentImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityCoverageAlignmentImmediateGuardMessageIdx,
      );
      const jsTestParityCoverageOkAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityCoverageOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCoverageAlignmentImmediateToCoverageOkSlice = verifySrc.slice(
        vitestAuditsOkJsxParityCoverageAlignmentImmediateGuardCloseIdx,
        jsTestParityCoverageOkAssertOpenIdx,
      );
      expect(jsTestParityCoverageOkAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCoverageAlignmentImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCoverageAlignmentImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityCoverageOkAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCoverageAlignmentImmediateGuardCloseIdx).toBeLessThan(
        jsTestParityCoverageOkAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxParityCoverageAlignmentImmediateToCoverageOkSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-coverage-alignment-immediate guard immediately precedes js test parity coverage ok assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-coverage-ok-immediate message is sole file-level vitest-audits-ok-jsx-parity-coverage-ok-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-coverage-alignment-immediate guard immediately precedes js test parity coverage ok assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-coverage-ok-immediate guard immediately precedes js test parity balance assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityBalanceAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsTestParityCoveredCount + vitestAudits.jsTestParityMissingCount ===',
      );
      const vitestAuditsOkJsxParityCoverageOkImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-coverage-alignment-immediate guard immediately precedes js test parity coverage ok assert',
        jsTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCoverageOkImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityCoverageOkImmediateGuardMessageIdx,
      );
      const jsTestParityBalanceAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCoverageOkImmediateToBalanceSlice = verifySrc.slice(
        vitestAuditsOkJsxParityCoverageOkImmediateGuardCloseIdx,
        jsTestParityBalanceAssertOpenIdx,
      );
      expect(jsTestParityBalanceAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCoverageOkImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCoverageOkImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityBalanceAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCoverageOkImmediateGuardCloseIdx).toBeLessThan(
        jsTestParityBalanceAssertOpenIdx,
      );
      expect(vitestAuditsOkJsxParityCoverageOkImmediateToBalanceSlice.split('assert(').length - 1).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-coverage-ok-immediate guard immediately precedes js test parity balance assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-balance-immediate message is sole file-level vitest-audits-ok-jsx-parity-balance-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-coverage-ok-immediate guard immediately precedes js test parity balance assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-balance-immediate guard immediately precedes js test parity complete milestone assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityCompleteMilestoneAssertBodyIdx = verifySrc.indexOf(
        "assert(JS_TEST_PARITY_COMPLETE, 'js test parity complete milestone')",
      );
      const vitestAuditsOkJsxParityBalanceImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-coverage-ok-immediate guard immediately precedes js test parity balance assert',
        jsTestParityCompleteMilestoneAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityBalanceImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityBalanceImmediateGuardMessageIdx,
      );
      const jsTestParityCompleteMilestoneAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityCompleteMilestoneAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityBalanceImmediateToCompleteMilestoneSlice = verifySrc.slice(
        vitestAuditsOkJsxParityBalanceImmediateGuardCloseIdx,
        jsTestParityCompleteMilestoneAssertOpenIdx,
      );
      expect(jsTestParityCompleteMilestoneAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityBalanceImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityBalanceImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityCompleteMilestoneAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityBalanceImmediateGuardCloseIdx).toBeLessThan(
        jsTestParityCompleteMilestoneAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxParityBalanceImmediateToCompleteMilestoneSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-balance-immediate guard immediately precedes js test parity complete milestone assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-complete-milestone-immediate message is sole file-level vitest-audits-ok-jsx-parity-complete-milestone-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-balance-immediate guard immediately precedes js test parity complete milestone assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-complete-milestone-immediate guard immediately precedes js test parity complete flag assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityCompleteFlagAssertBodyIdx = verifySrc.indexOf(
        "'js test parity complete flag',",
      );
      const vitestAuditsOkJsxParityCompleteMilestoneImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-balance-immediate guard immediately precedes js test parity complete milestone assert',
        jsTestParityCompleteFlagAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCompleteMilestoneImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityCompleteMilestoneImmediateGuardMessageIdx,
      );
      const jsTestParityCompleteFlagAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityCompleteFlagAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCompleteMilestoneImmediateToCompleteFlagSlice = verifySrc.slice(
        vitestAuditsOkJsxParityCompleteMilestoneImmediateGuardCloseIdx,
        jsTestParityCompleteFlagAssertOpenIdx,
      );
      expect(jsTestParityCompleteFlagAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCompleteMilestoneImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCompleteMilestoneImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityCompleteFlagAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCompleteMilestoneImmediateGuardCloseIdx).toBeLessThan(
        jsTestParityCompleteFlagAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxParityCompleteMilestoneImmediateToCompleteFlagSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-complete-milestone-immediate guard immediately precedes js test parity complete flag assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-complete-flag-immediate message is sole file-level vitest-audits-ok-jsx-parity-complete-flag-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-complete-milestone-immediate guard immediately precedes js test parity complete flag assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-complete-flag-immediate guard immediately precedes js test parity ok matches complete milestone assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityOkMatchesCompleteMilestoneAssertBodyIdx = verifySrc.indexOf(
        "'js test parity ok matches complete milestone'",
      );
      const vitestAuditsOkJsxParityCompleteFlagImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-complete-milestone-immediate guard immediately precedes js test parity complete flag assert',
        jsTestParityOkMatchesCompleteMilestoneAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCompleteFlagImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityCompleteFlagImmediateGuardMessageIdx,
      );
      const jsTestParityOkMatchesCompleteMilestoneAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityOkMatchesCompleteMilestoneAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCompleteFlagImmediateToOkMatchesMilestoneSlice = verifySrc.slice(
        vitestAuditsOkJsxParityCompleteFlagImmediateGuardCloseIdx,
        jsTestParityOkMatchesCompleteMilestoneAssertOpenIdx,
      );
      expect(jsTestParityOkMatchesCompleteMilestoneAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCompleteFlagImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCompleteFlagImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityOkMatchesCompleteMilestoneAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCompleteFlagImmediateGuardCloseIdx).toBeLessThan(
        jsTestParityOkMatchesCompleteMilestoneAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxParityCompleteFlagImmediateToOkMatchesMilestoneSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-complete-flag-immediate guard immediately precedes js test parity ok matches complete milestone assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate message is sole file-level vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-complete-flag-immediate guard immediately precedes js test parity ok matches complete milestone assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate guard immediately precedes js test parity coverage ok matches complete milestone assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsTestParityCoverageOkMatchesCompleteMilestoneAssertBodyIdx = verifySrc.indexOf(
        "'js test parity coverage ok matches complete milestone'",
      );
      const vitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-complete-flag-immediate guard immediately precedes js test parity ok matches complete milestone assert',
        jsTestParityCoverageOkMatchesCompleteMilestoneAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardMessageIdx,
      );
      const jsTestParityCoverageOkMatchesCompleteMilestoneAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsTestParityCoverageOkMatchesCompleteMilestoneAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityOkMatchesMilestoneImmediateToCoverageOkMatchesMilestoneSlice = verifySrc.slice(
        vitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardCloseIdx,
        jsTestParityCoverageOkMatchesCompleteMilestoneAssertOpenIdx,
      );
      expect(jsTestParityCoverageOkMatchesCompleteMilestoneAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsTestParityCoverageOkMatchesCompleteMilestoneAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityOkMatchesMilestoneImmediateGuardCloseIdx).toBeLessThan(
        jsTestParityCoverageOkMatchesCompleteMilestoneAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxParityOkMatchesMilestoneImmediateToCoverageOkMatchesMilestoneSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate guard immediately precedes js test parity coverage ok matches complete milestone assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate message is sole file-level vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate guard immediately precedes js test parity coverage ok matches complete milestone assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate guard immediately precedes jsx ui test parity scaffold assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxUiTestParityScaffoldAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxUiTestParity.moduleCount === vitestAudits.jsxUiSurfaceCount',
      );
      const vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-ok-matches-milestone-immediate guard immediately precedes js test parity coverage ok matches complete milestone assert',
        jsxUiTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardMessageIdx,
      );
      const jsxUiTestParityScaffoldAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxUiTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateToJsxUiScaffoldSlice = verifySrc.slice(
        vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardCloseIdx,
        jsxUiTestParityScaffoldAssertOpenIdx,
      );
      expect(jsxUiTestParityScaffoldAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxUiTestParityScaffoldAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateGuardCloseIdx).toBeLessThan(
        jsxUiTestParityScaffoldAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxParityCoverageOkMatchesMilestoneImmediateToJsxUiScaffoldSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate guard immediately precedes jsx ui test parity scaffold assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ui-parity-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-ui-parity-scaffold-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate guard immediately precedes jsx ui test parity scaffold assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ui-parity-scaffold-immediate guard immediately precedes jsx ui test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxUiTestParityAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxUiTestParity.ok',
      );
      const vitestAuditsOkJsxUiParityScaffoldImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-parity-coverage-ok-matches-milestone-immediate guard immediately precedes jsx ui test parity scaffold assert',
        jsxUiTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxUiParityScaffoldImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxUiParityScaffoldImmediateGuardMessageIdx,
      );
      const jsxUiTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxUiTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxUiParityScaffoldImmediateToJsxUiParitySlice = verifySrc.slice(
        vitestAuditsOkJsxUiParityScaffoldImmediateGuardCloseIdx,
        jsxUiTestParityAssertOpenIdx,
      );
      expect(jsxUiTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityScaffoldImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityScaffoldImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxUiTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityScaffoldImmediateGuardCloseIdx).toBeLessThan(
        jsxUiTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxUiParityScaffoldImmediateToJsxUiParitySlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-ui-parity-scaffold-immediate guard immediately precedes jsx ui test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ui-parity-immediate message is sole file-level vitest-audits-ok-jsx-ui-parity-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-ui-parity-scaffold-immediate guard immediately precedes jsx ui test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ui-parity-immediate guard immediately precedes jsx ui test parity complete assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxUiTestParityCompleteAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxUiTestParity.missing.length === 0',
      );
      const vitestAuditsOkJsxUiParityImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-ui-parity-scaffold-immediate guard immediately precedes jsx ui test parity assert',
        jsxUiTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxUiParityImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxUiParityImmediateGuardMessageIdx,
      );
      const jsxUiTestParityCompleteAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxUiTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxUiParityImmediateToJsxUiParityCompleteSlice = verifySrc.slice(
        vitestAuditsOkJsxUiParityImmediateGuardCloseIdx,
        jsxUiTestParityCompleteAssertOpenIdx,
      );
      expect(jsxUiTestParityCompleteAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxUiTestParityCompleteAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityImmediateGuardCloseIdx).toBeLessThan(
        jsxUiTestParityCompleteAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxUiParityImmediateToJsxUiParityCompleteSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-ui-parity-immediate guard immediately precedes jsx ui test parity complete assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ui-parity-complete-immediate message is sole file-level vitest-audits-ok-jsx-ui-parity-complete-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-ui-parity-immediate guard immediately precedes jsx ui test parity complete assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ui-parity-complete-immediate guard immediately precedes payout toast jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const payoutToastJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'payout toast jsx test parity'",
      );
      const vitestAuditsOkJsxUiParityCompleteImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-ui-parity-immediate guard immediately precedes jsx ui test parity complete assert',
        payoutToastJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxUiParityCompleteImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxUiParityCompleteImmediateGuardMessageIdx,
      );
      const payoutToastJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        payoutToastJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxUiParityCompleteImmediateToPayoutToastSlice = verifySrc.slice(
        vitestAuditsOkJsxUiParityCompleteImmediateGuardCloseIdx,
        payoutToastJsxTestParityAssertOpenIdx,
      );
      expect(payoutToastJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityCompleteImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityCompleteImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(payoutToastJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityCompleteImmediateGuardCloseIdx).toBeLessThan(
        payoutToastJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxUiParityCompleteImmediateToPayoutToastSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-ui-parity-complete-immediate guard immediately precedes payout toast jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-payout-toast-immediate message is sole file-level vitest-audits-ok-jsx-payout-toast-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-ui-parity-complete-immediate guard immediately precedes payout toast jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-payout-toast-immediate guard immediately precedes install prompt jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const installPromptJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'install prompt jsx test parity'",
      );
      const vitestAuditsOkJsxPayoutToastImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-ui-parity-complete-immediate guard immediately precedes payout toast jsx test parity assert',
        installPromptJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxPayoutToastImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxPayoutToastImmediateGuardMessageIdx,
      );
      const installPromptJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        installPromptJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxPayoutToastImmediateToInstallPromptSlice = verifySrc.slice(
        vitestAuditsOkJsxPayoutToastImmediateGuardCloseIdx,
        installPromptJsxTestParityAssertOpenIdx,
      );
      expect(installPromptJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxPayoutToastImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxPayoutToastImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(installPromptJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxPayoutToastImmediateGuardCloseIdx).toBeLessThan(
        installPromptJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxPayoutToastImmediateToInstallPromptSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-payout-toast-immediate guard immediately precedes install prompt jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-install-prompt-immediate message is sole file-level vitest-audits-ok-jsx-install-prompt-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-payout-toast-immediate guard immediately precedes install prompt jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-install-prompt-immediate guard immediately precedes ghost bet layer jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const ghostBetLayerJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'ghost bet layer jsx test parity'",
      );
      const vitestAuditsOkJsxInstallPromptImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-payout-toast-immediate guard immediately precedes install prompt jsx test parity assert',
        ghostBetLayerJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxInstallPromptImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxInstallPromptImmediateGuardMessageIdx,
      );
      const ghostBetLayerJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        ghostBetLayerJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxInstallPromptImmediateToGhostBetLayerSlice = verifySrc.slice(
        vitestAuditsOkJsxInstallPromptImmediateGuardCloseIdx,
        ghostBetLayerJsxTestParityAssertOpenIdx,
      );
      expect(ghostBetLayerJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxInstallPromptImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxInstallPromptImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(ghostBetLayerJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxInstallPromptImmediateGuardCloseIdx).toBeLessThan(
        ghostBetLayerJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxInstallPromptImmediateToGhostBetLayerSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-install-prompt-immediate guard immediately precedes ghost bet layer jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ghost-bet-layer-immediate message is sole file-level vitest-audits-ok-jsx-ghost-bet-layer-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-install-prompt-immediate guard immediately precedes ghost bet layer jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ghost-bet-layer-immediate guard immediately precedes fairness panel jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fairnessPanelJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'fairness panel jsx test parity'",
      );
      const vitestAuditsOkJsxGhostBetLayerImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-install-prompt-immediate guard immediately precedes ghost bet layer jsx test parity assert',
        fairnessPanelJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxGhostBetLayerImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxGhostBetLayerImmediateGuardMessageIdx,
      );
      const fairnessPanelJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fairnessPanelJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxGhostBetLayerImmediateToFairnessPanelSlice = verifySrc.slice(
        vitestAuditsOkJsxGhostBetLayerImmediateGuardCloseIdx,
        fairnessPanelJsxTestParityAssertOpenIdx,
      );
      expect(fairnessPanelJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxGhostBetLayerImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxGhostBetLayerImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fairnessPanelJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxGhostBetLayerImmediateGuardCloseIdx).toBeLessThan(
        fairnessPanelJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxGhostBetLayerImmediateToFairnessPanelSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-ghost-bet-layer-immediate guard immediately precedes fairness panel jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-fairness-panel-immediate message is sole file-level vitest-audits-ok-jsx-fairness-panel-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-ghost-bet-layer-immediate guard immediately precedes fairness panel jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-fairness-panel-immediate guard immediately precedes jsx ui test parity balance assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxUiTestParityBalanceAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxUiTestParityCoveredCount + vitestAudits.jsxUiTestParityMissingCount ===',
      );
      const vitestAuditsOkJsxFairnessPanelImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-ghost-bet-layer-immediate guard immediately precedes fairness panel jsx test parity assert',
        jsxUiTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxFairnessPanelImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxFairnessPanelImmediateGuardMessageIdx,
      );
      const jsxUiTestParityBalanceAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxUiTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxFairnessPanelImmediateToJsxUiParityBalanceSlice = verifySrc.slice(
        vitestAuditsOkJsxFairnessPanelImmediateGuardCloseIdx,
        jsxUiTestParityBalanceAssertOpenIdx,
      );
      expect(jsxUiTestParityBalanceAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxFairnessPanelImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxFairnessPanelImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxUiTestParityBalanceAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxFairnessPanelImmediateGuardCloseIdx).toBeLessThan(
        jsxUiTestParityBalanceAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxFairnessPanelImmediateToJsxUiParityBalanceSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-fairness-panel-immediate guard immediately precedes jsx ui test parity balance assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ui-parity-balance-immediate message is sole file-level vitest-audits-ok-jsx-ui-parity-balance-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-fairness-panel-immediate guard immediately precedes jsx ui test parity balance assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ui-parity-balance-immediate guard immediately precedes jsx scene test parity scaffold assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSceneTestParityScaffoldAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSceneTestParity.moduleCount === vitestAudits.jsxSceneSurfaceCount',
      );
      const vitestAuditsOkJsxUiParityBalanceImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-fairness-panel-immediate guard immediately precedes jsx ui test parity balance assert',
        jsxSceneTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxUiParityBalanceImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxUiParityBalanceImmediateGuardMessageIdx,
      );
      const jsxSceneTestParityScaffoldAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSceneTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxUiParityBalanceImmediateToJsxSceneParityScaffoldSlice = verifySrc.slice(
        vitestAuditsOkJsxUiParityBalanceImmediateGuardCloseIdx,
        jsxSceneTestParityScaffoldAssertOpenIdx,
      );
      expect(jsxSceneTestParityScaffoldAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityBalanceImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityBalanceImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSceneTestParityScaffoldAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxUiParityBalanceImmediateGuardCloseIdx).toBeLessThan(
        jsxSceneTestParityScaffoldAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxUiParityBalanceImmediateToJsxSceneParityScaffoldSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-ui-parity-balance-immediate guard immediately precedes jsx scene test parity scaffold assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-parity-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-scene-parity-scaffold-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-ui-parity-balance-immediate guard immediately precedes jsx scene test parity scaffold assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-parity-scaffold-immediate guard immediately precedes jsx scene test parity gaps assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSceneTestParityGapsAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSceneTestParity.missing.length === vitestAudits.jsxSceneTestParityMissingCount',
      );
      const vitestAuditsOkJsxSceneParityScaffoldImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-ui-parity-balance-immediate guard immediately precedes jsx scene test parity scaffold assert',
        jsxSceneTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneParityScaffoldImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxSceneParityScaffoldImmediateGuardMessageIdx,
      );
      const jsxSceneTestParityGapsAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSceneTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneParityScaffoldImmediateToJsxSceneParityGapsSlice = verifySrc.slice(
        vitestAuditsOkJsxSceneParityScaffoldImmediateGuardCloseIdx,
        jsxSceneTestParityGapsAssertOpenIdx,
      );
      expect(jsxSceneTestParityGapsAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityScaffoldImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityScaffoldImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSceneTestParityGapsAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityScaffoldImmediateGuardCloseIdx).toBeLessThan(
        jsxSceneTestParityGapsAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxSceneParityScaffoldImmediateToJsxSceneParityGapsSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-scene-parity-scaffold-immediate guard immediately precedes jsx scene test parity gaps assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-parity-gaps-immediate message is sole file-level vitest-audits-ok-jsx-scene-parity-gaps-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-scene-parity-scaffold-immediate guard immediately precedes jsx scene test parity gaps assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-parity-gaps-immediate guard immediately precedes game scene jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const gameSceneJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'game scene jsx test parity'",
      );
      const vitestAuditsOkJsxSceneParityGapsImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-scene-parity-scaffold-immediate guard immediately precedes jsx scene test parity gaps assert',
        gameSceneJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneParityGapsImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxSceneParityGapsImmediateGuardMessageIdx,
      );
      const gameSceneJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        gameSceneJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneParityGapsImmediateToGameSceneSlice = verifySrc.slice(
        vitestAuditsOkJsxSceneParityGapsImmediateGuardCloseIdx,
        gameSceneJsxTestParityAssertOpenIdx,
      );
      expect(gameSceneJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityGapsImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityGapsImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(gameSceneJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityGapsImmediateGuardCloseIdx).toBeLessThan(
        gameSceneJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxSceneParityGapsImmediateToGameSceneSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-scene-parity-gaps-immediate guard immediately precedes game scene jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-game-scene-immediate message is sole file-level vitest-audits-ok-jsx-game-scene-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-scene-parity-gaps-immediate guard immediately precedes game scene jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-game-scene-immediate guard immediately precedes european wheel jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const europeanWheelJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'european wheel jsx test parity'",
      );
      const vitestAuditsOkJsxGameSceneImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-scene-parity-gaps-immediate guard immediately precedes game scene jsx test parity assert',
        europeanWheelJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxGameSceneImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxGameSceneImmediateGuardMessageIdx,
      );
      const europeanWheelJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        europeanWheelJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxGameSceneImmediateToEuropeanWheelSlice = verifySrc.slice(
        vitestAuditsOkJsxGameSceneImmediateGuardCloseIdx,
        europeanWheelJsxTestParityAssertOpenIdx,
      );
      expect(europeanWheelJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxGameSceneImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxGameSceneImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(europeanWheelJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxGameSceneImmediateGuardCloseIdx).toBeLessThan(
        europeanWheelJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxGameSceneImmediateToEuropeanWheelSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-game-scene-immediate guard immediately precedes european wheel jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-european-wheel-immediate message is sole file-level vitest-audits-ok-jsx-european-wheel-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-game-scene-immediate guard immediately precedes european wheel jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-european-wheel-immediate guard immediately precedes rapier stage jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const rapierStageJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'rapier stage jsx test parity'",
      );
      const vitestAuditsOkJsxEuropeanWheelImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-game-scene-immediate guard immediately precedes european wheel jsx test parity assert',
        rapierStageJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxEuropeanWheelImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEuropeanWheelImmediateGuardMessageIdx,
      );
      const rapierStageJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        rapierStageJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxEuropeanWheelImmediateToRapierStageSlice = verifySrc.slice(
        vitestAuditsOkJsxEuropeanWheelImmediateGuardCloseIdx,
        rapierStageJsxTestParityAssertOpenIdx,
      );
      expect(rapierStageJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEuropeanWheelImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEuropeanWheelImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(rapierStageJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEuropeanWheelImmediateGuardCloseIdx).toBeLessThan(
        rapierStageJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEuropeanWheelImmediateToRapierStageSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-european-wheel-immediate guard immediately precedes rapier stage jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-rapier-stage-immediate message is sole file-level vitest-audits-ok-jsx-rapier-stage-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-european-wheel-immediate guard immediately precedes rapier stage jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-rapier-stage-immediate guard immediately precedes roulette ball jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const rouletteBallJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'roulette ball jsx test parity'",
      );
      const vitestAuditsOkJsxRapierStageImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-european-wheel-immediate guard immediately precedes rapier stage jsx test parity assert',
        rouletteBallJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxRapierStageImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxRapierStageImmediateGuardMessageIdx,
      );
      const rouletteBallJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        rouletteBallJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxRapierStageImmediateToRouletteBallSlice = verifySrc.slice(
        vitestAuditsOkJsxRapierStageImmediateGuardCloseIdx,
        rouletteBallJsxTestParityAssertOpenIdx,
      );
      expect(rouletteBallJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxRapierStageImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxRapierStageImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(rouletteBallJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxRapierStageImmediateGuardCloseIdx).toBeLessThan(
        rouletteBallJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxRapierStageImmediateToRouletteBallSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-rapier-stage-immediate guard immediately precedes roulette ball jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-roulette-ball-immediate message is sole file-level vitest-audits-ok-jsx-roulette-ball-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-rapier-stage-immediate guard immediately precedes roulette ball jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-roulette-ball-immediate guard immediately precedes ball friction vapor jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const ballFrictionVaporJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'ball friction vapor jsx test parity'",
      );
      const vitestAuditsOkJsxRouletteBallImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-rapier-stage-immediate guard immediately precedes roulette ball jsx test parity assert',
        ballFrictionVaporJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxRouletteBallImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxRouletteBallImmediateGuardMessageIdx,
      );
      const ballFrictionVaporJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        ballFrictionVaporJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxRouletteBallImmediateToBallFrictionVaporSlice = verifySrc.slice(
        vitestAuditsOkJsxRouletteBallImmediateGuardCloseIdx,
        ballFrictionVaporJsxTestParityAssertOpenIdx,
      );
      expect(ballFrictionVaporJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxRouletteBallImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxRouletteBallImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(ballFrictionVaporJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxRouletteBallImmediateGuardCloseIdx).toBeLessThan(
        ballFrictionVaporJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxRouletteBallImmediateToBallFrictionVaporSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-roulette-ball-immediate guard immediately precedes ball friction vapor jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ball-friction-vapor-immediate message is sole file-level vitest-audits-ok-jsx-ball-friction-vapor-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-roulette-ball-immediate guard immediately precedes ball friction vapor jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-ball-friction-vapor-immediate guard immediately precedes cinematic camera jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const cinematicCameraJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'cinematic camera jsx test parity'",
      );
      const vitestAuditsOkJsxBallFrictionVaporImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-roulette-ball-immediate guard immediately precedes ball friction vapor jsx test parity assert',
        cinematicCameraJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxBallFrictionVaporImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxBallFrictionVaporImmediateGuardMessageIdx,
      );
      const cinematicCameraJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        cinematicCameraJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxBallFrictionVaporImmediateToCinematicCameraSlice = verifySrc.slice(
        vitestAuditsOkJsxBallFrictionVaporImmediateGuardCloseIdx,
        cinematicCameraJsxTestParityAssertOpenIdx,
      );
      expect(cinematicCameraJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxBallFrictionVaporImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxBallFrictionVaporImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(cinematicCameraJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxBallFrictionVaporImmediateGuardCloseIdx).toBeLessThan(
        cinematicCameraJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxBallFrictionVaporImmediateToCinematicCameraSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-ball-friction-vapor-immediate guard immediately precedes cinematic camera jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-cinematic-camera-immediate message is sole file-level vitest-audits-ok-jsx-cinematic-camera-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-ball-friction-vapor-immediate guard immediately precedes cinematic camera jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-cinematic-camera-immediate guard immediately precedes european wheel visual jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const europeanWheelVisualJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'european wheel visual jsx test parity'",
      );
      const vitestAuditsOkJsxCinematicCameraImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-ball-friction-vapor-immediate guard immediately precedes cinematic camera jsx test parity assert',
        europeanWheelVisualJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxCinematicCameraImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxCinematicCameraImmediateGuardMessageIdx,
      );
      const europeanWheelVisualJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        europeanWheelVisualJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxCinematicCameraImmediateToEuropeanWheelVisualSlice = verifySrc.slice(
        vitestAuditsOkJsxCinematicCameraImmediateGuardCloseIdx,
        europeanWheelVisualJsxTestParityAssertOpenIdx,
      );
      expect(europeanWheelVisualJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxCinematicCameraImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxCinematicCameraImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(europeanWheelVisualJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxCinematicCameraImmediateGuardCloseIdx).toBeLessThan(
        europeanWheelVisualJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxCinematicCameraImmediateToEuropeanWheelVisualSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-cinematic-camera-immediate guard immediately precedes european wheel visual jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-european-wheel-visual-immediate message is sole file-level vitest-audits-ok-jsx-european-wheel-visual-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-cinematic-camera-immediate guard immediately precedes european wheel visual jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-european-wheel-visual-immediate guard immediately precedes felt table jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const feltTableJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'felt table jsx test parity'",
      );
      const vitestAuditsOkJsxEuropeanWheelVisualImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-cinematic-camera-immediate guard immediately precedes european wheel visual jsx test parity assert',
        feltTableJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxEuropeanWheelVisualImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEuropeanWheelVisualImmediateGuardMessageIdx,
      );
      const feltTableJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        feltTableJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxEuropeanWheelVisualImmediateToFeltTableSlice = verifySrc.slice(
        vitestAuditsOkJsxEuropeanWheelVisualImmediateGuardCloseIdx,
        feltTableJsxTestParityAssertOpenIdx,
      );
      expect(feltTableJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEuropeanWheelVisualImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEuropeanWheelVisualImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(feltTableJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEuropeanWheelVisualImmediateGuardCloseIdx).toBeLessThan(
        feltTableJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEuropeanWheelVisualImmediateToFeltTableSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-european-wheel-visual-immediate guard immediately precedes felt table jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-felt-table-immediate message is sole file-level vitest-audits-ok-jsx-felt-table-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-european-wheel-visual-immediate guard immediately precedes felt table jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-felt-table-immediate guard immediately precedes floating win text jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const floatingWinTextJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'floating win text jsx test parity'",
      );
      const vitestAuditsOkJsxFeltTableImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-european-wheel-visual-immediate guard immediately precedes felt table jsx test parity assert',
        floatingWinTextJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxFeltTableImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxFeltTableImmediateGuardMessageIdx,
      );
      const floatingWinTextJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        floatingWinTextJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxFeltTableImmediateToFloatingWinTextSlice = verifySrc.slice(
        vitestAuditsOkJsxFeltTableImmediateGuardCloseIdx,
        floatingWinTextJsxTestParityAssertOpenIdx,
      );
      expect(floatingWinTextJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxFeltTableImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxFeltTableImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(floatingWinTextJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxFeltTableImmediateGuardCloseIdx).toBeLessThan(
        floatingWinTextJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxFeltTableImmediateToFloatingWinTextSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-felt-table-immediate guard immediately precedes floating win text jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-floating-win-text-immediate message is sole file-level vitest-audits-ok-jsx-floating-win-text-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-felt-table-immediate guard immediately precedes floating win text jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-floating-win-text-immediate guard immediately precedes lounge dust jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const loungeDustJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'lounge dust jsx test parity'",
      );
      const vitestAuditsOkJsxFloatingWinTextImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-felt-table-immediate guard immediately precedes floating win text jsx test parity assert',
        loungeDustJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxFloatingWinTextImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxFloatingWinTextImmediateGuardMessageIdx,
      );
      const loungeDustJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        loungeDustJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxFloatingWinTextImmediateToLoungeDustSlice = verifySrc.slice(
        vitestAuditsOkJsxFloatingWinTextImmediateGuardCloseIdx,
        loungeDustJsxTestParityAssertOpenIdx,
      );
      expect(loungeDustJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxFloatingWinTextImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxFloatingWinTextImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(loungeDustJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxFloatingWinTextImmediateGuardCloseIdx).toBeLessThan(
        loungeDustJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxFloatingWinTextImmediateToLoungeDustSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-floating-win-text-immediate guard immediately precedes lounge dust jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-lounge-dust-immediate message is sole file-level vitest-audits-ok-jsx-lounge-dust-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-floating-win-text-immediate guard immediately precedes lounge dust jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-lounge-dust-immediate guard immediately precedes material library jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const materialLibraryJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'material library jsx test parity'",
      );
      const vitestAuditsOkJsxLoungeDustImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-floating-win-text-immediate guard immediately precedes lounge dust jsx test parity assert',
        materialLibraryJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxLoungeDustImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxLoungeDustImmediateGuardMessageIdx,
      );
      const materialLibraryJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        materialLibraryJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxLoungeDustImmediateToMaterialLibrarySlice = verifySrc.slice(
        vitestAuditsOkJsxLoungeDustImmediateGuardCloseIdx,
        materialLibraryJsxTestParityAssertOpenIdx,
      );
      expect(materialLibraryJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxLoungeDustImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxLoungeDustImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(materialLibraryJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxLoungeDustImmediateGuardCloseIdx).toBeLessThan(
        materialLibraryJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxLoungeDustImmediateToMaterialLibrarySlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-lounge-dust-immediate guard immediately precedes material library jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-material-library-immediate message is sole file-level vitest-audits-ok-jsx-material-library-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-lounge-dust-immediate guard immediately precedes material library jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-material-library-immediate guard immediately precedes performance monitor jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const performanceMonitorJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'performance monitor jsx test parity'",
      );
      const vitestAuditsOkJsxMaterialLibraryImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-lounge-dust-immediate guard immediately precedes material library jsx test parity assert',
        performanceMonitorJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxMaterialLibraryImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxMaterialLibraryImmediateGuardMessageIdx,
      );
      const performanceMonitorJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        performanceMonitorJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxMaterialLibraryImmediateToPerformanceMonitorSlice = verifySrc.slice(
        vitestAuditsOkJsxMaterialLibraryImmediateGuardCloseIdx,
        performanceMonitorJsxTestParityAssertOpenIdx,
      );
      expect(performanceMonitorJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxMaterialLibraryImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxMaterialLibraryImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(performanceMonitorJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxMaterialLibraryImmediateGuardCloseIdx).toBeLessThan(
        performanceMonitorJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxMaterialLibraryImmediateToPerformanceMonitorSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-material-library-immediate guard immediately precedes performance monitor jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-performance-monitor-immediate message is sole file-level vitest-audits-ok-jsx-performance-monitor-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-material-library-immediate guard immediately precedes performance monitor jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-performance-monitor-immediate guard immediately precedes quantum probability arc jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const quantumProbabilityArcJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'quantum probability arc jsx test parity'",
      );
      const vitestAuditsOkJsxPerformanceMonitorImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-material-library-immediate guard immediately precedes performance monitor jsx test parity assert',
        quantumProbabilityArcJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxPerformanceMonitorImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxPerformanceMonitorImmediateGuardMessageIdx,
      );
      const quantumProbabilityArcJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        quantumProbabilityArcJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxPerformanceMonitorImmediateToQuantumProbabilityArcSlice = verifySrc.slice(
        vitestAuditsOkJsxPerformanceMonitorImmediateGuardCloseIdx,
        quantumProbabilityArcJsxTestParityAssertOpenIdx,
      );
      expect(quantumProbabilityArcJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxPerformanceMonitorImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxPerformanceMonitorImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(quantumProbabilityArcJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxPerformanceMonitorImmediateGuardCloseIdx).toBeLessThan(
        quantumProbabilityArcJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxPerformanceMonitorImmediateToQuantumProbabilityArcSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-performance-monitor-immediate guard immediately precedes quantum probability arc jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-quantum-probability-arc-immediate message is sole file-level vitest-audits-ok-jsx-quantum-probability-arc-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-performance-monitor-immediate guard immediately precedes quantum probability arc jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-quantum-probability-arc-immediate guard immediately precedes rim streaks jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const rimStreaksJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'rim streaks jsx test parity'",
      );
      const vitestAuditsOkJsxQuantumProbabilityArcImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-performance-monitor-immediate guard immediately precedes quantum probability arc jsx test parity assert',
        rimStreaksJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxQuantumProbabilityArcImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxQuantumProbabilityArcImmediateGuardMessageIdx,
      );
      const rimStreaksJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        rimStreaksJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxQuantumProbabilityArcImmediateToRimStreaksSlice = verifySrc.slice(
        vitestAuditsOkJsxQuantumProbabilityArcImmediateGuardCloseIdx,
        rimStreaksJsxTestParityAssertOpenIdx,
      );
      expect(rimStreaksJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxQuantumProbabilityArcImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxQuantumProbabilityArcImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(rimStreaksJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxQuantumProbabilityArcImmediateGuardCloseIdx).toBeLessThan(
        rimStreaksJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxQuantumProbabilityArcImmediateToRimStreaksSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-quantum-probability-arc-immediate guard immediately precedes rim streaks jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-rim-streaks-immediate message is sole file-level vitest-audits-ok-jsx-rim-streaks-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-quantum-probability-arc-immediate guard immediately precedes rim streaks jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-rim-streaks-immediate guard immediately precedes spark burst jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const sparkBurstJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'spark burst jsx test parity'",
      );
      const vitestAuditsOkJsxRimStreaksImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-quantum-probability-arc-immediate guard immediately precedes rim streaks jsx test parity assert',
        sparkBurstJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxRimStreaksImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxRimStreaksImmediateGuardMessageIdx,
      );
      const sparkBurstJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        sparkBurstJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxRimStreaksImmediateToSparkBurstSlice = verifySrc.slice(
        vitestAuditsOkJsxRimStreaksImmediateGuardCloseIdx,
        sparkBurstJsxTestParityAssertOpenIdx,
      );
      expect(sparkBurstJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxRimStreaksImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxRimStreaksImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(sparkBurstJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxRimStreaksImmediateGuardCloseIdx).toBeLessThan(
        sparkBurstJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxRimStreaksImmediateToSparkBurstSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-rim-streaks-immediate guard immediately precedes spark burst jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-spark-burst-immediate message is sole file-level vitest-audits-ok-jsx-spark-burst-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-rim-streaks-immediate guard immediately precedes spark burst jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-spark-burst-immediate guard immediately precedes vip lighting jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const vipLightingJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'vip lighting jsx test parity'",
      );
      const vitestAuditsOkJsxSparkBurstImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-rim-streaks-immediate guard immediately precedes spark burst jsx test parity assert',
        vipLightingJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxSparkBurstImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxSparkBurstImmediateGuardMessageIdx,
      );
      const vipLightingJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        vipLightingJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxSparkBurstImmediateToVipLightingSlice = verifySrc.slice(
        vitestAuditsOkJsxSparkBurstImmediateGuardCloseIdx,
        vipLightingJsxTestParityAssertOpenIdx,
      );
      expect(vipLightingJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSparkBurstImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSparkBurstImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(vipLightingJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSparkBurstImmediateGuardCloseIdx).toBeLessThan(
        vipLightingJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxSparkBurstImmediateToVipLightingSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-spark-burst-immediate guard immediately precedes vip lighting jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-vip-lighting-immediate message is sole file-level vitest-audits-ok-jsx-vip-lighting-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-spark-burst-immediate guard immediately precedes vip lighting jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-vip-lighting-immediate guard immediately precedes vip post fx jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const vipPostFxJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'vip post fx jsx test parity'",
      );
      const vitestAuditsOkJsxVipLightingImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-spark-burst-immediate guard immediately precedes vip lighting jsx test parity assert',
        vipPostFxJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxVipLightingImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxVipLightingImmediateGuardMessageIdx,
      );
      const vipPostFxJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        vipPostFxJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxVipLightingImmediateToVipPostFxSlice = verifySrc.slice(
        vitestAuditsOkJsxVipLightingImmediateGuardCloseIdx,
        vipPostFxJsxTestParityAssertOpenIdx,
      );
      expect(vipPostFxJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxVipLightingImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxVipLightingImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(vipPostFxJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxVipLightingImmediateGuardCloseIdx).toBeLessThan(
        vipPostFxJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxVipLightingImmediateToVipPostFxSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-vip-lighting-immediate guard immediately precedes vip post fx jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-vip-post-fx-immediate message is sole file-level vitest-audits-ok-jsx-vip-post-fx-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-vip-lighting-immediate guard immediately precedes vip post fx jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-vip-post-fx-immediate guard immediately precedes volumetric god rays jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const volumetricGodRaysJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'volumetric god rays jsx test parity'",
      );
      const vitestAuditsOkJsxVipPostFxImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-vip-lighting-immediate guard immediately precedes vip post fx jsx test parity assert',
        volumetricGodRaysJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxVipPostFxImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxVipPostFxImmediateGuardMessageIdx,
      );
      const volumetricGodRaysJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        volumetricGodRaysJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxVipPostFxImmediateToVolumetricGodRaysSlice = verifySrc.slice(
        vitestAuditsOkJsxVipPostFxImmediateGuardCloseIdx,
        volumetricGodRaysJsxTestParityAssertOpenIdx,
      );
      expect(volumetricGodRaysJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxVipPostFxImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxVipPostFxImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(volumetricGodRaysJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxVipPostFxImmediateGuardCloseIdx).toBeLessThan(
        volumetricGodRaysJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxVipPostFxImmediateToVolumetricGodRaysSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-vip-post-fx-immediate guard immediately precedes volumetric god rays jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-volumetric-god-rays-immediate message is sole file-level vitest-audits-ok-jsx-volumetric-god-rays-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-vip-post-fx-immediate guard immediately precedes volumetric god rays jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-volumetric-god-rays-immediate guard immediately precedes wheel instanced jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const wheelInstancedJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'wheel instanced jsx test parity'",
      );
      const vitestAuditsOkJsxVolumetricGodRaysImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-vip-post-fx-immediate guard immediately precedes volumetric god rays jsx test parity assert',
        wheelInstancedJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxVolumetricGodRaysImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxVolumetricGodRaysImmediateGuardMessageIdx,
      );
      const wheelInstancedJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        wheelInstancedJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxVolumetricGodRaysImmediateToWheelInstancedSlice = verifySrc.slice(
        vitestAuditsOkJsxVolumetricGodRaysImmediateGuardCloseIdx,
        wheelInstancedJsxTestParityAssertOpenIdx,
      );
      expect(wheelInstancedJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxVolumetricGodRaysImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxVolumetricGodRaysImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(wheelInstancedJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxVolumetricGodRaysImmediateGuardCloseIdx).toBeLessThan(
        wheelInstancedJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxVolumetricGodRaysImmediateToWheelInstancedSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-volumetric-god-rays-immediate guard immediately precedes wheel instanced jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-wheel-instanced-immediate message is sole file-level vitest-audits-ok-jsx-wheel-instanced-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-volumetric-god-rays-immediate guard immediately precedes wheel instanced jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-wheel-instanced-immediate guard immediately precedes wheel sector neon jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const wheelSectorNeonJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'wheel sector neon jsx test parity'",
      );
      const vitestAuditsOkJsxWheelInstancedImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-volumetric-god-rays-immediate guard immediately precedes wheel instanced jsx test parity assert',
        wheelSectorNeonJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxWheelInstancedImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxWheelInstancedImmediateGuardMessageIdx,
      );
      const wheelSectorNeonJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        wheelSectorNeonJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxWheelInstancedImmediateToWheelSectorNeonSlice = verifySrc.slice(
        vitestAuditsOkJsxWheelInstancedImmediateGuardCloseIdx,
        wheelSectorNeonJsxTestParityAssertOpenIdx,
      );
      expect(wheelSectorNeonJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxWheelInstancedImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxWheelInstancedImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(wheelSectorNeonJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxWheelInstancedImmediateGuardCloseIdx).toBeLessThan(
        wheelSectorNeonJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxWheelInstancedImmediateToWheelSectorNeonSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-wheel-instanced-immediate guard immediately precedes wheel sector neon jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-wheel-sector-neon-immediate message is sole file-level vitest-audits-ok-jsx-wheel-sector-neon-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-wheel-instanced-immediate guard immediately precedes wheel sector neon jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-wheel-sector-neon-immediate guard immediately precedes win particles jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const winParticlesJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "'win particles jsx test parity'",
      );
      const vitestAuditsOkJsxWheelSectorNeonImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-wheel-instanced-immediate guard immediately precedes wheel sector neon jsx test parity assert',
        winParticlesJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxWheelSectorNeonImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxWheelSectorNeonImmediateGuardMessageIdx,
      );
      const winParticlesJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        winParticlesJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxWheelSectorNeonImmediateToWinParticlesSlice = verifySrc.slice(
        vitestAuditsOkJsxWheelSectorNeonImmediateGuardCloseIdx,
        winParticlesJsxTestParityAssertOpenIdx,
      );
      expect(winParticlesJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxWheelSectorNeonImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxWheelSectorNeonImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(winParticlesJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxWheelSectorNeonImmediateGuardCloseIdx).toBeLessThan(
        winParticlesJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxWheelSectorNeonImmediateToWinParticlesSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-wheel-sector-neon-immediate guard immediately precedes win particles jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-win-particles-immediate message is sole file-level vitest-audits-ok-jsx-win-particles-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-wheel-sector-neon-immediate guard immediately precedes win particles jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-win-particles-immediate guard immediately precedes jsx scene test parity ok assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSceneTestParityOkAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSceneTestParity.ok',
      );
      const vitestAuditsOkJsxWinParticlesImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-wheel-sector-neon-immediate guard immediately precedes win particles jsx test parity assert',
        jsxSceneTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxWinParticlesImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxWinParticlesImmediateGuardMessageIdx,
      );
      const jsxSceneTestParityOkAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSceneTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxWinParticlesImmediateToJsxSceneTestParityOkSlice = verifySrc.slice(
        vitestAuditsOkJsxWinParticlesImmediateGuardCloseIdx,
        jsxSceneTestParityOkAssertOpenIdx,
      );
      expect(jsxSceneTestParityOkAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxWinParticlesImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxWinParticlesImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSceneTestParityOkAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxWinParticlesImmediateGuardCloseIdx).toBeLessThan(
        jsxSceneTestParityOkAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxWinParticlesImmediateToJsxSceneTestParityOkSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-win-particles-immediate guard immediately precedes jsx scene test parity ok assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-parity-ok-immediate message is sole file-level vitest-audits-ok-jsx-scene-parity-ok-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-win-particles-immediate guard immediately precedes jsx scene test parity ok assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-parity-ok-immediate guard immediately precedes jsx scene test parity complete assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSceneTestParityCompleteAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSceneTestParity.missing.length === 0',
      );
      const vitestAuditsOkJsxSceneParityOkImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-win-particles-immediate guard immediately precedes jsx scene test parity ok assert',
        jsxSceneTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneParityOkImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxSceneParityOkImmediateGuardMessageIdx,
      );
      const jsxSceneTestParityCompleteAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSceneTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneParityOkImmediateToJsxSceneTestParityCompleteSlice = verifySrc.slice(
        vitestAuditsOkJsxSceneParityOkImmediateGuardCloseIdx,
        jsxSceneTestParityCompleteAssertOpenIdx,
      );
      expect(jsxSceneTestParityCompleteAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityOkImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityOkImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSceneTestParityCompleteAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityOkImmediateGuardCloseIdx).toBeLessThan(
        jsxSceneTestParityCompleteAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxSceneParityOkImmediateToJsxSceneTestParityCompleteSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-scene-parity-ok-immediate guard immediately precedes jsx scene test parity complete assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-parity-complete-immediate message is sole file-level vitest-audits-ok-jsx-scene-parity-complete-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-scene-parity-ok-immediate guard immediately precedes jsx scene test parity complete assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-parity-complete-immediate guard immediately precedes jsx scene test parity balance assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSceneTestParityBalanceAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSceneTestParityCoveredCount + vitestAudits.jsxSceneTestParityMissingCount ===',
      );
      const vitestAuditsOkJsxSceneParityCompleteImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-scene-parity-ok-immediate guard immediately precedes jsx scene test parity complete assert',
        jsxSceneTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneParityCompleteImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxSceneParityCompleteImmediateGuardMessageIdx,
      );
      const jsxSceneTestParityBalanceAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSceneTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneParityCompleteImmediateToJsxSceneTestParityBalanceSlice = verifySrc.slice(
        vitestAuditsOkJsxSceneParityCompleteImmediateGuardCloseIdx,
        jsxSceneTestParityBalanceAssertOpenIdx,
      );
      expect(jsxSceneTestParityBalanceAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityCompleteImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityCompleteImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSceneTestParityBalanceAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityCompleteImmediateGuardCloseIdx).toBeLessThan(
        jsxSceneTestParityBalanceAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxSceneParityCompleteImmediateToJsxSceneTestParityBalanceSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-scene-parity-complete-immediate guard immediately precedes jsx scene test parity balance assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-parity-balance-immediate message is sole file-level vitest-audits-ok-jsx-scene-parity-balance-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-scene-parity-complete-immediate guard immediately precedes jsx scene test parity balance assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-scene-parity-balance-immediate guard immediately precedes jsx context test parity scaffold assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxContextTestParityScaffoldAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxContextTestParity.moduleCount === vitestAudits.jsxContextSurfaceCount',
      );
      const vitestAuditsOkJsxSceneParityBalanceImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-scene-parity-complete-immediate guard immediately precedes jsx scene test parity balance assert',
        jsxContextTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneParityBalanceImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxSceneParityBalanceImmediateGuardMessageIdx,
      );
      const jsxContextTestParityScaffoldAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxContextTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxSceneParityBalanceImmediateToJsxContextTestParityScaffoldSlice = verifySrc.slice(
        vitestAuditsOkJsxSceneParityBalanceImmediateGuardCloseIdx,
        jsxContextTestParityScaffoldAssertOpenIdx,
      );
      expect(jsxContextTestParityScaffoldAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityBalanceImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityBalanceImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxContextTestParityScaffoldAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxSceneParityBalanceImmediateGuardCloseIdx).toBeLessThan(
        jsxContextTestParityScaffoldAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxSceneParityBalanceImmediateToJsxContextTestParityScaffoldSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-scene-parity-balance-immediate guard immediately precedes jsx context test parity scaffold assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-scaffold-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-scene-parity-balance-immediate guard immediately precedes jsx context test parity scaffold assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-scaffold-immediate guard immediately precedes jsx context test parity gaps assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxContextTestParityGapsAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxContextTestParity.missing.length === vitestAudits.jsxContextTestParityMissingCount',
      );
      const vitestAuditsOkJsxContextParityScaffoldImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-scene-parity-balance-immediate guard immediately precedes jsx context test parity scaffold assert',
        jsxContextTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityScaffoldImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxContextParityScaffoldImmediateGuardMessageIdx,
      );
      const jsxContextTestParityGapsAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxContextTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityScaffoldImmediateToJsxContextTestParityGapsSlice = verifySrc.slice(
        vitestAuditsOkJsxContextParityScaffoldImmediateGuardCloseIdx,
        jsxContextTestParityGapsAssertOpenIdx,
      );
      expect(jsxContextTestParityGapsAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityScaffoldImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityScaffoldImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxContextTestParityGapsAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityScaffoldImmediateGuardCloseIdx).toBeLessThan(
        jsxContextTestParityGapsAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxContextParityScaffoldImmediateToJsxContextTestParityGapsSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-context-parity-scaffold-immediate guard immediately precedes jsx context test parity gaps assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-gaps-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-gaps-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-context-parity-scaffold-immediate guard immediately precedes jsx context test parity gaps assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-gaps-immediate guard immediately precedes game context jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const gameContextJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "!vitestAudits.jsxContextTestParity.missing.includes('context/GameContext.jsx')",
      );
      const vitestAuditsOkJsxContextParityGapsImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-context-parity-scaffold-immediate guard immediately precedes jsx context test parity gaps assert',
        gameContextJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityGapsImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxContextParityGapsImmediateGuardMessageIdx,
      );
      const gameContextJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        gameContextJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityGapsImmediateToGameContextJsxTestParitySlice = verifySrc.slice(
        vitestAuditsOkJsxContextParityGapsImmediateGuardCloseIdx,
        gameContextJsxTestParityAssertOpenIdx,
      );
      expect(gameContextJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityGapsImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityGapsImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(gameContextJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityGapsImmediateGuardCloseIdx).toBeLessThan(
        gameContextJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxContextParityGapsImmediateToGameContextJsxTestParitySlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-context-parity-gaps-immediate guard immediately precedes game context jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-context-parity-gaps-immediate guard immediately precedes game context jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate guard immediately precedes jsx context test parity ok assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxContextTestParityOkAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxContextTestParity.ok',
      );
      const vitestAuditsOkJsxContextParityGapsGameContextImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-context-parity-gaps-immediate guard immediately precedes game context jsx test parity assert',
        jsxContextTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityGapsGameContextImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxContextParityGapsGameContextImmediateGuardMessageIdx,
      );
      const jsxContextTestParityOkAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxContextTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityGapsGameContextImmediateToJsxContextTestParityOkSlice = verifySrc.slice(
        vitestAuditsOkJsxContextParityGapsGameContextImmediateGuardCloseIdx,
        jsxContextTestParityOkAssertOpenIdx,
      );
      expect(jsxContextTestParityOkAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityGapsGameContextImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityGapsGameContextImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxContextTestParityOkAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityGapsGameContextImmediateGuardCloseIdx).toBeLessThan(
        jsxContextTestParityOkAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxContextParityGapsGameContextImmediateToJsxContextTestParityOkSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate guard immediately precedes jsx context test parity ok assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-ok-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-ok-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate guard immediately precedes jsx context test parity ok assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-ok-immediate guard immediately precedes jsx context test parity complete assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxContextTestParityCompleteAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxContextTestParity.missing.length === 0',
      );
      const vitestAuditsOkJsxContextParityOkImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-context-parity-gaps-game-context-immediate guard immediately precedes jsx context test parity ok assert',
        jsxContextTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityOkImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxContextParityOkImmediateGuardMessageIdx,
      );
      const jsxContextTestParityCompleteAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxContextTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityOkImmediateToJsxContextTestParityCompleteSlice = verifySrc.slice(
        vitestAuditsOkJsxContextParityOkImmediateGuardCloseIdx,
        jsxContextTestParityCompleteAssertOpenIdx,
      );
      expect(jsxContextTestParityCompleteAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityOkImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityOkImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxContextTestParityCompleteAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityOkImmediateGuardCloseIdx).toBeLessThan(
        jsxContextTestParityCompleteAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxContextParityOkImmediateToJsxContextTestParityCompleteSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-context-parity-ok-immediate guard immediately precedes jsx context test parity complete assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-complete-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-complete-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-context-parity-ok-immediate guard immediately precedes jsx context test parity complete assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-complete-immediate guard immediately precedes jsx context test parity balance assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxContextTestParityBalanceAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxContextTestParityCoveredCount + vitestAudits.jsxContextTestParityMissingCount ===',
      );
      const vitestAuditsOkJsxContextParityCompleteImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-context-parity-ok-immediate guard immediately precedes jsx context test parity complete assert',
        jsxContextTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityCompleteImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxContextParityCompleteImmediateGuardMessageIdx,
      );
      const jsxContextTestParityBalanceAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxContextTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityCompleteImmediateToJsxContextTestParityBalanceSlice = verifySrc.slice(
        vitestAuditsOkJsxContextParityCompleteImmediateGuardCloseIdx,
        jsxContextTestParityBalanceAssertOpenIdx,
      );
      expect(jsxContextTestParityBalanceAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityCompleteImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityCompleteImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxContextTestParityBalanceAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityCompleteImmediateGuardCloseIdx).toBeLessThan(
        jsxContextTestParityBalanceAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxContextParityCompleteImmediateToJsxContextTestParityBalanceSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-context-parity-complete-immediate guard immediately precedes jsx context test parity balance assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-balance-immediate message is sole file-level vitest-audits-ok-jsx-context-parity-balance-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-context-parity-complete-immediate guard immediately precedes jsx context test parity balance assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-context-parity-balance-immediate guard immediately precedes jsx entry test parity scaffold assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxEntryTestParityScaffoldAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxEntryTestParity.moduleCount === vitestAudits.jsxEntrySurfaceCount',
      );
      const vitestAuditsOkJsxContextParityBalanceImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-context-parity-complete-immediate guard immediately precedes jsx context test parity balance assert',
        jsxEntryTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityBalanceImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxContextParityBalanceImmediateGuardMessageIdx,
      );
      const jsxEntryTestParityScaffoldAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxEntryTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxContextParityBalanceImmediateToJsxEntryTestParityScaffoldSlice = verifySrc.slice(
        vitestAuditsOkJsxContextParityBalanceImmediateGuardCloseIdx,
        jsxEntryTestParityScaffoldAssertOpenIdx,
      );
      expect(jsxEntryTestParityScaffoldAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityBalanceImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityBalanceImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxEntryTestParityScaffoldAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxContextParityBalanceImmediateGuardCloseIdx).toBeLessThan(
        jsxEntryTestParityScaffoldAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxContextParityBalanceImmediateToJsxEntryTestParityScaffoldSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-context-parity-balance-immediate guard immediately precedes jsx entry test parity scaffold assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-scaffold-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-context-parity-balance-immediate guard immediately precedes jsx entry test parity scaffold assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-scaffold-immediate guard immediately precedes jsx entry test parity gaps assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxEntryTestParityGapsAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxEntryTestParity.missing.length === vitestAudits.jsxEntryTestParityMissingCount',
      );
      const vitestAuditsOkJsxEntryParityScaffoldImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-context-parity-balance-immediate guard immediately precedes jsx entry test parity scaffold assert',
        jsxEntryTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityScaffoldImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityScaffoldImmediateGuardMessageIdx,
      );
      const jsxEntryTestParityGapsAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxEntryTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityScaffoldImmediateToJsxEntryTestParityGapsSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityScaffoldImmediateGuardCloseIdx,
        jsxEntryTestParityGapsAssertOpenIdx,
      );
      expect(jsxEntryTestParityGapsAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityScaffoldImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityScaffoldImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxEntryTestParityGapsAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityScaffoldImmediateGuardCloseIdx).toBeLessThan(
        jsxEntryTestParityGapsAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityScaffoldImmediateToJsxEntryTestParityGapsSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-scaffold-immediate guard immediately precedes jsx entry test parity gaps assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-gaps-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-gaps-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-scaffold-immediate guard immediately precedes jsx entry test parity gaps assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-gaps-immediate guard immediately precedes app entry jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const appEntryJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "!vitestAudits.jsxEntryTestParity.missing.includes('App.jsx')",
      );
      const vitestAuditsOkJsxEntryParityGapsImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-scaffold-immediate guard immediately precedes jsx entry test parity gaps assert',
        appEntryJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityGapsImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityGapsImmediateGuardMessageIdx,
      );
      const appEntryJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        appEntryJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityGapsImmediateToAppEntryJsxTestParitySlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityGapsImmediateGuardCloseIdx,
        appEntryJsxTestParityAssertOpenIdx,
      );
      expect(appEntryJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityGapsImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityGapsImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(appEntryJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityGapsImmediateGuardCloseIdx).toBeLessThan(
        appEntryJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityGapsImmediateToAppEntryJsxTestParitySlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-gaps-immediate guard immediately precedes app entry jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate guard immediately precedes main entry jsx test parity assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const mainEntryJsxTestParityAssertBodyIdx = verifySrc.indexOf(
        "!vitestAudits.jsxEntryTestParity.missing.includes('main.jsx')",
      );
      const vitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-gaps-immediate guard immediately precedes app entry jsx test parity assert',
        mainEntryJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardMessageIdx,
      );
      const mainEntryJsxTestParityAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        mainEntryJsxTestParityAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityGapsAppEntryImmediateToMainEntryJsxTestParitySlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardCloseIdx,
        mainEntryJsxTestParityAssertOpenIdx,
      );
      expect(mainEntryJsxTestParityAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(mainEntryJsxTestParityAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityGapsAppEntryImmediateGuardCloseIdx).toBeLessThan(
        mainEntryJsxTestParityAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityGapsAppEntryImmediateToMainEntryJsxTestParitySlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate guard immediately precedes main entry jsx test parity assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-gaps-immediate guard immediately precedes app entry jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate guard immediately precedes main entry jsx test parity assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate guard immediately precedes jsx entry test parity ok assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxEntryTestParityOkAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxEntryTestParity.ok',
      );
      const vitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-gaps-app-entry-immediate guard immediately precedes main entry jsx test parity assert',
        jsxEntryTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardMessageIdx,
      );
      const jsxEntryTestParityOkAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxEntryTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityGapsMainEntryImmediateToJsxEntryTestParityOkSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardCloseIdx,
        jsxEntryTestParityOkAssertOpenIdx,
      );
      expect(jsxEntryTestParityOkAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxEntryTestParityOkAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityGapsMainEntryImmediateGuardCloseIdx).toBeLessThan(
        jsxEntryTestParityOkAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityGapsMainEntryImmediateToJsxEntryTestParityOkSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate guard immediately precedes jsx entry test parity ok assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-ok-immediate guard immediately precedes jsx entry test parity complete assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxEntryTestParityCompleteAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxEntryTestParity.missing.length === 0',
      );
      const vitestAuditsOkJsxEntryParityOkImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate guard immediately precedes jsx entry test parity ok assert',
        jsxEntryTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityOkImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityOkImmediateGuardMessageIdx,
      );
      const jsxEntryTestParityCompleteAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxEntryTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityOkImmediateToJsxEntryTestParityCompleteSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityOkImmediateGuardCloseIdx,
        jsxEntryTestParityCompleteAssertOpenIdx,
      );
      expect(jsxEntryTestParityCompleteAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityOkImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityOkImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxEntryTestParityCompleteAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityOkImmediateGuardCloseIdx).toBeLessThan(
        jsxEntryTestParityCompleteAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityOkImmediateToJsxEntryTestParityCompleteSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-ok-immediate guard immediately precedes jsx entry test parity complete assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-complete-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-complete-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-ok-immediate guard immediately precedes jsx entry test parity complete assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-complete-immediate guard immediately precedes jsx entry test parity balance assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxEntryTestParityBalanceAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxEntryTestParityCoveredCount + vitestAudits.jsxEntryTestParityMissingCount ===',
      );
      const vitestAuditsOkJsxEntryParityCompleteImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-ok-immediate guard immediately precedes jsx entry test parity complete assert',
        jsxEntryTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityCompleteImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityCompleteImmediateGuardMessageIdx,
      );
      const jsxEntryTestParityBalanceAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxEntryTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityCompleteImmediateToJsxEntryTestParityBalanceSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityCompleteImmediateGuardCloseIdx,
        jsxEntryTestParityBalanceAssertOpenIdx,
      );
      expect(jsxEntryTestParityBalanceAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityCompleteImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityCompleteImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxEntryTestParityBalanceAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityCompleteImmediateGuardCloseIdx).toBeLessThan(
        jsxEntryTestParityBalanceAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityCompleteImmediateToJsxEntryTestParityBalanceSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-complete-immediate guard immediately precedes jsx entry test parity balance assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-complete-immediate guard immediately precedes jsx entry test parity balance assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-immediate guard immediately precedes jsx surface test parity scaffold assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityScaffoldAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurfaceTestParity.moduleCount === vitestAudits.jsxSurfaceCount',
      );
      const vitestAuditsOkJsxEntryParityBalanceImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-complete-immediate guard immediately precedes jsx entry test parity balance assert',
        jsxSurfaceTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityScaffoldAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityScaffoldAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceImmediateToJsxSurfaceTestParityScaffoldSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceImmediateGuardCloseIdx,
        jsxSurfaceTestParityScaffoldAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityScaffoldAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityScaffoldAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityScaffoldAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceImmediateToJsxSurfaceTestParityScaffoldSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-immediate guard immediately precedes jsx surface test parity scaffold assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-immediate guard immediately precedes jsx surface test parity scaffold assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate guard immediately precedes jsx surface test parity matches src tree assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityMatchesSrcTreeAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurfaceTestParity.moduleCount === vitestAudits.jsxSrcSurfaceCount',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-immediate guard immediately precedes jsx surface test parity scaffold assert',
        jsxSurfaceTestParityMatchesSrcTreeAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityMatchesSrcTreeAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityMatchesSrcTreeAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateToJsxSurfaceTestParityMatchesSrcTreeSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardCloseIdx,
        jsxSurfaceTestParityMatchesSrcTreeAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityMatchesSrcTreeAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityMatchesSrcTreeAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityMatchesSrcTreeAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceScaffoldImmediateToJsxSurfaceTestParityMatchesSrcTreeSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate guard immediately precedes jsx surface test parity matches src tree assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate guard immediately precedes jsx surface test parity matches src tree assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate guard immediately precedes jsx surface test parity ok assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityOkAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurfaceTestParity.ok',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-scaffold-immediate guard immediately precedes jsx surface test parity matches src tree assert',
        jsxSurfaceTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityOkAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateToJsxSurfaceTestParityOkSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardCloseIdx,
        jsxSurfaceTestParityOkAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityOkAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityOkAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityOkAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceMatchesSrcTreeImmediateToJsxSurfaceTestParityOkSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate guard immediately precedes jsx surface test parity ok assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate guard immediately precedes jsx surface test parity ok assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate guard immediately precedes jsx surface test parity complete assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityCompleteAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurfaceTestParity.missing.length === 0',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-matches-src-tree-immediate guard immediately precedes jsx surface test parity ok assert',
        jsxSurfaceTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityCompleteAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateToJsxSurfaceTestParityCompleteSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardCloseIdx,
        jsxSurfaceTestParityCompleteAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityCompleteAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityCompleteAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityCompleteAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceOkImmediateToJsxSurfaceTestParityCompleteSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate guard immediately precedes jsx surface test parity complete assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate guard immediately precedes jsx surface test parity complete assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate guard immediately precedes jsx surface test parity gaps assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityGapsAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurfaceTestParity.missing.length === vitestAudits.jsxSurfaceTestParityMissingCount',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-ok-immediate guard immediately precedes jsx surface test parity complete assert',
        jsxSurfaceTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityGapsAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateToJsxSurfaceTestParityGapsSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardCloseIdx,
        jsxSurfaceTestParityGapsAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityGapsAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityGapsAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityGapsAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteImmediateToJsxSurfaceTestParityGapsSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate guard immediately precedes jsx surface test parity gaps assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate guard immediately precedes jsx surface test parity gaps assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate guard immediately precedes jsx surface test parity balance assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityBalanceAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurfaceTestParityCoveredCount + vitestAudits.jsxSurfaceTestParityMissingCount ===',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-immediate guard immediately precedes jsx surface test parity gaps assert',
        jsxSurfaceTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityBalanceAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateToJsxSurfaceTestParityBalanceSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardCloseIdx,
        jsxSurfaceTestParityBalanceAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityBalanceAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityBalanceAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityBalanceAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceGapsImmediateToJsxSurfaceTestParityBalanceSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate guard immediately precedes jsx surface test parity balance assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate guard immediately precedes jsx surface test parity balance assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate guard immediately precedes jsx surface test parity covered assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityCoveredAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurfaceTestParityCoveredCount === JSX_SURFACE_TEST_PARITY_COVERED_COUNT',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-gaps-immediate guard immediately precedes jsx surface test parity balance assert',
        jsxSurfaceTestParityCoveredAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityCoveredAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityCoveredAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateToJsxSurfaceTestParityCoveredSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardCloseIdx,
        jsxSurfaceTestParityCoveredAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityCoveredAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityCoveredAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityCoveredAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceBalanceImmediateToJsxSurfaceTestParityCoveredSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate guard immediately precedes jsx surface test parity covered assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate guard immediately precedes jsx surface test parity covered assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate guard immediately precedes jsx surface test parity missing assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityMissingAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxSurfaceTestParityMissingCount === JSX_SURFACE_TEST_PARITY_MISSING_COUNT',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-balance-immediate guard immediately precedes jsx surface test parity covered assert',
        jsxSurfaceTestParityMissingAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityMissingAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityMissingAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateToJsxSurfaceTestParityMissingSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardCloseIdx,
        jsxSurfaceTestParityMissingAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityMissingAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityMissingAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityMissingAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceCoveredImmediateToJsxSurfaceTestParityMissingSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate guard immediately precedes jsx surface test parity missing assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate guard immediately precedes jsx surface test parity missing assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate guard immediately precedes jsx surface test parity closure assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityClosureAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsxEntryTestParityCoveredCount ===',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-covered-immediate guard immediately precedes jsx surface test parity missing assert',
        jsxSurfaceTestParityClosureAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityClosureAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityClosureAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateToJsxSurfaceTestParityClosureSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardCloseIdx,
        jsxSurfaceTestParityClosureAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityClosureAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityClosureAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityClosureAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceMissingImmediateToJsxSurfaceTestParityClosureSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate guard immediately precedes jsx surface test parity closure assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate guard immediately precedes jsx surface test parity closure assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate guard immediately precedes jsx surface test parity complete milestone assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityCompleteMilestoneAssertBodyIdx = verifySrc.indexOf(
        "assert(JSX_SURFACE_TEST_PARITY_COMPLETE, 'jsx surface test parity complete milestone')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-missing-immediate guard immediately precedes jsx surface test parity closure assert',
        jsxSurfaceTestParityCompleteMilestoneAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityCompleteMilestoneAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityCompleteMilestoneAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateToJsxSurfaceTestParityCompleteMilestoneSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardCloseIdx,
        jsxSurfaceTestParityCompleteMilestoneAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityCompleteMilestoneAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityCompleteMilestoneAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityCompleteMilestoneAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceClosureImmediateToJsxSurfaceTestParityCompleteMilestoneSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate guard immediately precedes jsx surface test parity complete milestone assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate guard immediately precedes jsx surface test parity complete milestone assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate guard immediately precedes jsx surface test parity complete flag assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityCompleteFlagAssertBodyIdx = verifySrc.indexOf(
        "'jsx surface test parity complete flag',",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-closure-immediate guard immediately precedes jsx surface test parity complete milestone assert',
        jsxSurfaceTestParityCompleteFlagAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityCompleteFlagAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityCompleteFlagAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateToJsxSurfaceTestParityCompleteFlagSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardCloseIdx,
        jsxSurfaceTestParityCompleteFlagAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityCompleteFlagAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityCompleteFlagAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityCompleteFlagAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteMilestoneImmediateToJsxSurfaceTestParityCompleteFlagSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate guard immediately precedes jsx surface test parity complete flag assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate guard immediately precedes jsx surface test parity complete flag assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate guard immediately precedes jsx surface test parity ok matches complete milestone assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertBodyIdx = verifySrc.indexOf(
        "'jsx surface test parity ok matches complete milestone'",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-milestone-immediate guard immediately precedes jsx surface test parity complete flag assert',
        jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardMessageIdx,
      );
      const jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateToOkMatchesMilestoneSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardCloseIdx,
        jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertOpenIdx,
      );
      expect(jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateGuardCloseIdx).toBeLessThan(
        jsxSurfaceTestParityOkMatchesCompleteMilestoneAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceCompleteFlagImmediateToOkMatchesMilestoneSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate guard immediately precedes jsx surface test parity ok matches complete milestone assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate guard immediately precedes jsx surface test parity ok matches complete milestone assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate guard immediately precedes full surface test parity module count assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fullSurfaceTestParityModuleCountAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.moduleCount + vitestAudits.jsxSurfaceCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-complete-flag-immediate guard immediately precedes jsx surface test parity ok matches complete milestone assert',
        fullSurfaceTestParityModuleCountAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardMessageIdx,
      );
      const fullSurfaceTestParityModuleCountAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fullSurfaceTestParityModuleCountAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateToFullSurfaceTestParityModuleCountSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardCloseIdx,
        fullSurfaceTestParityModuleCountAssertOpenIdx,
      );
      expect(fullSurfaceTestParityModuleCountAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fullSurfaceTestParityModuleCountAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateGuardCloseIdx).toBeLessThan(
        fullSurfaceTestParityModuleCountAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceOkMatchesMilestoneImmediateToFullSurfaceTestParityModuleCountSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate guard immediately precedes full surface test parity module count assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate guard immediately precedes full surface test parity module count assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate guard immediately precedes full surface test parity audit assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fullSurfaceTestParityAuditAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.fullSurfaceTestParity.moduleCount === FULL_SURFACE_TEST_PARITY_MODULE_COUNT',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-ok-matches-milestone-immediate guard immediately precedes full surface test parity module count assert',
        fullSurfaceTestParityAuditAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardMessageIdx,
      );
      const fullSurfaceTestParityAuditAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fullSurfaceTestParityAuditAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateToFullSurfaceTestParityAuditSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardCloseIdx,
        fullSurfaceTestParityAuditAssertOpenIdx,
      );
      expect(fullSurfaceTestParityAuditAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fullSurfaceTestParityAuditAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateGuardCloseIdx).toBeLessThan(
        fullSurfaceTestParityAuditAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceModuleCountImmediateToFullSurfaceTestParityAuditSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate guard immediately precedes full surface test parity audit assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate guard immediately precedes full surface test parity audit assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate guard immediately precedes full surface test parity closure assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fullSurfaceTestParityClosureAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.jsTestParityCoveredCount + vitestAudits.jsxSurfaceTestParityCoveredCount ===',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-module-count-immediate guard immediately precedes full surface test parity audit assert',
        fullSurfaceTestParityClosureAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardMessageIdx,
      );
      const fullSurfaceTestParityClosureAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fullSurfaceTestParityClosureAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateToFullSurfaceTestParityClosureSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardCloseIdx,
        fullSurfaceTestParityClosureAssertOpenIdx,
      );
      expect(fullSurfaceTestParityClosureAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fullSurfaceTestParityClosureAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateGuardCloseIdx).toBeLessThan(
        fullSurfaceTestParityClosureAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceAuditImmediateToFullSurfaceTestParityClosureSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate guard immediately precedes full surface test parity closure assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate guard immediately precedes full surface test parity closure assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate guard immediately precedes full surface test parity ok assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fullSurfaceTestParityOkAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.fullSurfaceTestParity.ok,',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-audit-immediate guard immediately precedes full surface test parity closure assert',
        fullSurfaceTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardMessageIdx,
      );
      const fullSurfaceTestParityOkAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fullSurfaceTestParityOkAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateToFullSurfaceTestParityOkSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardCloseIdx,
        fullSurfaceTestParityOkAssertOpenIdx,
      );
      expect(fullSurfaceTestParityOkAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fullSurfaceTestParityOkAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateGuardCloseIdx).toBeLessThan(
        fullSurfaceTestParityOkAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceClosureImmediateToFullSurfaceTestParityOkSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate guard immediately precedes full surface test parity ok assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate guard immediately precedes full surface test parity ok assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate guard immediately precedes full surface test parity complete assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fullSurfaceTestParityCompleteAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.fullSurfaceTestParity.missing.length === 0',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-closure-immediate guard immediately precedes full surface test parity ok assert',
        fullSurfaceTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardMessageIdx,
      );
      const fullSurfaceTestParityCompleteAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fullSurfaceTestParityCompleteAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateToFullSurfaceTestParityCompleteSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardCloseIdx,
        fullSurfaceTestParityCompleteAssertOpenIdx,
      );
      expect(fullSurfaceTestParityCompleteAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fullSurfaceTestParityCompleteAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateGuardCloseIdx).toBeLessThan(
        fullSurfaceTestParityCompleteAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceOkImmediateToFullSurfaceTestParityCompleteSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate guard immediately precedes full surface test parity complete assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate guard immediately precedes full surface test parity complete assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate guard immediately precedes full surface test parity gaps assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fullSurfaceTestParityGapsAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.fullSurfaceTestParity.missing.length === vitestAudits.fullSurfaceTestParityMissingCount',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-ok-immediate guard immediately precedes full surface test parity complete assert',
        fullSurfaceTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardMessageIdx,
      );
      const fullSurfaceTestParityGapsAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fullSurfaceTestParityGapsAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateToFullSurfaceTestParityGapsSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardCloseIdx,
        fullSurfaceTestParityGapsAssertOpenIdx,
      );
      expect(fullSurfaceTestParityGapsAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fullSurfaceTestParityGapsAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateGuardCloseIdx).toBeLessThan(
        fullSurfaceTestParityGapsAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCompleteImmediateToFullSurfaceTestParityGapsSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate guard immediately precedes full surface test parity gaps assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate guard immediately precedes full surface test parity balance assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fullSurfaceTestParityBalanceAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.fullSurfaceTestParityCoveredCount + vitestAudits.fullSurfaceTestParityMissingCount ===',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate guard immediately precedes full surface test parity gaps assert',
        fullSurfaceTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardMessageIdx,
      );
      const fullSurfaceTestParityBalanceAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fullSurfaceTestParityBalanceAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateToFullSurfaceTestParityBalanceSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardCloseIdx,
        fullSurfaceTestParityBalanceAssertOpenIdx,
      );
      expect(fullSurfaceTestParityBalanceAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fullSurfaceTestParityBalanceAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateGuardCloseIdx).toBeLessThan(
        fullSurfaceTestParityBalanceAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceGapsImmediateToFullSurfaceTestParityBalanceSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate guard immediately precedes full surface test parity balance assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate guard immediately precedes full surface test parity covered assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fullSurfaceTestParityCoveredAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.fullSurfaceTestParityCoveredCount === FULL_SURFACE_TEST_PARITY_COVERED_COUNT',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate guard immediately precedes full surface test parity balance assert',
        fullSurfaceTestParityCoveredAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardMessageIdx,
      );
      const fullSurfaceTestParityCoveredAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fullSurfaceTestParityCoveredAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateToFullSurfaceTestParityCoveredSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardCloseIdx,
        fullSurfaceTestParityCoveredAssertOpenIdx,
      );
      expect(fullSurfaceTestParityCoveredAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fullSurfaceTestParityCoveredAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateGuardCloseIdx).toBeLessThan(
        fullSurfaceTestParityCoveredAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceBalanceImmediateToFullSurfaceTestParityCoveredSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate guard immediately precedes full surface test parity covered assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate guard immediately precedes full surface test parity missing assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fullSurfaceTestParityMissingAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.fullSurfaceTestParityMissingCount === FULL_SURFACE_TEST_PARITY_MISSING_COUNT',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate guard immediately precedes full surface test parity covered assert',
        fullSurfaceTestParityMissingAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardMessageIdx,
      );
      const fullSurfaceTestParityMissingAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fullSurfaceTestParityMissingAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateToFullSurfaceTestParityMissingSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardCloseIdx,
        fullSurfaceTestParityMissingAssertOpenIdx,
      );
      expect(fullSurfaceTestParityMissingAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fullSurfaceTestParityMissingAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateGuardCloseIdx).toBeLessThan(
        fullSurfaceTestParityMissingAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceCoveredImmediateToFullSurfaceTestParityMissingSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate guard immediately precedes full surface test parity missing assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate guard immediately precedes unified surface flat closure from vitestSurfaceTestParity report assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const unifiedSurfaceFlatClosureAssertBodyIdx = verifySrc.indexOf(
        'vitestAudits.vitestSurfaceTestParity.vitestSurfaceComplete === VITEST_SURFACE_TEST_PARITY_COMPLETE',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate guard immediately precedes full surface test parity missing assert',
        unifiedSurfaceFlatClosureAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardMessageIdx,
      );
      const unifiedSurfaceFlatClosureAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        unifiedSurfaceFlatClosureAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateToUnifiedSurfaceFlatClosureSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardCloseIdx,
        unifiedSurfaceFlatClosureAssertOpenIdx,
      );
      expect(unifiedSurfaceFlatClosureAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(unifiedSurfaceFlatClosureAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateGuardCloseIdx).toBeLessThan(
        unifiedSurfaceFlatClosureAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceMissingImmediateToUnifiedSurfaceFlatClosureSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate guard immediately precedes unified surface flat closure from vitestSurfaceTestParity report assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate guard immediately precedes surface flat report quartet closure from runVitestVerifyAudits report assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const surfaceFlatReportQuartetClosureAssertBodyIdx = verifySrc.lastIndexOf(
        'vitestAudits.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE',
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate guard immediately precedes unified surface flat closure from vitestSurfaceTestParity report assert',
        surfaceFlatReportQuartetClosureAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardMessageIdx,
      );
      const surfaceFlatReportQuartetClosureAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        surfaceFlatReportQuartetClosureAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateToSurfaceFlatReportQuartetClosureSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardCloseIdx,
        surfaceFlatReportQuartetClosureAssertOpenIdx,
      );
      expect(surfaceFlatReportQuartetClosureAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(surfaceFlatReportQuartetClosureAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateGuardCloseIdx).toBeLessThan(
        surfaceFlatReportQuartetClosureAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceUnifiedClosureImmediateToSurfaceFlatReportQuartetClosureSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate guard immediately precedes surface flat report quartet closure from runVitestVerifyAudits report assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate guard immediately precedes TD-09 resolved note assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const td09ResolvedNoteAssertBodyIdx = verifySrc.indexOf(
        "techManifestSrc.includes('fairRoundStore.test.ts')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate guard immediately precedes surface flat report quartet closure from runVitestVerifyAudits report assert',
        td09ResolvedNoteAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardMessageIdx,
      );
      const td09ResolvedNoteAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        td09ResolvedNoteAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateToTd09ResolvedNoteSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardCloseIdx,
        td09ResolvedNoteAssertOpenIdx,
      );
      expect(td09ResolvedNoteAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(td09ResolvedNoteAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateGuardCloseIdx).toBeLessThan(
        td09ResolvedNoteAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceQuartetClosureImmediateToTd09ResolvedNoteSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate guard immediately precedes TD-09 resolved note assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-note-immediate guard immediately precedes TD-09 resolved assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const td09ResolvedAssertBodyIdx = verifySrc.indexOf(
        "!TECH_DEBT.some((d) => d.id === 'TD-09')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate guard immediately precedes TD-09 resolved note assert',
        td09ResolvedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardMessageIdx,
      );
      const td09ResolvedAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        td09ResolvedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateToTd09ResolvedSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardCloseIdx,
        td09ResolvedAssertOpenIdx,
      );
      expect(td09ResolvedAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(td09ResolvedAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateGuardCloseIdx).toBeLessThan(
        td09ResolvedAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedNoteImmediateToTd09ResolvedSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-note-immediate guard immediately precedes TD-09 resolved assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate guard immediately precedes TD-09 in resolved register assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const td09InResolvedRegisterAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(RESOLVED_TECH_DEBT.some((d) => d.id === 'TD-09')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate guard immediately precedes TD-09 in resolved register assert',
        td09InResolvedRegisterAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardMessageIdx,
      );
      const td09InResolvedRegisterAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        td09InResolvedRegisterAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateToTd09InResolvedRegisterSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardCloseIdx,
        td09InResolvedRegisterAssertOpenIdx,
      );
      expect(td09InResolvedRegisterAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(td09InResolvedRegisterAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateGuardCloseIdx).toBeLessThan(
        td09InResolvedRegisterAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedImmediateToTd09InResolvedRegisterSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate guard immediately precedes TD-09 in resolved register assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate guard immediately precedes authorityGuard.ts exists assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const authorityGuardTsExistsAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(fs.existsSync(path.join(__dirname, 'src/core/authorityGuard.ts')), 'authorityGuard.ts')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate guard immediately precedes authorityGuard.ts exists assert',
        authorityGuardTsExistsAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardMessageIdx,
      );
      const authorityGuardTsExistsAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        authorityGuardTsExistsAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateToAuthorityGuardTsExistsSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardCloseIdx,
        authorityGuardTsExistsAssertOpenIdx,
      );
      expect(authorityGuardTsExistsAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(authorityGuardTsExistsAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateGuardCloseIdx).toBeLessThan(
        authorityGuardTsExistsAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterImmediateToAuthorityGuardTsExistsSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate guard immediately precedes authorityGuard.ts exists assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate guard immediately precedes client startup guard wired assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const clientStartupGuardWiredAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(mainSrc.includes('runStartupAuthorityGuard'), 'client startup guard wired')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate guard immediately precedes client startup guard wired assert',
        clientStartupGuardWiredAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardMessageIdx,
      );
      const clientStartupGuardWiredAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        clientStartupGuardWiredAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateToClientStartupGuardWiredSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardCloseIdx,
        clientStartupGuardWiredAssertOpenIdx,
      );
      expect(clientStartupGuardWiredAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(clientStartupGuardWiredAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateGuardCloseIdx).toBeLessThan(
        clientStartupGuardWiredAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterAuthorityImmediateToClientStartupGuardWiredSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate guard immediately precedes client startup guard wired assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate guard immediately precedes authority server startup guard assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const authorityServerStartupGuardAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(devAuthSrc.includes('assertAuthorityStartup'), 'authority server startup guard')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate guard immediately precedes authority server startup guard assert',
        authorityServerStartupGuardAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardMessageIdx,
      );
      const authorityServerStartupGuardAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        authorityServerStartupGuardAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateToAuthorityServerStartupGuardSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardCloseIdx,
        authorityServerStartupGuardAssertOpenIdx,
      );
      expect(authorityServerStartupGuardAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(authorityServerStartupGuardAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateGuardCloseIdx).toBeLessThan(
        authorityServerStartupGuardAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterStartupImmediateToAuthorityServerStartupGuardSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate guard immediately precedes authority server startup guard assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate guard immediately precedes master secret env documented assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const masterSecretEnvDocumentedAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(devAuthSrc.includes('AUTHORITY_MASTER_SECRET'), 'master secret env documented')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate guard immediately precedes master secret env documented assert',
        masterSecretEnvDocumentedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardMessageIdx,
      );
      const masterSecretEnvDocumentedAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        masterSecretEnvDocumentedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateToMasterSecretEnvDocumentedSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardCloseIdx,
        masterSecretEnvDocumentedAssertOpenIdx,
      );
      expect(masterSecretEnvDocumentedAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(masterSecretEnvDocumentedAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateGuardCloseIdx).toBeLessThan(
        masterSecretEnvDocumentedAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterServerImmediateToMasterSecretEnvDocumentedSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate guard immediately precedes master secret env documented assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate guard immediately precedes authority guard upgrade logged assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const authorityGuardUpgradeLoggedAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(techManifestSrc.includes('authority-seed-guard'), 'authority guard upgrade logged')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate guard immediately precedes authority guard upgrade logged assert',
        authorityGuardUpgradeLoggedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardMessageIdx,
      );
      const authorityGuardUpgradeLoggedAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        authorityGuardUpgradeLoggedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateToAuthorityGuardUpgradeLoggedSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardCloseIdx,
        authorityGuardUpgradeLoggedAssertOpenIdx,
      );
      expect(authorityGuardUpgradeLoggedAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(authorityGuardUpgradeLoggedAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateGuardCloseIdx).toBeLessThan(
        authorityGuardUpgradeLoggedAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterMasterSecretImmediateToAuthorityGuardUpgradeLoggedSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate guard immediately precedes authority guard upgrade logged assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate guard immediately precedes dev demo custody allowed assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const devDemoCustodyAllowedAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(devAudit.safe && devAudit.mode === 'demo-local', 'dev demo custody allowed')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate guard immediately precedes dev demo custody allowed assert',
        devDemoCustodyAllowedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardMessageIdx,
      );
      const devDemoCustodyAllowedAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        devDemoCustodyAllowedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateToDevDemoCustodyAllowedSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardCloseIdx,
        devDemoCustodyAllowedAssertOpenIdx,
      );
      expect(devDemoCustodyAllowedAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(devDemoCustodyAllowedAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateGuardCloseIdx).toBeLessThan(
        devDemoCustodyAllowedAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterUpgradeLoggedImmediateToDevDemoCustodyAllowedSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate guard immediately precedes dev demo custody allowed assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate guard immediately precedes prod without API blocked assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const prodWithoutApiBlockedAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(!prodAudit.safe, 'prod without API blocked')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate guard immediately precedes prod without API blocked assert',
        prodWithoutApiBlockedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardMessageIdx,
      );
      const prodWithoutApiBlockedAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        prodWithoutApiBlockedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateToProdWithoutApiBlockedSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardCloseIdx,
        prodWithoutApiBlockedAssertOpenIdx,
      );
      expect(prodWithoutApiBlockedAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(prodWithoutApiBlockedAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateGuardCloseIdx).toBeLessThan(
        prodWithoutApiBlockedAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDevDemoImmediateToProdWithoutApiBlockedSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate guard immediately precedes prod without API blocked assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate guard immediately precedes prod demo custody opt-in allowed assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const prodDemoCustodyOptInAllowedAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(prodDemoAudit.safe, 'prod demo custody opt-in allowed')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate guard immediately precedes prod demo custody opt-in allowed assert',
        prodDemoCustodyOptInAllowedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardMessageIdx,
      );
      const prodDemoCustodyOptInAllowedAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        prodDemoCustodyOptInAllowedAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateToProdDemoCustodyOptInAllowedSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardCloseIdx,
        prodDemoCustodyOptInAllowedAssertOpenIdx,
      );
      expect(prodDemoCustodyOptInAllowedAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(prodDemoCustodyOptInAllowedAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateGuardCloseIdx).toBeLessThan(
        prodDemoCustodyOptInAllowedAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdBlockedImmediateToProdDemoCustodyOptInAllowedSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate guard immediately precedes prod demo custody opt-in allowed assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate guard immediately precedes prod with API passes assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const prodWithApiPassesAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(() => assertProductionSeedCustody({ PROD: true, VITE_API_BASE: 'http://127.0.0.1:8787' }) === undefined, 'prod with API passes')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate guard immediately precedes prod with API passes assert',
        prodWithApiPassesAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardMessageIdx,
      );
      const prodWithApiPassesAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        prodWithApiPassesAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateToProdWithApiPassesSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardCloseIdx,
        prodWithApiPassesAssertOpenIdx,
      );
      expect(prodWithApiPassesAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(prodWithApiPassesAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateGuardCloseIdx).toBeLessThan(
        prodWithApiPassesAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdDemoOptInImmediateToProdWithApiPassesSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate guard immediately precedes prod with API passes assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate guard immediately precedes vercel.json for static demo deploy assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const vercelJsonForStaticDemoDeployAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(fs.existsSync(path.join(__dirname, 'vercel.json')), 'vercel.json for static demo deploy')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate guard immediately precedes vercel.json for static demo deploy assert',
        vercelJsonForStaticDemoDeployAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardMessageIdx,
      );
      const vercelJsonForStaticDemoDeployAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        vercelJsonForStaticDemoDeployAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateToVercelJsonForStaticDemoDeploySlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardCloseIdx,
        vercelJsonForStaticDemoDeployAssertOpenIdx,
      );
      expect(vercelJsonForStaticDemoDeployAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(vercelJsonForStaticDemoDeployAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateGuardCloseIdx).toBeLessThan(
        vercelJsonForStaticDemoDeployAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterProdApiPassesImmediateToVercelJsonForStaticDemoDeploySlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate guard immediately precedes vercel.json for static demo deploy assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate guard immediately precedes demo custody badge assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const demoCustodyBadgeAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(demoBadge.badge === 'demo' && demoBadge.label === 'Demo', 'demo custody badge')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate guard immediately precedes demo custody badge assert',
        demoCustodyBadgeAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardMessageIdx,
      );
      const demoCustodyBadgeAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        demoCustodyBadgeAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateToDemoCustodyBadgeSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardCloseIdx,
        demoCustodyBadgeAssertOpenIdx,
      );
      expect(demoCustodyBadgeAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(demoCustodyBadgeAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateGuardCloseIdx).toBeLessThan(
        demoCustodyBadgeAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterVercelDeployImmediateToDemoCustodyBadgeSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate guard immediately precedes demo custody badge assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate guard immediately precedes fairness custody badge CSS class assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fairnessCustodyBadgeCssClassAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(fairnessSrc.includes('fairness-custody-badge'), 'fairness custody badge CSS class')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate guard immediately precedes fairness custody badge CSS class assert',
        fairnessCustodyBadgeCssClassAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardMessageIdx,
      );
      const fairnessCustodyBadgeCssClassAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fairnessCustodyBadgeCssClassAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateToFairnessCustodyBadgeCssClassSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardCloseIdx,
        fairnessCustodyBadgeCssClassAssertOpenIdx,
      );
      expect(fairnessCustodyBadgeCssClassAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fairnessCustodyBadgeCssClassAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateGuardCloseIdx).toBeLessThan(
        fairnessCustodyBadgeCssClassAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterDemoCustodyBadgeImmediateToFairnessCustodyBadgeCssClassSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate guard immediately precedes fairness custody badge CSS class assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate guard immediately precedes FairnessPanel custody badge prop assert', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fairnessPanelCustodyBadgePropAssertBodyIdx = verifySrc.lastIndexOf(
        "assert(fairnessSrc.includes('custodyBadge'), 'FairnessPanel custody badge prop')",
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardMessageIdx = verifySrc.lastIndexOf(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate guard immediately precedes FairnessPanel custody badge prop assert',
        fairnessPanelCustodyBadgePropAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardCloseIdx = verifySrc.indexOf(
        ');',
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardMessageIdx,
      );
      const fairnessPanelCustodyBadgePropAssertOpenIdx = verifySrc.lastIndexOf(
        'assert(',
        fairnessPanelCustodyBadgePropAssertBodyIdx,
      );
      const vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateToFairnessPanelCustodyBadgePropSlice = verifySrc.slice(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardCloseIdx,
        fairnessPanelCustodyBadgePropAssertOpenIdx,
      );
      expect(fairnessPanelCustodyBadgePropAssertBodyIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardMessageIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardCloseIdx).toBeGreaterThan(-1);
      expect(fairnessPanelCustodyBadgePropAssertOpenIdx).toBeGreaterThan(-1);
      expect(vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateGuardCloseIdx).toBeLessThan(
        fairnessPanelCustodyBadgePropAssertOpenIdx,
      );
      expect(
        vitestAuditsOkJsxEntryParityBalanceSurfaceFullSurfaceTd09ResolvedResolvedRegisterFairnessCustodyCssImmediateToFairnessPanelCustodyBadgePropSlice.split('assert(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate guard immediately precedes FairnessPanel custody badge prop assert',
      );
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-custody-badge-prop-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-custody-badge-prop-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate guard immediately precedes FairnessPanel custody badge prop assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-fairness-custody-css-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate guard immediately precedes fairness custody badge CSS class assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-demo-custody-badge-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate guard immediately precedes demo custody badge assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-vercel-deploy-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate guard immediately precedes vercel.json for static demo deploy assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-api-passes-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate guard immediately precedes prod with API passes assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-demo-opt-in-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate guard immediately precedes prod demo custody opt-in allowed assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-prod-blocked-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate guard immediately precedes prod without API blocked assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-dev-demo-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate guard immediately precedes dev demo custody allowed assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-upgrade-logged-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate guard immediately precedes authority guard upgrade logged assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-master-secret-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate guard immediately precedes master secret env documented assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-server-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate guard immediately precedes authority server startup guard assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-startup-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate guard immediately precedes client startup guard wired assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-authority-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate guard immediately precedes authorityGuard.ts exists assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-resolved-register-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate guard immediately precedes TD-09 in resolved register assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-note-immediate guard immediately precedes TD-09 resolved assert').length - 1,
      ).toBe(2);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-note-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-td09-resolved-note-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate guard immediately precedes TD-09 resolved note assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-quartet-closure-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate guard immediately precedes surface flat report quartet closure from runVitestVerifyAudits report assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-unified-closure-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate guard immediately precedes unified surface flat closure from vitestSurfaceTestParity report assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-missing-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate guard immediately precedes full surface test parity missing assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-covered-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate guard immediately precedes full surface test parity covered assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-balance-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate guard immediately precedes full surface test parity balance assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-gaps-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-balance-surface-full-surface-complete-immediate guard immediately precedes full surface test parity gaps assert').length - 1,
      ).toBe(3);
    });

    it('verify.js dedupe-block vitest-audits-ok-jsx-entry-parity-ok-immediate message is sole file-level vitest-audits-ok-jsx-entry-parity-ok-immediate structural check', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest-audits-ok-jsx-entry-parity-gaps-main-entry-immediate guard immediately precedes jsx entry test parity ok assert').length - 1,
      ).toBe(3);
    });

    it('verify.js structural section excludes file-level verifySrc.includes lastIndexOf anchor pattern', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const structuralStart = verifySrc.indexOf(
        "verifySrc.includes('unified surface flat closure from vitestSurfaceTestParity report')",
      );
      const structuralEnd = verifySrc.lastIndexOf('const vitestCoverageTestSrc = fs.readFileSync');
      const structuralSlice = verifySrc.slice(structuralStart, structuralEnd);
      expect(
        structuralSlice.split(
          "verifySrc.includes('unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(')",
        ).length - 1,
      ).toBe(1);
    });

    it('verify.js structural section excludes file-level verifySrc.includes quartetClosureRuntimeMsgIdx lastIndexOf anchor pattern', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const structuralStart = verifySrc.indexOf(
        "verifySrc.includes('unified surface flat closure from vitestSurfaceTestParity report')",
      );
      const structuralEnd = verifySrc.lastIndexOf('const vitestCoverageTestSrc = fs.readFileSync');
      const structuralSlice = verifySrc.slice(structuralStart, structuralEnd);
      expect(
        structuralSlice.split(
          "verifySrc.includes('quartetClosureRuntimeMsgIdx = verifySrc.lastIndexOf(')",
        ).length - 1,
      ).toBe(1);
    });

    it('verify.js unified closure runtime tail dedupe block excludes indexOf message anchor', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const dedupeStart = verifySrc.indexOf(
        'const unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(',
      );
      const dedupeEnd = verifySrc.indexOf('const vitestAudits = runVitestVerifyAudits');
      const dedupeSlice = verifySrc.slice(dedupeStart, dedupeEnd);
      expect(
        dedupeSlice.split('unifiedClosureRuntimeMsgIdx = verifySrc.indexOf(').length - 1,
      ).toBe(0);
    });

    it('verify.js dedupe-block excludes indexOf message anchor for quartet consolidated runtime tail retain slice', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const dedupeStart = verifySrc.indexOf(
        'const unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(',
      );
      const dedupeEnd = verifySrc.indexOf('const vitestAudits = runVitestVerifyAudits');
      const dedupeSlice = verifySrc.slice(dedupeStart, dedupeEnd);
      expect(
        dedupeSlice.split('quartetClosureRuntimeMsgIdx = verifySrc.indexOf(').length - 1,
      ).toBe(0);
      expect(verifySrc).toContain(
        'quartet consolidated runtime tail retain dedupe block excludes indexOf message anchor',
      );
    });

    it('verify.js unified closure runtime tail dedupe block includes lastIndexOf message anchor', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const dedupeStart = verifySrc.indexOf(
        'const unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(',
      );
      const dedupeEnd = verifySrc.indexOf('const vitestAudits = runVitestVerifyAudits');
      const dedupeSlice = verifySrc.slice(dedupeStart, dedupeEnd);
      expect(dedupeSlice).toContain('unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(');
    });

    it('verify.js dedupe-block include guard confirms quartet consolidated runtime tail retain slice uses lastIndexOf message anchor', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const dedupeStart = verifySrc.indexOf(
        'const unifiedClosureRuntimeMsgIdx = verifySrc.lastIndexOf(',
      );
      const dedupeEnd = verifySrc.indexOf('const vitestAudits = runVitestVerifyAudits');
      const dedupeSlice = verifySrc.slice(dedupeStart, dedupeEnd);
      expect(dedupeSlice).toContain('quartetClosureRuntimeMsgIdx = verifySrc.lastIndexOf(');
      expect(verifySrc).toContain(
        'quartet consolidated runtime tail retain slice uses lastIndexOf message anchor',
      );
    });

    it('verify.js consolidated quartet closure assertion includes vitestSurfaceFlatReportTailComplete', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      ).replace(/\r\n/g, '\n');
      const unifiedRuntimeEnd = verifySrc.lastIndexOf(
        "'unified surface flat closure from vitestSurfaceTestParity report'",
      );
      const quartetRuntimeStart = verifySrc.indexOf('assert(', unifiedRuntimeEnd);
      const quartetMsgIdx = verifySrc.indexOf(
        'surface flat report quartet closure from runVitestVerifyAudits report',
        quartetRuntimeStart,
      );
      const quartetSlice = verifySrc.slice(quartetRuntimeStart, quartetMsgIdx);
      expect(quartetSlice).toContain('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE &&');
      expect(quartetSlice).toContain(
        'vitestAudits.vitestSurfaceFlatReportTailComplete === VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE',
      );
    });

    it('verify.js quartet closure structural section retains vitest surface flat report tail milestone guards', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split(
          'verify surface flat report quartet closure consolidated includes vitest surface flat report tail complete milestone',
        ).length - 1,
      ).toBe(2);
      expect(
        verifySrc.split(
          'verify surface flat report quartet closure consolidated includes vitest surface flat report tail complete align',
        ).length - 1,
      ).toBe(2);
    });

    it('verify.js consolidated quartet closure assertion includes surfaceFlatReportQuartetComplete', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain('surfaceFlatReportQuartetComplete === SURFACE_FLAT_REPORT_QUARTET_COMPLETE');
      expect(verifySrc).toContain('SURFACE_FLAT_REPORT_QUARTET_COMPLETE &&');
    });

    it('verify.js dedupes standalone report quartet complete milestone assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc.split('surface flat report quartet complete milestone report').length - 1).toBe(1);
      expect(verifySrc).toContain('SURFACE_FLAT_REPORT_QUARTET_COMPLETE &&');
    });

    it('verify.js dedupes standalone vitest surface flat report tail complete milestone assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('vitest surface flat report tail complete milestone report').length - 1,
      ).toBe(1);
      expect(verifySrc).toContain('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE &&');
    });

    it('verify.js dedupes standalone trilogy report assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const trilogyReportAssertCount =
        verifySrc.split('surface flat field trilogy complete report matches milestone').length - 1;
      expect(trilogyReportAssertCount).toBe(1);
      expect(verifySrc).toContain('surface flat report quartet closure from runVitestVerifyAudits report');
    });

    it('verify.js dedupes standalone report flat field count asserts into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const reportFlatFieldCountAssertCount =
        verifySrc.split('surface flat report flat field count report').length - 1;
      const reportFlatFieldPairAlignAssertCount =
        verifySrc.split('surface flat report flat field count aligns with pair count plus quartet report').length - 1;
      expect(reportFlatFieldCountAssertCount).toBe(1);
      expect(reportFlatFieldPairAlignAssertCount).toBe(1);
    });

    it('verify.js dedupes standalone quartet milestone balance assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const quartetBalanceAssertCount =
        verifySrc.split('surface flat report quartet milestone balance report').length - 1;
      expect(quartetBalanceAssertCount).toBe(1);
      expect(verifySrc).toContain('surface flat report quartet closure from runVitestVerifyAudits report');
      expect(verifySrc).toContain('surfaceFlatReportQuartetComplete === SURFACE_FLAT_REPORT_QUARTET_COMPLETE');
    });

    it('verify.js dedupes standalone trilogy milestone balance assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const trilogyBalanceAssertCount =
        verifySrc.split('surface flat field trilogy milestone balance report').length - 1;
      expect(trilogyBalanceAssertCount).toBe(1);
      expect(verifySrc).toContain('surfaceFlatFieldTrilogyComplete === SURFACE_FLAT_FIELD_TRILOGY_COMPLETE');
    });

    it('verify.js dedupes standalone total field count asserts into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const totalFieldCountAssertCount =
        verifySrc.split('surface flat total field count report').length - 1;
      const totalFieldCountBalanceAssertCount =
        verifySrc.split('surface flat total field count balance report').length - 1;
      const totalFieldCountClosureAssertCount =
        verifySrc.split('surface flat total field count closure report').length - 1;
      expect(totalFieldCountAssertCount).toBe(1);
      expect(totalFieldCountBalanceAssertCount).toBe(1);
      expect(totalFieldCountClosureAssertCount).toBe(1);
      expect(verifySrc).toContain('surfaceFlatTotalFieldCount === SURFACE_FLAT_TOTAL_FIELD_COUNT');
    });

    it('verify.js dedupes standalone field pair count assert into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const fieldPairCountAssertCount =
        verifySrc.split('surface flat field pair count report').length - 1;
      expect(fieldPairCountAssertCount).toBe(1);
      expect(verifySrc).toContain('surfaceFlatFieldPairCount === SURFACE_FLAT_FIELD_PAIR_COUNT');
    });

    it('verify.js dedupes standalone unified closure asserts into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc).toContain(
        'surfaceFlatUnifiedClosureComplete === vitestAudits.vitestSurfaceTestParity.ok',
      );
      expect(verifySrc.split('surface flat unified closure complete matches milestone report').length - 1).toBe(
        1,
      );
      expect(verifySrc.split('full surface flat complete matches unified closure milestone report').length - 1).toBe(
        1,
      );
      expect(verifySrc.split('vitest surface flat complete matches unified closure milestone report').length - 1).toBe(
        1,
      );
      expect(
        verifySrc.split('surface flat unified closure complete from vitestSurfaceTestParity report ok report')
          .length - 1,
      ).toBe(1);
      expect(
        verifySrc.split('surface flat unified closure complete aligns with fullSurfaceTestParityComplete report')
          .length - 1,
      ).toBe(1);
      expect(
        verifySrc.split(
          'surface flat unified closure complete aligns with vitestSurfaceTestParityComplete report',
        ).length - 1,
      ).toBe(1);
    });

    it('verify.js dedupes standalone fullSurface flat field asserts into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(
        verifySrc.split('full surface flat covered count from vitestSurfaceTestParity report report').length - 1,
      ).toBe(1);
      expect(
        verifySrc.split('full surface flat missing count from vitestSurfaceTestParity report report').length - 1,
      ).toBe(1);
      expect(
        verifySrc.split('full surface flat module count from vitestSurfaceTestParity report report').length - 1,
      ).toBe(1);
      expect(
        verifySrc.split('full surface flat complete from vitestSurfaceTestParity report ok report').length - 1,
      ).toBe(1);
      expect(verifySrc).toContain(
        'fullSurfaceTestParityCoveredCount === vitestAudits.vitestSurfaceTestParity.coveredCount',
      );
    });

    it('verify.js dedupes standalone vitestSurface flat field asserts into consolidated guard', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      expect(verifySrc.split('vitest surface flat module count from report report').length - 1).toBe(1);
      expect(verifySrc.split('vitest surface flat covered count from report report').length - 1).toBe(1);
      expect(verifySrc.split('vitest surface flat missing count from report report').length - 1).toBe(1);
      expect(verifySrc.split('vitest surface flat complete from report ok report').length - 1).toBe(1);
      expect(verifySrc).toContain(
        'vitestSurfaceTestParityModuleCount === vitestAudits.vitestSurfaceTestParity.moduleCount',
      );
    });

    it('verify.js no longer duplicates per-module test existsSync checks', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const moduleTestExistsSync =
        verifySrc.match(
          /existsSync\(path\.join\(__dirname, 'src\/(?:core|lib|scene|shaders|hooks)\/[^']+\.test\.ts'\)\)/g,
        ) ?? [];
      expect(moduleTestExistsSync).toHaveLength(1);
      expect(moduleTestExistsSync[0]).toContain('vitestCoverage.test.ts');
    });

    it('verify.js delegates vitest manifest history to auditVitestUpgradeLog', () => {
      const verifySrc = fs.readFileSync(
        path.resolve(SRC_ROOT, '..', 'verify.js'),
        'utf8',
      );
      const perVitestManifestAsserts =
        verifySrc.match(/techManifestSrc\.includes\('vitest-/g) ?? [];
      expect(perVitestManifestAsserts).toHaveLength(0);
      expect(verifySrc).toContain('runVitestVerifyAudits');
    });

    it('runVitestVerifyAudits ok gate uses runtime vitestSurfaceTestParity only', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const okGateStart = coverageSrc.indexOf('ok:', runVitestOkIdx);
      const okGateEnd = coverageSrc.indexOf('upgradeLog,', okGateStart);
      const okGateSlice = coverageSrc.slice(okGateStart, okGateEnd);
      expect(okGateSlice).toContain('vitestSurfaceTestParity.ok');
      expect(okGateSlice).not.toContain('fullSurfaceTestParity.ok');
      expect(okGateSlice).not.toContain('FULL_SURFACE_TEST_PARITY_COMPLETE');
      expect(okGateSlice).not.toContain('VITEST_SURFACE_TEST_PARITY_COMPLETE');
      expect(okGateSlice).not.toContain('SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE');
      expect(okGateSlice).not.toContain('SURFACE_FLAT_REPORT_QUARTET_COMPLETE');
      expect(okGateSlice).not.toContain('JSX_SURFACE_TEST_PARITY_COMPLETE');
      expect(okGateSlice).not.toContain('JS_TEST_PARITY_COMPLETE');
    });

    it('runVitestVerifyAudits flat vitestSurface fields use runtime report only', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const flatStart = coverageSrc.indexOf('vitestSurfaceTestParityModuleCount:', runVitestOkIdx);
      const flatEnd = coverageSrc.indexOf('};', flatStart);
      const flatSlice = coverageSrc.slice(flatStart, flatEnd);
      expect(flatSlice).toContain('vitestSurfaceTestParity.moduleCount');
      expect(flatSlice).toContain('vitestSurfaceTestParity.coveredCount');
      expect(flatSlice).toContain('vitestSurfaceTestParity.missingCount');
      expect(flatSlice).toContain('vitestSurfaceTestParity.ok');
      expect(flatSlice).not.toContain('vitestSurfaceTestParity.vitestSurfaceModuleCount');
      expect(flatSlice).not.toContain('vitestSurfaceTestParity.vitestSurfaceCoveredCount');
      expect(flatSlice).not.toContain('vitestSurfaceTestParity.vitestSurfaceMissingCount');
      expect(flatSlice).not.toContain('vitestSurfaceTestParity.vitestSurfaceComplete');
      expect(flatSlice).not.toContain('VITEST_SURFACE_TEST_PARITY_COMPLETE');
      expect(flatSlice).not.toContain('VITEST_SURFACE_TEST_PARITY_COVERED_COUNT');
      expect(flatSlice).not.toContain('VITEST_SURFACE_TEST_PARITY_MISSING_COUNT');
      expect(flatSlice).not.toContain('VITEST_SURFACE_TEST_PARITY_MODULE_COUNT');
    });

    it('runVitestVerifyAudits flat fullSurface fields use vitestSurfaceTestParity report only', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const flatStart = coverageSrc.indexOf('fullSurfaceTestParityCoveredCount:', runVitestOkIdx);
      const flatEnd = coverageSrc.indexOf('vitestSurfaceTestParity,', flatStart);
      const flatSlice = coverageSrc.slice(flatStart, flatEnd);
      expect(flatSlice).toContain('vitestSurfaceTestParity.coveredCount');
      expect(flatSlice).toContain('vitestSurfaceTestParity.missingCount');
      expect(flatSlice).toContain('vitestSurfaceTestParity.moduleCount');
      expect(flatSlice).toContain('vitestSurfaceTestParity.ok');
      expect(flatSlice).not.toContain('fullSurfaceTestParity.coveredCount');
      expect(flatSlice).not.toContain('fullSurfaceTestParity.missingCount');
      expect(flatSlice).not.toContain('fullSurfaceTestParity.moduleCount');
      expect(flatSlice).not.toContain('fullSurfaceTestParity.ok');
      expect(flatSlice).not.toContain('FULL_SURFACE_TEST_PARITY_COMPLETE');
      expect(flatSlice).not.toContain('FULL_SURFACE_TEST_PARITY_COVERED_COUNT');
      expect(flatSlice).not.toContain('FULL_SURFACE_TEST_PARITY_MISSING_COUNT');
      expect(flatSlice).not.toContain('FULL_SURFACE_TEST_PARITY_MODULE_COUNT');
    });

    it('runVitestVerifyAudits surfaceFlatUnifiedClosureComplete uses runtime report only', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const flatStart = coverageSrc.indexOf('surfaceFlatUnifiedClosureComplete:', runVitestOkIdx);
      const flatEnd = coverageSrc.indexOf('};', flatStart);
      const flatSlice = coverageSrc.slice(flatStart, flatEnd);
      expect(flatSlice).toContain('vitestSurfaceTestParity.ok');
      expect(flatSlice).not.toContain('SURFACE_FLAT_UNIFIED_CLOSURE_COMPLETE');
    });

    it('runVitestVerifyAudits surfaceFlatFieldPairCount uses SURFACE_FLAT_FIELD_PAIR_COUNT constant', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const flatStart = coverageSrc.indexOf('surfaceFlatFieldPairCount:', runVitestOkIdx);
      const flatEnd = coverageSrc.indexOf('};', flatStart);
      const flatSlice = coverageSrc.slice(flatStart, flatEnd);
      expect(flatSlice).toContain('SURFACE_FLAT_FIELD_PAIR_COUNT');
    });

    it('runVitestVerifyAudits surfaceFlatTotalFieldCount uses SURFACE_FLAT_TOTAL_FIELD_COUNT constant', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const flatStart = coverageSrc.indexOf('surfaceFlatTotalFieldCount:', runVitestOkIdx);
      const flatEnd = coverageSrc.indexOf('};', flatStart);
      const flatSlice = coverageSrc.slice(flatStart, flatEnd);
      expect(flatSlice).toContain('SURFACE_FLAT_TOTAL_FIELD_COUNT');
    });

    it('runVitestVerifyAudits surfaceFlatFieldTrilogyComplete uses SURFACE_FLAT_FIELD_TRILOGY_COMPLETE constant', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const flatStart = coverageSrc.indexOf('surfaceFlatFieldTrilogyComplete:', runVitestOkIdx);
      const flatEnd = coverageSrc.indexOf('};', flatStart);
      const flatSlice = coverageSrc.slice(flatStart, flatEnd);
      expect(flatSlice).toContain('SURFACE_FLAT_FIELD_TRILOGY_COMPLETE');
    });

    it('runVitestVerifyAudits surfaceFlatReportFlatFieldCount uses SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT constant', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const flatStart = coverageSrc.indexOf('surfaceFlatReportFlatFieldCount:', runVitestOkIdx);
      const flatEnd = coverageSrc.indexOf('};', flatStart);
      const flatSlice = coverageSrc.slice(flatStart, flatEnd);
      expect(flatSlice).toContain('SURFACE_FLAT_REPORT_FLAT_FIELD_COUNT');
    });

    it('runVitestVerifyAudits surfaceFlatReportQuartetComplete uses SURFACE_FLAT_REPORT_QUARTET_COMPLETE constant', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const flatStart = coverageSrc.indexOf('surfaceFlatReportQuartetComplete:', runVitestOkIdx);
      const flatEnd = coverageSrc.indexOf('};', flatStart);
      const flatSlice = coverageSrc.slice(flatStart, flatEnd);
      expect(flatSlice).toContain('SURFACE_FLAT_REPORT_QUARTET_COMPLETE');
    });

    it('runVitestVerifyAudits vitestSurfaceFlatReportTailComplete uses VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE constant', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const flatStart = coverageSrc.indexOf('vitestSurfaceFlatReportTailComplete:', runVitestOkIdx);
      const flatEnd = coverageSrc.indexOf('};', flatStart);
      const flatSlice = coverageSrc.slice(flatStart, flatEnd);
      expect(flatSlice).toContain('VITEST_SURFACE_FLAT_REPORT_TAIL_COMPLETE');
    });

    it('runVitestVerifyAudits unified surface flat closure structural symmetry', () => {
      const coverageSrc = fs.readFileSync(
        path.resolve(SRC_ROOT, 'core', 'vitestCoverage.ts'),
        'utf8',
      );
      const runVitestOkIdx = coverageSrc.indexOf('export function runVitestVerifyAudits');
      const vitestFlatStart = coverageSrc.indexOf('vitestSurfaceTestParityModuleCount:', runVitestOkIdx);
      const vitestFlatEnd = coverageSrc.indexOf('};', vitestFlatStart);
      const vitestFlatSlice = coverageSrc.slice(vitestFlatStart, vitestFlatEnd);
      const fullFlatStart = coverageSrc.indexOf('fullSurfaceTestParityCoveredCount:', runVitestOkIdx);
      const fullFlatEnd = coverageSrc.indexOf('vitestSurfaceTestParity,', fullFlatStart);
      const fullFlatSlice = coverageSrc.slice(fullFlatStart, fullFlatEnd);
      for (const field of ['moduleCount', 'coveredCount', 'missingCount', 'ok'] as const) {
        expect(fullFlatSlice).toContain(`vitestSurfaceTestParity.${field}`);
        expect(vitestFlatSlice).toContain(`vitestSurfaceTestParity.${field}`);
      }
    });
  });
});

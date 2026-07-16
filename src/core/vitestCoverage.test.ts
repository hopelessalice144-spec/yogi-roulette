import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { VITEST_COMPLETED_UPGRADE_COUNT } from './techManifest.js';
import {
  FULL_SURFACE_TEST_PARITY_COMPLETE,
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
  auditJsxSurface,
  auditJsxSurfaceComplete,
  auditJsxContextTestParity,
  auditJsxEntryTestParity,
  auditJsxSceneTestParity,
  auditJsxSurfaceTestParity,
  auditJsxUiTestParity,
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
      expect(findModulesMissingTests(SRC_ROOT)).toEqual([]);
    });
  });

  describe('JSX_SURFACE_TEST_PARITY_COMPLETE', () => {
    it('is true when all jsx surfaces have vitest siblings in the production tree', () => {
      expect(JSX_SURFACE_TEST_PARITY_COMPLETE).toBe(true);
      expect(JSX_SURFACE_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JSX_SURFACE_TEST_PARITY_COVERED_COUNT).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(JSX_SURFACE_MODULE_COUNT).toBe(JSX_SRC_SURFACE_MODULE_COUNT);
      expect(auditJsxSurfaceTestParity(SRC_ROOT).ok).toBe(JSX_SURFACE_TEST_PARITY_COMPLETE);
    });
  });

  describe('FULL_SURFACE_TEST_PARITY_COMPLETE', () => {
    it('is true when all gated JS and JSX surfaces have vitest siblings', () => {
      expect(FULL_SURFACE_TEST_PARITY_COMPLETE).toBe(true);
      expect(JS_TEST_PARITY_COMPLETE).toBe(true);
      expect(JSX_SURFACE_TEST_PARITY_COMPLETE).toBe(true);
      expect(JS_TEST_PARITY_MISSING_COUNT).toBe(0);
      expect(JS_TEST_PARITY_COVERED_COUNT).toBe(VITEST_COVERAGE_MODULE_COUNT);
      expect(FULL_SURFACE_TEST_PARITY_MODULE_COUNT).toBe(
        VITEST_COVERAGE_MODULE_COUNT + JSX_SURFACE_MODULE_COUNT,
      );
      expect(auditVitestCoverage(SRC_ROOT).ok).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
      expect(auditJsxSurfaceTestParity(SRC_ROOT).ok).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
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
      expect(report.jsxSurfaceTestParity.coveredCount).toBe(JSX_SURFACE_MODULE_COUNT);
      expect(report.jsxSurfaceTestParity.missingCount).toBe(0);
      expect(report.jsxSurfaceTestParityCoveredCount).toBe(JSX_SURFACE_TEST_PARITY_COVERED_COUNT);
      expect(report.jsxSurfaceTestParityMissingCount).toBe(JSX_SURFACE_TEST_PARITY_MISSING_COUNT);
      expect(report.jsxSurfaceTestParityComplete).toBe(true);
      expect(report.jsxSurfaceTestParityComplete).toBe(JSX_SURFACE_TEST_PARITY_COMPLETE);
      expect(report.fullSurfaceTestParityModuleCount).toBe(FULL_SURFACE_TEST_PARITY_MODULE_COUNT);
      expect(report.fullSurfaceTestParityComplete).toBe(true);
      expect(report.fullSurfaceTestParityComplete).toBe(FULL_SURFACE_TEST_PARITY_COMPLETE);
    });

    it('runVitestVerifyAudits fails when module parity breaks', () => {
      const src = makeSrcTree({
        'shaders/gap.js': 'export const gap = 1;',
      });
      const report = runVitestVerifyAudits(src);
      expect(report.ok).toBe(false);
      expect(report.coverage.ok).toBe(false);
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
      expect(hooks).toEqual(['hooks/useLiveClock.js', 'hooks/useWebGLRecovery.js']);
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
  });
});

/**
 * Vitest file-parity audit for pure JS modules under src/core, src/lib, src/scene, src/shaders, src/hooks.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VITEST_COMPLETED_UPGRADE_COUNT,
  auditVitestUpgradeLog,
} from './techManifest.js';

export const VITEST_COVERAGE_DIRS = Object.freeze(['core', 'lib', 'scene', 'shaders', 'hooks']);

/** JSX roots inventoried for future parity expansion (probe-only, not gated yet). */
export const JSX_UI_PROBE_DIRS = Object.freeze(['ui']);
export const JSX_SCENE_PROBE_DIRS = Object.freeze(['scene']);
export const JSX_CONTEXT_PROBE_DIRS = Object.freeze(['context']);
/** Root-level entry JSX files relative to src/ (not in a probe subdir). */
export const JSX_ENTRY_PROBE_FILES = Object.freeze(['App.jsx', 'main.jsx']);
export const JSX_SURFACE_PROBE_DIRS = Object.freeze(['ui', 'scene', 'context']);

/** JSX roots with test-parity scaffolding. */
export const JSX_UI_TEST_PARITY_DIRS = JSX_UI_PROBE_DIRS;
export const JSX_SCENE_TEST_PARITY_DIRS = JSX_SCENE_PROBE_DIRS;
export const JSX_CONTEXT_TEST_PARITY_DIRS = JSX_CONTEXT_PROBE_DIRS;
export const JSX_ENTRY_TEST_PARITY_FILES = JSX_ENTRY_PROBE_FILES;

const COVERAGE_SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Relative paths from src/ — modules covered by a shared sibling test file. */
export const SHARED_MODULE_TESTS = Object.freeze({
  'lib/timer.js': 'lib/libShims.test.ts',
  'lib/performanceGuard.js': 'lib/libShims.test.ts',
});

/**
 * Resolve the expected vitest file for a module (posix-style path under src/).
 */
export function moduleTestPath(moduleRelPath: string): string {
  const shared = SHARED_MODULE_TESTS[moduleRelPath as keyof typeof SHARED_MODULE_TESTS];
  if (shared) return shared;
  if (moduleRelPath.endsWith('.jsx')) {
    return moduleRelPath.replace(/\.jsx$/, '.test.tsx');
  }
  return moduleRelPath.replace(/\.js$/, '.test.ts');
}

/**
 * List .js modules in configured coverage roots (posix-style paths relative to src/).
 */
export function listJsModules(
  srcDir: string,
  subdirs: readonly string[] = VITEST_COVERAGE_DIRS,
): string[] {
  const modules: string[] = [];
  for (const sub of subdirs) {
    const dir = path.join(srcDir, sub);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.js')) {
        modules.push(`${sub}/${name}`);
      }
    }
  }
  return modules.sort();
}

/**
 * List .jsx modules in configured JSX probe roots (posix-style paths relative to src/).
 */
export function listJsxModules(
  srcDir: string,
  subdirs: readonly string[] = JSX_SURFACE_PROBE_DIRS,
): string[] {
  const modules: string[] = [];
  for (const sub of subdirs) {
    const dir = path.join(srcDir, sub);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.jsx')) {
        modules.push(`${sub}/${name}`);
      }
    }
  }
  return modules.sort();
}

/**
 * List root-level entry .jsx files in src/ (posix-style paths relative to src/).
 */
export function listJsxEntryModules(
  srcDir: string,
  entryFiles: readonly string[] = JSX_ENTRY_PROBE_FILES,
): string[] {
  const modules: string[] = [];
  for (const name of entryFiles) {
    if (fs.existsSync(path.join(srcDir, name))) {
      modules.push(name);
    }
  }
  return modules.sort();
}

/**
 * List every .jsx file under src/ (posix-style paths relative to src/).
 */
export function listAllSrcJsxModules(srcDir: string): string[] {
  const modules: string[] = [];

  function walk(relDir: string): void {
    const dir = relDir ? path.join(srcDir, relDir) : srcDir;
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const rel = relDir ? `${relDir}/${name}` : name;
      const full = path.join(dir, name);
      if (!fs.statSync(full).isDirectory()) {
        if (name.endsWith('.jsx')) {
          modules.push(rel.replace(/\\/g, '/'));
        }
        continue;
      }
      walk(rel);
    }
  }

  walk('');
  return modules.sort();
}

/** Canonical ui/ JSX module count for the production src tree. */
export const JSX_UI_SURFACE_MODULE_COUNT = listJsxModules(COVERAGE_SRC_DIR, JSX_UI_PROBE_DIRS).length;

/** ui/ JSX modules with a vitest sibling in the production src tree. */
export const JSX_UI_TEST_PARITY_COVERED_COUNT = listJsxModules(
  COVERAGE_SRC_DIR,
  JSX_UI_TEST_PARITY_DIRS,
).filter((mod) => fs.existsSync(path.join(COVERAGE_SRC_DIR, moduleTestPath(mod)))).length;

/** ui/ JSX modules still missing a vitest sibling in the production src tree. */
export const JSX_UI_TEST_PARITY_MISSING_COUNT =
  JSX_UI_SURFACE_MODULE_COUNT - JSX_UI_TEST_PARITY_COVERED_COUNT;

/** Canonical scene/ JSX module count for the production src tree. */
export const JSX_SCENE_SURFACE_MODULE_COUNT = listJsxModules(
  COVERAGE_SRC_DIR,
  JSX_SCENE_PROBE_DIRS,
).length;

/** scene/ JSX modules with a vitest sibling in the production src tree. */
export const JSX_SCENE_TEST_PARITY_COVERED_COUNT = listJsxModules(
  COVERAGE_SRC_DIR,
  JSX_SCENE_TEST_PARITY_DIRS,
).filter((mod) => fs.existsSync(path.join(COVERAGE_SRC_DIR, moduleTestPath(mod)))).length;

/** scene/ JSX modules still missing a vitest sibling in the production src tree. */
export const JSX_SCENE_TEST_PARITY_MISSING_COUNT =
  JSX_SCENE_SURFACE_MODULE_COUNT - JSX_SCENE_TEST_PARITY_COVERED_COUNT;

/** Canonical context/ JSX module count for the production src tree. */
export const JSX_CONTEXT_SURFACE_MODULE_COUNT = listJsxModules(
  COVERAGE_SRC_DIR,
  JSX_CONTEXT_PROBE_DIRS,
).length;

/** context/ JSX modules with a vitest sibling in the production src tree. */
export const JSX_CONTEXT_TEST_PARITY_COVERED_COUNT = listJsxModules(
  COVERAGE_SRC_DIR,
  JSX_CONTEXT_TEST_PARITY_DIRS,
).filter((mod) => fs.existsSync(path.join(COVERAGE_SRC_DIR, moduleTestPath(mod)))).length;

/** context/ JSX modules still missing a vitest sibling in the production src tree. */
export const JSX_CONTEXT_TEST_PARITY_MISSING_COUNT =
  JSX_CONTEXT_SURFACE_MODULE_COUNT - JSX_CONTEXT_TEST_PARITY_COVERED_COUNT;

/** Canonical root entry JSX module count for the production src tree. */
export const JSX_ENTRY_SURFACE_MODULE_COUNT = listJsxEntryModules(COVERAGE_SRC_DIR).length;

/** Root entry JSX modules with a vitest sibling in the production src tree. */
export const JSX_ENTRY_TEST_PARITY_COVERED_COUNT = listJsxEntryModules(
  COVERAGE_SRC_DIR,
  JSX_ENTRY_TEST_PARITY_FILES,
).filter((mod) => fs.existsSync(path.join(COVERAGE_SRC_DIR, moduleTestPath(mod)))).length;

/** Root entry JSX modules still missing a vitest sibling in the production src tree. */
export const JSX_ENTRY_TEST_PARITY_MISSING_COUNT =
  JSX_ENTRY_SURFACE_MODULE_COUNT - JSX_ENTRY_TEST_PARITY_COVERED_COUNT;

/** Combined JSX probe count across ui + scene + context + entry roots. */
export const JSX_SURFACE_MODULE_COUNT =
  JSX_UI_SURFACE_MODULE_COUNT +
  JSX_SCENE_SURFACE_MODULE_COUNT +
  JSX_CONTEXT_SURFACE_MODULE_COUNT +
  JSX_ENTRY_SURFACE_MODULE_COUNT;

/** Canonical count of every .jsx file under the production src tree. */
export const JSX_SRC_SURFACE_MODULE_COUNT = listAllSrcJsxModules(COVERAGE_SRC_DIR).length;

/** Combined JSX surface modules with a vitest sibling in the production src tree. */
export const JSX_SURFACE_TEST_PARITY_COVERED_COUNT =
  JSX_UI_TEST_PARITY_COVERED_COUNT +
  JSX_SCENE_TEST_PARITY_COVERED_COUNT +
  JSX_CONTEXT_TEST_PARITY_COVERED_COUNT +
  JSX_ENTRY_TEST_PARITY_COVERED_COUNT;

/** Combined JSX surface modules still missing a vitest sibling in the production src tree. */
export const JSX_SURFACE_TEST_PARITY_MISSING_COUNT =
  JSX_SURFACE_MODULE_COUNT - JSX_SURFACE_TEST_PARITY_COVERED_COUNT;

/** Milestone flag — true when every probed JSX surface has a vitest sibling (30/30). */
export const JSX_SURFACE_TEST_PARITY_COMPLETE =
  JSX_SURFACE_TEST_PARITY_MISSING_COUNT === 0 &&
  JSX_SURFACE_TEST_PARITY_COVERED_COUNT === JSX_SURFACE_MODULE_COUNT &&
  JSX_SURFACE_MODULE_COUNT === JSX_SRC_SURFACE_MODULE_COUNT;

/** Inventory probe for untested JSX surfaces (no test-file requirement yet). */
export function auditJsxSurface(srcDir: string): {
  moduleCount: number;
  modules: string[];
  uiCount: number;
  sceneCount: number;
  contextCount: number;
  entryCount: number;
  uiModules: string[];
  sceneModules: string[];
  contextModules: string[];
  entryModules: string[];
} {
  const uiModules = listJsxModules(srcDir, JSX_UI_PROBE_DIRS);
  const sceneModules = listJsxModules(srcDir, JSX_SCENE_PROBE_DIRS);
  const contextModules = listJsxModules(srcDir, JSX_CONTEXT_PROBE_DIRS);
  const entryModules = listJsxEntryModules(srcDir);
  const modules = [...uiModules, ...sceneModules, ...contextModules, ...entryModules].sort();
  return {
    moduleCount: modules.length,
    modules,
    uiCount: uiModules.length,
    sceneCount: sceneModules.length,
    contextCount: contextModules.length,
    entryCount: entryModules.length,
    uiModules,
    sceneModules,
    contextModules,
    entryModules,
  };
}

/** Closure audit — probe inventory must match every .jsx file under src/. */
export function auditJsxSurfaceComplete(srcDir: string): {
  ok: boolean;
  moduleCount: number;
  probeCount: number;
  missingFromProbe: string[];
  extraInProbe: string[];
} {
  const allModules = listAllSrcJsxModules(srcDir);
  const probe = auditJsxSurface(srcDir);
  const allSet = new Set(allModules);
  const probeSet = new Set(probe.modules);
  const missingFromProbe = allModules.filter((mod) => !probeSet.has(mod));
  const extraInProbe = probe.modules.filter((mod) => !allSet.has(mod));
  return {
    ok:
      missingFromProbe.length === 0 &&
      extraInProbe.length === 0 &&
      probe.moduleCount === allModules.length,
    moduleCount: allModules.length,
    probeCount: probe.moduleCount,
    missingFromProbe,
    extraInProbe,
  };
}

/** Canonical module count for the production src tree (avoids magic numbers in verify/tests). */
export const VITEST_COVERAGE_MODULE_COUNT = listJsModules(COVERAGE_SRC_DIR).length;

/** Modules missing a vitest sibling (or shared test mapping). */
export function findModulesMissingTests(
  srcDir: string,
  subdirs: readonly string[] = VITEST_COVERAGE_DIRS,
): string[] {
  const missing: string[] = [];
  for (const mod of listJsModules(srcDir, subdirs)) {
    const testRel = moduleTestPath(mod);
    if (!fs.existsSync(path.join(srcDir, testRel))) {
      missing.push(mod);
    }
  }
  return missing;
}

/** JS modules with a vitest sibling in the production src tree. */
export const JS_TEST_PARITY_COVERED_COUNT = listJsModules(COVERAGE_SRC_DIR).filter((mod) =>
  fs.existsSync(path.join(COVERAGE_SRC_DIR, moduleTestPath(mod))),
).length;

/** JS modules still missing a vitest sibling in the production src tree. */
export const JS_TEST_PARITY_MISSING_COUNT =
  VITEST_COVERAGE_MODULE_COUNT - JS_TEST_PARITY_COVERED_COUNT;

/** Milestone flag — true when every gated JS module has a vitest sibling (62/62). */
export const JS_TEST_PARITY_COMPLETE = JS_TEST_PARITY_MISSING_COUNT === 0;

/** Combined JS + JSX surface modules under vitest parity gates (62 + 30). */
export const FULL_SURFACE_TEST_PARITY_MODULE_COUNT =
  VITEST_COVERAGE_MODULE_COUNT + JSX_SURFACE_MODULE_COUNT;

/** Milestone flag — true when all gated JS and JSX surfaces have vitest siblings. */
export const FULL_SURFACE_TEST_PARITY_COMPLETE =
  JS_TEST_PARITY_COMPLETE &&
  JSX_SURFACE_TEST_PARITY_COMPLETE &&
  findModulesMissingTests(COVERAGE_SRC_DIR).length === 0;

/** JSX modules in ui/ missing a mapped vitest sibling. */
export function findJsxModulesMissingTests(
  srcDir: string,
  subdirs: readonly string[] = JSX_UI_TEST_PARITY_DIRS,
): string[] {
  const missing: string[] = [];
  for (const mod of listJsxModules(srcDir, subdirs)) {
    const testRel = moduleTestPath(mod);
    if (!fs.existsSync(path.join(srcDir, testRel))) {
      missing.push(mod);
    }
  }
  return missing;
}

/** scene/ JSX modules missing a mapped vitest sibling (scaffold — not in main ok gate yet). */
export function findJsxSceneModulesMissingTests(
  srcDir: string,
  subdirs: readonly string[] = JSX_SCENE_TEST_PARITY_DIRS,
): string[] {
  const missing: string[] = [];
  for (const mod of listJsxModules(srcDir, subdirs)) {
    const testRel = moduleTestPath(mod);
    if (!fs.existsSync(path.join(srcDir, testRel))) {
      missing.push(mod);
    }
  }
  return missing;
}

/** context/ JSX modules missing a mapped vitest sibling. */
export function findJsxContextModulesMissingTests(
  srcDir: string,
  subdirs: readonly string[] = JSX_CONTEXT_TEST_PARITY_DIRS,
): string[] {
  const missing: string[] = [];
  for (const mod of listJsxModules(srcDir, subdirs)) {
    const testRel = moduleTestPath(mod);
    if (!fs.existsSync(path.join(srcDir, testRel))) {
      missing.push(mod);
    }
  }
  return missing;
}

/** Root entry JSX modules missing a mapped vitest sibling (scaffold — not in main ok gate yet). */
export function findJsxEntryModulesMissingTests(
  srcDir: string,
  entryFiles: readonly string[] = JSX_ENTRY_TEST_PARITY_FILES,
): string[] {
  const missing: string[] = [];
  for (const mod of listJsxEntryModules(srcDir, entryFiles)) {
    const testRel = moduleTestPath(mod);
    if (!fs.existsSync(path.join(srcDir, testRel))) {
      missing.push(mod);
    }
  }
  return missing;
}

/** ui/ JSX test-parity audit — ok when every ui jsx has a test sibling. */
export function auditJsxUiTestParity(srcDir: string): {
  ok: boolean;
  missing: string[];
  moduleCount: number;
} {
  const modules = listJsxModules(srcDir, JSX_UI_TEST_PARITY_DIRS);
  const missing = findJsxModulesMissingTests(srcDir);
  return {
    ok: missing.length === 0,
    missing,
    moduleCount: modules.length,
  };
}

/** scene/ JSX test-parity audit (scaffold — reports gaps, not gated in runVitestVerifyAudits ok yet). */
export function auditJsxSceneTestParity(srcDir: string): {
  ok: boolean;
  missing: string[];
  moduleCount: number;
} {
  const modules = listJsxModules(srcDir, JSX_SCENE_TEST_PARITY_DIRS);
  const missing = findJsxSceneModulesMissingTests(srcDir);
  return {
    ok: missing.length === 0,
    missing,
    moduleCount: modules.length,
  };
}

/** context/ JSX test-parity audit — ok when every context jsx has a test sibling. */
export function auditJsxContextTestParity(srcDir: string): {
  ok: boolean;
  missing: string[];
  moduleCount: number;
} {
  const modules = listJsxModules(srcDir, JSX_CONTEXT_TEST_PARITY_DIRS);
  const missing = findJsxContextModulesMissingTests(srcDir);
  return {
    ok: missing.length === 0,
    missing,
    moduleCount: modules.length,
  };
}

/** Root entry JSX test-parity audit — ok when every entry jsx has a test sibling. */
export function auditJsxEntryTestParity(srcDir: string): {
  ok: boolean;
  missing: string[];
  moduleCount: number;
} {
  const modules = listJsxEntryModules(srcDir, JSX_ENTRY_TEST_PARITY_FILES);
  const missing = findJsxEntryModulesMissingTests(srcDir);
  return {
    ok: missing.length === 0,
    missing,
    moduleCount: modules.length,
  };
}

/** Combined JSX surface test-parity audit — ok when ui+scene+context+entry all pass. */
export function auditJsxSurfaceTestParity(srcDir: string): {
  ok: boolean;
  missing: string[];
  moduleCount: number;
  coveredCount: number;
  missingCount: number;
} {
  const ui = auditJsxUiTestParity(srcDir);
  const scene = auditJsxSceneTestParity(srcDir);
  const context = auditJsxContextTestParity(srcDir);
  const entry = auditJsxEntryTestParity(srcDir);
  const missing = [
    ...ui.missing,
    ...scene.missing,
    ...context.missing,
    ...entry.missing,
  ].sort();
  const moduleCount = ui.moduleCount + scene.moduleCount + context.moduleCount + entry.moduleCount;
  const coveredCount = moduleCount - missing.length;
  const srcModuleCount = listAllSrcJsxModules(srcDir).length;
  return {
    ok:
      ui.ok &&
      scene.ok &&
      context.ok &&
      entry.ok &&
      missing.length === 0 &&
      coveredCount === moduleCount &&
      moduleCount === srcModuleCount,
    missing,
    moduleCount,
    coveredCount,
    missingCount: missing.length,
  };
}

export function auditVitestCoverage(srcDir: string): {
  ok: boolean;
  missing: string[];
  moduleCount: number;
} {
  const modules = listJsModules(srcDir);
  const missing = findModulesMissingTests(srcDir);
  return {
    ok: missing.length === 0,
    missing,
    moduleCount: modules.length,
  };
}

/** Combined verify.js runtime audits for module parity + upgrade milestone log. */
export function runVitestVerifyAudits(srcDir: string): {
  ok: boolean;
  upgradeLog: ReturnType<typeof auditVitestUpgradeLog>;
  coverage: ReturnType<typeof auditVitestCoverage>;
  upgradeCount: number;
  moduleCount: number;
  missingModules: string[];
  jsTestParityCoveredCount: number;
  jsTestParityMissingCount: number;
  jsTestParityComplete: boolean;
  jsxSurface: ReturnType<typeof auditJsxSurface>;
  jsxSurfaceCount: number;
  jsxUiSurfaceCount: number;
  jsxSceneSurfaceCount: number;
  jsxContextSurfaceCount: number;
  jsxEntrySurfaceCount: number;
  jsxSurfaceComplete: ReturnType<typeof auditJsxSurfaceComplete>;
  jsxSrcSurfaceCount: number;
  jsxUiTestParity: ReturnType<typeof auditJsxUiTestParity>;
  jsxUiTestParityCoveredCount: number;
  jsxUiTestParityMissingCount: number;
  jsxSceneTestParity: ReturnType<typeof auditJsxSceneTestParity>;
  jsxSceneTestParityCoveredCount: number;
  jsxSceneTestParityMissingCount: number;
  jsxContextTestParity: ReturnType<typeof auditJsxContextTestParity>;
  jsxContextTestParityCoveredCount: number;
  jsxContextTestParityMissingCount: number;
  jsxEntryTestParity: ReturnType<typeof auditJsxEntryTestParity>;
  jsxEntryTestParityCoveredCount: number;
  jsxEntryTestParityMissingCount: number;
  jsxSurfaceTestParity: ReturnType<typeof auditJsxSurfaceTestParity>;
  jsxSurfaceTestParityCoveredCount: number;
  jsxSurfaceTestParityMissingCount: number;
  jsxSurfaceTestParityComplete: boolean;
  fullSurfaceTestParityModuleCount: number;
  fullSurfaceTestParityComplete: boolean;
} {
  const upgradeLog = auditVitestUpgradeLog();
  const coverage = auditVitestCoverage(srcDir);
  const jsxSurface = auditJsxSurface(srcDir);
  const jsxSurfaceComplete = auditJsxSurfaceComplete(srcDir);
  const jsxUiTestParity = auditJsxUiTestParity(srcDir);
  const jsxSceneTestParity = auditJsxSceneTestParity(srcDir);
  const jsxContextTestParity = auditJsxContextTestParity(srcDir);
  const jsxEntryTestParity = auditJsxEntryTestParity(srcDir);
  const jsxSurfaceTestParity = auditJsxSurfaceTestParity(srcDir);
  return {
    ok:
      upgradeLog.ok &&
      FULL_SURFACE_TEST_PARITY_COMPLETE &&
      upgradeLog.count === VITEST_COMPLETED_UPGRADE_COUNT &&
      coverage.moduleCount === VITEST_COVERAGE_MODULE_COUNT,
    upgradeLog,
    coverage,
    upgradeCount: VITEST_COMPLETED_UPGRADE_COUNT,
    moduleCount: VITEST_COVERAGE_MODULE_COUNT,
    missingModules: coverage.missing,
    jsTestParityCoveredCount: JS_TEST_PARITY_COVERED_COUNT,
    jsTestParityMissingCount: JS_TEST_PARITY_MISSING_COUNT,
    jsTestParityComplete: JS_TEST_PARITY_COMPLETE,
    jsxSurface,
    jsxSurfaceCount: JSX_SURFACE_MODULE_COUNT,
    jsxUiSurfaceCount: JSX_UI_SURFACE_MODULE_COUNT,
    jsxSceneSurfaceCount: JSX_SCENE_SURFACE_MODULE_COUNT,
    jsxContextSurfaceCount: JSX_CONTEXT_SURFACE_MODULE_COUNT,
    jsxEntrySurfaceCount: JSX_ENTRY_SURFACE_MODULE_COUNT,
    jsxSurfaceComplete,
    jsxSrcSurfaceCount: JSX_SRC_SURFACE_MODULE_COUNT,
    jsxUiTestParity,
    jsxUiTestParityCoveredCount: JSX_UI_TEST_PARITY_COVERED_COUNT,
    jsxUiTestParityMissingCount: JSX_UI_TEST_PARITY_MISSING_COUNT,
    jsxSceneTestParity,
    jsxSceneTestParityCoveredCount: JSX_SCENE_TEST_PARITY_COVERED_COUNT,
    jsxSceneTestParityMissingCount: JSX_SCENE_TEST_PARITY_MISSING_COUNT,
    jsxContextTestParity,
    jsxContextTestParityCoveredCount: JSX_CONTEXT_TEST_PARITY_COVERED_COUNT,
    jsxContextTestParityMissingCount: JSX_CONTEXT_TEST_PARITY_MISSING_COUNT,
    jsxEntryTestParity,
    jsxEntryTestParityCoveredCount: JSX_ENTRY_TEST_PARITY_COVERED_COUNT,
    jsxEntryTestParityMissingCount: JSX_ENTRY_TEST_PARITY_MISSING_COUNT,
    jsxSurfaceTestParity,
    jsxSurfaceTestParityCoveredCount: JSX_SURFACE_TEST_PARITY_COVERED_COUNT,
    jsxSurfaceTestParityMissingCount: JSX_SURFACE_TEST_PARITY_MISSING_COUNT,
    jsxSurfaceTestParityComplete: JSX_SURFACE_TEST_PARITY_COMPLETE,
    fullSurfaceTestParityModuleCount: FULL_SURFACE_TEST_PARITY_MODULE_COUNT,
    fullSurfaceTestParityComplete: FULL_SURFACE_TEST_PARITY_COMPLETE,
  };
}

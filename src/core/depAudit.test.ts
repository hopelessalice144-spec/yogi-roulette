import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ORPHAN_TRANSITIVE_DEPS,
  auditOrphanDeps,
  findForbiddenDistMentions,
  findForbiddenSourceImports,
} from './depAudit.js';

describe('depAudit', () => {
  const tmpDirs: string[] = [];
  const PKG = 'n' + '8ao';
  const esmImportLine = `import n8ao from '${PKG}';`;
  const requireLine = `const x = require("${PKG}");`;

  function makeProject(files: Record<string, string>): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'turbo-dep-audit-'));
    tmpDirs.push(root);
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(root, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content);
    }
    return root;
  }

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  describe('ORPHAN_TRANSITIVE_DEPS', () => {
    it('registers n8ao as forbidden in src and dist', () => {
      const n8ao = ORPHAN_TRANSITIVE_DEPS.find((rule) => rule.id === 'n8ao');
      expect(n8ao).toBeDefined();
      expect(n8ao!.package).toBe('n8ao');
      expect(n8ao!.forbiddenInSrc).toBe(true);
      expect(n8ao!.forbiddenInDist).toBe(true);
    });
  });

  describe('findForbiddenSourceImports', () => {
    it('detects ESM imports of forbidden packages', () => {
      const root = makeProject({
        'src/fx/BadPostFX.js': `${esmImportLine}\nexport default n8ao;`,
      });
      const hits = findForbiddenSourceImports(path.join(root, 'src'), PKG);
      expect(hits).toHaveLength(1);
      expect(hits[0]).toContain('BadPostFX.js');
    });

    it('detects require() of forbidden packages', () => {
      const root = makeProject({
        'src/legacy.js': `${requireLine}\nmodule.exports = x;`,
      });
      const hits = findForbiddenSourceImports(path.join(root, 'src'), PKG);
      expect(hits).toHaveLength(1);
    });

    it('returns empty when src tree is clean', () => {
      const root = makeProject({
        'src/scene/VIPPostFX.jsx': "import { Bloom } from '@react-three/postprocessing';",
      });
      const hits = findForbiddenSourceImports(path.join(root, 'src'), PKG);
      expect(hits).toHaveLength(0);
    });
  });

  describe('findForbiddenDistMentions', () => {
    it('flags bundle assets that mention forbidden packages', () => {
      const root = makeProject({});
      const dist = path.join(root, 'dist');
      const assets = path.join(dist, 'assets');
      fs.mkdirSync(assets, { recursive: true });
      fs.writeFileSync(path.join(assets, 'postfx-abc.js'), `/* ${PKG} ambient occlusion shader */`);

      const hits = findForbiddenDistMentions(dist, PKG);
      expect(hits).toEqual(['postfx-abc.js']);
    });

    it('returns empty when assets directory is missing', () => {
      const root = makeProject({});
      expect(findForbiddenDistMentions(path.join(root, 'dist'), PKG)).toEqual([]);
    });
  });

  describe('auditOrphanDeps', () => {
    it('passes when src and dist are clean', () => {
      const root = makeProject({
        'src/app.js': "export const ok = true;",
      });
      const dist = path.join(root, 'dist');
      const assets = path.join(dist, 'assets');
      fs.mkdirSync(assets, { recursive: true });
      fs.writeFileSync(path.join(assets, 'index.js'), 'console.log("clean");');

      const report = auditOrphanDeps({ rootDir: root, distDir: dist });
      expect(report.ok).toBe(true);
      expect(report.violations).toHaveLength(0);
      expect(report.checked.length).toBeGreaterThanOrEqual(1);
    });

    it('reports src-import violations', () => {
      const root = makeProject({
        'src/bad.js': esmImportLine,
      });
      const report = auditOrphanDeps({
        rootDir: root,
        distDir: path.join(root, 'no-dist'),
      });
      expect(report.ok).toBe(false);
      expect(report.violations).toHaveLength(1);
      expect(report.violations[0]?.kind).toBe('src-import');
      expect(report.violations[0]?.ruleId).toBe('n8ao');
    });

    it('reports dist-mention violations', () => {
      const root = makeProject({
        'src/clean.js': 'export const x = 1;',
      });
      const dist = path.join(root, 'dist');
      const assets = path.join(dist, 'assets');
      fs.mkdirSync(assets, { recursive: true });
      fs.writeFileSync(path.join(assets, 'chunk.js'), `var ${PKG} = 1;`);

      const report = auditOrphanDeps({ rootDir: root, distDir: dist });
      expect(report.ok).toBe(false);
      expect(report.violations.some((v) => v.kind === 'dist-mention')).toBe(true);
    });
  });
});

/**
 * Transitive dependency audit — ensure orphan peers stay out of src + dist bundles.
 */

import fs from 'node:fs';
import path from 'node:path';

/** @typedef {{ id: string, package: string, introducedBy: string, reason: string, forbiddenInSrc: boolean, forbiddenInDist: boolean }} OrphanDepRule */

/** @type {readonly OrphanDepRule[]} */
export const ORPHAN_TRANSITIVE_DEPS = Object.freeze([
  {
    id: 'n8ao',
    package: 'n8ao',
    introducedBy: '@react-three/postprocessing',
    reason: 'N8AO optional peer; VIPPostFX uses Bloom/Vignette only — must tree-shake',
    forbiddenInSrc: true,
    forbiddenInDist: true,
  },
]);

const SRC_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);

/**
 * @param {string} dir
 * @param {Set<string>} extensions
 * @param {string[]} [files]
 */
function walkFiles(dir, extensions, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walkFiles(full, extensions, files);
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

/** @param {string} srcDir @param {string} pkg @param {Set<string>} [extensions] */
export function findForbiddenSourceImports(srcDir, pkg, extensions = SRC_EXTENSIONS) {
  const needle = new RegExp(`from\\s+['"]${pkg}(?:/[^'"]*)?['"]`, 'i');
  const hits = [];
  for (const file of walkFiles(srcDir, extensions)) {
    const text = fs.readFileSync(file, 'utf8');
    if (needle.test(text) || text.includes(`require('${pkg}')`) || text.includes(`require("${pkg}")`)) {
      hits.push(file);
    }
  }
  return hits;
}

/** @param {string} distDir @param {string} pkg */
export function findForbiddenDistMentions(distDir, pkg) {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) return [];
  const needle = pkg.toLowerCase();
  const hits = [];
  for (const file of fs.readdirSync(assetsDir)) {
    if (!/\.(js|css|mjs)$/i.test(file)) continue;
    const text = fs.readFileSync(path.join(assetsDir, file), 'utf8').toLowerCase();
    if (text.includes(needle)) hits.push(file);
  }
  return hits;
}

/**
 * @param {{ rootDir: string, srcDir?: string, distDir?: string }} opts
 */
export function auditOrphanDeps({ rootDir, srcDir, distDir }) {
  const src = srcDir ?? path.join(rootDir, 'src');
  const dist = distDir ?? path.join(rootDir, 'dist');
  /** @type {{ ruleId: string, kind: string, detail: string }[]} */
  const violations = [];

  for (const rule of ORPHAN_TRANSITIVE_DEPS) {
    if (rule.forbiddenInSrc) {
      for (const file of findForbiddenSourceImports(src, rule.package)) {
        violations.push({
          ruleId: rule.id,
          kind: 'src-import',
          detail: `${rule.package} imported in ${path.relative(rootDir, file)}`,
        });
      }
    }
    if (rule.forbiddenInDist && fs.existsSync(dist)) {
      for (const file of findForbiddenDistMentions(dist, rule.package)) {
        violations.push({
          ruleId: rule.id,
          kind: 'dist-mention',
          detail: `${rule.package} present in dist/assets/${file}`,
        });
      }
    }
  }

  return {
    ok: violations.length === 0,
    violations,
    checked: [...ORPHAN_TRANSITIVE_DEPS],
  };
}

console.assert(ORPHAN_TRANSITIVE_DEPS.some((d) => d.id === 'n8ao'), 'n8ao orphan rule');

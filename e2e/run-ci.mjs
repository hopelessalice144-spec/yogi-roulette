/**
 * CI E2E runner — builds with seed-custody bypass, spawns vite preview, runs smoke.mjs.
 */
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '127.0.0.1';
const READY_TIMEOUT_MS = 60_000;
const POLL_MS = 250;

async function resolvePort() {
  if (process.env.E2E_PORT) return Number(process.env.E2E_PORT);
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.listen(0, HOST, () => {
      const addr = probe.address();
      const port = typeof addr === 'object' && addr ? addr.port : 4173;
      probe.close(() => resolve(port));
    });
    probe.on('error', reject);
  });
}

async function isServerUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.ok || res.status === 304;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerUp(url)) return;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error(`E2E CI: preview server not ready at ${url}`);
}

function runCommand(cmd, args, env = process.env, { shell } = {}) {
  const isWin = process.platform === 'win32';
  const useShell = shell ?? isWin;
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      env,
      stdio: 'inherit',
      shell: useShell,
    });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

function spawnPreview(port) {
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npm.cmd' : 'npm';
  return spawn(cmd, ['run', 'preview', '--', '--host', HOST, '--port', String(port)], {
    cwd: ROOT,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
}

async function killPreview(child) {
  if (!child || child.killed) return;
  if (process.platform === 'win32' && child.pid) {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { shell: true });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
    });
    return;
  }
  child.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 500));
  if (!child.killed) child.kill('SIGKILL');
}

async function main() {
  const isWin = process.platform === 'win32';
  const npm = isWin ? 'npm.cmd' : 'npm';
  const port = await resolvePort();
  const base = process.env.E2E_BASE_URL ?? `http://${HOST}:${port}`;

  console.log('E2E CI: building dist with seed-custody CI bypass…');
  await runCommand(npm, ['run', 'build'], {
    ...process.env,
    VITE_SEED_CUSTODY_BYPASS: 'ci-e2e',
    VITE_API_BASE: '',
  });

  const preview = spawnPreview(port);
  preview.on('error', (err) => {
    console.error('E2E CI: failed to spawn preview', err);
  });

  try {
    await waitForServer(base, READY_TIMEOUT_MS);
    console.log(`E2E CI: preview ready at ${base}`);
    process.env.E2E_BASE_URL = base;
  // shell:false — process.execPath often contains spaces (e.g. Program Files) on Windows
    await runCommand(process.execPath, [path.join(ROOT, 'e2e', 'smoke.mjs')], process.env, { shell: false });
  } finally {
    await killPreview(preview);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

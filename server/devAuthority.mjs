/**
 * Development authoritative round server — REST + SSE cycle sync.
 * Run: npm run dev:authority
 *
 * NOT for production. Holds master seed server-side; clients receive hash at commit,
 * winning number after lock, full seed reveal at settle.
 */

import http from 'node:http';
import { createHmac } from 'node:crypto';
import {
  commitServerSeed,
  deriveWinningNumber,
  generateServerSeed,
  normalizeClientSeed,
  verifyRound,
} from '../src/core/provablyFair.js';
import { CYCLE_SECONDS, getCycleId, getPhase } from '../src/core/timer.js';

const PORT = Number(process.env.AUTHORITY_PORT || 8787);
const DEFAULT_MASTER = 'dev-authority-secret-change-me';
const MASTER = process.env.AUTHORITY_MASTER_SECRET || DEFAULT_MASTER;
const CORS_ORIGIN = process.env.AUTHORITY_CORS_ORIGIN || 'http://localhost:5173';

function assertAuthorityStartup() {
  if (process.env.AUTHORITY_INSECURE_ALLOW === '1') {
    console.warn('[authority] AUTHORITY_INSECURE_ALLOW=1 — startup checks relaxed');
    return;
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && MASTER === DEFAULT_MASTER) {
    console.error('[authority] FATAL: AUTHORITY_MASTER_SECRET must be set in production');
    process.exit(1);
  }

  if (MASTER === DEFAULT_MASTER) {
    console.warn('[authority] Using default master secret — development only');
  }
}

assertAuthorityStartup();

/** @type {Map<number, { serverSeed: string, serverSeedHash: string, clientSeed: string }>} */
const rounds = new Map();

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Cache-Control': 'no-store',
  };
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders() });
  res.end(JSON.stringify(body));
}

function parseUrl(req) {
  return new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
}

function cycleSnapshot(nowMs = Date.now()) {
  const phase = getPhase(nowMs);
  const cycleId = getCycleId(nowMs);
  return {
    type: 'cycle.tick',
    nowMs,
    cycleId,
    cycleSecond: phase.cycleSecond,
    name: phase.name,
    secondsRemaining: phase.secondsRemaining,
  };
}

function ensureRound(cycleId, clientSeed) {
  const cid = Math.floor(Number(cycleId));
  const cs = normalizeClientSeed(clientSeed);
  let round = rounds.get(cid);
  if (!round) {
    const serverSeed = generateServerSeed();
    round = {
      serverSeed,
      serverSeedHash: commitServerSeed(serverSeed),
      clientSeed: cs,
    };
    rounds.set(cid, round);
    if (rounds.size > 128) {
      const oldest = [...rounds.keys()].sort((a, b) => a - b)[0];
      rounds.delete(oldest);
    }
  } else if (cs !== round.clientSeed) {
    round = { ...round, clientSeed: cs };
    rounds.set(cid, round);
  }
  return { cid, round };
}

function winningFor(round, cycleId) {
  return deriveWinningNumber(round.serverSeed, round.clientSeed, cycleId);
}

function handleCommit(req, res, cycleId, clientSeed) {
  const { cid, round } = ensureRound(cycleId, clientSeed);
  json(res, 200, {
    cycleId: cid,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
    source: 'authority',
  });
}

function handleResult(req, res, cycleId) {
  const cid = Math.floor(Number(cycleId));
  const round = rounds.get(cid);
  if (!round) {
    json(res, 404, { error: 'round_not_found' });
    return;
  }
  const snap = cycleSnapshot();
  if (snap.cycleId !== cid || snap.cycleSecond < 20) {
    json(res, 403, { error: 'result_locked_until_betting_ends' });
    return;
  }
  json(res, 200, {
    cycleId: cid,
    winningNumber: winningFor(round, cid),
    source: 'authority',
  });
}

function handleOutcome(req, res, cycleId) {
  const cid = Math.floor(Number(cycleId));
  const round = rounds.get(cid);
  if (!round) {
    json(res, 404, { error: 'round_not_found' });
    return;
  }
  const snap = cycleSnapshot();
  if (snap.cycleId !== cid || snap.cycleSecond < 29) {
    json(res, 403, { error: 'outcome_locked_until_settle' });
    return;
  }
  const winningNumber = winningFor(round, cid);
  json(res, 200, {
    cycleId: cid,
    serverSeed: round.serverSeed,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
    winningNumber,
    verified: verifyRound(round.serverSeed, round.serverSeedHash, round.clientSeed, cid, winningNumber),
    source: 'authority',
  });
}

function handleCycleStream(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    ...corsHeaders(),
  });
  res.write(': connected\n\n');

  const push = () => {
    res.write(`data: ${JSON.stringify(cycleSnapshot())}\n\n`);
  };
  push();
  const timer = setInterval(push, 100);
  req.on('close', () => clearInterval(timer));
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  const url = parseUrl(req);
  const commitMatch = url.pathname.match(/^\/api\/v1\/rounds\/(\d+)\/commit$/);
  if (req.method === 'GET' && commitMatch) {
    handleCommit(req, res, commitMatch[1], url.searchParams.get('clientSeed'));
    return;
  }

  const resultMatch = url.pathname.match(/^\/api\/v1\/rounds\/(\d+)\/result$/);
  if (req.method === 'GET' && resultMatch) {
    handleResult(req, res, resultMatch[1]);
    return;
  }

  const outcomeMatch = url.pathname.match(/^\/api\/v1\/rounds\/(\d+)\/outcome$/);
  if (req.method === 'GET' && outcomeMatch) {
    handleOutcome(req, res, outcomeMatch[1]);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/cycle/stream') {
    handleCycleStream(req, res);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, { ok: true, cycles: CYCLE_SECONDS, port: PORT });
    return;
  }

  json(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  const bootHmac = createHmac('sha256', MASTER).update('authority-boot').digest('hex').slice(0, 8);
  console.log(`[authority] listening on http://127.0.0.1:${PORT} (boot:${bootHmac})`);
  console.log(`[authority] CORS origin: ${CORS_ORIGIN}`);
  console.log(`[authority] Set VITE_API_BASE=http://127.0.0.1:${PORT} in .env`);
});

/**
 * Per-cycle provably-fair session store — commit before round, reveal at settle.
 */

import {
  buildFairnessAudit,
  commitServerSeed,
  deriveWinningNumber,
  generateServerSeed,
  normalizeClientSeed,
} from './provablyFair.js';
import type {
  FairnessAudit,
  FairRound,
  PublicRoundCommit,
  RemoteCommitInput,
  RemoteCommitRegistration,
  RemoteRevealInput,
} from './types.js';
import {
  clearFairRoundHistory,
  loadFairRoundHistory,
  persistFairRound,
} from './fairRoundHistory.js';

const CLIENT_SEED_KEY = 'turboRoulette.clientSeed';
const MAX_ROUNDS = 48;

const rounds = new Map<number, FairRound>();

interface RemoteCommitEntry {
  serverSeedHash: string;
  clientSeed: string;
  serverSeed: string | null;
  source: 'remote';
}

const remoteCommits = new Map<number, RemoteCommitEntry>();

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function queuePersist(round: FairRound): void {
  void persistFairRound(round).catch(() => {});
}

function rememberRound(round: FairRound): Readonly<FairRound> {
  const frozen = Object.freeze({ ...round });
  rounds.set(round.cycleId, frozen);
  queuePersist(frozen);
  pruneRounds();
  return frozen;
}

/** Merge persisted rounds into memory (browser only). */
export async function hydrateFairRoundsFromStorage(): Promise<number> {
  if (hydrated) return rounds.size;
  if (!hydratePromise) {
    hydratePromise = (async () => {
      const entries = await loadFairRoundHistory();
      for (const round of entries) {
        const existing = rounds.get(round.cycleId);
        if (!existing || (round.revealed && !existing.revealed)) {
          rounds.set(round.cycleId, Object.freeze({ ...round }));
        }
      }
      hydrated = true;
    })();
  }
  await hydratePromise;
  return rounds.size;
}

/** In-memory round history newest-first. */
export function listFairRoundHistory(): readonly FairRound[] {
  return [...rounds.values()].sort((a, b) => b.cycleId - a.cycleId);
}

function auditFromStoredRound(round: FairRound): Readonly<FairnessAudit> {
  return buildFairnessAudit({
    serverSeed: round.serverSeed,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
    cycleId: round.cycleId,
  });
}

/** Rebuild verified audit from hydrated storage — restores HUD badge after refresh. */
export function restoreStoredFairnessAudit(currentCycleId: number): Readonly<FairnessAudit> | null {
  const cid = Math.floor(Number(currentCycleId));
  if (!Number.isFinite(cid) || cid < 0) return null;

  const revealed = listFairRoundHistory().filter(
    (round) => round.revealed && round.serverSeed.length > 0 && !round.remotePending
  );
  if (!revealed.length) return null;

  const current = revealed.find((round) => round.cycleId === cid);
  if (current) return auditFromStoredRound(current);

  const prior = revealed.find((round) => round.cycleId < cid);
  return prior ? auditFromStoredRound(prior) : null;
}

export function loadClientSeed(): string {
  try {
    const stored = localStorage.getItem(CLIENT_SEED_KEY);
    if (stored) return normalizeClientSeed(stored);
  } catch {
    /* private mode */
  }
  const seed = generateServerSeed().slice(0, 24);
  saveClientSeed(seed);
  return seed;
}

export function saveClientSeed(seed: string): void {
  try {
    localStorage.setItem(CLIENT_SEED_KEY, normalizeClientSeed(seed));
  } catch {
    /* noop */
  }
}

function pruneRounds(): void {
  if (rounds.size <= MAX_ROUNDS) return;
  const keys = [...rounds.keys()].sort((a, b) => a - b);
  while (rounds.size > MAX_ROUNDS && keys.length) {
    const oldest = keys.shift();
    if (oldest !== undefined) rounds.delete(oldest);
  }
}

export function registerRemoteCommit(
  cycleId: number,
  { serverSeedHash, clientSeed }: RemoteCommitInput
): Readonly<RemoteCommitRegistration> {
  const cid = Math.floor(Number(cycleId));
  const entry: RemoteCommitEntry = Object.freeze({
    serverSeedHash,
    clientSeed: normalizeClientSeed(clientSeed),
    serverSeed: null,
    source: 'remote',
  });
  remoteCommits.set(cid, entry);
  return Object.freeze({
    cycleId: cid,
    serverSeedHash: entry.serverSeedHash,
    clientSeed: entry.clientSeed,
  });
}

export function applyRemoteReveal(
  cycleId: number,
  { serverSeed, winningNumber, serverSeedHash, clientSeed }: RemoteRevealInput
): Readonly<FairnessAudit> {
  const cid = Math.floor(Number(cycleId));
  const remote = remoteCommits.get(cid);
  const hash = serverSeedHash ?? remote?.serverSeedHash ?? commitServerSeed(serverSeed);
  const cs = normalizeClientSeed(clientSeed ?? remote?.clientSeed ?? loadClientSeed());
  const round: FairRound = Object.freeze({
    cycleId: cid,
    serverSeed,
    serverSeedHash: hash,
    clientSeed: cs,
    revealed: true,
    source: 'remote',
  });
  rememberRound(round);
  remoteCommits.set(cid, { serverSeedHash: hash, clientSeed: cs, serverSeed, source: 'remote' });
  return buildFairnessAudit({
    serverSeed,
    serverSeedHash: hash,
    clientSeed: cs,
    cycleId: cid,
    winningNumber,
  });
}

export function isRemoteAuthorityCycle(cycleId: number): boolean {
  return remoteCommits.has(Math.floor(Number(cycleId)));
}

/** Prepare or return committed round material for cycleId. */
export function ensureRound(cycleId: number, clientSeed: string = loadClientSeed()): Readonly<FairRound> {
  const cid = Math.floor(Number(cycleId));
  if (!Number.isFinite(cid) || cid < 0) {
    throw new RangeError('cycleId must be a non-negative integer');
  }

  const existing = rounds.get(cid);
  if (existing) return existing;

  const remote = remoteCommits.get(cid);
  if (remote?.serverSeed) {
    return rememberRound({
      cycleId: cid,
      serverSeed: remote.serverSeed,
      serverSeedHash: remote.serverSeedHash,
      clientSeed: remote.clientSeed,
      revealed: false,
      source: 'remote',
    });
  }

  if (remote && !remote.serverSeed) {
    const pending = Object.freeze({
      cycleId: cid,
      serverSeed: '',
      serverSeedHash: remote.serverSeedHash,
      clientSeed: remote.clientSeed,
      revealed: false,
      remotePending: true,
      source: 'remote',
    });
    rounds.set(cid, pending);
    return pending;
  }

  const serverSeed = generateServerSeed();
  return rememberRound({
    cycleId: cid,
    serverSeed,
    serverSeedHash: commitServerSeed(serverSeed),
    clientSeed: normalizeClientSeed(clientSeed),
    revealed: false,
  });
}

/** Public commit visible during betting (hash only — seed hidden until reveal). */
export function publicRoundCommit(cycleId: number): Readonly<PublicRoundCommit> {
  const round = ensureRound(cycleId);
  return Object.freeze({
    cycleId: round.cycleId,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
  });
}

/** Authoritative pocket for cycleId. */
export function outcomeForCycle(cycleId: number): number {
  const round = ensureRound(cycleId);
  if (round.remotePending) {
    throw new Error('Remote authority outcome not yet available');
  }
  return deriveWinningNumber(round.serverSeed, round.clientSeed, cycleId);
}

/** Fair context for resolveCycleOutcome integration. */
export function fairContextForCycle(cycleId: number): Readonly<{ serverSeed: string; clientSeed: string }> {
  const round = ensureRound(cycleId);
  return Object.freeze({
    serverSeed: round.serverSeed,
    clientSeed: round.clientSeed,
  });
}

/** Reveal server seed + verification audit after settle. */
export function revealRound(cycleId: number, winningNumber?: number): Readonly<FairnessAudit> {
  const cid = Math.floor(Number(cycleId));
  const round = rounds.get(cid) ?? ensureRound(cid);
  const mutable: FairRound = { ...round, revealed: true };
  rememberRound(mutable);
  const derived = deriveWinningNumber(round.serverSeed, round.clientSeed, cid);
  return buildFairnessAudit({
    serverSeed: round.serverSeed,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
    cycleId: cid,
    winningNumber: winningNumber ?? derived,
  });
}

/** Reset store (tests). */
export function clearFairRounds(): void {
  rounds.clear();
  remoteCommits.clear();
  hydrated = false;
  hydratePromise = null;
  void clearFairRoundHistory().catch(() => {});
}

console.assert(publicRoundCommit(1).serverSeedHash.length === 64, 'fair commit hash length');

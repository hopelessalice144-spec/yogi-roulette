/**
 * Authoritative round API client — server-held seeds with local demo fallback.
 */

import {
  applyRemoteReveal,
  loadClientSeed,
  outcomeForCycle,
  publicRoundCommit,
  registerRemoteCommit,
  revealRound,
} from './fairRoundStore.js';
import type {
  FairnessAudit,
  PublicRoundCommit,
  RemoteCommitRegistration,
  RemoteCommitResponse,
  RemoteOutcomeResponse,
  RemoteResultResponse,
} from './types.js';

export function getApiBase(): string | null {
  const base = import.meta.env.VITE_API_BASE;
  if (typeof base !== 'string' || base.trim() === '') return null;
  return base.replace(/\/$/, '');
}

export function isAuthorityEnabled(): boolean {
  return getApiBase() != null;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch server-committed hash for cycle (no seed leakage). */
export async function fetchRemoteCommit(
  cycleId: number,
  clientSeed: string = loadClientSeed()
): Promise<Readonly<RemoteCommitRegistration> | null> {
  const base = getApiBase();
  if (!base) return null;
  const cid = Math.floor(Number(cycleId));
  const cs = encodeURIComponent(clientSeed);
  const res = await fetch(`${base}/api/v1/rounds/${cid}/commit?clientSeed=${cs}`, {
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  });
  const data = await parseJson<RemoteCommitResponse>(res);
  return registerRemoteCommit(cid, {
    serverSeedHash: data.serverSeedHash,
    clientSeed: data.clientSeed ?? clientSeed,
  });
}

/** Fetch winning pocket after betting locks (physics target — seed still hidden). */
export async function fetchRemoteResult(cycleId: number): Promise<RemoteResultResponse | null> {
  const base = getApiBase();
  if (!base) return null;
  const cid = Math.floor(Number(cycleId));
  const res = await fetch(`${base}/api/v1/rounds/${cid}/result`, {
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  });
  return parseJson<RemoteResultResponse>(res);
}

/** Fetch authoritative outcome + seed reveal at settle. */
export async function fetchRemoteOutcome(cycleId: number): Promise<RemoteOutcomeResponse | null> {
  const base = getApiBase();
  if (!base) return null;
  const cid = Math.floor(Number(cycleId));
  const res = await fetch(`${base}/api/v1/rounds/${cid}/outcome`, {
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  });
  return parseJson<RemoteOutcomeResponse>(res);
}

/** Commit for HUD — remote when API configured, else local demo store. */
export async function resolveAuthoritativeCommit(
  cycleId: number
): Promise<Readonly<RemoteCommitRegistration | PublicRoundCommit>> {
  try {
    const remote = await fetchRemoteCommit(cycleId);
    if (remote) return remote;
  } catch {
    /* authority offline — demo fallback */
  }
  return publicRoundCommit(cycleId);
}

/**
 * Winning pocket for physics/camera guide — local store immediately, remote after lock.
 * Returns null when authority is on but betting has not ended yet.
 */
export async function resolveVisualTargetNumber(cycleId: number): Promise<number | null> {
  const cid = Math.floor(Number(cycleId));
  if (!Number.isFinite(cid) || cid < 0) return null;

  if (!isAuthorityEnabled()) {
    return outcomeForCycle(cid);
  }

  try {
    const remote = await fetchRemoteResult(cid);
    if (remote && Number.isInteger(remote.winningNumber)) {
      return remote.winningNumber;
    }
  } catch {
    /* result_locked_until_betting_ends or network */
  }
  return null;
}

/** Winning pocket — remote reveal preferred. */
export async function resolveAuthoritativeOutcome(cycleId: number): Promise<number> {
  try {
    const remote = await fetchRemoteOutcome(cycleId);
    if (remote && Number.isInteger(remote.winningNumber)) {
      applyRemoteReveal(cycleId, {
        serverSeed: remote.serverSeed,
        winningNumber: remote.winningNumber,
        serverSeedHash: remote.serverSeedHash,
        clientSeed: remote.clientSeed,
      });
      return remote.winningNumber;
    }
  } catch {
    /* fallback */
  }
  return outcomeForCycle(cycleId);
}

/** Build audit after settle using best available reveal path. */
export async function resolveAuthoritativeAudit(
  cycleId: number,
  winningNumber: number
): Promise<Readonly<FairnessAudit>> {
  try {
    const remote = await fetchRemoteOutcome(cycleId);
    if (remote?.serverSeed) {
      return applyRemoteReveal(cycleId, {
        serverSeed: remote.serverSeed,
        winningNumber: remote.winningNumber ?? winningNumber,
        serverSeedHash: remote.serverSeedHash,
        clientSeed: remote.clientSeed,
      });
    }
  } catch {
    /* local reveal only */
  }
  return revealRound(cycleId, winningNumber);
}

console.assert(typeof isAuthorityEnabled() === 'boolean', 'authority flag');

/**
 * Provably Fair RNG — commit-reveal HMAC-SHA256 European roulette (0–36).
 */

import { integrityDigest } from '../lib/integrityDigest.js';
import { APP_CONFIG } from './config.js';
import type { FairnessAudit } from './types.js';

const POCKETS = APP_CONFIG.pockets;
const PREFIX_CHARS = APP_CONFIG.provablyFair.digestPrefixHexChars;

export function commitServerSeed(serverSeed: string): string {
  if (typeof serverSeed !== 'string' || serverSeed.length < 16) {
    throw new RangeError('serverSeed must be a string of at least 16 characters');
  }
  return integrityDigest(`pf:commit:${serverSeed}`);
}

export function deriveWinningNumber(
  serverSeed: string,
  clientSeed: string,
  cycleId: number
): number {
  const cid = Math.floor(Number(cycleId));
  if (!Number.isFinite(cid) || cid < 0) {
    throw new RangeError('cycleId must be a non-negative integer');
  }
  const cs = String(clientSeed ?? 'default');
  const digest = integrityDigest(`pf:result:${serverSeed}|${cs}|${cid}`);
  const slice = digest.slice(0, PREFIX_CHARS);
  const value = parseInt(slice, 16);
  if (!Number.isFinite(value)) return 0;
  return value % POCKETS;
}

export function verifyRound(
  serverSeed: string,
  serverSeedHash: string,
  clientSeed: string,
  cycleId: number,
  winningNumber: number
): boolean {
  if (commitServerSeed(serverSeed) !== serverSeedHash) return false;
  const expected = deriveWinningNumber(serverSeed, clientSeed, cycleId);
  const actual = Math.floor(Number(winningNumber));
  return Number.isInteger(actual) && actual >= 0 && actual < POCKETS && actual === expected;
}

export function generateServerSeed(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function normalizeClientSeed(input: unknown): string {
  const s = String(input ?? 'guest').trim().slice(0, 64);
  return s.length > 0 ? s : 'guest';
}

export function buildFairnessAudit(params: {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  cycleId: number;
  winningNumber?: number;
}): Readonly<FairnessAudit> {
  const { serverSeed, serverSeedHash, clientSeed, cycleId, winningNumber } = params;
  const derived = deriveWinningNumber(serverSeed, clientSeed, cycleId);
  return Object.freeze({
    algorithm: APP_CONFIG.provablyFair.algorithm,
    serverSeedHash,
    clientSeed: normalizeClientSeed(clientSeed),
    cycleId: Math.floor(Number(cycleId)),
    winningNumber: derived,
    verified: verifyRound(serverSeed, serverSeedHash, clientSeed, cycleId, winningNumber ?? derived),
    revealServerSeed: serverSeed,
  });
}

console.assert(deriveWinningNumber('abc', 'guest', 0) >= 0, 'pf pocket >= 0');
console.assert(deriveWinningNumber('abc', 'guest', 0) < POCKETS, 'pf pocket < 37');

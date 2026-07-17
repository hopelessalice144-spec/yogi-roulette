import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { commitServerSeed, deriveWinningNumber } from './provablyFair.js';
import { clearFairRounds, outcomeForCycle, publicRoundCommit } from './fairRoundStore.js';
import {
  fetchRemoteCommit,
  fetchRemoteOutcome,
  fetchRemoteResult,
  getApiBase,
  isAuthorityEnabled,
  resolveAuthoritativeAudit,
  resolveAuthoritativeCommit,
  resolveAuthoritativeOutcome,
  resolveVisualTargetNumber,
} from './authorityClient.js';

const API_BASE = 'http://authority.test';
const CLIENT_SEED = 'authority-client-seed';
const CYCLE_ID = 5001;
const SERVER_SEED = 'f'.repeat(32);

const fetchMock = vi.hoisted(() => vi.fn());

function mockLocalStorage(): void {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
  store.set('turboRoulette.clientSeed', CLIENT_SEED);
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response;
}

describe('authorityClient', () => {
  beforeEach(() => {
    clearFairRounds();
    mockLocalStorage();
    vi.stubEnv('VITE_API_BASE', API_BASE);
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    clearFairRounds();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('getApiBase', () => {
    it('returns null when unset', () => {
      vi.stubEnv('VITE_API_BASE', '');
      expect(getApiBase()).toBeNull();
      expect(isAuthorityEnabled()).toBe(false);
    });

    it('normalizes trailing slash', () => {
      vi.stubEnv('VITE_API_BASE', 'http://authority.test/');
      expect(getApiBase()).toBe('http://authority.test');
      expect(isAuthorityEnabled()).toBe(true);
    });
  });

  describe('fetchRemoteCommit', () => {
    it('returns null without API base', async () => {
      vi.stubEnv('VITE_API_BASE', '');
      expect(await fetchRemoteCommit(CYCLE_ID)).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('registers remote commit from API response', async () => {
      const hash = commitServerSeed(SERVER_SEED);
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          cycleId: CYCLE_ID,
          serverSeedHash: hash,
          clientSeed: CLIENT_SEED,
          source: 'authority',
        })
      );

      const commit = await fetchRemoteCommit(CYCLE_ID, CLIENT_SEED);
      expect(commit?.serverSeedHash).toBe(hash);
      expect(commit?.clientSeed).toBe(CLIENT_SEED);
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE}/api/v1/rounds/${CYCLE_ID}/commit?clientSeed=${encodeURIComponent(CLIENT_SEED)}`,
        expect.objectContaining({ credentials: 'omit' })
      );
    });

    it('throws on HTTP error', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'not_found' }, 404));
      await expect(fetchRemoteCommit(CYCLE_ID)).rejects.toThrow(/HTTP 404/);
    });
  });

  describe('fetchRemoteResult', () => {
    it('returns null without API base', async () => {
      vi.stubEnv('VITE_API_BASE', '');
      expect(await fetchRemoteResult(CYCLE_ID)).toBeNull();
    });

    it('parses winning number', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ cycleId: CYCLE_ID, winningNumber: 17, source: 'authority' })
      );
      const result = await fetchRemoteResult(CYCLE_ID);
      expect(result?.winningNumber).toBe(17);
    });
  });

  describe('fetchRemoteOutcome', () => {
    it('parses full reveal payload', async () => {
      const hash = commitServerSeed(SERVER_SEED);
      const winning = deriveWinningNumber(SERVER_SEED, CLIENT_SEED, CYCLE_ID);
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          cycleId: CYCLE_ID,
          serverSeed: SERVER_SEED,
          serverSeedHash: hash,
          clientSeed: CLIENT_SEED,
          winningNumber: winning,
          verified: true,
          source: 'authority',
        })
      );

      const outcome = await fetchRemoteOutcome(CYCLE_ID);
      expect(outcome?.serverSeed).toBe(SERVER_SEED);
      expect(outcome?.winningNumber).toBe(winning);
    });
  });

  describe('resolveAuthoritativeCommit', () => {
    it('falls back to local commit when fetch fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network'));
      const commit = await resolveAuthoritativeCommit(CYCLE_ID);
      const local = publicRoundCommit(CYCLE_ID);
      expect(commit.serverSeedHash).toBe(local.serverSeedHash);
    });

    it('prefers remote commit when available', async () => {
      const hash = commitServerSeed(SERVER_SEED);
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          cycleId: CYCLE_ID,
          serverSeedHash: hash,
          clientSeed: CLIENT_SEED,
        })
      );
      const commit = await resolveAuthoritativeCommit(CYCLE_ID);
      expect(commit.serverSeedHash).toBe(hash);
    });
  });

  describe('resolveVisualTargetNumber', () => {
    it('returns local outcome when authority is disabled', async () => {
      vi.stubEnv('VITE_API_BASE', '');
      expect(await resolveVisualTargetNumber(CYCLE_ID)).toBe(outcomeForCycle(CYCLE_ID));
    });

    it('returns remote result when authority is enabled', async () => {
      vi.stubEnv('VITE_API_BASE', API_BASE);
      const winning = deriveWinningNumber(SERVER_SEED, CLIENT_SEED, CYCLE_ID);
      fetchMock.mockResolvedValueOnce(jsonResponse({ cycleId: CYCLE_ID, winningNumber: winning }));
      expect(await resolveVisualTargetNumber(CYCLE_ID)).toBe(winning);
    });

    it('returns null when remote result is locked', async () => {
      vi.stubEnv('VITE_API_BASE', API_BASE);
      fetchMock.mockRejectedValueOnce(new Error('HTTP 403'));
      expect(await resolveVisualTargetNumber(CYCLE_ID)).toBeNull();
    });
  });

  describe('resolveAuthoritativeOutcome', () => {
    it('falls back to local outcome when remote unavailable', async () => {
      fetchMock.mockRejectedValueOnce(new Error('offline'));
      const local = outcomeForCycle(CYCLE_ID);
      expect(await resolveAuthoritativeOutcome(CYCLE_ID)).toBe(local);
    });

    it('applies remote reveal and returns winning number', async () => {
      const hash = commitServerSeed(SERVER_SEED);
      const winning = deriveWinningNumber(SERVER_SEED, CLIENT_SEED, CYCLE_ID);
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          cycleId: CYCLE_ID,
          serverSeed: SERVER_SEED,
          serverSeedHash: hash,
          clientSeed: CLIENT_SEED,
          winningNumber: winning,
        })
      );
      expect(await resolveAuthoritativeOutcome(CYCLE_ID)).toBe(winning);
    });
  });

  describe('resolveAuthoritativeAudit', () => {
    it('reveals locally when remote has no seed', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ cycleId: CYCLE_ID, winningNumber: 3 }));
      const winning = outcomeForCycle(CYCLE_ID);
      const audit = await resolveAuthoritativeAudit(CYCLE_ID, winning);
      expect(audit.verified).toBe(true);
      expect(audit.winningNumber).toBe(winning);
    });

    it('builds verified audit from remote reveal', async () => {
      const hash = commitServerSeed(SERVER_SEED);
      const winning = deriveWinningNumber(SERVER_SEED, CLIENT_SEED, CYCLE_ID);
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          cycleId: CYCLE_ID,
          serverSeed: SERVER_SEED,
          serverSeedHash: hash,
          clientSeed: CLIENT_SEED,
          winningNumber: winning,
        })
      );
      const audit = await resolveAuthoritativeAudit(CYCLE_ID, winning);
      expect(audit.verified).toBe(true);
      expect(audit.revealServerSeed).toBe(SERVER_SEED);
    });
  });
});

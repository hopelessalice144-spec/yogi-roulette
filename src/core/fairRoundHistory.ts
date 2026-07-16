/**
 * IndexedDB persistence for provably-fair round history (survives refresh).
 */

import type { FairRound } from './types.js';

const DB_NAME = 'turboRoulette';
const DB_VERSION = 1;
const STORE = 'fairRounds';

export const FAIR_ROUND_HISTORY_MAX = 48;

function canUseIdb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'cycleId' });
        store.createIndex('revealed', 'revealed', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

function runTx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error('IndexedDB transaction failed'));
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error ?? new Error('IndexedDB transaction aborted'));
        };
      })
  );
}

export async function loadFairRoundHistory(
  limit: number = FAIR_ROUND_HISTORY_MAX
): Promise<readonly FairRound[]> {
  if (!canUseIdb()) return [];
  const rows = await runTx<FairRound[]>('readonly', (store) => store.getAll());
  return rows
    .sort((a, b) => b.cycleId - a.cycleId)
    .slice(0, limit)
    .map((row) => Object.freeze({ ...row }));
}

export async function persistFairRound(round: FairRound): Promise<void> {
  if (!canUseIdb()) return;
  await runTx<IDBValidKey>('readwrite', (store) => store.put({ ...round }));
  await pruneFairRoundHistory(FAIR_ROUND_HISTORY_MAX);
}

async function pruneFairRoundHistory(max: number): Promise<void> {
  if (!canUseIdb()) return;
  const rows = await runTx<FairRound[]>('readonly', (store) => store.getAll());
  if (rows.length <= max) return;
  const stale = rows.sort((a, b) => b.cycleId - a.cycleId).slice(max);
  await openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        for (const row of stale) store.delete(row.cycleId);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error('IndexedDB prune failed'));
        };
      })
  );
}

export async function clearFairRoundHistory(): Promise<void> {
  if (!canUseIdb()) return;
  await runTx<undefined>('readwrite', (store) => store.clear());
}

console.assert(FAIR_ROUND_HISTORY_MAX === 48, 'fair round history cap');

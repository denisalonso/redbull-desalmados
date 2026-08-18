import { CONFIG } from '../config.ts';
import type { RankingEntry } from '../core/types.ts';

const STORAGE_KEY = 'redbull-stack:ranking';
const STORAGE_VERSION = 1;

interface StoredRanking {
  version: number;
  entries: RankingEntry[];
}

/** RN-40: entradas expiram após RETENCAO_RANKING. */
export function filtrarValidos(
  entries: RankingEntry[],
  nowMs: number,
  retencaoH: number = CONFIG.RETENCAO_RANKING_H,
): RankingEntry[] {
  const retencaoMs = retencaoH * 60 * 60 * 1000;
  return entries.filter((e) => nowMs - e.timestampMs <= retencaoMs);
}

export function ordenarRanking(entries: RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => b.score - a.score || a.timestampMs - b.timestampMs);
}

export function topN(entries: RankingEntry[], n: number): RankingEntry[] {
  return ordenarRanking(entries).slice(0, n);
}

/**
 * RN-39/41: persistência via localStorage, JSON versionado. Se localStorage
 * falhar, degrada para memória — o jogo nunca quebra por causa do placar.
 */
export class RankingStore {
  private memory: RankingEntry[] = [];
  private readonly usableStorage: boolean;

  constructor(private readonly storage: Storage | undefined = safeLocalStorage()) {
    this.usableStorage = this.storage !== undefined;
    this.cleanupExpired();
  }

  private cleanupExpired(): void {
    const all = this.readRaw();
    const valid = filtrarValidos(all, Date.now());
    if (valid.length !== all.length) this.writeRaw(valid);
    else this.memory = valid;
  }

  list(): RankingEntry[] {
    return ordenarRanking(this.readRaw());
  }

  top(n: number): RankingEntry[] {
    return topN(this.readRaw(), n);
  }

  add(entry: RankingEntry): RankingEntry[] {
    const updated = [...this.readRaw(), entry];
    this.writeRaw(updated);
    return ordenarRanking(updated);
  }

  private readRaw(): RankingEntry[] {
    if (!this.usableStorage) return this.memory;
    try {
      const raw = this.storage!.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StoredRanking;
      if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.entries)) return [];
      return parsed.entries;
    } catch {
      return this.memory;
    }
  }

  private writeRaw(entries: RankingEntry[]): void {
    this.memory = entries;
    if (!this.usableStorage) return;
    try {
      const payload: StoredRanking = { version: STORAGE_VERSION, entries };
      this.storage!.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // RN-41: localStorage falhou (quota, modo privado etc.) — segue só em memória.
    }
  }
}

function safeLocalStorage(): Storage | undefined {
  try {
    const testKey = '__redbull-stack-test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return undefined;
  }
}

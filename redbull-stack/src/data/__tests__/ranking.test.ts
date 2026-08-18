import { describe, expect, it } from 'vitest';
import { filtrarValidos, ordenarRanking, topN } from '../ranking.ts';
import type { RankingEntry } from '../../core/types.ts';

function entry(nome: string, score: number, timestampMs = 0): RankingEntry {
  return { nome, score, timestampMs };
}

describe('ranking — ordenação', () => {
  it('ordena por score decrescente e desempata por mais antigo primeiro', () => {
    const entries = [entry('BBB', 5, 200), entry('AAA', 10, 100), entry('CCC', 10, 50)];
    expect(ordenarRanking(entries).map((e) => e.nome)).toEqual(['CCC', 'AAA', 'BBB']);
  });

  it('topN corta na quantidade pedida já ordenada', () => {
    const entries = [entry('A', 1), entry('B', 3), entry('C', 2)];
    expect(topN(entries, 2).map((e) => e.nome)).toEqual(['B', 'C']);
  });
});

describe('ranking — expiração (RN-40)', () => {
  const umaHoraMs = 60 * 60 * 1000;

  it('mantém entradas dentro da janela de retenção', () => {
    const now = 100 * umaHoraMs;
    const entries = [entry('DENTRO', 1, now - 23 * umaHoraMs)];
    expect(filtrarValidos(entries, now, 24)).toHaveLength(1);
  });

  it('remove entradas além de RETENCAO_RANKING', () => {
    const now = 100 * umaHoraMs;
    const entries = [entry('FORA', 1, now - 25 * umaHoraMs)];
    expect(filtrarValidos(entries, now, 24)).toHaveLength(0);
  });
});

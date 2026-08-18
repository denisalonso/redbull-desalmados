import { describe, expect, it } from 'vitest';
import { ehNovoRecorde, incrementarScore, partidaEncerrada } from '../score.ts';

describe('score', () => {
  it('incrementa um ponto por objeto empilhado (RN-05)', () => {
    expect(incrementarScore(0)).toBe(1);
    expect(incrementarScore(9)).toBe(10);
  });

  it('encerra a partida apenas quando quedas superam o permitido (RN-08)', () => {
    expect(partidaEncerrada(0, 0)).toBe(false);
    expect(partidaEncerrada(1, 0)).toBe(true);
    expect(partidaEncerrada(2, 3)).toBe(false);
    expect(partidaEncerrada(4, 3)).toBe(true);
  });

  it('reconhece novo recorde apenas quando o score supera o recorde atual', () => {
    expect(ehNovoRecorde(10, 9)).toBe(true);
    expect(ehNovoRecorde(9, 9)).toBe(false);
    expect(ehNovoRecorde(8, 9)).toBe(false);
  });
});

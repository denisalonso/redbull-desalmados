import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config.ts';
import {
  aplicarDecaimento,
  borraoPx,
  decaimentoPorSegundo,
  intervaloPiscadaS,
  nivelDegradacao,
  recarregarComLata,
} from '../energy.ts';

describe('energy — decaimento (RN-26/RN-34, eixo tempo da dificuldade)', () => {
  it('começa em DECAIMENTO_INICIAL e cresce até DECAIMENTO_MAX em TEMPO_COLAPSO', () => {
    expect(decaimentoPorSegundo(0)).toBeCloseTo(CONFIG.DECAIMENTO_INICIAL);
    expect(decaimentoPorSegundo(CONFIG.TEMPO_COLAPSO_S)).toBeCloseTo(CONFIG.DECAIMENTO_MAX);
    expect(decaimentoPorSegundo(CONFIG.TEMPO_COLAPSO_S * 2)).toBeCloseTo(CONFIG.DECAIMENTO_MAX);
  });

  it('drena a energia proporcionalmente ao dt, nunca abaixo de zero (RN-24)', () => {
    expect(aplicarDecaimento(100, 0, 1)).toBeCloseTo(100 - CONFIG.DECAIMENTO_INICIAL);
    expect(aplicarDecaimento(1, 0, 10)).toBe(0);
  });
});

describe('energy — recarga por lata (RN-25)', () => {
  it('soma ENERGIA_POR_LATA respeitando o teto ENERGIA_MAX', () => {
    expect(recarregarComLata(50)).toBeCloseTo(50 + CONFIG.ENERGIA_POR_LATA);
    expect(recarregarComLata(CONFIG.ENERGIA_MAX - 5)).toBe(CONFIG.ENERGIA_MAX);
  });
});

describe('energy — degradação visual (seção 3 do GDD)', () => {
  it('classifica níveis pelos limiares configurados', () => {
    expect(nivelDegradacao(100)).toBe('nitido');
    expect(nivelDegradacao(CONFIG.LIMIAR_BORRAO)).toBe('nitido');
    expect(nivelDegradacao(CONFIG.LIMIAR_BORRAO - 1)).toBe('borrao-leve');
    expect(nivelDegradacao(CONFIG.LIMIAR_PISCADA)).toBe('borrao-leve');
    expect(nivelDegradacao(CONFIG.LIMIAR_PISCADA - 1)).toBe('borrao-pesado');
  });

  it('não borra acima de LIMIAR_BORRAO e satura no máximo pesado em energia zero', () => {
    expect(borraoPx(100)).toBe(0);
    expect(borraoPx(0)).toBeCloseTo(CONFIG.BORRAO_MAX_PESADO_PX);
  });

  it('nunca pisca acima de LIMIAR_PISCADA e respeita o teto de segurança de 1.5Hz (RN-30)', () => {
    expect(intervaloPiscadaS(CONFIG.LIMIAR_PISCADA)).toBe(Infinity);
    const intervaloMinimo = intervaloPiscadaS(0);
    expect(intervaloMinimo).toBeGreaterThanOrEqual(1 / CONFIG.PISCADA_FREQ_MAX_HZ);
  });
});

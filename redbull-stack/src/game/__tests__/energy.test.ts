import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config.ts';
import {
  aplicarDecaimento,
  avisoLateralIntensidade,
  decaimentoPorSegundo,
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

describe('energy — aviso lateral de energia baixa (RN-28..31)', () => {
  it('fica em zero acima de LIMIAR_BORRAO e sobe até 1 em energia zero', () => {
    expect(avisoLateralIntensidade(100)).toBe(0);
    expect(avisoLateralIntensidade(CONFIG.LIMIAR_BORRAO)).toBe(0);
    expect(avisoLateralIntensidade(0)).toBeCloseTo(1);
  });

  it('cruza a metade da intensidade em LIMIAR_PISCADA', () => {
    expect(avisoLateralIntensidade(CONFIG.LIMIAR_PISCADA)).toBeCloseTo(0.5);
  });

  it('cresce de forma monotônica conforme a energia cai (nunca oscila — RNF-10)', () => {
    const amostras = [100, 80, 60, 45, 30, 15, 0].map(avisoLateralIntensidade);
    for (let i = 1; i < amostras.length; i++) {
      expect(amostras[i]).toBeGreaterThanOrEqual(amostras[i - 1]);
    }
  });
});

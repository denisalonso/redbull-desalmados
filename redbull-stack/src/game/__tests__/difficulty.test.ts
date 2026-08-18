import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config.ts';
import { velocidadeHorizontal } from '../difficulty.ts';

describe('difficulty — eixo velocidade (RN-33)', () => {
  it('começa em VELOCIDADE_INICIAL_X com zero objetos empilhados', () => {
    expect(velocidadeHorizontal(0)).toBeCloseTo(CONFIG.VELOCIDADE_INICIAL_X);
  });

  it('atinge VELOCIDADE_MAX_X em OBJETOS_PARA_VELOCIDADE_MAX (RN-33)', () => {
    expect(velocidadeHorizontal(CONFIG.OBJETOS_PARA_VELOCIDADE_MAX)).toBeCloseTo(
      CONFIG.VELOCIDADE_MAX_X,
    );
  });

  it('continua subindo além de OBJETOS_PARA_VELOCIDADE_MAX — sem teto, de propósito', () => {
    expect(velocidadeHorizontal(CONFIG.OBJETOS_PARA_VELOCIDADE_MAX * 2)).toBeGreaterThan(
      CONFIG.VELOCIDADE_MAX_X,
    );
  });

  it('interpola de forma monotônica crescente', () => {
    const metade = velocidadeHorizontal(CONFIG.OBJETOS_PARA_VELOCIDADE_MAX / 2);
    expect(metade).toBeGreaterThan(CONFIG.VELOCIDADE_INICIAL_X);
    expect(metade).toBeLessThan(CONFIG.VELOCIDADE_MAX_X);
  });
});

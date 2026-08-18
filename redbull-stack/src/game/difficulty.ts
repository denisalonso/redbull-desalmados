import { CONFIG } from '../config.ts';
import { clamp01, lerp } from '../core/math.ts';

/**
 * RN-33: velocidade horizontal sobe por interpolação contínua conforme
 * objetos empilhados (nunca derrubados — RN-33.1), até OBJETOS_PARA_VELOCIDADE_MAX.
 */
export function velocidadeHorizontal(objetosEmpilhados: number): number {
  const t = clamp01(objetosEmpilhados / CONFIG.OBJETOS_PARA_VELOCIDADE_MAX);
  return lerp(CONFIG.VELOCIDADE_INICIAL_X, CONFIG.VELOCIDADE_MAX_X, t);
}

import { CONFIG } from '../config.ts';
import { lerp } from '../core/math.ts';

/**
 * RN-33: velocidade horizontal sobe por interpolação contínua conforme
 * objetos empilhados (nunca derrubados — RN-33.1). Desvio deliberado: sem
 * teto — VELOCIDADE_MAX_X/OBJETOS_PARA_VELOCIDADE_MAX definem só a
 * inclinação da rampa (a velocidade atingida nesse ponto), não um limite;
 * `t` passa de 1 livremente e a velocidade continua subindo depois disso.
 * Ela pediu de propósito: em partidas longas (40+ objetos, já batendo
 * recorde de 63) a velocidade estava saturando e o fim ficava fácil demais.
 */
export function velocidadeHorizontal(objetosEmpilhados: number): number {
  const t = objetosEmpilhados / CONFIG.OBJETOS_PARA_VELOCIDADE_MAX;
  return lerp(CONFIG.VELOCIDADE_INICIAL_X, CONFIG.VELOCIDADE_MAX_X, t);
}

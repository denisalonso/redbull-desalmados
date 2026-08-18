import { CONFIG } from '../config.ts';
import { clamp01, lerp } from '../core/math.ts';

/** RN-26/RN-34: a taxa de decaimento cresce com o tempo decorrido, até TEMPO_COLAPSO. */
export function decaimentoPorSegundo(tempoDecorridoS: number): number {
  const t = clamp01(tempoDecorridoS / CONFIG.TEMPO_COLAPSO_S);
  return lerp(CONFIG.DECAIMENTO_INICIAL, CONFIG.DECAIMENTO_MAX, t);
}

/**
 * RN-24: a barra drena continuamente, nunca abaixo de zero. Desvio do GDD
 * original (RN-27/RN-09): aqui energia zerada ENCERRA a partida — ver
 * Game.update — em vez de só degradar a visão indefinidamente.
 */
export function aplicarDecaimento(
  energiaAtual: number,
  tempoDecorridoS: number,
  dtS: number,
): number {
  const taxa = decaimentoPorSegundo(tempoDecorridoS);
  return Math.max(0, energiaAtual - taxa * dtS);
}

/** RN-25: empilhar uma lata recarrega, com teto em ENERGIA_MAX. RN-22 é responsabilidade do chamador. */
export function recarregarComLata(energiaAtual: number): number {
  return Math.min(CONFIG.ENERGIA_MAX, energiaAtual + CONFIG.ENERGIA_POR_LATA);
}

/**
 * RN-28..31: intensidade (0..1) da luz vermelha lateral de aviso — sobe em
 * duas etapas, cruzando 0,5 em LIMIAR_PISCADA, igual à antiga curva de
 * desfoque leve/pesado. Contínua (sem piscar) — ver CONFIG.AVISO_OPACIDADE_MAX.
 */
export function avisoLateralIntensidade(energia: number): number {
  if (energia >= CONFIG.LIMIAR_BORRAO) return 0;
  if (energia >= CONFIG.LIMIAR_PISCADA) {
    const t = clamp01(
      (CONFIG.LIMIAR_BORRAO - energia) / (CONFIG.LIMIAR_BORRAO - CONFIG.LIMIAR_PISCADA),
    );
    return lerp(0, 0.5, t);
  }
  const t = clamp01((CONFIG.LIMIAR_PISCADA - energia) / CONFIG.LIMIAR_PISCADA);
  return lerp(0.5, 1, t);
}

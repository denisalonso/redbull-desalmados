import { CONFIG } from '../config.ts';
import type { PiscadaState } from '../game/Game.ts';

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Controla as duas pálpebras (RN-28..31). A abertura/fechamento já vem
 * temporizada pelo Game (0,35s cada metade); aqui só convertemos o progresso
 * em altura de tela, com teto de obscurecimento em OBSCURECIMENTO_MAX.
 */
export class Degradation {
  private readonly topEl: HTMLElement;
  private readonly bottomEl: HTMLElement;

  constructor() {
    const topEl = document.querySelector('.eyelid-top');
    const bottomEl = document.querySelector('.eyelid-bottom');
    if (!(topEl instanceof HTMLElement) || !(bottomEl instanceof HTMLElement)) {
      throw new Error('Camadas de pálpebra (.eyelid-top / .eyelid-bottom) não encontradas.');
    }
    this.topEl = topEl;
    this.bottomEl = bottomEl;
  }

  update(piscada: PiscadaState | null): void {
    if (!piscada) {
      this.setHeightPercent(0);
      return;
    }
    const progresso = smoothstep(Math.max(0, Math.min(1, piscada.progresso)));
    const fechado = piscada.fechando ? progresso : 1 - progresso;
    // RN-31: cada pálpebra cobre no máximo metade da tela — juntas, no máximo OBSCURECIMENTO_MAX.
    this.setHeightPercent(fechado * CONFIG.OBSCURECIMENTO_MAX * 50);
  }

  private setHeightPercent(percent: number): void {
    this.topEl.style.height = `${percent}%`;
    this.bottomEl.style.height = `${percent}%`;
  }

  reset(): void {
    this.setHeightPercent(0);
  }
}

import { CONFIG } from '../config.ts';

/**
 * Aviso de energia baixa (RN-28..31): luz vermelha nas duas laterais, cuja
 * opacidade acompanha `avisoLateralIntensidade(energia)` continuamente — sem
 * piscar. Substitui o par embaçado/pálpebra piscando do design original.
 */
export class WarningGlow {
  private readonly leftEl: HTMLElement;
  private readonly rightEl: HTMLElement;

  constructor() {
    const leftEl = document.querySelector('.aviso-esquerda');
    const rightEl = document.querySelector('.aviso-direita');
    if (!(leftEl instanceof HTMLElement) || !(rightEl instanceof HTMLElement)) {
      throw new Error('Camadas de aviso lateral (.aviso-esquerda / .aviso-direita) não encontradas.');
    }
    this.leftEl = leftEl;
    this.rightEl = rightEl;
  }

  update(intensidade: number): void {
    const opacidade = Math.max(0, Math.min(1, intensidade)) * CONFIG.AVISO_OPACIDADE_MAX;
    this.leftEl.style.opacity = String(opacidade);
    this.rightEl.style.opacity = String(opacidade);
  }

  reset(): void {
    this.update(0);
  }
}

import { CONFIG } from '../config.ts';

/**
 * Resolução virtual 720×1280, retrato, letterbox. devicePixelRatio com teto em 2.
 * O #viewport tem o tamanho virtual fixo em CSS e é escalado inteiro via
 * `transform: scale()` para caber na janela — mantendo a proporção sem
 * recalcular coordenadas de jogo.
 */
export class Viewport {
  readonly ctx: CanvasRenderingContext2D;
  readonly width = CONFIG.VIRTUAL_WIDTH;
  readonly height = CONFIG.VIRTUAL_HEIGHT;

  private readonly viewportEl: HTMLElement;
  private readonly canvas: HTMLCanvasElement;

  constructor() {
    const viewportEl = document.getElementById('viewport');
    const canvas = document.getElementById('game-canvas');
    if (!viewportEl || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Estrutura DOM esperada (#viewport, #game-canvas) não encontrada.');
    }
    this.viewportEl = viewportEl;
    this.canvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D não suportado.');
    this.ctx = ctx;

    this.applyPixelRatio();
    this.fitToWindow();
    window.addEventListener('resize', this.fitToWindow);
    window.addEventListener('orientationchange', this.fitToWindow);
  }

  private applyPixelRatio(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.DEVICE_PIXEL_RATIO_MAX);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private readonly fitToWindow = (): void => {
    const scale = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
    this.viewportEl.style.transform = `scale(${scale})`;
  };

  clear(fillStyle: string): void {
    this.ctx.fillStyle = fillStyle;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}

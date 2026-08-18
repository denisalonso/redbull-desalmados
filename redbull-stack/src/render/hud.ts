export interface HudSnapshot {
  score: number;
  recorde: number;
  energia: number;
}

/**
 * HUD do JOGO: recorde/score (RF-04), barra de energia (RF-05).
 *
 * Sem barra de relógio do objeto: com duas barras de tempo lado a lado
 * (energia + relógio do objeto) a energia não lia como a pressão real do
 * jogo. O relógio por objeto (RN-35 original) foi removido de vez — quem
 * segura o jogador agora é só a energia (Game.iniciarCongelamento em energia
 * <= 0), então demorar demais tem custo real, não só borra a tela à toa.
 */
export class Hud {
  private readonly root: HTMLElement;
  private readonly scoreEl: HTMLElement;
  private readonly recordeEl: HTMLElement;
  private readonly energyFillEl: HTMLElement;

  constructor() {
    const root = document.getElementById('hud-layer');
    if (!root) throw new Error('#hud-layer não encontrado.');
    this.root = root;

    this.root.innerHTML = `
      <div class="hud-top">
        <span class="hud-recorde">RECORDE <b data-hud="recorde">0</b></span>
        <span class="hud-score" data-hud="score">0</span>
      </div>
      <div class="hud-energy">
        <span class="hud-energy-icon">⚡</span>
        <div class="hud-energy-track"><div class="hud-energy-fill" data-hud="energyFill"></div></div>
      </div>
    `;

    this.scoreEl = this.query('score');
    this.recordeEl = this.query('recorde');
    this.energyFillEl = this.query('energyFill');
  }

  private query(name: string): HTMLElement {
    const el = this.root.querySelector(`[data-hud="${name}"]`);
    if (!(el instanceof HTMLElement)) throw new Error(`Elemento de HUD "${name}" ausente.`);
    return el;
  }

  show(): void {
    this.root.style.display = 'block';
  }

  hide(): void {
    this.root.style.display = 'none';
  }

  update(snapshot: HudSnapshot): void {
    this.scoreEl.textContent = String(snapshot.score);
    this.recordeEl.textContent = String(snapshot.recorde);
    this.energyFillEl.style.width = `${Math.max(0, Math.min(100, snapshot.energia))}%`;
  }
}

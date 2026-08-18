import type { RankingEntry } from '../core/types.ts';

export interface IntroScreenDeps {
  getTop3(): RankingEntry[];
  onPlay(): void;
}

/** RF-02/RF-03: como jogar (ícones + uma linha), barra de energia, PLAY, top 3. */
export class IntroScreen {
  private readonly root: HTMLElement;

  constructor(private readonly deps: IntroScreenDeps) {
    const root = document.createElement('div');
    root.className = 'screen screen-intro';
    root.innerHTML = `
      <h1 class="brand-title">EMPILHA</h1>
      <div class="howto">
        <div class="howto-item"><span class="howto-icon">👆</span><span>Toque para soltar o objeto</span></div>
        <div class="howto-item"><span class="howto-icon">⚡</span><span>Empilhe latas para manter o foco</span></div>
        <div class="howto-item"><span class="howto-icon">📉</span><span>Deixar cair encerra a partida</span></div>
      </div>
      <button type="button" class="btn-play" data-play>JOGAR</button>
      <div class="top3">
        <h2>TOP 3</h2>
        <ol data-top3></ol>
      </div>
    `;
    this.root = root;

    root.querySelector('[data-play]')?.addEventListener('click', () => this.deps.onPlay());
  }

  show(): void {
    document.getElementById('screen-layer')?.appendChild(this.root);
    this.renderTop3();
  }

  hide(): void {
    this.root.remove();
  }

  private renderTop3(): void {
    const list = this.root.querySelector('[data-top3]');
    if (!list) return;
    const entries = this.deps.getTop3();
    list.innerHTML = entries.length
      ? entries
          .map((e) => `<li><span>${escapeHtml(e.nome)}</span><span>${e.score}</span></li>`)
          .join('')
      : '<li class="top3-empty">Seja o primeiro do ranking</li>';
  }
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

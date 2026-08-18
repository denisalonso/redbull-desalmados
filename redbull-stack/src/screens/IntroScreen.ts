import type { RankingEntry } from '../core/types.ts';

export interface IntroScreenDeps {
  getTop3(): RankingEntry[];
  onPlay(): void;
}

export class IntroScreen {
  private readonly root: HTMLElement;

  constructor(private readonly deps: IntroScreenDeps) {
    const root = document.createElement('div');
    root.className = 'screen screen-intro';

    root.innerHTML = `
      <div class="intro-noise" aria-hidden="true"></div>
      <div class="intro-glow intro-glow-red" aria-hidden="true"></div>
      <div class="intro-glow intro-glow-yellow" aria-hidden="true"></div>

      <header class="intro-header">
        <img
          class="redbull-logo"
          src="/redbull-logo.png"
          alt="Red Bull"
        />

        <div class="intro-kicker">
          RED BULL CHALLENGE
        </div>
      </header>

      <main class="intro-content">
        <div class="title-wrap">
          <span class="title-eyebrow">EMPILHE. RESISTA. DESAFIE O LIMITE.</span>
          <h1 class="brand-title">
            <span>DROP</span><span>ZONE</span>
          </h1>
          <p class="title-subtitle">
            O equilíbrio acaba quando você perde o foco.
          </p>
        </div>

        <div class="howto">
          <p class="howto-text">
            Equilibre as latas para recuperar o foco entre as principais situações que um Red Bull dá aquele gás extra.
          </p>
          <p class="howto-text">
            Quanto mais alto você chegar, maior será sua pontuação.</p>
          <p><strong>Mas cuidado: não deixe a pilha cair!</strong></p>
        </div>

        <button type="button" class="btn-play" data-play>
          <span class="btn-play-shine"></span>
          <span class="btn-play-label">JOGAR</span>
        </button>

        <div class="top3">
          <div class="top3-heading">
            <span class="top3-line"></span>
            <h2>TOP 3</h2>
            <span class="top3-line"></span>
          </div>

          <ol data-top3></ol>
        </div>
      </main>

      <footer class="intro-footer">
        <span>POWERED BY</span>
        <span class="footer-dot"></span>
        <span>RED BULL</span>
      </footer>
    `;

    this.root = root;

    root
      .querySelector('[data-play]')
      ?.addEventListener('click', () => this.deps.onPlay());
  }

  show(): void {
    document.getElementById('screen-layer')?.appendChild(this.root);
    this.renderTop3();

    requestAnimationFrame(() => {
      this.root.classList.add('is-visible');
    });
  }

  hide(): void {
    this.root.classList.remove('is-visible');
    this.root.remove();
  }

  private renderTop3(): void {
    const list = this.root.querySelector('[data-top3]');
    if (!list) return;

    const entries = this.deps.getTop3();

    list.innerHTML = entries.length
      ? entries
          .map(
            (entry, index) => `
              <li class="top3-entry top3-entry-${index + 1}">
                <span class="top3-position">0${index + 1}</span>
                <span class="top3-name">${escapeHtml(entry.nome)}</span>
                <span class="top3-score">${entry.score}</span>
              </li>
            `,
          )
          .join('')
      : `
          <li class="top3-empty">
            <span>AINDA NÃO HÁ NINGUÉM NO TOPO.</span>
            <small>SEJA O PRIMEIRO.</small>
          </li>
        `;
  }
}

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

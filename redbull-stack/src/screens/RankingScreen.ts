import { CONFIG } from '../config.ts';
import type { RankingEntry } from '../core/types.ts';

export interface RankingShowPayload {
  entries: RankingEntry[];
  destaque?: RankingEntry;
}

export interface RankingScreenDeps {
  onReturn(): void;
}

/** RF-11/RF-12: tabela completa com destaque, retorno a INÍCIO em 15s ou no primeiro toque. */
export class RankingScreen {
  private readonly root: HTMLElement;
  private readonly listEl: HTMLElement;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly deps: RankingScreenDeps) {
    const root = document.createElement('div');
    root.className = 'screen screen-ranking';
    root.innerHTML = `
      <h2>RANKING</h2>
      <ol class="ranking-list" data-ranking-list></ol>
      <p class="ranking-hint">toque para continuar</p>
    `;
    this.root = root;
    const listEl = root.querySelector('[data-ranking-list]');
    if (!listEl) throw new Error('RankingScreen: lista ausente.');
    this.listEl = listEl as HTMLElement;

    root.addEventListener('click', () => this.returnNow());
  }

  show(payload: RankingShowPayload): void {
    this.listEl.innerHTML = payload.entries.length
      ? payload.entries
          .map((e, i) => {
            const destacado =
              payload.destaque &&
              e.nome === payload.destaque.nome &&
              e.score === payload.destaque.score &&
              e.timestampMs === payload.destaque.timestampMs;
            return `<li class="${destacado ? 'ranking-destaque' : ''}">
              <span class="ranking-pos">${i + 1}</span>
              <span class="ranking-nome">${escapeHtml(e.nome)}</span>
              <span class="ranking-score">${e.score}</span>
            </li>`;
          })
          .join('')
      : '<li class="top3-empty">Ranking vazio</li>';

    document.getElementById('screen-layer')?.appendChild(this.root);
    this.timeoutId = setTimeout(() => this.returnNow(), CONFIG.RANKING_AUTO_RETORNO_S * 1000);
  }

  hide(): void {
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    this.timeoutId = null;
    this.root.remove();
  }

  private returnNow(): void {
    this.deps.onReturn();
  }
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

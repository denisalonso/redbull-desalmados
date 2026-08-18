import { CONFIG } from '../config.ts';

export interface NameScreenDeps {
  onSubmit(nome: string): void;
  onSkip(): void;
}

/** RF-10: NOME aceita até NOME_MAX_CARACTERES e é pulável. */
export class NameScreen {
  private readonly root: HTMLElement;
  private readonly scoreEl: HTMLElement;
  private readonly inputEl: HTMLInputElement;
  private score = 0;

  constructor(private readonly deps: NameScreenDeps) {
    const root = document.createElement('div');
    root.className = 'screen screen-name';
    root.innerHTML = `
      <p class="name-label">SUA PONTUAÇÃO</p>
      <h2 class="name-score" data-score>0</h2>
      <input
        class="name-input"
        data-name-input
        maxlength="${CONFIG.NOME_MAX_CARACTERES}"
        placeholder="NOME"
        autocomplete="off"
        autocapitalize="characters"
      />
      <div class="name-actions">
        <button type="button" class="btn-secondary" data-skip>PULAR</button>
        <button type="button" class="btn-play" data-confirm>OK</button>
      </div>
    `;
    this.root = root;
    this.scoreEl = this.mustQuery('[data-score]');
    this.inputEl = this.mustQuery<HTMLInputElement>('[data-name-input]');

    this.inputEl.addEventListener('input', () => {
      this.inputEl.value = this.inputEl.value.toUpperCase().slice(0, CONFIG.NOME_MAX_CARACTERES);
    });
    root.querySelector('[data-confirm]')?.addEventListener('click', () => this.submit());
    root.querySelector('[data-skip]')?.addEventListener('click', () => this.deps.onSkip());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submit();
    });
  }

  private mustQuery<T extends Element = HTMLElement>(selector: string): T {
    const el = this.root.querySelector(selector);
    if (!el) throw new Error(`NameScreen: elemento "${selector}" ausente.`);
    return el as T;
  }

  private submit(): void {
    const nome = this.inputEl.value.trim();
    this.deps.onSubmit(nome || 'JOGADOR');
  }

  show(score: number): void {
    this.score = score;
    this.scoreEl.textContent = String(this.score);
    this.inputEl.value = '';
    document.getElementById('screen-layer')?.appendChild(this.root);
    this.inputEl.focus();
  }

  hide(): void {
    this.root.remove();
  }
}

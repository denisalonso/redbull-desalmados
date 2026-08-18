import type { ScreenState } from './types.ts';

interface StateHandlers {
  onEnter?: (payload?: unknown) => void;
  onExit?: () => void;
}

/**
 * FSM própria e minimalista para as quatro telas do jogo (RF-01).
 * Sem biblioteca externa — STACK.md exige "FSM própria (~80 linhas)".
 */
export class FSM {
  private current: ScreenState;
  private readonly handlers: Partial<Record<ScreenState, StateHandlers>> = {};

  constructor(initial: ScreenState) {
    this.current = initial;
  }

  get state(): ScreenState {
    return this.current;
  }

  register(state: ScreenState, handlers: StateHandlers): void {
    this.handlers[state] = handlers;
  }

  transition(next: ScreenState, payload?: unknown): void {
    if (next === this.current) return;
    this.handlers[this.current]?.onExit?.();
    this.current = next;
    this.handlers[next]?.onEnter?.(payload);
  }

  start(payload?: unknown): void {
    this.handlers[this.current]?.onEnter?.(payload);
  }
}

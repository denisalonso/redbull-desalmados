export type UpdateFn = (dtSeconds: number) => void;
export type RenderFn = (alpha: number) => void;

/**
 * requestAnimationFrame + passo fixo (RN-38): timestep fixo de 1000/60ms via
 * acumulador, para que delta variável não faça a pilha física explodir em
 * máquinas lentas.
 */
export class GameLoop {
  private accumulatorMs = 0;
  private lastTimeMs = 0;
  private rafId = 0;
  private running = false;

  constructor(
    private readonly fixedStepMs: number,
    private readonly update: UpdateFn,
    private readonly render: RenderFn,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimeMs = performance.now();
    this.accumulatorMs = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;

    const frameMs = Math.min(now - this.lastTimeMs, 250); // evita espiral da morte
    this.lastTimeMs = now;
    this.accumulatorMs += frameMs;

    while (this.accumulatorMs >= this.fixedStepMs) {
      this.update(this.fixedStepMs / 1000);
      this.accumulatorMs -= this.fixedStepMs;
    }

    this.render(this.accumulatorMs / this.fixedStepMs);
    this.rafId = requestAnimationFrame(this.tick);
  };
}

import Matter from 'matter-js';
import { CONFIG } from '../config.ts';

/**
 * Encapsula o Matter.Engine com a configuração da GDD seção 7 — a diferença
 * entre uma pilha estável e uma que treme e explode sozinha.
 */
export class PhysicsWorld {
  readonly engine: Matter.Engine;

  constructor() {
    this.engine = Matter.Engine.create();
    this.engine.gravity.y = CONFIG.MATTER.gravityY;
    this.engine.positionIterations = CONFIG.MATTER.positionIterations;
    this.engine.velocityIterations = CONFIG.MATTER.velocityIterations;
    this.engine.enableSleeping = CONFIG.MATTER.enableSleeping;
  }

  /** RN-38: chamado com o passo fixo do acumulador do GameLoop, nunca com delta variável. */
  step(fixedStepMs: number): void {
    Matter.Engine.update(this.engine, fixedStepMs);
  }

  add(...bodies: Matter.Body[]): void {
    Matter.Composite.add(this.engine.world, bodies);
  }

  remove(body: Matter.Body): void {
    Matter.Composite.remove(this.engine.world, body);
  }

  clear(): void {
    Matter.Composite.clear(this.engine.world, false);
  }
}

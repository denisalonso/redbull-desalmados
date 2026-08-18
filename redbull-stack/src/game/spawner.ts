import { CONFIG } from '../config.ts';
import { COMUM_TEMPLATES, LATA_TEMPLATES, buildObjectDef } from '../data/objectLibrary.ts';
import type { ObjectDef } from '../core/types.ts';
import type { ObjectTemplate } from '../data/objectLibrary.ts';

/**
 * RN-21: objetos especiais aparecem na proporção PROPORCAO_LATAS.
 * Dentro de cada categoria, uma variante visual é escolhida aleatoriamente.
 */
export class Spawner {
  private count = 0;
  private latasEmitidas = 0;

  constructor(private readonly rng: () => number = Math.random) {}

  next(): ObjectDef {
    this.count += 1;

    const ehLataEspecial = this.decideLata();
    if (ehLataEspecial) this.latasEmitidas += 1;

    const pool = ehLataEspecial ? LATA_TEMPLATES : COMUM_TEMPLATES;
    const template = this.pick(pool);

    return buildObjectDef(template, `obj-${this.count}`);
  }

  private pick(templates: readonly ObjectTemplate[]): ObjectTemplate {
    const index = Math.floor(this.rng() * templates.length);
    return templates[index];
  }

  private decideLata(): boolean {
    if (this.latasEmitidas === 0) {
      if (this.count === CONFIG.LATA_GARANTIDA_ATE_OBJETO) return true;
      return this.rng() < 1 / CONFIG.PROPORCAO_LATAS;
    }

    return this.count % CONFIG.PROPORCAO_LATAS === 0;
  }
}

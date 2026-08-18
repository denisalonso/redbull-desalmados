import { CONFIG } from '../config.ts';
import { KEYWORDS } from '../theme.ts';
import { COMUM_TEMPLATES, LATA_TEMPLATE, buildObjectDef } from '../data/objectLibrary.ts';
import type { ObjectDef } from '../core/types.ts';

/**
 * RN-21: latas aparecem na proporção PROPORCAO_LATAS (1 a cada 4). A primeira
 * lata aparece garantidamente nos LATA_GARANTIDA_ATE_OBJETO primeiros objetos.
 */
export class Spawner {
  private count = 0;
  private latasEmitidas = 0;

  constructor(private readonly rng: () => number = Math.random) {}

  next(): ObjectDef {
    this.count += 1;
    const ehLata = this.decideLata();
    if (ehLata) this.latasEmitidas += 1;

    const template = ehLata
      ? LATA_TEMPLATE
      : COMUM_TEMPLATES[Math.floor(this.rng() * COMUM_TEMPLATES.length)];

    const id = `obj-${this.count}`;
    const label = ehLata ? 'RED BULL' : KEYWORDS[this.count % KEYWORDS.length];
    return buildObjectDef(template, id, label);
  }

  private decideLata(): boolean {
    if (this.latasEmitidas === 0) {
      if (this.count === CONFIG.LATA_GARANTIDA_ATE_OBJETO) return true;
      return this.rng() < 1 / CONFIG.PROPORCAO_LATAS;
    }
    return this.count % CONFIG.PROPORCAO_LATAS === 0;
  }
}

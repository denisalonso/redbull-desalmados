import { THEME } from '../theme.ts';
import type { ObjectClass, ObjectDef } from '../core/types.ts';

/**
 * RN-17/RN-18: toda hitbox é retângulo, nunca base curva.
 * RN-19: objetos variam em largura e altura — é a variedade de encaixe.
 * Placeholder: cor sólida + rótulo em vez de arte final (o fundo pode ser liso).
 */
export interface ObjectTemplate {
  classe: ObjectClass;
  larguraPx: number;
  alturaPx: number;
  densidade: number;
  cor: string;
}

/**
 * Variedade moderada de propositalmente: largura/altura e densidade variam
 * pouco entre si (spread reduzido) para que o encaixe (RN-19) continue
 * exigindo atenção sem tornar a pilha caoticamente instável — objetos muito
 * desproporcionais entre si (um bem largo embaixo de um bem estreito) são a
 * causa mais comum de tombamento "injusto".
 */
export const COMUM_TEMPLATES: ObjectTemplate[] = [
  {
    classe: 'comum',
    larguraPx: 150,
    alturaPx: 90,
    densidade: 0.0017,
    cor: THEME.color.primary.azulMarinho,
  },
  {
    classe: 'comum',
    larguraPx: 120,
    alturaPx: 110,
    densidade: 0.0018,
    cor: THEME.color.secondary.cinza,
  },
  {
    classe: 'comum',
    larguraPx: 160,
    alturaPx: 75,
    densidade: 0.0016,
    cor: THEME.color.secondary.prata,
  },
  {
    classe: 'comum',
    larguraPx: 105,
    alturaPx: 115,
    densidade: 0.0019,
    cor: THEME.color.primary.vermelho,
  },
];

/** RN-20: lata empilha e recarrega energia. */
export const LATA_TEMPLATE: ObjectTemplate = {
  classe: 'lata',
  larguraPx: 80,
  alturaPx: 115,
  densidade: 0.002,
  cor: THEME.color.primary.amarelo,
};

export function buildObjectDef(template: ObjectTemplate, id: string, label: string): ObjectDef {
  return {
    id,
    classe: template.classe,
    sprite: { cor: template.cor, label },
    larguraPx: template.larguraPx,
    alturaPx: template.alturaPx,
    densidade: template.densidade,
  };
}

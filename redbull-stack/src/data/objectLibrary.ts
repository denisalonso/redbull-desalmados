import { THEME } from '../theme.ts';
import type { ObjectClass, ObjectDef } from '../core/types.ts';

/**
 * RN-17/RN-18: toda hitbox é retângulo, nunca base curva.
 * RN-19 original: objetos variavam em largura e altura como variedade de
 * encaixe — desvio deliberado abaixo (COMUM_TEMPLATES): tamanho agora é
 * padronizado, a variedade ficou só visual (ícone + cor).
 */
export interface ObjectTemplate {
  classe: ObjectClass;
  larguraPx: number;
  alturaPx: number;
  densidade: number;
  cor: string;
  label: string;
  /** Arquivo em public/<classe>-<imagemKey>.png. Sem imagem carregada, cai pro placeholder (cor + label). */
  imagemKey?: string;
}

/**
 * Tamanho padronizado pra todos os objetos comuns — formato bem retangular
 * (base bem maior que altura) pra estabilidade máxima. Desvio deliberado de
 * RN-19 (variedade de largura/altura): a pedido dela, a variedade agora é só
 * visual (ícone + cor), não mais de geometria — a variação de tamanho estava
 * atrapalhando a leitura dos cartões brancos com borda colorida.
 */
const COMUM_LARGURA_PX = 220;
const COMUM_ALTURA_PX = 115;

/** Paleta de borda dos cartões — só estas 3 cores, nada do THEME genérico aqui. */
const BORDA_VERMELHO = '#e30118';
const BORDA_AMARELO = '#fdd900';
const BORDA_AZUL = '#3671c6';

/** Densidade varia um pouco (mesmo tamanho, peso levemente diferente). */
export const COMUM_TEMPLATES: ObjectTemplate[] = [
  {
    classe: 'comum',
    larguraPx: COMUM_LARGURA_PX,
    alturaPx: COMUM_ALTURA_PX,
    densidade: 0.0017,
    cor: BORDA_AZUL,
    label: 'TRABALHO',
    imagemKey: 'trabalho',
  },
  {
    classe: 'comum',
    larguraPx: COMUM_LARGURA_PX,
    alturaPx: COMUM_ALTURA_PX,
    densidade: 0.0018,
    cor: BORDA_AMARELO,
    label: 'FESTAS',
    imagemKey: 'festas',
  },
  {
    classe: 'comum',
    larguraPx: COMUM_LARGURA_PX,
    alturaPx: COMUM_ALTURA_PX,
    densidade: 0.0016,
    cor: BORDA_VERMELHO,
    label: 'ESPORTES',
    imagemKey: 'esportes',
  },
  {
    classe: 'comum',
    larguraPx: COMUM_LARGURA_PX,
    alturaPx: COMUM_ALTURA_PX,
    densidade: 0.0019,
    cor: BORDA_AZUL,
    label: 'JOGOS',
    imagemKey: 'jogos',
  },
  {
    classe: 'comum',
    larguraPx: COMUM_LARGURA_PX,
    alturaPx: COMUM_ALTURA_PX,
    densidade: 0.0017,
    cor: BORDA_AMARELO,
    label: 'FITNESS',
    imagemKey: 'fitness',
  },
  {
    classe: 'comum',
    larguraPx: COMUM_LARGURA_PX,
    alturaPx: COMUM_ALTURA_PX,
    densidade: 0.0018,
    cor: BORDA_VERMELHO,
    label: 'ESTUDOS',
    imagemKey: 'estudos',
  },
  {
    classe: 'comum',
    larguraPx: COMUM_LARGURA_PX,
    alturaPx: COMUM_ALTURA_PX,
    densidade: 0.0019,
    cor: BORDA_AZUL,
    label: 'DIRIGIR',
    imagemKey: 'dirigir',
  },
];

/**
 * RN-20: lata empilha e recarrega energia. Deitada (não em pé) — proporção
 * bate com os sprites reais (public/lata-*.png, ~900px de altura em pé,
 * razão ~2,55:1 deitada — as 5 artes ficam bem próximas entre si) pra não
 * distorcer a imagem no encaixe.
 */
export const LATA_TEMPLATE: ObjectTemplate = {
  classe: 'lata',
  larguraPx: 235,
  alturaPx: 92,
  densidade: 0.002,
  cor: THEME.color.primary.amarelo,
  label: 'RED BULL',
};

/** Sabores disponíveis (public/lata-<key>.png) — um é sorteado por lata. */
export const LATA_IMAGENS = ['nectarina', 'classica', 'melao', 'tropical', 'zero'] as const;

export function buildObjectDef(template: ObjectTemplate, id: string, imagemKeyOverride?: string): ObjectDef {
  return {
    id,
    classe: template.classe,
    sprite: {
      cor: template.cor,
      label: template.label,
      imagemKey: imagemKeyOverride ?? template.imagemKey,
    },
    larguraPx: template.larguraPx,
    alturaPx: template.alturaPx,
    densidade: template.densidade,
  };
}

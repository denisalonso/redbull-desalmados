import { THEME } from '../theme.ts';
import type { ObjectClass, ObjectDef } from '../core/types.ts';

/**
 * Monta a URL de uma imagem colocada em public/latas.
 * O BASE_URL faz o caminho continuar funcionando no Vite e no deploy.
 */
function lataAsset(nomeArquivo: string): string {
  return `${import.meta.env.BASE_URL}latas/${nomeArquivo}`;
}

/** Configuração visual e física de uma variante de lata. */
export interface ObjectTemplate {
  nome: string;
  classe: ObjectClass;
  larguraPx: number;
  alturaPx: number;
  densidade: number;
  corFallback: string;
  imagemUrl: string;
}

/**
 * Variantes comuns. Elas são escolhidas aleatoriamente quando o Spawner
 * decide criar um objeto comum. Todas podem ter imagens diferentes.
 */
export const COMUM_TEMPLATES: ObjectTemplate[] = [
  {
    nome: 'Objeto',
    classe: 'comum',
    larguraPx: 80,
    alturaPx: 160,
    densidade: 0.0018,
    corFallback: THEME.color.primary.azulMarinho,
    imagemUrl: lataAsset('Objeto.png'),
  },
  
];

/**
 * Variantes especiais. A regra atual do jogo faz objetos da classe "lata"
 * recuperarem energia quando são empilhados corretamente.
 */
export const LATA_TEMPLATES: ObjectTemplate[] = [
  {
    nome: 'Tradicional',
    classe: 'lata',
    larguraPx: 80,
    alturaPx: 160,
    densidade: 0.0018,
    corFallback: THEME.color.primary.amarelo,
    imagemUrl: lataAsset('lata_tradicional.png'),
  },
  {
    nome: 'Tradicional sem açucar',
    classe: 'lata',
    larguraPx: 80,
    alturaPx: 160,
    densidade: 0.0018,
    corFallback: THEME.color.secondary.ouro,
    imagemUrl: lataAsset('lata-tradicional-sem-acucar.png'),
  },
  {
    nome: 'Frutas Vermelhas',
    classe: 'lata',
    larguraPx: 80,
    alturaPx: 160,
    densidade: 0.0018,
    corFallback: THEME.color.secondary.ouro,
    imagemUrl: lataAsset('lata_frutas_vermelhas.png'),
  },
];

export function buildObjectDef(template: ObjectTemplate, id: string): ObjectDef {
  return {
    id,
    classe: template.classe,
    sprite: {
      cor: template.corFallback,
      label: template.nome,
      imagemUrl: template.imagemUrl,
    },
    larguraPx: template.larguraPx,
    alturaPx: template.alturaPx,
    densidade: template.densidade,
  };
}

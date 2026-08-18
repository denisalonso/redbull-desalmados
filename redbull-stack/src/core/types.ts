/** Tipos compartilhados entre módulos do jogo. */

export type ScreenState = 'INICIO' | 'JOGO' | 'NOME' | 'RANKING';

export type ObjectClass = 'comum' | 'lata';

/** RN-23: todo objeto declara id, classe, sprite, largura, altura e densidade. */
export interface ObjectDef {
  id: string;
  classe: ObjectClass;
  sprite: {
    /** Cor e texto usados como fallback se a imagem ainda não carregou. */
    cor: string;
    label: string;
    /** URL da imagem PNG usada para desenhar esta variante de lata. */
    imagemUrl: string;
  };
  larguraPx: number;
  alturaPx: number;
  densidade: number;
}

export interface RankingEntry {
  nome: string;
  score: number;
  timestampMs: number;
}

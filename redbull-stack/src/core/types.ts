/** Tipos compartilhados entre módulos do jogo. */

export type ScreenState = 'INICIO' | 'JOGO' | 'NOME' | 'RANKING';

/** Por que a partida terminou — mostrado na tela de game over. */
export type MotivoFim = 'queda' | 'energia' | 'teto';

export type ObjectClass = 'comum' | 'lata';

/** RN-23: todo objeto declara id, classe, sprite, largura, altura, densidade. */
export interface ObjectDef {
  id: string;
  classe: ObjectClass;
  /** Placeholder: cor + palavra-chave em vez de sprite de arte final. */
  sprite: {
    cor: string;
    label: string;
    /** Só lata: qual arte (data/objectLibrary.ts LATA_IMAGENS) esse objeto usa. */
    imagemKey?: string;
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

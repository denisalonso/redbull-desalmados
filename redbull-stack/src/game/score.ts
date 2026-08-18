/** RN-05: cada objeto empilhado soma um ponto. */
export function incrementarScore(score: number): number {
  return score + 1;
}

/** RN-08: a única condição de derrota — quedas além do permitido. */
export function partidaEncerrada(quedas: number, quedasPermitidas: number): boolean {
  return quedas > quedasPermitidas;
}

export function ehNovoRecorde(score: number, recordeAtual: number): boolean {
  return score > recordeAtual;
}

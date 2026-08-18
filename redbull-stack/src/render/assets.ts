import { COMUM_TEMPLATES, LATA_IMAGENS } from '../data/objectLibrary.ts';

/**
 * Sprites dos objetos (ocasiões + latas). Carregam assíncrono; até terminar,
 * o desenho cai de volta pro placeholder (retângulo colorido) automaticamente.
 */
const images = new Map<string, HTMLImageElement>();
const loaded = new Set<string>();

function preload(path: string): void {
  const img = new Image();
  img.onload = () => loaded.add(path);
  img.src = path;
  images.set(path, img);
}

for (const key of LATA_IMAGENS) preload(`/lata-${key}.png`);
for (const template of COMUM_TEMPLATES) {
  if (template.imagemKey) preload(`/comum-${template.imagemKey}.png`);
}
preload('/redbull-logo.png');

export function getSprite(classe: 'comum' | 'lata', imagemKey: string | undefined): HTMLImageElement | null {
  if (!imagemKey) return null;
  const path = `/${classe}-${imagemKey}.png`;
  if (!loaded.has(path)) return null;
  return images.get(path) ?? null;
}

/** Marca d'água no fundo da tela de jogo. */
export function getLogoSprite(): HTMLImageElement | null {
  const path = '/redbull-logo.png';
  if (!loaded.has(path)) return null;
  return images.get(path) ?? null;
}

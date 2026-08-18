/**
 * Configuração de quiosque (STACK.md): quatro ajustes que ninguém lembra e
 * que estragam a demo ao vivo. touch-action e overscroll-behavion já estão
 * em global.css; aqui ficam Wake Lock e o fullscreen no 1º toque.
 */
export function setupKiosk(): void {
  void requestWakeLock();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void requestWakeLock();
  });
  document.addEventListener('pointerdown', requestFullscreenOnce, { once: true });
}

async function requestWakeLock(): Promise<void> {
  if (!('wakeLock' in navigator)) return;
  try {
    await navigator.wakeLock.request('screen');
  } catch {
    // Sem permissão ou não suportado — degrada silenciosamente, não é crítico.
  }
}

async function requestFullscreenOnce(): Promise<void> {
  try {
    await document.documentElement.requestFullscreen?.();
  } catch {
    // iOS Safari não suporta a Fullscreen API — segue sem, não é bloqueante.
  }
}

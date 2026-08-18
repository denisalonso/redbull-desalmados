import { CONFIG } from './config.ts';
import { FSM } from './core/fsm.ts';
import { GameLoop } from './core/loop.ts';
import { Viewport } from './render/canvas.ts';
import { Hud } from './render/hud.ts';
import { WarningGlow } from './render/warningGlow.ts';
import { Game } from './game/Game.ts';
import { avisoLateralIntensidade } from './game/energy.ts';
import { RankingStore } from './data/ranking.ts';
import { IntroScreen } from './screens/IntroScreen.ts';
import { NameScreen } from './screens/NameScreen.ts';
import { RankingScreen, type RankingShowPayload } from './screens/RankingScreen.ts';
import { setupKiosk } from './kiosk/kiosk.ts';
import type { RankingEntry, MotivoFim } from './core/types.ts';

setupKiosk();

const viewport = new Viewport();
const hud = new Hud();
const warningGlow = new WarningGlow();
const rankingStore = new RankingStore();

const fsm = new FSM('INICIO');
let game: Game | null = null;
let lastScore = 0;
let lastMotivo: MotivoFim = 'queda';

function recordeAtual(): number {
  return rankingStore.top(1)[0]?.score ?? 0;
}

const introScreen = new IntroScreen({
  getTop3: () => rankingStore.top(3),
  onPlay: () => fsm.transition('JOGO'),
});

const nameScreen = new NameScreen({
  onSubmit: (nome) => finalizarPartida(nome),
  onSkip: () => finalizarPartida('----'),
});

const rankingScreen = new RankingScreen({
  onReturn: () => fsm.transition('INICIO'),
});

function finalizarPartida(nome: string): void {
  const entry: RankingEntry = { nome, score: lastScore, timestampMs: Date.now() };
  rankingStore.add(entry);
  fsm.transition('RANKING', { entries: rankingStore.list(), destaque: entry });
}

fsm.register('INICIO', {
  onEnter: () => introScreen.show(),
  onExit: () => introScreen.hide(),
});

fsm.register('JOGO', {
  onEnter: () => {
    hud.show();
    game = new Game(
      viewport,
      {
        onGameOver: (score, motivo) => {
          lastScore = score;
          lastMotivo = motivo;
          fsm.transition('NOME');
        },
      },
      recordeAtual(),
    );
  },
  onExit: () => {
    game?.destroy();
    game = null;
    hud.hide();
    warningGlow.reset();
  },
});

fsm.register('NOME', {
  onEnter: () => nameScreen.show(lastScore, lastMotivo),
  onExit: () => nameScreen.hide(),
});

fsm.register('RANKING', {
  onEnter: (payload) => rankingScreen.show(payload as RankingShowPayload),
  onExit: () => rankingScreen.hide(),
});

fsm.start();

const loop = new GameLoop(
  CONFIG.FIXED_TIMESTEP_MS,
  (dtS) => {
    if (fsm.state === 'JOGO' && game) game.update(dtS);
  },
  () => {
    if (fsm.state !== 'JOGO' || !game) return;
    game.render();
    const snapshot = game.getSnapshot();
    hud.update(snapshot);
    warningGlow.update(avisoLateralIntensidade(snapshot.energia));
  },
);
loop.start();

// RF-07/RF-08: toque em qualquer lugar, espaço ou seta-baixo soltam o objeto ativo.
document.getElementById('game-canvas')?.addEventListener('pointerdown', () => {
  if (fsm.state === 'JOGO') game?.handleDrop();
});
window.addEventListener('keydown', (e) => {
  if (fsm.state !== 'JOGO') return;
  if (e.code === 'Space' || e.code === 'ArrowDown') {
    e.preventDefault();
    game?.handleDrop();
  }
});

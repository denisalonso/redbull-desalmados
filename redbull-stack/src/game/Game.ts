import Matter from 'matter-js';
import { CONFIG } from '../config.ts';
import type { Viewport } from '../render/canvas.ts';
import { PhysicsWorld } from '../physics/world.ts';
import { BASE_THICKNESS_PX, createBaseBody, createDynamicBody } from '../physics/objects.ts';
import { Spawner } from './spawner.ts';
import { velocidadeHorizontal } from './difficulty.ts';
import { aplicarDecaimento, recarregarComLata, borraoPx, intervaloPiscadaS } from './energy.ts';
import { incrementarScore, partidaEncerrada } from './score.ts';
import type { ObjectDef } from '../core/types.ts';

interface AimState {
  def: ObjectDef;
  x: number;
  worldY: number;
}

interface TrackedBody {
  body: Matter.Body;
  def: ObjectDef;
  /**
   * Limiar de queda pessoal deste objeto (RN-06), congelado no momento em
   * que ele caiu ou assentou — nunca recalculado a partir do topo atual da
   * pilha. Um limiar global "sobe" junto com a torre e acaba varrendo por
   * cima de objetos antigos e parados lá embaixo, marcando-os como queda só
   * porque a pilha cresceu. RN-10 (objeto de baixo derrubado por impacto)
   * ainda funciona: ao assentar, o limiar é recalibrado para a posição de
   * repouso, então só dispara se ESTE objeto realmente se mexer depois.
   */
  limiteQuedaWorldY: number;
}

export interface GameCallbacks {
  onGameOver(score: number): void;
}

/** RN-28: sinaliza a piscada em progresso para a camada de apresentação (DOM). */
export interface PiscadaState {
  fechando: boolean;
  progresso: number; // 0..1
}

/**
 * Orquestra as regras centrais do GDD (seções 2 a 5): loop de empilhamento,
 * energia, dificuldade em dois eixos e as travas de segurança obrigatórias.
 */
export class Game {
  private readonly physics = new PhysicsWorld();
  private readonly spawner = new Spawner();

  private aim: AimState | null = null;
  private readonly fallingBodies = new Map<Matter.Body, TrackedBody>();
  private stackBodies: TrackedBody[] = [];

  private lastDroppedBody: Matter.Body | null = null;
  private lastDroppedResolved = false;
  private spawnTimerS: number | null = null;

  private topWorldY = 0;
  /** Versão suavizada de topWorldY que ancora a tela — RN-15. */
  private cameraTopWorldY = 0;

  private score = 0;
  private quedas = 0;
  private energia: number = CONFIG.ENERGIA_MAX;
  private tempoDecorridoS = 0;
  private objetosEmpilhados = 0;

  private estado: 'jogando' | 'congelado' | 'encerrado' = 'jogando';
  private freezeTimerS = 0;

  private piscadaTimerS = 0;
  private piscada: PiscadaState | null = null;

  private readonly baseBody: Matter.Body;

  constructor(
    private readonly viewport: Viewport,
    private readonly callbacks: GameCallbacks,
    private readonly recorde: number,
  ) {
    this.baseBody = createBaseBody(this.viewport.width / 2, 0);
    this.physics.add(this.baseBody);
    this.spawnNext();
  }

  getSnapshot() {
    return {
      score: this.score,
      recorde: Math.max(this.recorde, this.score),
      energia: this.energia,
      tempoDecorridoS: this.tempoDecorridoS,
      piscada: this.piscada,
    };
  }

  /** RF-07/RF-08: toque em qualquer lugar ou espaço/seta-baixo soltam o objeto ativo. */
  handleDrop(): void {
    if (this.estado !== 'jogando' || !this.aim) return;
    this.dropAim();
  }

  update(dtS: number): void {
    if (this.estado === 'encerrado') return;

    if (this.estado === 'congelado') {
      this.freezeTimerS -= dtS;
      if (this.freezeTimerS <= 0) {
        this.estado = 'encerrado';
        this.callbacks.onGameOver(this.score);
      }
      return;
    }

    this.tempoDecorridoS += dtS;
    this.energia = aplicarDecaimento(this.energia, this.tempoDecorridoS, dtS);
    this.updatePiscada(dtS);

    // Energia zerada encerra a partida: sem objeto se soltando sozinho (RN-35
    // removida), a pressão de tempo só existe se demorar demais realmente custar
    // a partida — não só borrar a tela indefinidamente.
    if (this.energia <= 0) {
      this.iniciarCongelamento();
      return;
    }

    if (this.tempoDecorridoS >= CONFIG.TETO_ABSOLUTO_S) {
      this.iniciarCongelamento();
      return;
    }

    this.updateAim(dtS);
    this.physics.step(dtS * 1000);
    this.resolveBodies();
    this.updateCamera(dtS);
    this.updateSpawnPacing(dtS);
  }

  render(): void {
    const ctx = this.viewport.ctx;
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 0, this.viewport.width, this.viewport.height);

    this.drawBase(ctx);
    for (const { body, def } of this.stackBodies) this.drawBody(ctx, body, def);
    for (const { body, def } of this.fallingBodies.values()) this.drawBody(ctx, body, def);

    if (this.aim) this.drawAim(ctx, this.aim);

    this.viewport.setBlur(borraoPx(this.energia));
  }

  destroy(): void {
    this.physics.clear();
  }

  // --- Ciclo do objeto ativo -------------------------------------------------

  private spawnNext(): void {
    const def = this.spawner.next();
    this.aim = {
      def,
      x: def.larguraPx / 2 + CONFIG.APRESENTACAO.AIM_MARGIN_X_PX,
      worldY: this.currentAnchorTopWorldY() - CONFIG.APRESENTACAO.AIM_LANE_ABOVE_STACK_PX,
    };
  }

  /**
   * RN-07 permite o próximo objeto surgir pelo temporizador de pacing ANTES
   * de o anterior terminar de assentar — e em jogo rápido pode haver VÁRIOS
   * objetos caindo ao mesmo tempo, ainda não resolvidos. this.topWorldY só
   * atualiza quando um objeto REALMENTE assenta, então ancorar a mira nele
   * ignora a altura que esses objetos pendentes ainda vão somar à pilha.
   *
   * A estimativa segura é pessimista: assume que TODOS os objetos ainda em
   * queda vão assentar com sucesso, empilhados um sobre o outro, e desconta a
   * soma das alturas deles do topo já confirmado. Se algum deles cair fora em
   * vez de assentar, a folga real só fica maior — nunca menor.
   */
  private currentAnchorTopWorldY(): number {
    let alturaPendente = 0;
    for (const tracked of this.fallingBodies.values()) {
      alturaPendente += tracked.def.alturaPx;
    }
    return this.topWorldY - alturaPendente;
  }

  private updateAim(dtS: number): void {
    if (!this.aim) return;
    const vx = velocidadeHorizontal(this.objetosEmpilhados);
    this.aim.x += vx * dtS;

    // RN-12/RN-13: wrap horizontal só vale na fase de mira.
    const half = this.aim.def.larguraPx / 2;
    if (this.aim.x - half > this.viewport.width) {
      this.aim.x = -half;
    }
  }

  private dropAim(): void {
    if (!this.aim) return;
    const { def, x, worldY } = this.aim;
    const body = createDynamicBody(def, x, worldY);
    this.physics.add(body);
    const limiteQuedaWorldY = this.topWorldY + CONFIG.LIMIAR_QUEDA_PX;
    this.fallingBodies.set(body, { body, def, limiteQuedaWorldY });
    this.lastDroppedBody = body;
    this.lastDroppedResolved = false;
    this.spawnTimerS = CONFIG.DELAY_PROXIMO_OBJETO_S;
    this.aim = null;
  }

  private updateSpawnPacing(dtS: number): void {
    if (this.aim || this.spawnTimerS === null) return;
    this.spawnTimerS -= dtS;
    // RN-07: surge após DELAY_PROXIMO_OBJETO, ou quando o anterior se acomoda — o que vier primeiro.
    if (this.spawnTimerS <= 0 || this.lastDroppedResolved) {
      this.spawnTimerS = null;
      this.spawnNext();
    }
  }

  // --- Resolução física -------------------------------------------------------

  private resolveBodies(): void {
    for (const [body, tracked] of [...this.fallingBodies]) {
      if (body.isSleeping) this.settleBody(tracked);
    }

    const tracked: TrackedBody[] = [...this.fallingBodies.values(), ...this.stackBodies];
    for (const t of tracked) {
      const topEdgeY = t.body.position.y - t.def.alturaPx / 2;
      if (topEdgeY > t.limiteQuedaWorldY) this.registerQueda(t.body);
    }
  }

  private settleBody(tracked: TrackedBody): void {
    const { body, def } = tracked;
    this.fallingBodies.delete(body);

    const topEdgeY = body.position.y - def.alturaPx / 2;
    if (topEdgeY > tracked.limiteQuedaWorldY) {
      this.registerQueda(body);
      return;
    }

    // RN-05: objeto empilhado = adormeceu acima da linha de queda. RN-10: recalibra o
    // limiar para a posição de repouso — só volta a contar se ESTE objeto for derrubado depois.
    this.stackBodies.push({ body, def, limiteQuedaWorldY: topEdgeY + CONFIG.LIMIAR_QUEDA_PX });
    this.score = incrementarScore(this.score);
    this.objetosEmpilhados += 1; // RN-33.1: só empilhados contam para a velocidade.
    this.topWorldY = Math.min(this.topWorldY, topEdgeY);

    // RN-22: a lata só recarrega se empilhada com sucesso.
    if (def.classe === 'lata') this.energia = recarregarComLata(this.energia);

    if (body === this.lastDroppedBody) this.lastDroppedResolved = true;
  }

  private registerQueda(body: Matter.Body): void {
    if (!this.fallingBodies.has(body) && !this.stackBodies.some((s) => s.body === body)) return;

    this.fallingBodies.delete(body);
    this.stackBodies = this.stackBodies.filter((s) => s.body !== body);
    this.physics.remove(body);
    this.quedas += 1; // RN-06/RN-10: física decide, mesmo para objetos antigos derrubados.

    if (body === this.lastDroppedBody) this.lastDroppedResolved = true;

    if (partidaEncerrada(this.quedas, CONFIG.QUEDAS_PERMITIDAS)) {
      this.iniciarCongelamento();
    }
  }

  private iniciarCongelamento(): void {
    if (this.estado !== 'jogando') return;
    this.estado = 'congelado';
    this.freezeTimerS = CONFIG.FREEZE_DERROTA_S; // RF-09: derrota legível antes de trocar de tela.
  }

  // --- Câmera -------------------------------------------------------------

  private updateCamera(dtS: number): void {
    // RN-15: segue o topo real da pilha, com interpolação suave, a cada objeto
    // — não só quando a torre deixa de caber no quadro — e nunca desce
    // (this.topWorldY só decresce por construção, logo cameraTopWorldY também).
    const smoothing = 1 - Math.exp(-CONFIG.APRESENTACAO.CAMERA_FOLLOW_SPEED * dtS);
    this.cameraTopWorldY += (this.topWorldY - this.cameraTopWorldY) * smoothing;
  }

  private worldToScreenY(worldY: number): number {
    return worldY - this.cameraTopWorldY + CONFIG.APRESENTACAO.TOP_SCREEN_Y;
  }

  // --- Degradação visual (pálpebra) ----------------------------------------

  private updatePiscada(dtS: number): void {
    const intervalo = intervaloPiscadaS(this.energia);
    if (!Number.isFinite(intervalo)) {
      this.piscada = null;
      this.piscadaTimerS = 0;
      return;
    }

    this.piscadaTimerS += dtS;
    const cicloS = CONFIG.PISCADA_DURACAO_S * 2;
    if (this.piscadaTimerS < intervalo) {
      this.piscada = null;
      return;
    }

    const tCiclo = this.piscadaTimerS - intervalo;
    if (tCiclo >= cicloS) {
      this.piscadaTimerS = 0;
      this.piscada = null;
      return;
    }

    const fechando = tCiclo < CONFIG.PISCADA_DURACAO_S;
    const progresso = fechando
      ? tCiclo / CONFIG.PISCADA_DURACAO_S
      : (tCiclo - CONFIG.PISCADA_DURACAO_S) / CONFIG.PISCADA_DURACAO_S;
    this.piscada = { fechando, progresso };
  }

  // --- Desenho (placeholders: retângulos coloridos + rótulo) ---------------

  private drawBase(ctx: CanvasRenderingContext2D): void {
    const screenY = this.worldToScreenY(this.baseBody.position.y);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(
      this.baseBody.position.x - CONFIG.LARGURA_BASE_PX / 2,
      screenY - BASE_THICKNESS_PX / 2,
      CONFIG.LARGURA_BASE_PX,
      BASE_THICKNESS_PX,
    );
  }

  private drawBody(ctx: CanvasRenderingContext2D, body: Matter.Body, def: ObjectDef): void {
    const screenY = this.worldToScreenY(body.position.y);
    this.drawRect(ctx, body.position.x, screenY, def, body.angle);
  }

  private drawAim(ctx: CanvasRenderingContext2D, aim: AimState): void {
    const screenY = this.worldToScreenY(aim.worldY);
    this.drawRect(ctx, aim.x, screenY, aim.def, 0);
  }

  private drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    def: ObjectDef,
    angle: number,
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = def.sprite.cor;
    ctx.fillRect(-def.larguraPx / 2, -def.alturaPx / 2, def.larguraPx, def.alturaPx);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-def.larguraPx / 2, -def.alturaPx / 2, def.larguraPx, def.alturaPx);

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.sprite.label, 0, 0, def.larguraPx - 10);
    ctx.restore();
  }
}

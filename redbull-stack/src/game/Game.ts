import Matter from 'matter-js';
import { CONFIG } from '../config.ts';
import type { Viewport } from '../render/canvas.ts';
import { PhysicsWorld } from '../physics/world.ts';
import { BASE_THICKNESS_PX, createBaseBody, createDynamicBody } from '../physics/objects.ts';
import { Spawner } from './spawner.ts';
import { velocidadeHorizontal } from './difficulty.ts';
import { aplicarDecaimento, recarregarComLata } from './energy.ts';
import { incrementarScore, partidaEncerrada } from './score.ts';
import { getSprite, getLogoSprite } from '../render/assets.ts';
import { THEME } from '../theme.ts';
import type { ObjectDef, MotivoFim } from '../core/types.ts';

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
  onGameOver(score: number, motivo: MotivoFim): void;
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
  private motivoFim: MotivoFim | null = null;
  private fundoGradientes: {
    base: CanvasGradient;
    brilhoAmarelo: CanvasGradient;
    brilhoAzul: CanvasGradient;
    brilhoVermelho: CanvasGradient;
  } | null = null;

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
        this.callbacks.onGameOver(this.score, this.motivoFim ?? 'queda');
      }
      return;
    }

    this.tempoDecorridoS += dtS;
    this.energia = aplicarDecaimento(this.energia, this.tempoDecorridoS, dtS);

    // Energia zerada encerra a partida: sem objeto se soltando sozinho (RN-35
    // removida), a pressão de tempo só existe se demorar demais realmente custar
    // a partida — não só borrar a tela indefinidamente.
    if (this.energia <= 0) {
      this.iniciarCongelamento('energia');
      return;
    }

    if (this.tempoDecorridoS >= CONFIG.TETO_ABSOLUTO_S) {
      this.iniciarCongelamento('teto');
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
    this.drawFundoDecorado(ctx);
    this.drawLogoFundo(ctx);

    this.drawBase(ctx);
    for (const { body, def } of this.stackBodies) this.drawBody(ctx, body, def);
    for (const { body, def } of this.fallingBodies.values()) this.drawBody(ctx, body, def);

    if (this.aim) this.drawAim(ctx, this.aim);
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
      this.iniciarCongelamento('queda');
    }
  }

  private iniciarCongelamento(motivo: MotivoFim): void {
    if (this.estado !== 'jogando') return;
    this.motivoFim = motivo;
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

  // --- Desenho (placeholders: retângulos coloridos + rótulo) ---------------

  /**
   * Mesmo visual da tela de início (gradiente escuro + brilhos coloridos nos
   * cantos), pra não ter uma quebra de estilo entre a intro e o jogo. Fixo na
   * tela — não acompanha a câmera. Gradientes calculados uma vez só (não
   * mudam com o viewport) e reaproveitados a cada frame.
   */
  private drawFundoDecorado(ctx: CanvasRenderingContext2D): void {
    if (!this.fundoGradientes) this.fundoGradientes = this.criarFundoGradientes(ctx);
    const { base, brilhoAmarelo, brilhoAzul, brilhoVermelho } = this.fundoGradientes;
    const w = this.viewport.width;
    const h = this.viewport.height;

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = brilhoAmarelo;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = brilhoAzul;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = brilhoVermelho;
    ctx.fillRect(0, 0, w, h);
  }

  private criarFundoGradientes(ctx: CanvasRenderingContext2D): {
    base: CanvasGradient;
    brilhoAmarelo: CanvasGradient;
    brilhoAzul: CanvasGradient;
    brilhoVermelho: CanvasGradient;
  } {
    const w = this.viewport.width;
    const h = this.viewport.height;

    const base = ctx.createLinearGradient(0, 0, w * 0.5, h);
    base.addColorStop(0, '#080808');
    base.addColorStop(0.38, '#0b0b0b');
    base.addColorStop(0.7, '#050505');
    base.addColorStop(1, '#100205');

    const brilho = (x: number, y: number, raio: number, cor: string): CanvasGradient => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, raio);
      g.addColorStop(0, cor);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      return g;
    };

    return {
      base,
      brilhoAmarelo: brilho(w * 0.5, 0, w * 0.55, 'rgba(253,217,0,0.13)'),
      brilhoAzul: brilho(w, h * 0.7, w * 0.6, 'rgba(54,113,198,0.18)'),
      brilhoVermelho: brilho(0, h * 0.85, w * 0.55, 'rgba(227,1,24,0.14)'),
    };
  }

  /** Marca d'água fixa na tela (não acompanha a câmera/pilha), centralizada e no terço superior. */
  private drawLogoFundo(ctx: CanvasRenderingContext2D): void {
    const logo = getLogoSprite();
    if (!logo) return;
    const larguraDesejada = 380;
    const escala = larguraDesejada / logo.naturalWidth;
    const w = larguraDesejada;
    const h = logo.naturalHeight * escala;
    const x = this.viewport.width / 2;
    const y = 340;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.drawImage(logo, x - w / 2, y - h / 2, w, h);
    ctx.restore();
  }

  /** Plataforma no mesmo estilo "vidro escuro" da intro — painel translúcido, sombra e uma linha de brilho no topo. */
  private drawBase(ctx: CanvasRenderingContext2D): void {
    const screenY = this.worldToScreenY(this.baseBody.position.y);
    const x = this.baseBody.position.x - CONFIG.LARGURA_BASE_PX / 2;
    const y = screenY - BASE_THICKNESS_PX / 2;
    const w = CONFIG.LARGURA_BASE_PX;
    const h = BASE_THICKNESS_PX;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;
    this.roundedRectPath(ctx, x, y, w, h, 10);
    ctx.fillStyle = 'rgba(18, 18, 22, 0.72)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(253, 217, 0, 0.65)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(253, 217, 0, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 1);
    ctx.lineTo(x + w - 10, y + 1);
    ctx.stroke();
    ctx.restore();
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

    const sprite = getSprite(def.classe, def.sprite.imagemKey);
    if (sprite && def.classe === 'lata') {
      this.drawLataSprite(ctx, sprite, def);
    } else if (sprite) {
      this.drawComumSprite(ctx, sprite, def);
    } else {
      this.drawPlaceholder(ctx, def);
    }
    ctx.restore();
  }

  /**
   * O sprite é a lata em pé (retrato) — gira 90° só na hora de desenhar pra
   * encaixar deitada no hitbox; o ângulo de física já foi aplicado antes.
   * Brilho ao redor (shadowBlur segue a silhueta via alpha da imagem): a
   * lata é o objeto especial — recarrega energia, as outras não.
   */
  private drawLataSprite(
    ctx: CanvasRenderingContext2D,
    sprite: HTMLImageElement,
    def: ObjectDef,
  ): void {
    ctx.rotate(Math.PI / 2);
    ctx.shadowColor = 'rgba(255, 212, 0, 0.85)';
    ctx.shadowBlur = 24;
    ctx.drawImage(sprite, -def.alturaPx / 2, -def.larguraPx / 2, def.alturaPx, def.larguraPx);
  }

  /** Caminho de retângulo com cantos arredondados, reutilizado pelo fundo e pela borda do cartão. */
  private roundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /** Cartão "vidro escuro" — mesma linguagem da intro (painel translúcido, sombra, borda com brilho). */
  private drawCartaoFundo(ctx: CanvasRenderingContext2D, w: number, h: number, cor: string): void {
    const raio = 16;
    const espessuraBorda = 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    this.roundedRectPath(ctx, -w / 2, -h / 2, w, h, raio);
    ctx.fillStyle = 'rgba(18, 18, 22, 0.62)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = cor;
    ctx.shadowBlur = 10;
    const inset = espessuraBorda / 2;
    this.roundedRectPath(ctx, -w / 2 + inset, -h / 2 + inset, w - espessuraBorda, h - espessuraBorda, raio - inset);
    ctx.strokeStyle = cor;
    ctx.lineWidth = espessuraBorda;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Cartão branco com borda na cor do template, ícone à esquerda e o nome à
   * direita — a ilustração sozinha (sem cartão) não lia como empilhável, e a
   * faixa de rótulo no topo (versão anterior) ficou poluída. Tamanho do
   * cartão é padronizado (COMUM_LARGURA_PX/ALTURA_PX em objectLibrary.ts).
   */
  private drawComumSprite(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement, def: ObjectDef): void {
    const w = def.larguraPx;
    const h = def.alturaPx;
    const cor = def.sprite.cor;

    this.drawCartaoFundo(ctx, w, h, cor);

    // Ícone: área quadrada à esquerda, deslocada um pouco pra direita, sem distorcer (letterbox).
    const pad = 10;
    const deslocamentoIcone = 10;
    const imgSide = h - pad * 2;
    const imgCenterX = -w / 2 + pad + imgSide / 2 + deslocamentoIcone;

    const escala = Math.min(imgSide / sprite.naturalWidth, imgSide / sprite.naturalHeight);
    const imgW = sprite.naturalWidth * escala;
    const imgH = sprite.naturalHeight * escala;
    ctx.drawImage(sprite, imgCenterX - imgW / 2, -imgH / 2, imgW, imgH);

    // Nome: resto do cartão à direita do ícone.
    const textX = -w / 2 + pad + imgSide + deslocamentoIcone + pad;
    const textAreaW = w / 2 - pad - textX;
    ctx.fillStyle = cor;
    ctx.font = `bold 15px ${THEME.font.family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.sprite.label, textX + textAreaW / 2, 0, textAreaW);
  }

  /** Mesmo cartão branco/borda colorida do sprite real, só sem o ícone (antes da imagem carregar). */
  private drawPlaceholder(ctx: CanvasRenderingContext2D, def: ObjectDef): void {
    const w = def.larguraPx;
    const h = def.alturaPx;

    this.drawCartaoFundo(ctx, w, h, def.sprite.cor);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.font = `bold 15px ${THEME.font.family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.sprite.label, 0, 0, w - 16);
  }
}

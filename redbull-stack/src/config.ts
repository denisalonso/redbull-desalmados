/**
 * Todos os parâmetros de balanceamento do jogo. GDD seção 6.
 * Nenhum destes valores deve aparecer escrito dentro de lógica de jogo (RN da seção 6).
 */
export const CONFIG = {
  // Resolução virtual (retrato, letterbox)
  VIRTUAL_WIDTH: 720,
  VIRTUAL_HEIGHT: 1280,
  DEVICE_PIXEL_RATIO_MAX: 2,

  // Fim de partida
  // Desvio do GDD original (lá era 0, "risco real, sem segunda chance"):
  // 1 queda de perdão deixou o jogo mais acessível pro público de stand sem
  // depender só de mexer no tamanho/física dos objetos.
  QUEDAS_PERMITIDAS: 1,
  TETO_ABSOLUTO_S: 120,

  // Energia
  ENERGIA_MAX: 100,
  ENERGIA_POR_LATA: 30,
  DECAIMENTO_INICIAL: 4, // por segundo
  DECAIMENTO_MAX: 14, // por segundo
  LIMIAR_BORRAO: 60,
  LIMIAR_PISCADA: 30,
  TEMPO_COLAPSO_S: 75,

  // Degradação visual
  BORRAO_MAX_LEVE_PX: 4, // 60→30 de energia
  BORRAO_MAX_PESADO_PX: 8, // 30→0 de energia
  PISCADA_DURACAO_S: 0.35, // fecha em 0.35s, abre em 0.35s
  PISCADA_FREQ_MIN_S: 6, // a 60 de energia (menos frequente)
  PISCADA_FREQ_MAX_S: 2.5, // a 0 de energia (mais frequente)
  PISCADA_FREQ_MAX_HZ: 1.5, // teto de segurança fotossensível (RN-30)
  OBSCURECIMENTO_MAX: 0.85, // RN-31: nunca 100% cega

  // Biblioteca de objetos
  PROPORCAO_LATAS: 4, // 1 a cada 4
  LATA_GARANTIDA_ATE_OBJETO: 3, // a primeira lata aparece nos 3 primeiros objetos

  // Dificuldade — eixo velocidade (por objetos empilhados)
  VELOCIDADE_INICIAL_X: 150, // px/s
  VELOCIDADE_MAX_X: 330, // px/s
  OBJETOS_PARA_VELOCIDADE_MAX: 40,

  // Objeto ativo
  DELAY_PROXIMO_OBJETO_S: 0.4,
  LIMIAR_QUEDA_PX: 250, // abaixo do topo da pilha

  // Pilha
  LARGURA_BASE_PX: 280,

  // Congelamento de derrota (legibilidade)
  FREEZE_DERROTA_S: 0.3,

  // Nome / ranking
  NOME_MAX_CARACTERES: 4,
  RETENCAO_RANKING_H: 24,
  RANKING_AUTO_RETORNO_S: 15,

  // Matter.js — GDD seção 7
  MATTER: {
    restitution: 0,
    friction: 0.7,
    frictionStatic: 1.0,
    slop: 0.02,
    positionIterations: 10,
    velocityIterations: 8,
    enableSleeping: true,
    gravityY: 1.2,
  },

  // Loop de física — passo fixo (RN-38)
  FIXED_TIMESTEP_MS: 1000 / 60,

  /**
   * Constantes de apresentação (câmera/enquadramento) — não fazem parte da
   * tabela de balanceamento do GDD seção 6, mas seguem a mesma regra de
   * centralização (nada de número mágico espalhado pela lógica de jogo).
   */
  APRESENTACAO: {
    // Altura de tela onde o topo ATUAL da pilha fica ancorado, sempre — desde
    // o primeiro objeto, não só quando a torre deixa de caber no quadro. É a
    // torre (a base) que "desce" conforme se empilha, não a câmera que espera.
    TOP_SCREEN_Y: 820,
    CAMERA_FOLLOW_SPEED: 12,
    // Impacto mais alto = mais velocidade na queda = pilha mais instável.
    AIM_LANE_ABOVE_STACK_PX: 200,
    AIM_MARGIN_X_PX: 20,
  },

  /**
   * Ajuste de jogabilidade fora da tabela do GDD seção 7 (que trava
   * restitution/friction/frictionStatic/slop/iterations/gravidade). Aumenta
   * a resistência dos objetos a começar a girar, sem alterar como eles
   * deslizam ou quicam — ataca especificamente o tombo que se acumula
   * conforme a pilha cresce, sem deixar a física "grudenta" no geral.
   */
  FISICA_AJUSTE: {
    MULTIPLICADOR_INERCIA: 14,
    // Um pouco de "ar" a mais amortece a oscilação residual que se acumula
    // pilha acima — padrão do Matter.js é 0.01.
    FRICTION_AIR: 0.03,
  },
} as const;

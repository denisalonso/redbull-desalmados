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

  // Aviso visual de energia baixa (RN-28..31): desvio do GDD original — em
  // vez de embaçar a tela e piscar uma "pálpebra" (RN-29/30), uma luz
  // vermelha nas laterais cresce em intensidade conforme a energia cai,
  // entre LIMIAR_BORRAO e 0. É contínuo, nunca pisca — satisfaz o teto de
  // segurança fotossensível (RNF-10, "nenhuma oscilação acima de 1,5Hz") por
  // construção, não por um teto de frequência que precisa ser respeitado.
  AVISO_OPACIDADE_MAX: 0.65,

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
  // Acompanha o aumento de largura dos objetos (data/objectLibrary.ts) —
  // mantém a mesma margem proporcional de apoio de antes.
  LARGURA_BASE_PX: 370,

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
    // Recuo pequeno e deliberado a partir de 20: ela achou o resultado
    // anterior "quase ótimo", só um pouco estável demais.
    MULTIPLICADOR_INERCIA: 17,
    // Um pouco de "ar" a mais amortece a oscilação residual que se acumula
    // pilha acima — padrão do Matter.js é 0.01.
    FRICTION_AIR: 0.038,
    // A lata é o objeto de maior razão altura/largura da biblioteca (a mais
    // estreita e mais alta) — a mais instável geometricamente, então recebe
    // resistência a girar extra além do MULTIPLICADOR_INERCIA geral.
    MULTIPLICADOR_INERCIA_LATA_EXTRA: 4,
  },
} as const;

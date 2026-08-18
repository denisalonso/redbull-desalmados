/**
 * Cores e tipografia centralizadas (RNF-08). Nenhum valor de cor deve viver dentro de componente.
 *
 * PLACEHOLDER: HEX exatos, fontes e ícones oficiais estão bloqueados pelo briefing
 * (GDD seção 13 — "puxar do DRIVE"). Os valores abaixo são aproximações de
 * "vermelho, azul-marinho, amarelo / ouro, cinza, prata" só para destravar a vertical slice.
 * Trocar por HEX oficiais assim que o briefing liberar.
 */
export const THEME = {
  color: {
    primary: {
      vermelho: '#D8232A',
      azulMarinho: '#0A2463',
      amarelo: '#FFD400',
    },
    secondary: {
      ouro: '#C9A227',
      cinza: '#8A8A8A',
      prata: '#C9C9C9',
    },
    background: '#1c1c1c',
    surface: '#2a2a2a',
    text: '#f5f5f5',
    textMuted: '#a0a0a0',
    danger: '#D8232A',
    success: '#3CB043',
  },
  font: {
    family: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    weightBold: 800,
    weightRegular: 500,
  },
} as const;

/** Palavras-chave impressas nos objetos empilháveis (GDD seção 10, plano A). PLACEHOLDER. */
export const KEYWORDS = ['FOCO', 'ENERGIA', 'ASAS', 'GARRA', 'RITMO', 'PULSO', 'VIGOR', 'FLOW'];

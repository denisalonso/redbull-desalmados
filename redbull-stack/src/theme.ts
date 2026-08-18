/**
 * Cores e tipografia centralizadas (RNF-08). Nenhum valor de cor deve viver dentro de componente.
 *
 * PLACEHOLDER: HEX exatos e ícones oficiais ainda estão bloqueados pelo
 * briefing (GDD seção 13 — "puxar do DRIVE"). As cores abaixo são
 * aproximações de "vermelho, azul-marinho, amarelo / ouro, cinza, prata" só
 * para destravar a vertical slice — trocar por HEX oficiais quando liberar.
 * A fonte (public/fonts/FuturaforRedBull-CondBold.ttf, @font-face em
 * global.css como 'Futura Red Bull Condensed') já é a oficial da marca, não
 * é mais placeholder. A tela de início usa a família 'Futura Red Bull' sem
 * o sufixo (pesos Light/Book/Medium/Bold) — ver src/screens/IntroScreen.ts.
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
    family: "'Futura Red Bull Condensed', system-ui, -apple-system, 'Segoe UI', sans-serif",
    weightBold: 800,
    weightRegular: 500,
  },
} as const;

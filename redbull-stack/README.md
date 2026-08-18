# Red Bull Challenge — Empilha

Jogo web de empilhamento (Vite + TypeScript + Matter.js + Canvas 2D) para o stand físico da Red Bull. Contexto e regras completas em `GDD.md.docx` e `STACK.md.docx` na raiz de `meu-agente/`.

## Rodando localmente

Pré-requisito: Node.js instalado (`node -v` pra conferir).

```bash
cd redbull-stack
npm install      # só precisa rodar de novo se as dependências mudarem
npm run dev
```

O terminal vai mostrar um endereço tipo `http://localhost:5173` — abre no navegador. O Vite recarrega sozinho a cada alteração salva no código (hot reload), não precisa reiniciar o servidor.

Pra parar o servidor: `Ctrl+C` no terminal.

## Outros comandos úteis

| Comando | Pra que serve |
|---|---|
| `npm run build` | Gera a versão de produção em `dist/` (typecheck + bundle) |
| `npm run preview` | Serve o build de `dist/` localmente, pra testar como fica publicado |
| `npm test` | Roda os testes (Vitest) |
| `npm run lint` | Checa o código com ESLint |
| `npm run format` | Formata o código com Prettier |

## Testando no dispositivo do stand

Se for testar em outro aparelho na mesma rede (ex: tablet do stand):

```bash
npm run dev -- --host
```

Isso expõe o endereço na rede local (tipo `http://192.168.x.x:5173`) além do `localhost`.

## Estrutura rápida

- `src/game/Game.ts` — loop e regras principais do jogo
- `src/config.ts` — todos os parâmetros de balanceamento (tabela do GDD seção 6 + ajustes fora do GDD, comentados como tal)
- `src/physics/` — criação de corpos Matter.js e mundo físico
- `src/data/objectLibrary.ts` — dimensões/densidade dos objetos e da lata
- `src/render/` — desenho em Canvas 2D
- `src/screens/` — telas (menu, jogo, ranking etc.)

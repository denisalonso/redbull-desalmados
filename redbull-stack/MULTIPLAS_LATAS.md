# Variantes de lata

O jogo agora escolhe uma imagem aleatória dentro de duas categorias:

- `COMUM_TEMPLATES`: variantes comuns.
- `LATA_TEMPLATES`: variantes especiais que recuperam energia e recebem brilho.

## Onde colocar as imagens

Coloque PNGs com fundo transparente em `public/latas/` usando estes nomes:

- `lata-original.png`
- `lata-sugarfree.png`
- `lata-red-edition.png`
- `lata-tropical.png`
- `lata-energy.png`
- `lata-energy-zero.png`

## Como adicionar uma nova variante

Abra `src/data/objectLibrary.ts`, copie um objeto da categoria desejada e altere:

- `nome`
- `imagemUrl`
- `larguraPx`
- `alturaPx`
- `densidade`, caso necessário
- `corFallback`

Depois coloque o PNG correspondente em `public/latas/`.

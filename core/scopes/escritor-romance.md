---
nome: romance
profundidade: Padrão
palavras_chave:
  - romance
  - livro
  - manuscrito
descricao: O caminho completo de um romance standalone em 27 capítulos
---

# Escopo `romance`

O escopo padrão, e o que o `_Template Livro` foi feito para servir: um romance standalone, 3 atos × 9 capítulos, numeração contínua de `Cap 01` a `Cap 27`.

## Por que estes estágios

Roda os 25 estágios fora da inicialização. Um romance é o caso em que **nada é dispensável**: o mercado importa (é um livro para vender ou publicar), o mundo precisa de bíblia, o elenco precisa de fichas, e a fase de revisão é onde o livro efetivamente fica bom.

## Profundidade

`Padrão` — artefatos com o detalhe suficiente para trabalhar, sem virar burocracia. Suba para `Completa` se o livro tiver worldbuilding pesado ou se for o primeiro volume de algo maior; nesse caso considere o escopo `serie`.

## Unidades

27 capítulos, geradas em `init-estado`. A fase de construção percorre cada um pelos 5 estágios do laço.

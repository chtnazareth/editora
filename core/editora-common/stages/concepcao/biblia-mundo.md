---
slug: biblia-mundo
fase: concepcao
execucao: SEMPRE
condicao: Sempre em obra com mundo secundário ou regras próprias. Em obra realista contemporânea, roda enxuto — mas roda.
agente_lider: editora-mundo-agent
agentes_apoio:
  - editora-pesquisa-agent
  - editora-continuidade-agent
modo: subagente
produz:
  - estado-do-mundo
  - sistema-e-regras
  - cronologia
consome:
  - artefato: pilares-criativos
    obrigatorio: true
  - artefato: riscos-de-pesquisa
    obrigatorio: false
  - artefato: retrato-do-projeto
    obrigatorio: false
    condicionado_a: retomada
requer_estagio:
  - pilares-criativos
escopos:
  - romance
  - serie
  - novela
  - retomada
revisor: editora-editor-chefe-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: Pilares criativos, riscos de pesquisa e — em retomada — o manuscrito existente
saidas: estado-do-mundo.md, sistema-e-regras.md, cronologia.md
---

# Bíblia do Mundo

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar personas

`editora-mundo-agent` lidera. `editora-pesquisa-agent` entra onde a regra depende de fato; `editora-continuidade-agent` entra para dizer o que o texto já escrito estabeleceu.

### Passo 2 — Em retomada: engenharia reversa primeiro

Antes de inventar qualquer coisa, extraia do manuscrito existente tudo que ele já afirmou sobre o mundo. Produza o retrato **e a lista de contradições internas** que a leitura revelar. Contradição encontrada vira pergunta ao autor, nunca correção silenciosa.

### Passo 3 — Estado do mundo

O que está acontecendo no dia em que o livro começa e por quê. Quem manda, quem obedece, quem está perdendo, e o que isso custa às pessoas comuns. Em pretérito imperfeito de crônica, impessoal — nunca em tom de verbete.

### Passo 4 — Sistema e regras

Cada regra com **custo, limite e quem paga**. Regra sem custo é conveniência de enredo. Declare também o que o sistema **não** faz: os limites é que geram tensão.

### Passo 5 — Cronologia

Eventos anteriores que ainda pesam na página. Datas relativas com âncora verificável ("dois anos depois do Atentado").

### Passo 6 — Podar

Corte o que a página não vai cobrar. Três continentes que ninguém visita são três continentes de dívida.

### Passo 7 — Alimentar o vault

Espelhe em `01 — Bíblia do Mundo/Estado do Mundo.md` e `04 — Mundo/{Sistema e Regras,Cronologia}.md`.

### Passo 8 — Revisor e portão

`editora-editor-chefe-agent`, até 2 iterações. Emoji: 🌍. Portão padrão.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream` — a bíblia que não cita os pilares foi construída ao lado deles, não a partir deles.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

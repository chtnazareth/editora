---
slug: aprovacao-conceito
fase: ideacao
execucao: SEMPRE
condicao: Sempre — é o portão que separa "ideia" de "projeto". Nada de concepção começa antes dele.
agente_lider: editora-editor-chefe-agent
agentes_apoio:
  - editora-desenvolvimento-agent
  - editora-aquisicao-agent
modo: mesa
produz:
  - parecer-de-conceito
consome:
  - artefato: logline
    obrigatorio: true
  - artefato: escopo-da-obra
    obrigatorio: true
  - artefato: avaliacao-viabilidade
    obrigatorio: false
  - artefato: posicionamento
    obrigatorio: false
requer_estagio:
  - premissa-e-pitch
  - definicao-escopo
escopos:
  - romance
  - serie
  - novela
  - retomada
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: Tudo que a Ideação produziu
saidas: parecer-de-conceito.md — vale escrever este livro, e com que ressalvas
---

# Aprovação de Conceito

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar personas

Modo mesa: `editora-editor-chefe-agent` conduz, com `editora-desenvolvimento-agent` e `editora-aquisicao-agent` na sala. Divergência entre eles é **registrada, não resolvida** — objeção de julgamento sobe ao autor no meio do estágio, não no fim.

### Passo 2 — Auditar completude

Todo artefato da Ideação existe e decide alguma coisa? Seção presente mas vazia conta como ausente.

### Passo 3 — Auditar rastreabilidade

Cada decisão remonta à semente, a uma resposta do autor ou a uma fonte? Marque toda **decisão inventada** — é o defeito mais grave desta fase, porque contamina tudo o que vem depois.

### Passo 4 — Auditar coerência

Cruze logline × escopo × posicionamento × viabilidade. Os conflitos que aparecem aqui: pitch que promete o que a extensão não cabe; posicionamento que exige pesquisa que a viabilidade reprovou; tema que o enredo declarado não toca.

### Passo 5 — Parecer

`parecer-de-conceito.md` com `## Veredito`, `## Ressalvas`, `## Riscos aceitos` e `## O que fica em aberto para a Concepção`. Veredito é **Segue** ou **Não segue ainda** — e o segundo vem sempre com a lista do que falta.

### Passo 6 — Portão

Emoji: ⚖️. Portão padrão. Este é o portão mais importante do método: depois dele, o custo de mudar de ideia sobe muito.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream` — o parecer que não cita o que auditou não auditou.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

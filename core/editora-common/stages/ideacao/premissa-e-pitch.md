---
slug: premissa-e-pitch
fase: ideacao
execucao: SEMPRE
condicao: Sempre — se a premissa não cabe numa frase, a história ainda não foi encontrada.
agente_lider: editora-aquisicao-agent
agentes_apoio:
  - editora-desenvolvimento-agent
modo: pipeline
produz:
  - logline
  - pitch-paragrafo
  - tema-central
consome:
  - artefato: declaracao-semente
    obrigatorio: true
  - artefato: escopo-da-obra
    obrigatorio: false
requer_estagio:
  - captura-semente
  - definicao-escopo
escopos:
  - romance
  - serie
  - novela
  - conto
  - retomada
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: declaracao-semente e escopo-da-obra
saidas: logline.md, pitch-paragrafo.md, tema-central.md
---

# Premissa e Pitch

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar persona

Modo pipeline: `editora-desenvolvimento-agent` formula a premissa a partir da semente, `editora-aquisicao-agent` a aperta até virar pitch. Cada elo vê o trabalho do anterior e avança o mesmo artefato.

### Passo 2 — Logline

Uma frase: **quem** quer **o quê**, **contra o quê**, e **o que perde se falhar**. Sem oração subordinada empilhada. Se a logline precisa de três "que", a história ainda está difusa — volte à semente.

### Passo 3 — Parágrafo

Cinco a oito linhas: situação, ruptura, escalada, aposta. Termina na pergunta que faz virar a página, não na resolução.

### Passo 4 — Tema

Formulado como pergunta, com as duas respostas que o livro leva a sério. Tema com uma resposta só é panfleto.

### Passo 5 — Teste de coerência

Logline, parágrafo e tema precisam vender **a mesma promessa**. Contradição entre eles é o defeito mais comum e o mais invisível — aponte antes do portão.

### Passo 6 — Alimentar o vault

Espelhe o resultado em `01 — Bíblia do Mundo/Premissa e Pitch.md` da obra, para o autor achar onde espera achar.

### Passo 7 — Portão

Emoji: 🎯. Portão padrão.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

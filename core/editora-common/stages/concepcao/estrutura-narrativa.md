---
slug: estrutura-narrativa
fase: concepcao
execucao: SEMPRE
condicao: Sempre — é onde o arco vira esqueleto de capítulos.
agente_lider: editora-enredo-agent
agentes_apoio:
  - editora-desenvolvimento-agent
modo: pipeline
produz:
  - estrutura-narrativa
  - viradas
consome:
  - artefato: pilares-criativos
    obrigatorio: true
  - artefato: tema-central
    obrigatorio: true
  - artefato: protagonista
    obrigatorio: true
requer_estagio:
  - elenco
escopos:
  - romance
  - serie
  - novela
  - conto
  - retomada
revisor: editora-editor-chefe-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: Pilares, tema e a ficha do protagonista
saidas: estrutura-narrativa.md, viradas.md
---

# Estrutura Narrativa

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar personas

Pipeline: `editora-desenvolvimento-agent` estabelece o arco, `editora-enredo-agent` o converte em estrutura de atos.

### Passo 2 — Declarar o método

O padrão do template é **27 capítulos em 3 atos de 9**, numeração contínua. Outro método é permitido, mas precisa de justificativa escrita — o `Painel.base` do Obsidian e a geração de unidades assumem o padrão.

### Passo 3 — Marcar as viradas

Em `viradas.md`, com o capítulo aproximado de cada uma:

- **Incidente incitante** — o que tira o protagonista do estado inicial
- **Ponto sem volta** (fim do Ato 1) — depois disto ele não pode desistir
- **Ponto médio** — a aposta se inverte, ou o que ele queria se revela outra coisa
- **Crise** (fim do Ato 2) — a derrota que custa mais caro
- **Clímax** e **custo** — o que ele ganha, e o que paga por isso

### Passo 4 — Verificar a escalada

Cada ato termina com o problema **transformado**, não adiado. Se o fim do Ato 2 é o mesmo problema do fim do Ato 1 com mais barulho, o meio está flácido — e este é o momento barato de descobrir isso.

### Passo 5 — Amarrar ao tema

Cada virada precisa fazer o tema doer. Se as viradas funcionariam identicamente com outro tema, o tema é decoração.

### Passo 6 — Alimentar o vault

Espelhe em `01 — Bíblia do Mundo/Estrutura Narrativa.md`.

### Passo 7 — Revisor e portão

`editora-editor-chefe-agent`, até 2 iterações. Emoji: 🧭. Portão padrão.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

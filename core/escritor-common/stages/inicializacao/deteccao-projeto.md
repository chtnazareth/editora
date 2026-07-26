---
slug: deteccao-projeto
fase: inicializacao
execucao: SEMPRE
condicao: Sempre — nada pode ser decidido antes de saber se há manuscrito no disco.
agente_lider: escritor-compositor-agent
agentes_apoio: []
modo: inline
produz:
  - retrato-do-projeto
consome: []
requer_estagio: []
escopos: []
sensores:
  - secoes-obrigatorias
entradas: A intenção crua do autor e o conteúdo da pasta alvo
saidas: retrato-do-projeto.md — o que já existe, o que falta, e se é obra nova ou retomada
---

# Detecção de Projeto

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão. Este estágio é um dos três **sem portão** — é mecânica, não decisão criativa.

## Passos

### Passo 1 — Carregar persona

Carregue `escritor-compositor-agent` e o conhecimento em `core/knowledge/escritor-compositor-agent/`.

### Passo 2 — Varrer o disco

Na pasta alvo, procure e registre:

- Manuscrito: arquivos em `05 — Manuscrito/` ou equivalente. Conte capítulos com prosa de verdade (mais de 200 palavras de corpo) e capítulos que só têm andaime.
- Bíblia: `01 — Bíblia do Mundo/`, decisões fechadas, perguntas em aberto.
- Fichas: `02 — Personagens/`, `03 — Lugares/`, `04 — Mundo/`.
- Skill de voz existente para este livro em `~/LIVROS/.claude/skills/prosa-*`.
- Estrutura própria que fuja do template dos 27 capítulos.

### Passo 3 — Classificar a origem

**Obra nova** — pasta vazia ou só com o molde. **Retomada** — existe prosa. O critério é prosa no disco, não intenção declarada: um autor com três capítulos escritos está em retomada mesmo que diga que "vai começar do zero".

### Passo 4 — Propor escopo

Cruze a intenção declarada com as palavras-chave de `core/scopes/`. Apresente a proposta com **a lista explícita do que o escopo pula**. O autor precisa saber o que não vai acontecer.

### Passo 5 — Gravar o retrato

Escreva `retrato-do-projeto.md` com as seções `## O que existe`, `## Origem`, `## Escopo proposto` e `## Lacunas`.

### Passo 6 — Reportar

`bun {{METODO}}/core/tools/escritor-orchestrate.ts reportar --estagio deteccao-projeto --resultado aguardando-aprovacao`, seguido de `--resultado aprovado`. Sem portão humano nesta fase.

## Sensores

`secoes-obrigatorias` confirma que o retrato tem estrutura. Um retrato sem seções costuma ser um retrato sem varredura.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto**. Antes de fechar, faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Regra que o autor mantiver vira linha em `memoria/projeto.md` (ou `memoria/autor.md`, se valer para todos os livros); verificação nova vira manifesto em `core/sensors/`. Nunca edite este arquivo: estágio é artefato imutável.

---
slug: init-estado
fase: inicializacao
execucao: SEMPRE
condicao: Sempre — sem estado o motor não sabe onde está.
agente_lider: escritor-compositor-agent
agentes_apoio: []
modo: inline
produz:
  - plano-de-fluxo
consome:
  - artefato: retrato-do-projeto
    obrigatorio: true
  - artefato: mapa-do-vault
    obrigatorio: true
requer_estagio:
  - scaffold-vault
escopos: []
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: retrato-do-projeto e mapa-do-vault
saidas: plano-de-fluxo.md — os estágios que vão rodar, na ordem, com o que cada um pula
---

# Inicialização de Estado

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão. Estágio sem portão.

## Passos

### Passo 1 — Gravar o estado

`bun {{METODO}}/core/tools/escritor-state.ts iniciar --titulo "<título>" --escopo <escopo> --origem <novo|retomada>`.

Isso cria `estado.json` e o espelho `estado.md`, que o autor lê no Obsidian.

### Passo 2 — Gerar as unidades

Para escopos com manuscrito longo: `escritor-state.ts unidades --gerar 27`. Para `conto` e `oficina`, gere 1. As unidades são o que a fase de construção percorre.

### Passo 3 — Semear a memória

Crie `memoria/projeto.md` com o que já se sabe da obra e `memoria/autor.md` se ainda não existir — este último é compartilhado entre todos os livros do autor e **não** se reescreve, só recebe linhas novas.

### Passo 4 — Escrever o plano de fluxo

`plano-de-fluxo.md` com `## Estágios que vão rodar` (a lista em ordem, vinda de `escritor-graph.ts mostrar --escopo <escopo>`), `## O que este escopo pula` e `## Unidades`.

### Passo 5 — Reportar

Reporte `aguardando-aprovacao` e em seguida `aprovado`. A Ideação começa no próximo estágio.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream` — o plano precisa citar o retrato e o mapa que o originaram.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto**. Antes de fechar, faça a pergunta obrigatória do §13 do stage-protocol. Regra que o autor mantiver vira linha em `memoria/projeto.md` (ou `memoria/autor.md`); verificação nova vira manifesto em `core/sensors/`. Nunca edite este arquivo.

---
slug: plano-capitulos
fase: concepcao
execucao: SEMPRE
condicao: Sempre — é o estágio que gera as unidades de trabalho da fase de construção.
agente_lider: escritor-enredo-agent
agentes_apoio:
  - escritor-personagens-agent
  - escritor-mundo-agent
modo: mesa
produz:
  - plano-de-capitulos
  - mapa-setup-payoff
  - unidade-capitulo
consome:
  - artefato: estrutura-narrativa
    obrigatorio: true
  - artefato: viradas
    obrigatorio: true
  - artefato: protagonista
    obrigatorio: true
  - artefato: sistema-e-regras
    obrigatorio: false
  - artefato: lugares-do-livro
    obrigatorio: false
requer_estagio:
  - estrutura-narrativa
  - lugares
escopos:
  - romance
  - serie
  - novela
  - retomada
revisor: escritor-desenvolvimento-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: Estrutura narrativa, viradas, fichas e regras do mundo
saidas: plano-de-capitulos.md, mapa-setup-payoff.md, unidade-capitulo.md
---

# Plano de Capítulos

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar personas

Modo mesa: enredo conduz, personagens e mundo na sala. Cross-talk permitido, dissenso registrado. Objeção de julgamento sobe ao autor no meio do estágio.

### Passo 2 — Uma linha por capítulo

Para cada um dos 27: **beat**, POV, local, quem quer o quê, qual o obstáculo, o que muda ao sair.

Se a função dramática não couber em uma linha, o capítulo tem dois capítulos dentro. Divida ou funda até caber.

### Passo 3 — Mapa de setup e payoff

Em `mapa-setup-payoff.md`, duas colunas amarradas: onde cada informação, objeto ou promessa é **plantada** e onde é **cobrada**.

- Setup sem payoff é dívida
- Payoff sem setup é trapaça

Liste as duas listas de órfãos explicitamente. É o produto mais útil deste estágio.

### Passo 4 — Caminho crítico

Marque os capítulos que não podem ser cortados sem derrubar outros. Numa revisão futura, é por aqui que se decide o que sobrevive.

### Passo 5 — Gerar as unidades

`unidade-capitulo.md` lista as 27 unidades com id (`cap-01`…`cap-27`), ato, rótulo e beat. Sincronize com o estado:

`bun {{METODO}}/core/tools/escritor-state.ts unidades --gerar 27`

e preencha o campo `beat` de cada unidade. São estas unidades que a fase de construção percorre.

### Passo 6 — Alimentar o vault

Escreva o beat de cada capítulo no callout `[!summary]` do respectivo `Cap NN.md`, e o `status: planejado` no frontmatter.

### Passo 7 — Revisor e portão

`escritor-desenvolvimento-agent` revisa (é ele quem cobra o arco). Emoji: 📋. Portão padrão.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream` — um plano que não cita as viradas não foi derivado da estrutura.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

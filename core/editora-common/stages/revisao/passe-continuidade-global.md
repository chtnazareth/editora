---
slug: passe-continuidade-global
fase: revisao
execucao: SEMPRE
condicao: Sempre — há erros que só aparecem lendo o livro inteiro de uma vez.
agente_lider: editora-continuidade-agent
agentes_apoio:
  - editora-mundo-agent
modo: subagente
produz:
  - divergencias-de-canon
consome:
  - artefato: relatorio-de-continuidade
    obrigatorio: false
  - artefato: cronologia
    obrigatorio: false
  - artefato: mapa-setup-payoff
    obrigatorio: false
requer_estagio:
  - revisao-estrutural-ato
escopos:
  - romance
  - serie
  - novela
  - retomada
revisor: editora-editor-chefe-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
entradas: O manuscrito completo e todos os relatórios de continuidade por capítulo
saidas: divergencias-de-canon.md — o registro consolidado, com decisão por item
---

# Passe de Continuidade Global

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Ler tudo seguido

A checagem por capítulo pega o que contradiz o canon. Este passe pega o que só a leitura corrida revela: personagem que muda de cor de olho, cidade a dois dias de viagem que vira meio dia, arma perdida que reaparece, ferimento que some.

### Passo 2 — Rastrear objetos e corpos

Faça a linha do tempo de cada objeto significativo e de cada ferimento. É trabalho mecânico e é onde mora a maioria dos erros.

### Passo 3 — Fechar setup e payoff

Consolide a lista final de órfãos. Depois do livro escrito, promessa não paga é o que o leitor lembra.

### Passo 4 — Consolidar as decisões

Cada divergência sai com uma decisão registrada: texto muda, ou bíblia muda. Atualize `01 — Bíblia do Mundo/Decisões Fechadas.md` com o que o autor fechar.

### Passo 5 — Revisor e portão

`editora-editor-chefe-agent`, até 2 iterações. Emoji: 🧵. Portão padrão (2 opções).

## Sensores

`secoes-obrigatorias`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

---
slug: revisao-estrutural-ato
fase: revisao
execucao: CONDICIONAL
condicao: Roda em obra dividida em atos com capítulos suficientes para o ritmo importar. Pula em novela, conto e oficina.
agente_lider: escritor-desenvolvimento-agent
agentes_apoio:
  - escritor-enredo-agent
modo: pipeline
produz:
  - diagnostico-de-ato
consome:
  - artefato: plano-de-capitulos
    obrigatorio: true
  - artefato: viradas
    obrigatorio: true
  - artefato: mapa-setup-payoff
    obrigatorio: false
  - artefato: relatorio-de-leitura
    obrigatorio: false
  - artefato: mapa-de-tedio
    obrigatorio: false
requer_estagio:
  - leitura-beta
escopos:
  - romance
  - serie
  - retomada
revisor: escritor-leitor-beta-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: O manuscrito completo, o plano de capítulos e as viradas
saidas: diagnostico-de-ato.md — um diagnóstico por ato, com endereço
---

# Revisão Estrutural de Ato

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar personas

Pipeline: `escritor-enredo-agent` confere o executado contra o planejado; `escritor-desenvolvimento-agent` diagnostica o que o desvio custou.

### Passo 2 — Ato por ato

Para cada ato, responda com capítulo na mão:

- A virada prometida aconteceu, e no lugar previsto?
- O ato termina com o problema **transformado**, ou só adiado?
- A tensão sobe dentro do ato, ou oscila em torno do mesmo nível?
- O protagonista age, ou reage por capítulos seguidos?

### Passo 3 — Caçar o meio flácido

O defeito mais comum e mais caro: o Ato 2 que repete a mesma derrota com roupas diferentes. Sintoma: dois capítulos consecutivos cujo resumo é intercambiável. Liste os pares.

### Passo 4 — Órfãos

Cruze com o `mapa-setup-payoff`: o que foi plantado e nunca cobrado, o que foi cobrado sem plantio. Depois do manuscrito escrito, esta lista costuma ser diferente da planejada.

### Passo 5 — Diagnóstico com endereço

Nunca "o Ato 2 arrasta". Sempre "os capítulos 12 a 15 repetem a mesma derrota sem mudar a aposta; o capítulo 13 pode absorver o 14". Cada diagnóstico com o corte ou a costura proposta e **a conta do que isso implica**.

### Passo 6 — Revisor e portão

`escritor-leitor-beta-agent` confronta o diagnóstico com a experiência de leitura. Emoji: 🏗️. Portão padrão (2 opções).

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

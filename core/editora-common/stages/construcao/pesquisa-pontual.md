---
slug: pesquisa-pontual
fase: construcao
execucao: CONDICIONAL
condicao: Roda só quando o outline desta cena sinalizou fato que ninguém levantou. Sem sinalização, pula.
agente_lider: editora-pesquisa-agent
agentes_apoio: []
modo: inline
para_cada: unidade-capitulo
produz:
  - dossie-de-cena
consome:
  - artefato: outline-de-cenas
    obrigatorio: true
requer_estagio:
  - outline-cena
escopos:
  - romance
  - serie
  - retomada
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: O outline desta cena e a marcação de pesquisa
saidas: dossie-de-cena.md — o mínimo para a cena não mentir
---

# Pesquisa Pontual

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

Estágio em laço: uma vez por unidade-capítulo, e só quando acionado.

## Passos

### Passo 1 — Carregar persona

`editora-pesquisa-agent`, modo inline.

### Passo 2 — Reduzir a pergunta

Transforme a marcação do outline em perguntas concretas e fechadas. "Pesquisar medicina de campo" não é pergunta; "quanto tempo alguém sobrevive com este ferimento sem atendimento, e o que dói primeiro" é.

### Passo 3 — Levantar detalhe material

Priorize o sensorial e o mensurável: como cheira, quanto pesa, quanto tempo leva, o que dói, o que faz barulho. É isso que entra na cena — não o conceito.

### Passo 4 — Separar fato de convenção

Diga o que é fato e o que é convenção do gênero, e qual dos dois a cena está usando. As duas coisas são legítimas; confundi-las não.

### Passo 5 — Registrar licença poética

O que se sabe estar errado e se decidiu manter, e por quê. Errar de propósito é legítimo; errar sem saber, não.

### Passo 6 — Portão

Emoji: 📚. Portão padrão (2 opções).

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

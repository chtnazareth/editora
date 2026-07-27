---
slug: leitura-beta
fase: revisao
execucao: SEMPRE
condicao: Sempre — é a única vez em que alguém lê o livro sem saber o que o autor quis dizer.
agente_lider: editora-leitor-beta-agent
agentes_apoio: []
modo: inline
produz:
  - relatorio-de-leitura
  - mapa-de-tedio
consome:
  - artefato: logline
    obrigatorio: false
  - artefato: pilares-criativos
    obrigatorio: false
requer_estagio:
  - checagem-continuidade
escopos:
  - romance
  - serie
  - novela
  - retomada
sensores:
  - secoes-obrigatorias
entradas: O manuscrito, e nada mais até o relatório estar escrito
saidas: relatorio-de-leitura.md e mapa-de-tedio.md
---

# Leitura Beta

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Ler o texto sozinho, primeiro

**Não leia a bíblia do mundo antes.** Ler o canon contamina o relatório: você passa a entender coisas que o leitor real não entenderia, e o achado mais valioso desaparece.

### Passo 2 — Quatro passagens, quatro lentes

Uma passagem por lente, cada uma declarada no relatório. Lentes diferentes acham defeitos diferentes; repetir a mesma lente não acha mais nada.

- **Leitor de gênero** — comprou esperando o que o gênero promete; cobra as convenções
- **Leitor cético** — não dá crédito; para em cada conveniência e coincidência
- **Leitor apressado** — lê distraído; marca onde perdeu o fio e teve de voltar
- **Leitor sensível ao tema** — conhece o assunto ou pertence ao grupo retratado; marca o que soa falso

### Passo 3 — Mapa de tédio

O produto mais valioso. Para cada capítulo, marque: **onde largaria o livro**, onde pulou parágrafo, onde os olhos atravessaram sem ler. Descrição longa e exposição costumam aparecer aqui.

### Passo 4 — Relatório

`relatorio-de-leitura.md` com `## Onde não entendi`, `## Onde não acreditei`, `## O que o livro prometeu e não pagou` e `## O que ficou no dia seguinte`. Se não ficou nada no dia seguinte, **isso é o achado**.

### Passo 5 — Relate, não resolva

"Parei no capítulo 14" vale mais que "o capítulo 14 precisa de mais conflito". Quem propõe solução é o editor de desenvolvimento, com o seu relatório na mão.

### Passo 6 — Só agora, o canon

Depois de escrever o relatório, leia a bíblia e separe "não entendi" de "está errado". As duas coisas importam, e são diferentes.

### Passo 7 — Portão

Emoji: 👓. Portão padrão (2 opções).

## Sensores

`secoes-obrigatorias`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

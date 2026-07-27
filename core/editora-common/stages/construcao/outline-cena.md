---
slug: outline-cena
fase: construcao
execucao: SEMPRE
condicao: Sempre — o prosista não abre um capítulo sem saber quem quer o quê e o que impede.
agente_lider: editora-enredo-agent
agentes_apoio:
  - editora-personagens-agent
modo: subagente
para_cada: unidade-capitulo
produz:
  - outline-de-cenas
consome:
  - artefato: plano-de-capitulos
    obrigatorio: false
  - artefato: protagonista
    obrigatorio: false
  - artefato: convencoes-de-prosa
    obrigatorio: false
requer_estagio:
  - plano-capitulos
  - convencoes-prosa
escopos:
  - romance
  - serie
  - novela
  - conto
  - retomada
  - oficina
revisor: editora-leitor-beta-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
entradas: O beat deste capítulo, as fichas de quem está na cena e as convenções de prosa
saidas: outline-de-cenas.md — uma cena por bloco, com objetivo, obstáculo, virada e saída
---

# Outline de Cena

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

Estágio em laço: roda uma vez por unidade-capítulo. O motor informa a unidade ativa na diretiva.

## Passos

### Passo 1 — Carregar personas e o metodo-martin

`editora-enredo-agent` lidera. Carregue a skill `metodo-martin` — este estágio é a aplicação direta dela.

### Passo 2 — Quebrar o capítulo em cenas

Uma a três cenas por capítulo, tipicamente. Para cada cena:

- **Quem quer o quê** — objetivo concreto, verificável na página
- **O que impede** — obstáculo com vontade própria, de preferência outra pessoa
- **A virada** — o que muda no meio, e que o POV não previa
- **A saída** — como a cena termina, e o que ficou diferente
- **O relógio** — o que cria pressa, mesmo pequeno (a noite chegando, o capitão sumido)

### Passo 3 — Definir a abertura

Diga a primeira frase, ou pelo menos o que a primeira frase faz. **Proibido abrir com:** descrição de cenário, parágrafo de clima, exposição de mundo, o POV acordando e observando, ou resumo do que vai acontecer.

Abra por uma **voz** ou por uma **ação com tensão**. O sensor `abertura-cena` vai medir isso no rascunho — resolva aqui, que sai mais barato.

### Passo 4 — O mundo pelas beiras

Marque o que o mundo entrega nesta cena **por comportamento**: o gesto, o hábito, o atrito. Nunca por explicação. Um gesto vale um parágrafo de exposição.

### Passo 5 — Declarar o POV

Nome do personagem-POV, para o frontmatter do capítulo. O sensor `deriva-pov` depende deste campo.

### Passo 6 — Sinalizar pesquisa

Se a cena precisa de fato que ninguém levantou, marque — é o gatilho do estágio `pesquisa-pontual`.

### Passo 7 — Revisor e portão

`editora-leitor-beta-agent` lê o outline como leitor: a cena promete alguma coisa? Emoji: 🎬. Portão padrão (2 opções — estágio de Construção).

## Sensores

`secoes-obrigatorias`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

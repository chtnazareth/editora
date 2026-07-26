---
slug: convencoes-prosa
fase: concepcao
execucao: SEMPRE
condicao: Sempre — é a voz DESTE livro, e é o que muda de livro para livro. Sem ela o prosista escreve genérico.
agente_lider: escritor-linha-agent
agentes_apoio:
  - escritor-prosista-agent
  - escritor-personagens-agent
modo: pipeline
produz:
  - convencoes-de-prosa
  - frase-exemplar
consome:
  - artefato: pilares-criativos
    obrigatorio: false
  - artefato: declaracao-semente
    obrigatorio: false
requer_estagio:
  - pilares-criativos
escopos:
  - romance
  - serie
  - novela
  - conto
  - retomada
  - oficina
revisor: escritor-editor-chefe-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
entradas: Os pilares, a semente e — quando houver — manuscrito já aprovado deste livro
saidas: convencoes-de-prosa.md e frase-exemplar.md
---

# Convenções de Prosa

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Calibrar o ouvido antes de teorizar

Se já existe prosa aprovada deste livro, **leia um trecho antes de escrever qualquer regra**. Se não existe, leia o exemplar que o autor elegeu como régua para este projeto. Regra deduzida de teoria produz voz genérica; regra extraída de texto real produz voz.

### Passo 2 — Perguntas

- POV: primeira ou terceira? Limitada, próxima ou onisciente? Um POV ou vários?
- Tempo verbal, e como o passado do passado é tratado.
- Onde este livro fica na escala entre seco e lírico?
- Discurso indireto livre: sim ou não?
- O que este livro **nunca** faz?

### Passo 3 — Extrair a mecânica de frase

Do trecho-régua, extraia o que é replicável: tamanho médio de frase, uso de símile, densidade de efeito, como a descrição entra, como o corpo mede a emoção, o que abre e o que fecha parágrafo.

### Passo 4 — A seção mais útil: o que este livro nunca faz

Liste os tiques banidos, as construções vetadas e as aberturas proibidas. Inclua sempre os quatro venenos do autor: translatês, aforismo de para-choque, registro oral/baixo e prosa densa demais. Nomeie os sensores que medem cada um.

### Passo 5 — Frase-exemplar

Copie de 3 a 6 frases do manuscrito aprovado para `frase-exemplar.md`. É contra estas frases que o prosista vai calibrar, não contra a descrição.

### Passo 6 — Alimentar o vault

Espelhe em `01 — Bíblia do Mundo/Convenções de Prosa.md`. Se o autor mantiver skill de voz própria (`prosa-<livro>`), proponha a atualização dela — mas **não edite skill sem portão**.

### Passo 7 — Revisor e portão

`escritor-editor-chefe-agent`, até 2 iterações. Emoji: 🎼. Portão padrão.

## Sensores

`secoes-obrigatorias`. Os sensores de prosa não rodam aqui — este artefato descreve a voz, não a exerce.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

---
slug: rascunho
fase: construcao
execucao: SEMPRE
condicao: Sempre — é o estágio em que o livro é efetivamente escrito.
agente_lider: escritor-prosista-agent
agentes_apoio:
  - escritor-personagens-agent
modo: subagente
para_cada: unidade-capitulo
exige_manuscrito: true
produz:
  - nota-de-rascunho
consome:
  - artefato: outline-de-cenas
    obrigatorio: true
  - artefato: convencoes-de-prosa
    obrigatorio: true
  - artefato: frase-exemplar
    obrigatorio: false
  - artefato: dossie-de-cena
    obrigatorio: false
requer_estagio:
  - outline-cena
  - pesquisa-pontual
escopos:
  - romance
  - serie
  - novela
  - conto
  - retomada
  - oficina
revisor: escritor-linha-agent
revisor_max_iteracoes: 3
sensores:
  - abertura-cena
  - registro-baixo
  - deriva-pov
  - translates
  - aforismo
  - densidade
  - repeticao
  - metrica-capitulo
entradas: Outline da cena, convenções de prosa, frase-exemplar, fichas e dossiê
saidas: prosa em `05 — Manuscrito/**/Cap NN.md` e nota-de-rascunho.md no registro
---

# Rascunho

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

Estágio em laço, e o único com `exige_manuscrito: true` na Construção: a guarda de conclusão recusa fechá-lo se não houver prosa de verdade no capítulo.

## Passos

### Passo 1 — Calibrar o ouvido

**Antes de escrever uma linha**, leia um trecho de manuscrito já aprovado deste livro. Depois carregue `metodo-martin` **e** a skill de voz do livro (`prosa-a-luz`, `prosa-cinzas`, `prosa-primeira-incursao`, `prosa-projectx`). As duas juntas, sempre: uma monta a cena, a outra dá o registro e o canon.

### Passo 2 — Ler o que a cena precisa

Outline, fichas de quem está na sala, regras do mundo que a cena toca, dossiê se houver.

### Passo 3 — Escrever

Grave em `05 — Manuscrito/<Ato>/Cap NN.md`, preservando o frontmatter (`status`, `pov`, `beat`, `local`) e substituindo o andaime pelo texto. Atualize `status: rascunho`.

Enquanto escreve, as duas leis:

- **Cena, não ensaio.** Se um parágrafo pode ser lido como informação sobre o mundo em vez de coisa acontecendo com alguém agora, reescreva como ação ou corte.
- **Clareza primeiro.** Frase relida é frase errada. Um efeito por parágrafo, no máximo.

E os quatro venenos, todos ao mesmo tempo: nada de translatês, aforismo de para-choque, registro oral/baixo nem prosa densa demais.

### Passo 4 — Não inventar canon

Se a cena precisa de um fato que não existe na bíblia, **pare e pergunte**. Inventar aqui gera dívida que o `checagem-continuidade` vai cobrar mais caro.

### Passo 5 — Rodar os sensores

`bun {{METODO}}/core/tools/escritor-sensor.ts estagio --estagio rascunho --unidade <unidade>`

Os sensores rodam contra o **capítulo do manuscrito**, não contra a nota. `registro-baixo`, `abertura-cena` e `deriva-pov` são bloqueantes: falharam, o portão não abre.

### Passo 6 — Nota de rascunho

`nota-de-rascunho.md` com `## O que a cena entregou`, `## Onde divergi do outline` e `## Dúvidas para o portão`. É o que o revisor e o autor leem antes do texto.

### Passo 7 — Revisor e portão

`escritor-linha-agent` revisa, até 3 iterações. Emoji: ✍️. Portão padrão (2 opções — estágio de Construção; após 3 ciclos de "Pedir mudanças", o escape "Aceitar como está" aparece).

## Sensores

Os oito sensores de prosa. Três são bloqueantes (`registro-baixo`, `abertura-cena`, `deriva-pov`); os outros reportam e o portão decide. Detalhe em `.escritor/registro/.sensores/rascunho/`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

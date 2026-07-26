---
slug: retrospectiva
fase: revisao
execucao: SEMPRE
condicao: Sempre — é o estágio que faz o próximo livro custar menos que este.
agente_lider: escritor-desenvolvimento-agent
agentes_apoio:
  - escritor-linha-agent
  - escritor-leitor-beta-agent
modo: mesa
produz:
  - retrospectiva-da-obra
  - regras-promovidas
consome:
  - artefato: relatorio-de-leitura
    obrigatorio: false
  - artefato: relatorio-de-voz
    obrigatorio: false
  - artefato: divergencias-de-canon
    obrigatorio: false
requer_estagio:
  - revisao-final
escopos:
  - romance
  - serie
  - novela
  - conto
  - retomada
  - oficina
sensores:
  - secoes-obrigatorias
entradas: Todos os diários `memoria.md` dos estágios e os relatórios da fase de revisão
saidas: retrospectiva-da-obra.md e regras-promovidas.md
---

# Retrospectiva

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

Este é o estágio que fecha o laço de aprendizado do método. Sem ele, o AI-DLC Escritor é só um checklist: é aqui que a correção do autor vira guardião permanente.

## Passos

### Passo 1 — Reunir os diários

Colete todos os `memoria.md` de todos os estágios da obra. É o registro bruto de onde o método hesitou, desviou e trocou.

### Passo 2 — Mesa

Modo mesa: desenvolvimento conduz, editor de linha e leitor beta na sala. Dissenso registrado, não resolvido.

### Passo 3 — Separar o que é da obra do que é do autor

A pergunta que decide o destino de cada aprendizado:

- **Vale só para este livro?** → linha em `memoria/projeto.md`
- **Vale para todos os livros deste autor?** → linha em `memoria/autor.md`, e passa a carregar em toda obra futura
- **É verificável por máquina?** → manifesto novo em `core/sensors/` + analisador em `escritor-sensores.ts`, e o id entra no `sensores:` do estágio pertinente

Este terceiro caso é o mais valioso: é como o método ganha um sensor novo. Um tique que o autor caçou à mão em 27 capítulos vira uma regex que nunca mais deixa passar.

### Passo 4 — O que o método errou

Estágio que não pagou o próprio custo. Portão que travou sem motivo. Sensor com falso positivo demais. Ordem de estágios que se provou errada. Registre — o método também é revisável.

### Passo 5 — Escrever

`retrospectiva-da-obra.md` com `## O que funcionou`, `## O que custou caro`, `## O que o método errou` e `## Da próxima vez`.
`regras-promovidas.md` com cada regra, o destino escolhido e a justificativa.

### Passo 6 — Aplicar

Escreva de fato nas memórias e nos sensores. Retrospectiva que não altera arquivo nenhum não aconteceu.

### Passo 7 — Portão

Emoji: 🔁. Portão padrão (2 opções).

## Sensores

`secoes-obrigatorias`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

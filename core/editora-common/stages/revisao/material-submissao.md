---
slug: material-submissao
fase: revisao
execucao: CONDICIONAL
condicao: Roda quando a obra vai ser submetida a agente, editora ou publicada. Pula em livro escrito só para si e em oficina.
agente_lider: editora-aquisicao-agent
agentes_apoio:
  - editora-desenvolvimento-agent
modo: pipeline
produz:
  - sinopse
  - carta-de-apresentacao
  - texto-de-quarta-capa
consome:
  - artefato: logline
    obrigatorio: true
  - artefato: pitch-paragrafo
    obrigatorio: true
  - artefato: posicionamento
    obrigatorio: false
  - artefato: analise-comps
    obrigatorio: false
requer_estagio:
  - revisao-final
escopos:
  - romance
  - serie
  - novela
  - retomada
revisor: editora-leitor-beta-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: O manuscrito pronto, a logline, o pitch e o posicionamento
saidas: sinopse.md, carta-de-apresentacao.md, texto-de-quarta-capa.md
---

# Material de Submissão

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Reler a logline contra o livro escrito

O livro que saiu quase nunca é o que o pitch prometeu. Atualize a logline **contra o manuscrito**, não contra a intenção original.

### Passo 2 — Sinopse em três escalas

- **Uma frase** — a logline final
- **Um parágrafo** — situação, ruptura, escalada, aposta
- **Uma página** — a sinopse de submissão, que **conta o final**. Sinopse para editora não faz suspense; ela prova que o livro tem estrutura

Espelhe em `SINOPSE.md` da obra.

### Passo 3 — Carta de apresentação

Curta: o que é o livro (gênero, extensão, comps), por que este editor, e uma linha sobre o autor. Nada de sinopse dentro da carta.

### Passo 4 — Quarta capa

Texto de venda, 100 a 150 palavras. **Não** conta o final. Termina na pergunta que faz comprar.

### Passo 5 — Teste de coerência

As três peças vendem a mesma promessa? Contradição entre a quarta capa e a sinopse é o defeito mais comum aqui — e o mais fácil de um editor notar.

### Passo 6 — Revisor e portão

`editora-leitor-beta-agent` lê como quem recebe a submissão sem conhecer o livro. Emoji: 📮. Portão padrão (2 opções).

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

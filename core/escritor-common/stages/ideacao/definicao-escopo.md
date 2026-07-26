---
slug: definicao-escopo
fase: ideacao
execucao: SEMPRE
condicao: Sempre — extensão, formato e limite precisam ser decididos antes da estrutura.
agente_lider: escritor-aquisicao-agent
agentes_apoio:
  - escritor-desenvolvimento-agent
modo: subagente
produz:
  - escopo-da-obra
consome:
  - artefato: declaracao-semente
    obrigatorio: true
  - artefato: analise-comps
    obrigatorio: false
  - artefato: avaliacao-viabilidade
    obrigatorio: false
requer_estagio:
  - captura-semente
  - pesquisa-mercado
  - viabilidade
escopos:
  - romance
  - serie
  - novela
  - retomada
revisor: escritor-editor-chefe-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: declaracao-semente, e o que houver de comps e viabilidade
saidas: escopo-da-obra.md
---

# Definição de Escopo

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar persona

`escritor-aquisicao-agent` lidera; `escritor-desenvolvimento-agent` faz o teste de realidade estrutural.

### Passo 2 — Decidir o formato

- Volume único ou série? Se série, **o que fecha neste volume**.
- Extensão-alvo em palavras, calibrada pelo gênero e pelas comps.
- Quantos POVs, e quais.
- Tempo verbal e pessoa (a decisão fina de voz fica em `convencoes-prosa`, mas a estrutural é aqui).

### Passo 3 — Fronteira

`## Dentro` e `## Fora`, explícitos. O que está fora é mais útil que o que está dentro: é o que impede o livro de crescer sem controle.

### Passo 4 — Contradições

Rode detecção de contradição sobre as respostas. Os conflitos típicos: extensão-alvo incompatível com o número de POVs; ambição de série com premissa que se esgota num volume; viabilidade que exige pesquisa que o prazo não comporta.

### Passo 5 — Revisor

`escritor-editor-chefe-agent`, até 2 iterações.

### Passo 6 — Portão

Emoji: 📐. Portão padrão. Este é um estágio de Ideação: pode incluir a terceira opção para adicionar um estágio antes pulado.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

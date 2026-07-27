---
slug: pilares-criativos
fase: concepcao
execucao: SEMPRE
condicao: Sempre — os pilares são a régua contra a qual toda decisão posterior é medida.
agente_lider: editora-desenvolvimento-agent
agentes_apoio:
  - editora-enredo-agent
modo: subagente
produz:
  - pilares-criativos
consome:
  - artefato: declaracao-semente
    obrigatorio: true
  - artefato: tema-central
    obrigatorio: true
  - artefato: parecer-de-conceito
    obrigatorio: false
requer_estagio:
  - premissa-e-pitch
  - aprovacao-conceito
escopos:
  - romance
  - serie
  - novela
  - retomada
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: declaracao-semente, tema-central e o parecer de conceito
saidas: pilares-criativos.md — de 3 a 5 colunas inegociáveis
---

# Pilares Criativos

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar persona

`editora-desenvolvimento-agent` lidera; `editora-enredo-agent` testa se cada pilar é sustentável ao longo de 27 capítulos.

### Passo 2 — Extrair candidatos

Da semente, do tema e do parecer, levante os candidatos a pilar. Um pilar é uma escolha que, se cair, **torna o livro outro livro**.

### Passo 3 — Formular como restrição

Este é o passo que faz o estágio valer. Pilar precisa ser formulado como **restrição verificável**, não como elogio:

- vale: "o protagonista nunca descobre o que ele é"
- vale: "nenhuma cena acontece fora do perímetro murado"
- não vale: "personagens profundos", "prosa bonita", "worldbuilding rico"

Teste: dá para olhar um capítulo e dizer se ele obedece ou desobedece? Se não dá, não é pilar.

### Passo 4 — Podar

Máximo de cinco. Com mais que isso, nenhum é inegociável de verdade. Se sobrarem seis candidatos, dois são o mesmo pilar dito de duas maneiras — funda-os.

### Passo 5 — Custo de cada pilar

Para cada um, diga o que ele **impede**. Pilar sem custo é desejo. "Nenhuma cena fora do perímetro" impede a cena de resgate que o autor já imaginou — e é bom que ele saiba disso agora.

### Passo 6 — Alimentar o vault

Espelhe em `01 — Bíblia do Mundo/Pilares Criativos.md`.

### Passo 7 — Portão

Emoji: 🏛️. Portão padrão.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

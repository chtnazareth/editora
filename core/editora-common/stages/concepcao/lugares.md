---
slug: lugares
fase: concepcao
execucao: CONDICIONAL
condicao: Roda quando o livro tem cenários recorrentes que precisam ser os mesmos em capítulos distantes. Pula em novela, conto e oficina.
agente_lider: editora-mundo-agent
agentes_apoio: []
modo: inline
produz:
  - lugares-do-livro
consome:
  - artefato: estado-do-mundo
    obrigatorio: true
requer_estagio:
  - biblia-mundo
escopos:
  - romance
  - serie
  - retomada
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: estado-do-mundo
saidas: lugares-do-livro.md
---

# Lugares

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar persona

`editora-mundo-agent`, modo inline.

### Passo 2 — Só o que a página vai cobrar

Liste os cenários que aparecem em mais de uma cena, ou em uma cena decisiva. Lugar de passagem não precisa de ficha.

### Passo 3 — Descrever pelo uso

Cada lugar pelo que **se faz nele** e pelo que **se evita nele**. Não inventário de turista: o que o POV notaria sem pensar, porque mora ali ou porque tem medo.

### Passo 4 — Ancorar o material

Três a cinco detalhes concretos por lugar: som constante, cheiro, temperatura, o que range, o que está sempre quebrado. São eles que fazem o lugar voltar igual no capítulo 22.

### Passo 5 — Geografia utilizável

Distâncias e tempos de deslocamento entre os lugares principais. É o que impede a cidade a dois dias de viagem de virar meio dia no capítulo em que convém.

### Passo 6 — Alimentar o vault

Espelhe em `03 — Lugares/`.

### Passo 7 — Portão

Emoji: 🗺️. Portão padrão.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

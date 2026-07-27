---
slug: captura-semente
fase: ideacao
execucao: SEMPRE
condicao: Sempre — sem a semente, todo o resto é execução sem direção.
agente_lider: editora-desenvolvimento-agent
agentes_apoio:
  - editora-aquisicao-agent
modo: subagente
produz:
  - declaracao-semente
  - perguntas-semente
consome:
  - artefato: plano-de-fluxo
    obrigatorio: true
requer_estagio:
  - init-estado
escopos:
  - romance
  - serie
  - novela
  - conto
  - retomada
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: A ideia crua do autor, como ele conseguir dizer
saidas: declaracao-semente.md e perguntas-semente.md
---

# Captura da Semente

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar persona

`editora-desenvolvimento-agent` como líder; `editora-aquisicao-agent` como apoio, para aterrar a ideia num gênero sem ainda discutir mercado.

### Passo 2 — Perguntar antes de formular

Escreva `perguntas-semente.md` e conduza pelo fluxo de perguntas do protocolo (Me guie / Editar arquivo / Conversar). As perguntas que importam:

- Qual é a **imagem, cena ou pergunta** que não sai da sua cabeça? A que veio antes do enredo.
- O que você quer que o leitor **sinta** ao fechar o livro?
- Que livro você quis ler e não achou?
- O que neste livro é **inegociável** — cai e vira outro livro?
- O que você acha que quer mas cede sem dor?
- Que pergunta o livro faz sem responder?

### Passo 3 — Separar semente de andaime

A semente é o que resiste. Andaime é tudo que o autor cede quando pressionado — e cede sem tristeza. Teste cada elemento: *se isso saísse, ainda seria este livro?*

### Passo 4 — Nomear o tema sem moralizar

Tema é a pergunta que o livro faz, não a lição que ele ensina. `A que preço se compra sobrevivência?` é tema; `a guerra é ruim` é moral.

### Passo 5 — Gravar a declaração

`declaracao-semente.md` com `## A semente`, `## O inegociável`, `## O andaime`, `## Tema` e `## O que ainda não sei`.

### Passo 6 — Portão

Emoji de conclusão: 🌱. Portão padrão (Aprovar / Pedir mudanças). Encerre o turno e espere.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`. A declaração precisa referenciar o plano de fluxo — é o que amarra a semente ao escopo escolhido.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

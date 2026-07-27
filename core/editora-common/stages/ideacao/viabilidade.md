---
slug: viabilidade
fase: ideacao
execucao: CONDICIONAL
condicao: Roda quando a premissa exige domínio que o autor não tem de cabeça. Pula em conto e oficina.
agente_lider: editora-pesquisa-agent
agentes_apoio:
  - editora-desenvolvimento-agent
modo: subagente
produz:
  - avaliacao-viabilidade
  - riscos-de-pesquisa
consome:
  - artefato: declaracao-semente
    obrigatorio: true
requer_estagio:
  - captura-semente
escopos:
  - romance
  - serie
  - novela
  - retomada
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: declaracao-semente
saidas: avaliacao-viabilidade.md, riscos-de-pesquisa.md
---

# Viabilidade

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar persona

`editora-pesquisa-agent` lidera; `editora-desenvolvimento-agent` avalia o custo estrutural das descobertas.

### Passo 2 — Mapear domínios

Liste os domínios que a premissa exige: técnico, histórico, geográfico, profissional, militar, médico, cultural. Para cada um: o que precisa saber, e para quê na página.

### Passo 3 — Medir a distância

Contra cada domínio, o que o autor já tem de repertório. A pergunta útil não é "o que preciso pesquisar?" e sim **"o que eu não sei que não sei?"**.

### Passo 4 — Riscos

- **Sensibilidade** — representação de grupo, tema que exige leitor sensível
- **Precisão cobrada** — assunto com leitores especialistas que vão conferir
- **Dependência** — pesquisa que exige acesso a fonte que o autor não tem

### Passo 5 — Contornos

Para cada risco alto, proponha uma escolha narrativa que reduza a exigência **sem ferir a semente**: mudar o POV para quem não precisaria explicar, deslocar a cena, elidir o processo e mostrar a consequência.

### Passo 6 — Portão

Emoji: 🔍. Portão padrão. Este estágio pode legitimamente concluir "esta premissa custa mais pesquisa do que o autor quer pagar" — e essa é uma conclusão válida, não um fracasso.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

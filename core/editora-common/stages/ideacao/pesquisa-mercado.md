---
slug: pesquisa-mercado
fase: ideacao
execucao: CONDICIONAL
condicao: Roda quando a obra tem ambição de publicação ou posicionamento externo. Pula em conto, oficina e em livro escrito só para si.
agente_lider: editora-aquisicao-agent
agentes_apoio:
  - editora-pesquisa-agent
modo: subagente
produz:
  - analise-comps
  - posicionamento
  - leitor-alvo
consome:
  - artefato: declaracao-semente
    obrigatorio: true
requer_estagio:
  - captura-semente
escopos:
  - romance
  - serie
  - retomada
revisor: editora-editor-chefe-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: declaracao-semente
saidas: analise-comps.md, posicionamento.md, leitor-alvo.md
---

# Pesquisa de Mercado

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar persona

`editora-aquisicao-agent` lidera; `editora-pesquisa-agent` levanta dados de mercado. Modo subagente: o apoio escreve `contributions/editora-pesquisa-agent.md` e o líder integra.

### Passo 2 — Perguntas

- Em que prateleira este livro fica? Gênero e subgênero, com precisão de livraria.
- Que livros o leitor deste vai ter lido antes?
- O que o gênero exige e não perdoa (table-stakes)?
- O que aqui é diferencial de verdade — e não só gosto do autor?
- Mercado brasileiro, tradução, ou os dois?

### Passo 3 — Comps

Levante de 3 a 6 obras comparáveis, de preferência recentes. Para cada uma: o que promete, o que entrega, e em que este livro se parece e se separa. **Comp é promessa, não vaidade** — citar clássico consagrado descreve ambição, não mercado.

### Passo 4 — Leitor-alvo

Descreva por comportamento de leitura, não por demografia: o que ele já lê, onde descobre livro, o que o faz abandonar um.

### Passo 5 — Posicionamento

Uma frase do tipo "para quem gostou de X mas quer Y". Aponte explicitamente se duas escolhas do autor puxam o livro para leitores incompatíveis.

### Passo 6 — Revisor

Despache `editora-editor-chefe-agent` (§12a). Veredito PRONTO / NÃO-PRONTO, até 2 iterações antes de subir ao portão.

### Passo 7 — Portão

Emoji: 📊. Portão padrão.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream` — a análise precisa citar a semente, senão está descrevendo outro livro.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

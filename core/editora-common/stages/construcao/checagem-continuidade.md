---
slug: checagem-continuidade
fase: construcao
execucao: SEMPRE
condicao: Sempre — divergência barata de consertar agora fica cara no capítulo 24.
agente_lider: editora-continuidade-agent
agentes_apoio:
  - editora-mundo-agent
  - editora-personagens-agent
modo: subagente
para_cada: unidade-capitulo
produz:
  - relatorio-de-continuidade
consome:
  - artefato: nota-de-rascunho
    obrigatorio: true
  - artefato: estado-do-mundo
    obrigatorio: false
  - artefato: sistema-e-regras
    obrigatorio: false
  - artefato: cronologia
    obrigatorio: false
  - artefato: protagonista
    obrigatorio: false
requer_estagio:
  - passe-linha
escopos:
  - romance
  - serie
  - novela
  - retomada
sensores:
  - secoes-obrigatorias
  - deriva-pov
entradas: O capítulo revisado, a bíblia, as fichas e a cronologia
saidas: relatorio-de-continuidade.md
---

# Checagem de Continuidade

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

Estágio em laço.

## Passos

### Passo 1 — Carregar personas

`editora-continuidade-agent` lidera; mundo e personagens entram como consulta ao canon.

### Passo 2 — Conferir, item a item

- **Nomes** — grafia conferida contra as fichas
- **Regras** — cada regra do mundo usada na cena conferida contra `sistema-e-regras`
- **Tempo** — referências temporais contra a `cronologia`
- **Comportamento** — o que o personagem faz contra a ficha dele. Ele faria isso?
- **POV** — o capítulo respeita o POV declarado, sem entrar em cabeça alheia
- **Coisas** — objetos, ferimentos, distâncias, estações do ano que atravessam capítulos

### Passo 3 — Distinguir erro de mudança

Antes de acusar, pergunte: o autor pode ter mudado de ideia de propósito. Nesse caso quem está velho é o canon. Escale como pergunta, não como defeito.

### Passo 4 — Registrar com endereço

Toda divergência com capítulo, trecho citado e a fonte contrariada. Sem os três, não é achado.

### Passo 5 — Fechar a decisão

Cada divergência sai daqui com decisão: **o texto muda** ou **a bíblia muda**. Duas versões nunca convivem. Se a bíblia muda, marque para atualização em `01 — Bíblia do Mundo/Decisões Fechadas.md`.

### Passo 6 — Portão

Emoji: 🔗. Portão padrão (2 opções). Capítulo sem divergência fecha com "nada a apontar" — e isso é informação, não estágio vazio.

Ao aprovar, atualize `status: pronto` no frontmatter do capítulo.

## Sensores

`secoes-obrigatorias` sobre o relatório e `deriva-pov` sobre o capítulo — a segunda passagem do sensor, agora contra o texto já revisado.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

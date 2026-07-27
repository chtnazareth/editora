---
slug: revisao-final
fase: revisao
execucao: SEMPRE
condicao: Sempre — última passagem antes de o texto sair da casa.
agente_lider: editora-copidesque-agent
agentes_apoio:
  - editora-linha-agent
modo: subagente
exige_manuscrito: true
produz:
  - folha-de-estilo
  - relatorio-de-copidesque
consome:
  - artefato: convencoes-de-prosa
    obrigatorio: true
  - artefato: divergencias-de-canon
    obrigatorio: false
  - artefato: relatorio-de-leitura
    obrigatorio: false
requer_estagio:
  - passe-voz
escopos:
  - romance
  - serie
  - novela
  - conto
  - retomada
revisor: editora-editor-chefe-agent
revisor_max_iteracoes: 2
sensores:
  - secoes-obrigatorias
  - registro-baixo
  - metrica-capitulo
entradas: O manuscrito completo e as convenções de prosa
saidas: folha-de-estilo.md, relatorio-de-copidesque.md e o manuscrito preparado
---

# Revisão Final

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Ler as convenções antes de corrigir qualquer coisa

`convencoes-de-prosa.md` diz o que é **escolha** e não pode ser "corrigido". Ênclise, inversão, fragmento, mais-que-perfeito sintético: em registro literário são recurso, não erro.

### Passo 2 — Norma culta

Concordância, regência, crase, colocação pronominal. Personagem pode falar errado; o narrador, não.

### Passo 3 — Pontuação de diálogo

Travessão de abertura e travessão de aparte no padrão brasileiro. Verbo de elocução em minúscula depois de vírgula. Um padrão só, do primeiro ao último capítulo.

### Passo 4 — Folha de estilo

`folha-de-estilo.md` registra as decisões de grafia do livro: nomes próprios e termos inventados, uso de itálico, numerais por extenso ou algarismo, aspas, reticências, travessão × meia-risca, estrangeirismos.

Entre duas grafias corretas, o livro escolhe uma e mantém.

### Passo 5 — Relatório

Cada intervenção justificável em uma linha. Se você não sabe explicar a regra, não mexa. Na dúvida entre desvio deliberado e engano, **pergunte**.

### Passo 6 — Revisor e portão

`editora-editor-chefe-agent`, até 2 iterações. Emoji: 📖. Portão padrão (2 opções).

## Sensores

`secoes-obrigatorias` sobre a folha de estilo, `registro-baixo` e `metrica-capitulo` sobre o manuscrito — a última medição antes de fechar.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

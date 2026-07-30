---
slug: passe-voz
fase: revisao
execucao: SEMPRE
condicao: Sempre — o capítulo 27 precisa soar como o capítulo 1.
agente_lider: editora-linha-agent
agentes_apoio:
  - editora-copidesque-agent
modo: subagente
exige_manuscrito: true
produz:
  - relatorio-de-voz
consome:
  - artefato: convencoes-de-prosa
    obrigatorio: true
  - artefato: frase-exemplar
    obrigatorio: false
requer_estagio:
  - passe-continuidade-global
escopos:
  - romance
  - serie
  - novela
  - retomada
sensores:
  - registro-baixo
  - translates
  - aforismo
  - densidade
  - repeticao
  - regra-de-tres
  - hedging
  - variacao-elegante
  - final-de-capitulo
entradas: O manuscrito completo, as convenções de prosa e a frase-exemplar
saidas: relatorio-de-voz.md e o manuscrito uniformizado
---

# Passe de Voz

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Rodar os sensores no livro inteiro

Rode os cinco sensores de prosa capítulo a capítulo e **tabule**. O valor deste passe está na série, não no caso isolado: um `registro-baixo` no capítulo 19 é um erro; uma curva de densidade que sobe do capítulo 14 ao 22 é uma deriva.

### Passo 2 — Localizar a deriva

Compare cada capítulo com a `frase-exemplar`. Marque os trechos escritos em outra chave — o capítulo escrito em dia ruim, o trecho em que o autor estava imitando outro livro, a cena que subiu de registro sem motivo.

### Passo 3 — Consolidar tiques

Tique é o que só aparece na leitura corrida: a construção favorita repetida em 14 capítulos, a mesma imagem reaproveitada, o mesmo verbo de atribuição. Liste com contagem e capítulos.

### Passo 4 — Uniformizar

Corrija a deriva **em direção à convenção declarada**, não ao seu gosto. Onde a deriva ficou melhor que a convenção, proponha atualizar a convenção — e leve ao portão.

### Passo 5 — Portão

Emoji: 🎚️. Portão padrão (2 opções).

## Sensores

Cinco sensores de prosa sobre o manuscrito inteiro. `registro-baixo` bloqueante; o resto compõe a tabela de deriva.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

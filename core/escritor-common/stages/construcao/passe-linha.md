---
slug: passe-linha
fase: construcao
execucao: SEMPRE
condicao: Sempre — nenhum capítulo fica pronto no primeiro jato.
agente_lider: escritor-linha-agent
agentes_apoio: []
modo: inline
para_cada: unidade-capitulo
exige_manuscrito: true
produz:
  - relatorio-de-passe-de-linha
consome:
  - artefato: nota-de-rascunho
    obrigatorio: true
  - artefato: convencoes-de-prosa
    obrigatorio: true
requer_estagio:
  - rascunho
escopos:
  - romance
  - serie
  - novela
  - conto
  - retomada
  - oficina
sensores:
  - registro-baixo
  - translates
  - aforismo
  - densidade
  - repeticao
  - metrica-capitulo
entradas: O capítulo rascunhado e as convenções de prosa
saidas: capítulo revisado em `05 — Manuscrito/` e relatorio-de-passe-de-linha.md
---

# Passe de Linha

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

Estágio em laço.

## Passos

### Passo 1 — Carregar persona

`escritor-linha-agent`, com as convenções de prosa e a frase-exemplar à mão.

### Passo 2 — Cortar o supérfluo

Advérbio que repete o verbo. Adjetivo que não acrescenta. Atribuição de fala enfeitada ("vociferou", "gargalhou") onde "disse" bastava. Explicação do que o gesto já disse.

### Passo 3 — Desempilhar

Quebre frase que exige releitura. Desfaça relativa dentro de relativa. Duas frases claras valem mais que uma esperta.

### Passo 4 — Reduzir a um efeito por parágrafo

Símile, aforismo, elipse esperta, construção "de escritor" — tudo conta. Escolha o melhor de cada parágrafo e converta o resto em prosa direta.

### Passo 5 — Ritmo

Alternância de frase curta e longa. Rajada de curtas seguidas é tique de thriller; sequência de longas cansa. Frase-soco depois de período longo funciona — uma vez.

### Passo 6 — Preservar a voz

Passe de linha **não é reescrita**. Se a sua versão soa como você e não como o autor, você errou. Na dúvida, aponte e proponha em vez de trocar.

### Passo 7 — Rodar sensores e reportar

`escritor-sensor.ts estagio --estagio passe-linha --unidade <unidade>`. Compare com os números do rascunho: média de palavras por frase, frases longas, ecos. O relatório mostra o **antes e depois**.

Atualize `status: revisao` no frontmatter do capítulo.

### Passo 8 — Portão

Emoji: ✂️. Portão padrão (2 opções).

## Sensores

Seis sensores de prosa. `registro-baixo` é bloqueante; os demais reportam a variação em relação ao rascunho.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

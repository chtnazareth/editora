---
slug: sabatina
fase: ideacao
execucao: SEMPRE
condicao: Sempre — nenhuma decisão do livro deve chegar ao capítulo 1 por omissão.
agente_lider: editora-desenvolvimento-agent
agentes_apoio:
  - editora-aquisicao-agent
  - editora-pesquisa-agent
modo: mesa
produz:
  - dossie-da-ideia
  - perguntas-adiadas
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
  - oficina
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: A ideia crua do autor, como ele conseguir dizer
saidas: dossie-da-ideia.md e perguntas-adiadas.md
---

# Sabatina

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

A entrevista implacável, e a primeira coisa que acontece. Antes de qualquer estágio olhar mercado, mundo ou estrutura, este desce na ideia crua até o autor ter tomado **conscientemente** as decisões que, de outro modo, seriam tomadas por omissão lá pelo capítulo 14 — quando já custam caro.

Não é coleta de requisitos. É pressão.

## As cinco regras

1. **Uma pergunta por vez.** Nunca duas. Perguntar em bloco atordoa e produz resposta rasa.
2. **Toda pergunta vem com a sua recomendação.** *"Recomendo X, porque Y. Concorda?"* É muito mais fácil discordar de uma proposta do que responder no vazio.
3. **Fato você pesquisa; decisão é do autor.** Se dá para descobrir procurando — quantos livros já usaram essa premissa, o que o gênero convenciona, quanto pesa uma espada de verdade —, **procure e traga pronto**. Nunca gaste uma pergunta com o que você mesmo pode levantar.
4. **Desça a árvore.** Cada resposta abre o galho seguinte. Não volte a um assunto fechado sem motivo novo.
5. **Não construa nada até haver entendimento comum.** A sabatina não produz o livro. Produz o acordo.

## Passos

### Passo 1 — Carregar personas

Modo mesa: `editora-desenvolvimento-agent` conduz, `editora-aquisicao-agent` pergunta pelo leitor, `editora-pesquisa-agent` levanta os fatos. Dissenso entre eles é **registrado, não resolvido** — e objeção de julgamento sobe ao autor no meio do estágio.

### Passo 2 — Ouvir a ideia crua

Sem interromper. Depois **devolva em uma frase** e confirme que entendeu, antes de qualquer pergunta. Metade das sabatinas ruins começa interrogando a ideia errada.

### Passo 3 — Levantar os fatos ANTES de perguntar

Pesquise e traga para a mesa:

- Esta premissa já foi usada? Por quem, e o que fizeram com ela?
- O que o gênero convenciona, e o que ele não perdoa?
- Que domínio isto exige que o autor talvez não tenha?
- O que o mercado brasileiro fez com isso nos últimos cinco anos?

Isso muda a qualidade da conversa: em vez de "que gênero é?", você chega com *"isto lê como fantasia contemporânea; as três comps mais próximas fazem assim; você quer ficar dentro ou fora dessa convenção?"*

### Passo 4 — Descer a árvore

Ordem sugerida, não roteiro. A resposta do autor decide o próximo galho.

**A premissa**
- O que exatamente é diferente neste mundo?
- Qual a regra disso — e o que ela custa?
- Quem paga esse custo?

**A pessoa**
- Quem sofre isso de perto? Por que ele, e não outro?
- O que ele quer? O que ele precisa e ainda não sabe?
- O que ele perde se falhar? *(Se a resposta for "tudo", ainda não foi pensado.)*

**A oposição**
- Quem impede? Com que razão própria?
- O que o oponente quer que também é legítimo?

**A promessa**
- Que livro o leitor pensa que está comprando ao ler a quarta capa?
- Qual a primeira imagem que ele vai lembrar uma semana depois?

**O fim**
- Você sabe onde termina? *Recomendo saber.* Vinte e sete capítulos sem destino viram catorze capítulos e um abandono.
- O que custa a vitória?

**A fronteira**
- O que este livro **não** é?
- O que você já sabe que vai querer enfiar aqui dentro e não cabe?

**O tamanho**
- Quantos POVs? *Recomendo de 2 a 4 num romance de 27 capítulos — abaixo de sete capítulos por fio não cabe arco.*
- Volume único ou série? *Recomendo único até prova em contrário.*

### Passo 5 — Marcar o que ficou em aberto

Nem tudo se decide agora, e forçar decisão prematura é tão ruim quanto não decidir. O que o autor não quiser fechar vai para `perguntas-adiadas.md` **com o estágio em que ela precisa estar respondida**.

Pergunta adiada sem prazo é pergunta esquecida.

### Passo 6 — Escrever o dossiê

`dossie-da-ideia.md` com:

- `## A ideia, em uma frase` — como você devolveu e o autor confirmou
- `## Decisões fechadas` — cada uma **com a alternativa que foi descartada e por quê**
- `## O que este livro não é`
- `## Fatos levantados` — o que a pesquisa trouxe, com fonte
- `## Riscos` — o que pode fazer este livro não funcionar

A alternativa descartada é o campo mais útil seis meses depois, quando o autor não lembrar por que não foi pelo outro caminho.

### Passo 7 — Ler de volta

Antes do portão, leia o dossiê inteiro de volta para o autor. É a última chance barata de ele dizer *"não foi isso que eu quis dizer"*.

### Passo 8 — Portão

Emoji: 🔥. Portão padrão. Este é um estágio de Ideação: pode incluir a terceira opção para adicionar um estágio antes pulado.

## Quando parar

Quando três perguntas seguidas produzirem resposta que não muda nada no dossiê — você exauriu o galho.

Sabatina que dura demais vira procrastinação com cara de rigor. O objetivo não é decidir tudo: é decidir **o que, ficando em aberto, custa caro depois**.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

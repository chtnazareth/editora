---
slug: elenco
fase: concepcao
execucao: SEMPRE
condicao: Sempre — nenhuma cena pode ser escrita sem saber o que as pessoas nela querem.
agente_lider: editora-personagens-agent
agentes_apoio:
  - editora-enredo-agent
modo: subagente
produz:
  - protagonista
  - antagonista
  - elenco-de-apoio
consome:
  - artefato: pilares-criativos
    obrigatorio: true
  - artefato: estado-do-mundo
    obrigatorio: false
requer_estagio:
  - pilares-criativos
  - biblia-mundo
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
  - cobertura-upstream
entradas: Pilares criativos e estado do mundo
saidas: protagonista.md, antagonista.md, elenco-de-apoio.md
---

# Elenco

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão.

## Passos

### Passo 1 — Carregar personas

`editora-personagens-agent` lidera; `editora-enredo-agent` confere se o que cada um quer é capaz de mover 27 capítulos.

### Passo 2 — Ficha como previsão de comportamento

Para cada personagem com peso, escreva:

- **Quer** — o objetivo consciente, o que ele persegue
- **Precisa** — o que lhe falta e ele não sabe. Se coincidir com o "quer", não há arco
- **Ferida** — o que aconteceu antes do livro e ainda governa
- **Contradição** — o que ele faz e que desmente o que diz de si
- **Sob pressão** — comportamento concreto quando encurralado, cansado, humilhado
- **Linha vermelha** — o que ele não faz de jeito nenhum, e o preço de cruzá-la

### Passo 3 — Antagonista com razão própria

Ele acha que está certo, e o texto precisa deixar isso defensável. Escreva o argumento dele na melhor versão possível. Vilão que sabe que é vilão é fraco.

### Passo 4 — Voz

Como cada um fala: registro, tamanho de frase, o que evita nomear, o que repete quando está nervoso. **Teste do diálogo cego** — tape os nomes: dá para saber quem fala?

### Passo 5 — Entrevistar antes de fechar

Para cada personagem com peso, **entreviste antes de dar a ficha por pronta**. É o teste
mais barato que existe.

```bash
bun {{METODO}}/core/tools/editora-personagem.ts --nome <nome>
```

O comando reúne a ficha e as aparições na página. A entrevista é sua: assuma a pessoa,
responda em primeira pessoa e no registro dela, usando só o que a ficha e o canon
estabelecem. Diante de uma situação que o livro ainda não mostrou, a pergunta que decide
tudo é **"o que você faria agora?"**.

- **Respondeu com firmeza** → a ficha aguenta.
- **Hesitou** → falta alguma coisa. Volte à ficha antes de escrever qualquer cena com ele.
- **Contradisse a ficha** → o achado mais valioso. Ou a ficha está errada, ou o
  personagem é mais interessante do que ela dizia. Leve ao autor.

Método completo em `core/knowledge/editora-personagens-agent/entrevistar-o-personagem.md`.

### Passo 6 — Podar o elenco

Dois personagens que cumprem a mesma função viram um. Promova a ficha própria só quem ganhou peso; o resto fica em `elenco-de-apoio.md`.

### Passo 6 — Alimentar o vault

Espelhe em `02 — Personagens/`.

### Passo 7 — Revisor e portão

`editora-editor-chefe-agent`, até 2 iterações. Emoji: 🎭. Portão padrão.

## Sensores

`secoes-obrigatorias` e `cobertura-upstream`.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto** —, formato `- <ISO8601> — <resumo>; <contexto>`. Antes do portão, leia o diário e faça a pergunta obrigatória do §13 do stage-protocol ("algo a guardar para a próxima vez?"). Nunca infira "nada a acrescentar". Regra prescritiva que o autor mantiver vira linha em `memoria/projeto.md` — ou `memoria/autor.md`, se valer para todos os livros dele; verificação nova vira manifesto em `core/sensors/` e entra no `sensores:` do estágio. Nunca edite este arquivo: estágio é artefato imutável do método.

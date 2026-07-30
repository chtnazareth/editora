# Editora

Um ciclo de vida dirigido por IA para **escrever livros**, portado de
[awslabs/aidlc-workflows@v2](https://github.com/awslabs/aidlc-workflows/tree/v2) —
que faz a mesma coisa para software.

29 estágios em 5 fases, 13 agentes-persona, 6 escopos, 10 sensores determinísticos
sobre o texto, e um portão de aprovação humana em cada etapa.

```bash
bun run doctor      # o método está são?
./scripts/instalar.sh   # liga ao Claude Code em ~/LIVROS/.claude
```

Depois, no Claude Code: `/editora`.

---

## A ideia

O AI-DLC não é um gerador de código. É uma **máquina de estados de método**: cada
estágio é um arquivo markdown com frontmatter declarando quem lidera, o que consome,
o que produz e o que precisa vir antes. Um motor lê o grafo, roda o estágio com a
persona certa, verifica o resultado com sensores determinísticos e **para num portão
humano** antes de avançar.

Essa arquitetura transpõe quase 1:1 para a escrita de um romance.

| AI-DLC (software) | Editora |
|---|---|
| Ideation: intent, market-research, feasibility, scope | A semente da ideia, gênero e comps, viabilidade de pesquisa, escopo da obra |
| Inception: requirements, stories, design, units | Bíblia do mundo, elenco, estrutura dos 27 capítulos, convenções de prosa |
| Construction: code-generation, build-and-test | Outline de cena → rascunho → passe de linha → continuidade |
| Operation: observability, incidents, feedback | Leitura beta, revisão estrutural, passe de voz, copidesque, submissão |
| 14 agentes (product, architect, developer…) | 13 agentes (aquisição, desenvolvimento, worldbuilder, prosista, copidesque…) |
| `sensors`: linter, type-check | Sensores de prosa: translatês, aforismo, registro baixo, densidade, deriva de POV |
| `knowledge/` por agente | `metodo-martin` e as skills `prosa-*` do autor |
| `workspace_requires` — o estágio tem de escrever código | `exige_manuscrito` — o estágio tem de escrever **prosa** |

---

## As cinco fases

| fase | pergunta que responde | estágios |
|---|---|---|
| **Inicialização** | onde este livro mora e o que já existe dele | 3 |
| **Ideação** | vale escrever este livro, e que livro é | 7 |
| **Concepção** | como ele é por dentro: mundo, gente, estrutura, voz | 7 |
| **Construção** | escrever, capítulo a capítulo | 5 (em laço × 27) |
| **Revisão** | fazer ficar bom, e prepará-lo para sair | 7 |

```bash
bun core/tools/editora-graph.ts mostrar --escopo romance
```

### A sabatina abre tudo

O estágio `1.1` não existe no AI-DLC original e é a porta de entrada: uma entrevista
implacável sobre a ideia crua, **uma pergunta por vez**, cada uma com recomendação, e
com a regra que a torna útil — *se é fato, o método pesquisa; se é decisão, é do autor*.

Ela existe para que nenhuma decisão do livro chegue ao capítulo 1 por omissão. Sai dela
um `dossie-da-ideia` que os seis estágios seguintes da Ideação consomem — e que registra,
para cada decisão fechada, **a alternativa que foi descartada e por quê**.

Inspirada na skill `grilling`.

---

## O loop: voltar atrás sem perder o lugar

Livro não é software. Software entrega e segue em frente; um livro leva meses e é
revisitado — você chega no capítulo 19 e quer repensar a protagonista, relê o
capítulo 1 seis meses depois, troca o nome de uma cidade.

O caminho é reto por padrão. O **desvio** é a saída controlada dele:

```bash
editora revisar --sobre "Vela"     # acha onde ela vive e propõe o alvo
editora revisar --unidade cap-07   # o ciclo daquele capítulo
editora revisar --cancelar         # desiste e restaura tudo
```

O motor guarda onde você estava **antes** de reabrir qualquer coisa. Terminada a
revisão, ele fecha o desvio e te devolve:

```
✓ desvio em "rascunho · cap-07" fechado.
  ↩ voltando para onde você estava: 4.4 Passe de Voz
```

Reabrir uma etapa de capítulo arrasta as seguintes daquele capítulo — texto que mudou
precisa de continuidade refeita. `--so-esta` desliga isso.

### Impacto: o que a mudança quebrou

Em software, renomear é seguro porque o compilador acha todas as referências. **Prosa
não tem compilador**: você repensa a protagonista no mês 4 e os capítulos do mês 1
continuam marcados como prontos, mesmo contradizendo a ficha nova.

```bash
editora impacto --termo "Vela"
```

```
Cap 03   4 ocorrências   [x] concluído   ← reconferir
Cap 09   1 ocorrência    [x] concluído   ← reconferir
Cap 18   7 ocorrências   [ ] pendente    (sem risco)
```

Ele **mostra e não aplica**. Depois de meses, reabrir dez capítulos sem perguntar
seria hostil.

### Retomada

```bash
editora resumo
```

Onde você parou, o que está esperando sua decisão, o que decidiu desde a última
sessão, e as perguntas que ficaram em aberto — inclusive as que a sabatina adiou com
prazo. A skill abre por aqui, sem você pedir.

---

## Os sensores

É a parte que não existia no original e é o que dá alavancagem ao método.

No AI-DLC, `linter` e `type-check` reprovam um estágio antes de o humano perder tempo
revisando. Aqui, dez verificações determinísticas fazem o mesmo com **prosa em
português brasileiro** — calibradas no gosto de um autor específico, não em conselho
genérico de escrita.

| sensor | mede | severidade |
|---|---|---|
| `translates` | decalque do inglês: possessivo redundante, verbo-filtro, muleta traduzida | consultivo |
| `aforismo` | o contraste esperto que vira slogan; parágrafo-sentença em série | consultivo |
| `registro-baixo` | oralidade e coloquialismo **na narração** (diálogo é livre) | **bloqueante** |
| `densidade` | frase longa, subordinação empilhada, efeito sobre efeito | consultivo |
| `abertura-cena` | a cena abre em paisagem em vez de gente e atrito | **bloqueante** |
| `deriva-pov` | o narrador entra na cabeça de quem não é o POV declarado | **bloqueante** |
| `repeticao` | eco lexical próximo; tique de abertura de parágrafo | consultivo |
| `secoes-obrigatorias` | forma do artefato de planejamento | bloqueante |
| `cobertura-upstream` | o artefato produzido referencia o que declarou consumir | bloqueante |
| `metrica-capitulo` | palavras, frases, proporção de diálogo, maior frase | consultivo |

Os quatro primeiros codificam os **quatro venenos** que o autor rejeitou em iterações
seguidas; `abertura-cena` e `densidade` codificam as Leis nº 1 e nº 2 do `metodo-martin`.

Eles rodam sobre o **capítulo do manuscrito**, não sobre o relatório — a separação
está em `SENSORES_DE_PROSA`, em `editora-sensor.ts`.

```bash
# em qualquer arquivo, mesmo fora de uma obra
bun core/tools/editora-sensor.ts rodar --id densidade --arquivo "cap-07.md"

# todos os que o estágio declara
bun core/tools/editora-sensor.ts estagio --estagio rascunho --unidade cap-07
```

### Calibração é obrigação, não luxo

Sensor com falso positivo demais é pior que sensor nenhum: o autor aprende a ignorar
o relatório. Dois exemplos já calibrados neste repo:

- `a gente da Igreja` é substantivo legítimo ("o povo da Igreja"), não o pronome
  coloquial. O sensor distingue os dois.
- `que…, que…, que…` em frase curta é anáfora deliberada — e o manuscrito de *Cinzas
  do Pacífico* usa bem. Só acusa quando o empilhamento vem com frase comprida.

Falso positivo novo vira calibração pelo ritual de aprendizado, e fica registrado em
`memoria/oficina.md`.

---

## Os escopos

Nem todo texto precisa dos 29 estágios.

| escopo | profundidade | para |
|---|---|---|
| `romance` | Padrão | romance standalone em 27 capítulos — o padrão |
| `serie` | Completa | volume de série: arco de volume e arco de série convivem |
| `novela` | Padrão | narrativa média; corta mercado, lugares e revisão por ato |
| `conto` | Mínima | 9 estágios, só o caminho crítico |
| `retomada` | Completa | **brownfield**: manuscrito já começado, bíblia por engenharia reversa |
| `oficina` | Mínima | cena solta, para treinar |

---

## O motor

TypeScript sobre [bun](https://bun.sh). Sem dependências de runtime.

| arquivo | papel |
|---|---|
| `editora-lib.ts` | parser de subconjunto YAML, tipos do grafo, resolução de caminhos |
| `editora-stage-schema.ts` | as 16 chaves autorais + invariantes de grafo |
| `editora-graph.ts` | compila os `.md` em `stage-graph.json` + `scope-grid.json`, com `--checar` de drift |
| `editora-state.ts` | máquina de estados, transições válidas e **guardas de conclusão** |
| `editora-orchestrate.ts` | a diretiva de estágio e as transições de ciclo de vida |
| `editora-sensores.ts` | os dez analisadores de texto |
| `editora-sensor.ts` | executor: separa alvo de prosa de alvo de documento |
| `editora-audit.ts` | trilha de auditoria em markdown, legível no Obsidian |
| `editora-harness.ts` | gera os subagentes do Claude Code a partir de `core/agents/` |
| `editora-doctor.ts` | diagnóstico do método inteiro |

### As guardas

O que impede o método de "avançar no papel":

- **Guarda de artefato** — o estágio não fecha se um artefato declarado em `produz`
  não existe no disco.
- **Guarda de manuscrito** — o estágio com `exige_manuscrito: true` não fecha se o
  capítulo não tem no mínimo 200 palavras de corpo, descontados frontmatter e andaime.
- **Sensor bloqueante** — falhou, o portão não abre.
- **Parada dura no portão** — o condutor encerra o turno e espera o autor. Não existe
  auto-aprovar. É o que impede a IA de escrever 27 capítulos sozinha.

---

## Estrutura

```
core/
├── agents/                       13 personas
├── editora-common/
│   ├── conductor.md              o laço que o agente executa
│   ├── protocols/                stage-protocol.md, stage-definition.md
│   └── stages/<fase>/*.md        os 29 estágios
├── knowledge/editora-shared/    princípios
├── memory/                       modelos: autor, projeto, oficina
├── scopes/                       6 escopos
├── sensors/                      10 manifestos
└── tools/                        o motor
harness/claude/                   skills e agentes do Claude Code (gerados)
scripts/instalar.sh               liga tudo em ~/LIVROS/.claude
tests/                            125 testes
```

Numa obra, o método grava em `<vault>/.editora/`:

```
.editora/
├── estado.json          fonte de verdade
├── estado.md            espelho legível no Obsidian
├── registro/<fase>/<estagio>/   os artefatos
├── auditoria/           trilha de eventos em markdown
├── memoria/             autor.md, projeto.md, oficina.md
└── conhecimento/
```

O manuscrito continua onde sempre esteve: `05 — Manuscrito/Ato N/Cap NN.md`, no
padrão do `_Template Livro`. **O molde nunca é escrito** — todo livro nasce de uma cópia.

---

## O que o método aprende

O ritual de aprendizado (§13 do protocolo) roda antes de todo portão. O que o autor
mantiver tem quatro destinos:

| a regra vale para… | destino |
|---|---|
| só este livro | `memoria/projeto.md` |
| todos os livros dele | `memoria/autor.md` |
| o modo de trabalhar | `memoria/oficina.md` |
| é verificável por máquina | **um sensor novo** |

O quarto é o que importa: um tique que o autor caçou à mão em 27 capítulos vira uma
verificação que nunca mais deixa passar.

---

## Desenvolvimento

```bash
bun test                 # 125 testes
bun run compilar         # regenera stage-graph.json e scope-grid.json
bun run checar           # falha se o compilado driftou do frontmatter
bun run harness          # regenera os subagentes do Claude Code
bun run doctor           # valida o método inteiro
```

Depois de mexer em qualquer estágio, agente ou sensor: `bun run compilar && bun run harness && bun run doctor`.

## Relação com as skills existentes

Este método **não substitui** `metodo-martin` nem as skills `prosa-*`. Ele as invoca:

- `metodo-martin` — construção de cena — é carregada em `outline-cena` e `rascunho`
- `prosa-a-luz` / `prosa-cinzas` / `prosa-primeira-incursao` / `prosa-projectx` — a voz
  de cada livro — é carregada em `rascunho`, `passe-linha` e `passe-voz`

O instalador preserva todas elas.

## Crédito

Metodologia, vocabulário de estágios, protocolo de portões, sistema de escopos e o
ritual de aprendizado são portados de **awslabs/aidlc-workflows@v2** (Apache-2.0).
A transposição para escrita, os 13 agentes, os 29 estágios e os sensores de prosa em
português são deste repositório.

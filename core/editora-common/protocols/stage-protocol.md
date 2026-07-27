# Protocolo de Estágio

Contrato de comportamento de **todo** estágio do Editora. Porte de
`core/aidlc-common/protocols/stage-protocol.md` (awslabs/aidlc-workflows@v2).

Onde este documento e um arquivo de estágio divergirem, **este documento vence**.
Onde este documento e o motor (`editora-orchestrate.ts`) divergirem, o motor vence:
ele é dono de toda transição de ciclo de vida.

## Lista de conformidade (o que mais se erra)

1. Encerrar o turno no portão de aprovação. Sem exceção.
2. Rodar o ritual de aprendizado (§13) **antes** de abrir o portão, como turno próprio.
3. Reportar todo desfecho pelo `editora-orchestrate.ts`, nunca escrevendo estado à mão.
4. Carregar a persona do agente líder antes do primeiro passo.
5. Gravar os artefatos de `produz` no diretório de registro — a guarda recusa fechar sem eles.
6. Nomear o próximo estágio a partir do campo `proximo_estagio_nome` da diretiva, nunca de memória.

---

## 1. Portões de Aprovação

Todo estágio exige aprovação explícita do autor antes de seguir, **exceto** os três
da fase de inicialização (`deteccao-projeto`, `scaffold-vault`, `init-estado`), que
são mecânica e não decisão criativa.

### REGRA DE PARADA DURA (inegociável)

Ao apresentar um portão, você **encerra o turno imediatamente** e espera a resposta
do autor. Não chame nenhuma ferramenta até ele ter respondido em mensagem nova.

Um portão é ponto de controle humano. Não pode ser inferido, auto-aprovado nem pulado.

Num método de escrita isto é ainda mais crítico do que em software: é o que impede
a IA de escrever 27 capítulos sozinha e entregar ao autor um livro que não é dele.

### REGRA DE NÃO-EMERGÊNCIA

Estágios de Construção e Revisão usam **estritamente 2 opções**. Só Ideação e
Concepção podem incluir uma terceira opção — a de adicionar um estágio antes pulado.
Qualquer outro menu é violação de protocolo.

### Portão padrão

```question
prompt: "[Nome do Estágio] concluído. Como você quer seguir?"
header: Aprovação
multiSelect: false
options:
  - label: Aprovar
    description: Seguir para [próximo estágio]
  - label: Pedir mudanças
    description: Dar retorno para revisão
```

**Nomear o próximo estágio:** renderize `[próximo estágio]` literalmente do campo
`proximo_estagio_nome` da diretiva. Quando for `null`, escreva `Concluir o fluxo`.
NUNCA deduza o nome — só o motor sabe, porque depende do escopo e do estado.

### Portão com terceira opção (só Ideação e Concepção)

```question
options:
  - label: Aprovar
  - label: Pedir mudanças
  - label: Incluir [Estágio Pulado]
    description: Rodar [estágio], que o escopo tinha pulado
```

### Escape do laço de revisão

Depois de **3 ciclos** de "Pedir mudanças" no mesmo estágio, todo portão seguinte
daquele estágio ganha uma terceira opção:

```question
options:
  - label: Aprovar
  - label: Pedir mudanças
  - label: Aceitar como está
    description: Arquivar a versão atual e seguir
```

Após o **2º** ciclo (antes do escape existir), inclua no portão a nota: *"Após mais
uma revisão, a opção 'Aceitar como está' fica disponível."*

Escolhido "Aceitar como está": reporte com `--resultado aceito-como-esta`. O motor
registra `ACEITO_COMO_ESTA` na auditoria e fecha o estágio.

Isto reconhece uma verdade da escrita: às vezes o autor trava num capítulo e precisa
seguir. Travar o método num portão é pior que aceitar um capítulo imperfeito.

---

## 2. Mensagens de Conclusão

Todo estágio termina nesta estrutura de 5 partes.

### Parte 0 — Entrar no portão

1. Renderize as Partes 1 e 2 (anúncio, resumo).
2. Rode o ritual de aprendizado (§13) **como turno próprio** — encerre o turno na
   pergunta dele. A resposta precisa estar registrada **antes** de o portão abrir.
3. `bun {{METODO}}/core/tools/editora-orchestrate.ts reportar --estagio <slug> --resultado aguardando-aprovacao`
   O motor roda a guarda de artefatos; se ela reprovar, o portão **não abre** e você
   volta a escrever o que falta.
4. Apresente a Parte 3 (a pergunta do portão) e encerre o turno.
5. Conforme a resposta:
   - **Aprovar** → `--resultado aprovado --entrada "<escolha literal>"`. O motor fecha
     o estágio e avança sozinho. Não existe chamada de `avancar` separada.
   - **Pedir mudanças** → `--resultado rejeitado --entrada "<retorno>"`. Revise já, se
     o retorno disser o que mudar; só pergunte antes se estiver genuinamente ambíguo, e
     pergunte de forma estruturada com opções tiradas do artefato. Depois de revisar,
     `--resultado revisado` reabre o portão. Nunca deixe o estágio parado em revisão.
     Se o estágio tem revisor e a revisão mexeu num artefato de `produz`, refaça o §12a.
   - **Aceitar como está** → `--resultado aceito-como-esta`.

### Parte 1 — Anúncio

```markdown
# [emoji] [Nome do Estágio] concluído
```

### Parte 2 — Resumo

Bullets factuais do que foi produzido. **Sem** instrução de fluxo ("por favor revise",
"me avise", "antes de seguirmos"). Inclua uma tabela curta de 5 a 10 linhas com os
artefatos e o miolo de cada um, para o autor decidir sem abrir arquivo:

```
| Artefato | Conteúdo |
|----------|----------|
| pilares-criativos.md | 4 pilares, cada um com o custo declarado |
| memoria.md | 3 interpretações, 1 desvio |
```

Na primeira conclusão da sessão, informe também: **Profundidade** e o lembrete de que
ela pode ser trocada em qualquer portão.

### Parte 3 — Revisão + Aprovação

```markdown
**Revisar em:** `<caminho do dir_registro da diretiva>`
```

Seguido da pergunta estruturada do §1.

### Parte 4 — Progresso (depois do "Aprovar")

Reproduza literalmente a linha que o motor imprimiu:

```
Progresso: [X]/[S] estágios no escopo ([N] compilados) | [n]/[t] [FASE]. Próximo: [Nome]
```

Nunca calcule o progresso por conta própria.

---

## 3. Formato de Pergunta

**O arquivo de perguntas é a fonte de verdade.** Independentemente da quantidade:

1. Escreva `<estagio>-perguntas.md` no diretório de registro com todas as perguntas.
2. Ofereça ao autor os três modos, como pergunta estruturada:
   - **Me guie** — uma pergunta por vez, em conversa
   - **Editar arquivo** — ele abre o `.md` e responde por escrito
   - **Conversar** — ele responde em texto corrido e você distribui
3. Colete as respostas de volta **para dentro do arquivo**. Resposta que só existe no
   chat não sobrevive à próxima sessão.

### Análise das respostas (obrigatória)

Antes de gerar qualquer artefato:

- **Ambiguidade** — resposta que comporta duas leituras materialmente diferentes volta
  como pergunta, não vira suposição.
- **Contradição** — cruze todas as respostas entre si. Os conflitos típicos deste
  método: extensão-alvo × número de POVs; ambição de série × premissa que se esgota;
  pilar criativo × escolha de estrutura; registro declarado × exemplo dado.
- **Silêncio** — pergunta sem resposta é pergunta em aberto registrada, nunca resposta
  inventada.

### Prevenção de excesso de confiança

Quando o autor der uma resposta vaga e você preencher a lacuna, **marque a lacuna no
artefato** com a interpretação que você adotou. Ele precisa poder discordar depois.

---

## 4. Rastreamento de Estado

Estado vive em `<obra>/.editora/estado.json`, espelhado em `estado.md`.

**Você nunca escreve nesses arquivos.** Toda mudança passa por
`editora-orchestrate.ts` ou `editora-state.ts`. As marcas do espelho:

| marca | estado |
|---|---|
| `[ ]` | pendente |
| `[-]` | em andamento |
| `[?]` | aguardando aprovação |
| `[R]` | revisando |
| `[x]` | concluído |
| `[S]` | pulado pelo escopo |

### Auditoria

Cada evento vira linha em `<obra>/.editora/auditoria/<host>-<data>.md`, em markdown
para o autor ler no Obsidian. Eventos longos (retorno de rejeição, veredito de revisor)
viram bloco com título próprio.

---

## 5. Carregamento de Persona

Ordem, sempre:

1. `<obra>/.editora/memoria/{autor,oficina,projeto}.md` — o que já é regra
2. `<metodo>/core/knowledge/editora-shared/` — princípios do método
3. `<metodo>/core/knowledge/<agente>/` — metodologia do agente
4. `<obra>/.editora/conhecimento/` — conhecimento próprio da obra
5. Os artefatos nomeados no `consome` da diretiva

Para estágios que tocam prosa, some a isto: **um trecho de manuscrito aprovado do
livro**, lido antes de qualquer regra escrita, mais `metodo-martin` e a skill de voz
do livro (`prosa-*`). Regra deduzida de teoria produz voz genérica.

---

## 6. Modos de Colaboração

O campo `modo` declara a topologia de comunicação do estágio.

- **`inline`** — o condutor assume a voz do líder. Nenhum despacho.
- **`subagente`** — cubo e raios: o líder redige; cada agente de `agentes_apoio` é
  despachado como raio **cego aos demais**; o líder integra. Cada apoio escreve
  `contributions/<agente>.md`; o líder é o único que edita os artefatos de `produz`.
- **`pipeline`** — corrente: cada elo vê todo o trabalho anterior e avança o mesmo
  produto. O último elo entrega os artefatos completos.
- **`mesa`** — malha: uma sala, conversa cruzada, **dissenso registrado**. Objeção de
  julgamento sobe ao autor no meio do estágio, não no fim.

Em `mesa` e em `subagente` com apoio, o motor recusa a aprovação enquanto faltar o
arquivo de contribuição de um colaborador declarado — é a evidência de que o conjunto
realmente trabalhou.

---

## 7. Recuperação de Erro

Falha de subagente: registre `ERRO` na auditoria com o que falhou, e apresente ao
autor **tentar de novo / pular o apoio / abortar o estágio**. Nunca continue fingindo
que a contribuição existiu.

---

## 8. Profundidade

Três níveis, vindos do escopo: `Mínima`, `Padrão`, `Completa`. Controlam o detalhe dos
artefatos, não quais estágios rodam (isso é o escopo). O autor pode trocar a
profundidade em qualquer portão.

---

## 9. Terminologia

| termo | significado |
|---|---|
| **obra** | o livro e seu vault |
| **estágio** | uma etapa do método, com dono e portão |
| **artefato** | documento nomeado em `produz`, gravado no registro |
| **unidade** | um capítulo, quando a fase de construção percorre em laço |
| **registro** | `<obra>/.editora/registro/` — onde os artefatos vivem |
| **manuscrito** | `<obra>/05 — Manuscrito/` — onde a prosa vive |
| **portão** | o ponto em que o autor aprova ou devolve |
| **sensor** | verificação determinística sobre o texto produzido |

---

## 10. Validação de Conteúdo

- Nunca grave artefato fora do `dir_registro` da diretiva, com uma exceção: os estágios
  com `exige_manuscrito: true` gravam prosa em `05 — Manuscrito/`.
- Espelhar no vault (`01 — Bíblia do Mundo/`, `02 — Personagens/`) é bem-vindo e está
  descrito nos estágios — mas o registro continua sendo a fonte para o motor.
- **Nunca edite arquivo de estágio, de agente ou de sensor durante uma execução.**
  O método é imutável em tempo de execução; ele só muda pelo §13.

---

## 11. Retorno de Subagente

```markdown
## Resumo do subagente: [Nome do Estágio]

### Produzido
### Decisões-chave
### Problemas e ressalvas
### Próximos passos
```

Sem prosa de cortesia. O retorno é dado, não mensagem.

---

## 12. Fronteira de Fase

Ao fechar o último estágio de uma fase, confirme antes de avançar: todo artefato
declarado existe, e nenhum ficou vazio. Fronteira de fase é onde o custo de voltar
começa a subir de verdade.

## 12a. Invocação do Revisor

Quando o estágio declara `revisor`, antes de abrir o portão:

1. Despache o revisor com o artefato e o que ele declara consumir. Registre
   `REVISOR_DESPACHADO`.
2. O revisor emite **PRONTO** ou **NÃO-PRONTO**, com justificativa item a item, numa
   seção `## Revisão` do artefato. Registre `REVISOR_VEREDITO`.
3. **NÃO-PRONTO** devolve ao líder **sem consumir ciclo de revisão do autor**. Repita
   até `revisor_max_iteracoes`.
4. Esgotado o orçamento, o artefato sobe ao portão **com o veredito anexado**, e o
   autor decide.

O revisor nunca reescreve o artefato. Ele aponta; quem conserta é o líder.

O laço de revisor não é um `modo` — ele funciona sobre qualquer topologia.

---

## 13. Ritual de Aprendizado

O que transforma este método de checklist em algo que aprende.

### Durante o estágio

Mantenha `memoria.md` no diretório de registro, com quatro títulos:

- **Interpretações** — escolhas feitas onde a prosa do estágio era ambígua
- **Desvios** — onde você se afastou de propósito, e por quê
- **Trocas** — alternativas consideradas e a razão da escolha
- **Perguntas em aberto** — o que confirmar antes da próxima rodada

Formato: `- 2026-07-26T14:02:11Z — <resumo>; <contexto>`

### Antes do portão (turno próprio, obrigatório)

Leia o `memoria.md` e leve os candidatos ao autor como **pergunta estruturada**. Mesmo
sem candidato nenhum, faça a pergunta obrigatória:

> "Algo a guardar para a próxima vez?"

**Nunca infira "nada a acrescentar".** Só depois de o autor responder o portão pode abrir.

### Roteiro de destino

Para cada regra que o autor mantiver:

| a regra vale para… | destino |
|---|---|
| só este livro | linha em `<obra>/.editora/memoria/projeto.md` |
| todos os livros deste autor | linha em `<obra>/.editora/memoria/autor.md` |
| o modo de trabalhar, não o conteúdo | linha em `<obra>/.editora/memoria/oficina.md` |
| é verificável por máquina | manifesto novo em `<metodo>/core/sensors/` + analisador em `editora-sensores.ts`, e o id entra no `sensores:` do estágio |

O quarto caso é o mais valioso: um tique que o autor caçou à mão em 27 capítulos vira
uma regex que nunca mais deixa passar.

### Por que arquivos de estágio são imutáveis

O ritual escreve na **obra** (memórias) e no **método** (sensores novos) — nunca no
arquivo do estágio. Assim o estágio continua sendo o mesmo contrato para todos os
livros, e o que é específico fica onde é específico.

### Reaproveitamento de artefato (voltar atrás)

Quando o autor manda voltar a um estágio já concluído, o artefato antigo é preservado
na auditoria antes de ser reescrito. Nada é perdido em silêncio.

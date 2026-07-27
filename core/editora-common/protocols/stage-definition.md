# Formato de Definição de Estágio

Contrato autoritativo do frontmatter de todo arquivo em
`core/editora-common/stages/<fase>/<slug>.md`.

O schema (`editora-stage-schema.ts`), o parser (`lerFrontmatter` em
`editora-lib.ts`) e os arquivos de estágio implementam contra este documento.
Onde este documento e o schema divergirem, **o schema é o que o motor obedece** —
e `editora-doctor.ts` acusa a divergência.

## Layout

```yaml
---
# frontmatter YAML — 16 campos autorais
---

# [Título do Estágio]

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de
pergunta e mensagens de conclusão.

## Passos      # obrigatório

## Sensores    # o que as verificações medem neste estágio

## Aprender    # o ritual do §13
```

O compilador (`editora-graph.ts compilar`) transforma o YAML em
`core/tools/data/stage-graph.json`. O motor lê o JSON, nunca os `.md`. A checagem
`compilar --checar` falha se os dois divergirem.

---

## Campos autorais

| campo | tipo | obrigatório | restrição |
|---|---|---|---|
| `slug` | string | sim | kebab-case; igual ao nome do arquivo |
| `fase` | string | sim | `inicializacao` \| `ideacao` \| `concepcao` \| `construcao` \| `revisao`; igual ao nome da pasta |
| `execucao` | string | sim | `SEMPRE` \| `CONDICIONAL` |
| `condicao` | string | sim | texto livre: a razão de ser SEMPRE, ou a condição de ramificação |
| `agente_lider` | string | sim | slug validado contra `core/agents/*.md` |
| `agentes_apoio` | string[] | sim | pode ser vazio; nenhum pode repetir o líder |
| `modo` | string | sim | `inline` \| `subagente` \| `pipeline` \| `mesa`. `pipeline` e `mesa` exigem apoio não vazio |
| `para_cada` | string | não | nome de artefato; o estágio roda uma vez por instância dele |
| `exige_manuscrito` | booleano | não | `true` marca estágio que precisa gravar prosa em `05 — Manuscrito/`. A guarda de conclusão recusa fechá-lo sem no mínimo 200 palavras de corpo. Só vale em `construcao` e `revisao` |
| `produz` | string[] | sim | pode ser vazio; nomes kebab-case; um artefato tem **um dono só** |
| `consome` | objeto[] | sim | pode ser vazio; cada entrada `{artefato, obrigatorio, condicionado_a?}` |
| `consome[].artefato` | string | sim | kebab-case; precisa ser produzido por algum estágio |
| `consome[].obrigatorio` | booleano | sim | escopado ao plano ativo — ver abaixo |
| `consome[].condicionado_a` | string | não | `retomada` \| `novo` |
| `requer_estagio` | string[] | sim | pode ser vazio; slugs conhecidos. Duas funções: dependência de dado **e** aresta de ordem de apresentação |
| `escopos` | string[] | sim fora da inicialização | nomear um escopo marca este estágio como EXECUTA nele; ausência marca PULA |
| `sensores` | string[] | sim | ids existentes em `core/sensors/` |
| `revisor` | string | não | slug de agente ≠ líder |
| `revisor_max_iteracoes` | número | sim se houver revisor | 1 a 5 |
| `entradas` | string | sim | prosa humana |
| `saidas` | string | sim | prosa humana. **Não fixe a raiz do registro** — o motor resolve o caminho a partir de `produz` na obra ativa |

### Sobre `consome[].obrigatorio`

`true` significa: *"se o estágio produtor rodar, este consumo precisa estar
satisfeito"*. Não é uma afirmação global de que o artefato sempre existe.

Um escopo que pula o produtor torna o consumo inócuo — o corpo do estágio degrada
com elegância, e o sensor `cobertura-upstream` só cobra os artefatos que existem
no disco. É por isso que `convencoes-prosa` pode consumir `pilares-criativos` e
mesmo assim rodar no escopo `oficina`, que pula os pilares.

---

## Campos computados (não autorados)

| campo | derivação |
|---|---|
| `ordem` | `<prefixo-fase>.<sequência>`. Prefixos: inicializacao=0, ideacao=1, concepcao=2, construcao=3, revisao=4. A sequência é a ordenação topológica de `requer_estagio` restrita à fase, com desempate alfabético |
| `nome` | o H1 do arquivo, ou o slug em capitulares |

Como o desempate é alfabético, **duas etapas sem dependência entre si podem sair em
ordem contraintuitiva**. Quando a ordem importa editorialmente, declare a aresta em
`requer_estagio` mesmo sem dependência de dado. Foi exatamente o que aconteceu com
`revisao-estrutural-ato`, que sem aresta explícita caía depois da leitura beta.

---

## Invariantes que o compilador exige

1. Slug único e igual ao nome do arquivo
2. Um artefato produzido por um único estágio
3. Nenhum ciclo em `requer_estagio`
4. Nenhum estágio consumindo artefato que só nasce depois dele na ordem topológica
5. Todo agente, escopo e sensor referenciado existe
6. Todo estágio fora da inicialização nomeia ao menos um escopo — senão nunca executa
7. Corpo com `## Passos` e com a linha MANDATÓRIO

---

## Exemplo mínimo

```yaml
---
slug: lugares
fase: concepcao
execucao: CONDICIONAL
condicao: Roda quando o livro tem cenários recorrentes. Pula em novela, conto e oficina.
agente_lider: editora-mundo-agent
agentes_apoio: []
modo: inline
produz:
  - lugares-do-livro
consome:
  - artefato: estado-do-mundo
    obrigatorio: true
requer_estagio:
  - biblia-mundo
escopos:
  - romance
  - serie
  - retomada
sensores:
  - secoes-obrigatorias
  - cobertura-upstream
entradas: estado-do-mundo
saidas: lugares-do-livro.md
---
```

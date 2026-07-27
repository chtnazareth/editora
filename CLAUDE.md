# CLAUDE.md

Instruções para trabalhar **neste repositório** — o método em si.

Para *conduzir* uma obra usando o método, não é aqui: leia
`core/editora-common/conductor.md` e use a skill `/editora`.

## O que é

Porte de `awslabs/aidlc-workflows@v2` do domínio de software para o de manuscrito.
TypeScript sobre bun, sem dependência de runtime. Tudo em português.

## Regra número um

**Nunca edite `core/tools/data/*.json` à mão.** São compilados. A fonte é o
frontmatter dos `.md`. Depois de qualquer mudança em estágio, agente ou sensor:

```bash
bun run compilar && bun run harness && bun run doctor && bun test
```

`bun run checar` falha se o compilado driftou — é a guarda de CI.

## Onde mexer para cada coisa

| quero… | mexo em |
|---|---|
| mudar um passo de um estágio | `core/editora-common/stages/<fase>/<slug>.md` |
| mudar quem lidera / o que produz | o frontmatter do mesmo arquivo, depois `bun run compilar` |
| mudar uma persona | `core/agents/<slug>.md`, depois `bun run harness` |
| adicionar um sensor | analisador em `core/tools/editora-sensores.ts` **e** manifesto em `core/sensors/` — o doctor exige os dois |
| mudar as regras de portão | `core/editora-common/protocols/stage-protocol.md` |
| mudar o que um escopo executa | o campo `escopos:` de cada estágio (não o arquivo do escopo) |

O campo `escopos:` mora no **estágio**, não no escopo. O arquivo em `core/scopes/`
é descritivo; a matriz de pertencimento é a transposta que o compilador monta.

## Armadilhas conhecidas

### `\b` não funciona com acento

`\b` em JavaScript é fronteira **ASCII**. `/\bvocê\b/u` **nunca casa** — o `ê` final
não é caractere de palavra ASCII. Em qualquer padrão cuja ponta tenha acento, use:

```ts
/(?<![\p{L}])você(?![\p{L}])/giu
```

Já custou dois testes vermelhos. Vale para `né`, `tá`, `manhã`, `salão`, `ruínas`.

### Os sensores medem prosa, não arquivo

Antes de qualquer análise, passe o texto por `extrairProsa()`: ela mascara frontmatter,
títulos, blocos de código, citações e o andaime do template (`**LUGAR** — …`),
**preservando a contagem de linhas** para que o número reportado seja o do arquivo real.

Sem isso o sensor mede o esqueleto. Foi o primeiro defeito encontrado no teste contra
o manuscrito de verdade.

### Ordem de estágio tem desempate alfabético

Duas etapas sem dependência declarada saem em ordem alfabética, que pode ser
contraintuitiva. Quando a ordem importa editorialmente, declare a aresta em
`requer_estagio` mesmo sem dependência de dado — foi o que aconteceu com
`revisao-estrutural-ato`, que sem aresta caía depois da leitura beta.

### Calibrar antes de apertar

Sensor novo é validado contra prosa **aprovada** do autor antes de virar bloqueante.
A régua é `~/LIVROS/cinzas-do-pacifico/manuscrito/ato-1/cap-01/cena-01.md`. Se o
sensor reprova a régua, o sensor está errado — não a régua.

## Estilo

- Português em tudo: código, identificadores, mensagens, documentação.
- Comentário explica **por quê**, não o quê. Prefira o comentário que registra a
  decisão ou a armadilha; o resto o código já diz.
- Sem dependência externa no motor. O parser de YAML é próprio de propósito.
- Mensagem de erro diz o que fazer, não só o que houve.

## Testes

`bun test` — 101 testes em 4 arquivos. Todo sensor tem caso positivo **e** negativo;
o negativo é o que impede o falso positivo de voltar.

Ao mexer num sensor, o teste de calibração é obrigatório: o caso que ele **não** pode
acusar.

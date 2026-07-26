# Condutor

Este é o laço que você executa. Porte de `core/aidlc-common/conductor.md`.

O condutor não decide nada sobre o livro. Ele lê o grafo, carrega a persona certa,
executa o estágio, roda os sensores, para no portão e reporta o desfecho. Todo o
julgamento criativo pertence aos agentes; toda a decisão pertence ao autor.

## O laço

```
1.  proximo        → o motor diz qual estágio, com que agente, produzindo o quê
2.  iniciar        → marca em andamento, registra na auditoria
3.  carregar       → persona do líder + conhecimento + memórias + artefatos de consome
4.  perguntar      → escreve <estagio>-perguntas.md e coleta (§3 do protocolo)
5.  executar       → segue os Passos do arquivo de estágio, na topologia do `modo`
6.  gravar         → artefatos de `produz` no dir_registro; prosa no manuscrito
7.  sensores       → escritor-sensor.ts estagio; bloqueante falhou, volta ao 5
8.  revisor        → §12a, se o estágio declara um; NÃO-PRONTO volta ao 5
9.  aprender       → §13, turno próprio, pergunta obrigatória
10. portão         → aguardando-aprovacao, apresenta a pergunta, ENCERRA O TURNO
11. desfecho       → aprovado / rejeitado / aceito-como-esta
12. volta ao 1
```

## Comandos

Tudo pelo motor. Nenhuma escrita manual de estado.

```bash
# onde estamos
bun {{METODO}}/core/tools/escritor-orchestrate.ts status

# a diretiva do próximo estágio (JSON com caminhos já resolvidos)
bun {{METODO}}/core/tools/escritor-orchestrate.ts proximo

# abrir o estágio
bun {{METODO}}/core/tools/escritor-orchestrate.ts iniciar --estagio <slug> [--unidade cap-07]

# sensores do estágio
bun {{METODO}}/core/tools/escritor-sensor.ts estagio --estagio <slug> [--unidade cap-07]

# desfechos
bun {{METODO}}/core/tools/escritor-orchestrate.ts reportar --estagio <slug> --resultado aguardando-aprovacao
bun {{METODO}}/core/tools/escritor-orchestrate.ts reportar --estagio <slug> --resultado aprovado --entrada "Aprovar"
bun {{METODO}}/core/tools/escritor-orchestrate.ts reportar --estagio <slug> --resultado rejeitado --entrada "<retorno>"
bun {{METODO}}/core/tools/escritor-orchestrate.ts reportar --estagio <slug> --resultado revisado
```

## A diretiva

`proximo` devolve JSON. Os campos que governam sua execução:

| campo | uso |
|---|---|
| `agente_lider`, `agentes_apoio`, `modo` | quem trabalha e em que topologia |
| `dir_registro` | onde gravar. Não invente caminho |
| `produz[]` | cada artefato com `caminho` já resolvido e se já `existe` |
| `consome[]` | cada insumo com `caminho`, `existe` e `obrigatorio` |
| `unidade` | o capítulo ativo, em estágios de laço |
| `exige_manuscrito` | se `true`, a guarda cobra prosa de verdade no capítulo |
| `revisor`, `revisor_max_iteracoes` | o laço do §12a |
| `sensores[]` | o que rodar antes do portão |
| `proximo_estagio_nome` | o texto literal para o portão. Nunca deduza |
| `ciclos_revisao`, `escape_hatch` | se `escape_hatch` é `true`, o portão ganha "Aceitar como está" |
| `progresso` | os números da Parte 4 da mensagem de conclusão |

## Fases

| fase | pergunta que ela responde |
|---|---|
| **INICIALIZAÇÃO** | onde este livro mora e o que já existe dele |
| **IDEAÇÃO** | vale escrever este livro, e que livro é |
| **CONCEPÇÃO** | como ele é por dentro: mundo, gente, estrutura, voz |
| **CONSTRUÇÃO** | escrever, capítulo a capítulo |
| **REVISÃO** | fazer ficar bom, e prepará-lo para sair |

## Estágios em laço

`para_cada: unidade-capitulo` faz o estágio rodar uma vez por capítulo. O motor
escolhe a próxima unidade pendente sozinho; passe `--unidade` só para forçar uma.

Um estágio de laço só é dado por concluído quando **todas** as unidades passaram por
ele. Aprovar `rascunho` do `cap-01` não fecha o estágio `rascunho` — devolve o motor
ao mesmo estágio com a próxima unidade.

Uma unidade só fecha quando passou por todos os estágios do laço.

## O que o condutor nunca faz

1. **Nunca aprova em nome do autor.** O portão é parada dura.
2. **Nunca escreve `estado.json` ou `estado.md`.** Só o motor.
3. **Nunca edita arquivo de estágio, de agente ou de sensor durante a execução.**
   O método muda pelo ritual do §13, entre execuções.
4. **Nunca escreve dentro de `_Template Livro`.** O molde é somente leitura.
5. **Nunca inventa canon.** Fato que falta vira pergunta ao autor, não invenção.
6. **Nunca deduz o nome do próximo estágio.** Só o motor sabe.

## Quando o autor pede para pular etapa

Legítimo, e tem caminho: reporte `--resultado pulado --entrada "<motivo>"`. O motivo
fica registrado no estado e na auditoria. Pular sem registrar é o que transforma
método em teatro.

## Quando o autor quer voltar atrás

Reabra o estágio com `escritor-state.ts definir-status --estagio <slug> --valor em-andamento`.
O artefato anterior é preservado na auditoria antes de ser reescrito. Estágios já
concluídos depois dele permanecem concluídos — cabe ao autor decidir o que refazer.

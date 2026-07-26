# Princípios do AI-DLC Escritor

## Princípio de projeto: mesa pequena, agentes largos

O AI-DLC nasceu do modelo de mesa — um grupo pequeno e multidisciplinar andando junto
e rápido. Os agentes espelham isso. Em vez de dezenas de especialistas estreitos (o que
recria a cadeia de repasses do modelo cascata), são **13 agentes largos**, cada um
presente em vários estágios e fases, como um editor de verdade estaria.

Cada agente carrega contexto entre estágios porque está presente o tempo todo. Isso
elimina repasse, reduz coordenação e mantém o processo ágil.

## Princípios centrais

1. **O autor decide, a IA executa.** Toda decisão material passa por um portão em que
   ele aprova, revisa ou anula. Num método de escrita isso não é cerimônia: é o que
   garante que o livro continua sendo dele.
2. **Profundidade adaptativa.** Conto não carrega bíblia do mundo. Série carrega tudo.
   O escopo ajusta o método ao livro, não o contrário.
3. **Artefato rastreável.** Todo estágio produz documento versionado no registro,
   formando o histórico completo das decisões do livro.
4. **Perícia por papel.** Cada estágio é conduzido por uma persona de domínio. O editor
   de aquisição não opina sobre vírgula; o copidesque não opina sobre arco.
5. **Sem comportamento emergente.** Menus de aprovação, mensagens de conclusão e
   transições de estado são padronizados. Improviso do condutor é violação.
6. **Pergunta antes de suposição.** Na dúvida, pergunte. Resposta incompleta gera
   estrutura ruim, e estrutura ruim custa 27 capítulos.
7. **Detecção de contradição.** Cruze todas as respostas entre si antes de gerar
   artefato.

## Os dois princípios que só existem aqui

Estes dois não vêm do AI-DLC original. Vêm do domínio.

8. **A voz é do autor, e é inegociável.** Nenhum agente reescreve para soar como si
   mesmo. Passe de linha corta o que atrapalha a voz; não a substitui. Se a versão
   proposta soa como a IA, ela está errada mesmo que esteja melhor.
9. **Nada de canon inventado.** Quando a cena precisa de um fato que a bíblia não tem,
   o estágio **para e pergunta**. Inventar ali gera dívida que aparece vinte capítulos
   depois, com aparência de coisa decidida.

## As cinco fases

| fase | propósito | resultado |
|---|---|---|
| **INICIALIZAÇÃO** | montar a casa: vault, estado, escopo | obra pronta para começar |
| **IDEAÇÃO** | validar a ideia: semente, mercado, viabilidade, escopo, pitch | conceito aprovado |
| **CONCEPÇÃO** | elaborar: pilares, voz, mundo, elenco, estrutura, plano | plano de execução detalhado |
| **CONSTRUÇÃO** | escrever: outline, pesquisa, rascunho, linha, continuidade | manuscrito completo |
| **REVISÃO** | fazer ficar bom: beta, estrutura, continuidade, voz, copidesque, submissão | livro pronto para sair |

## O sistema de escopos

Nem todo texto precisa dos 28 estágios. Os escopos (`romance`, `serie`, `novela`,
`conto`, `retomada`, `oficina`) determinam o que executa e em que profundidade.

O escopo `retomada` é o caso brownfield: manuscrito já começado, em que a Concepção
roda em **engenharia reversa** — extrai a bíblia do que já está escrito em vez de
inventá-la.

## Guardiões que aprendem sozinhos

Quando o autor corrige um comportamento, a correção vira guardião permanente. É o
ritual do §13, e ele tem quatro destinos possíveis: memória do projeto, memória do
autor, memória da oficina, ou **um sensor novo**.

O quarto destino é o que dá alavancagem ao método. Um tique que o autor caçou à mão em
27 capítulos vira uma verificação determinística que nunca mais deixa passar. É assim
que os sensores `translates`, `aforismo`, `registro-baixo` e `densidade` existem: cada
um codifica um veneno que o autor rejeitou em iterações seguidas.

## O que os sensores são, e o que não são

Sensor mede o que é medível: um padrão sintático, uma contagem, uma distância. Ele não
tem gosto e não sabe se a cena é boa.

Um sensor **bloqueante** trava o portão porque o defeito que ele mede é sempre defeito
(oralidade na narração, abertura descritiva, mente alheia em POV limitado). Um sensor
**consultivo** reporta e deixa o autor decidir, porque o padrão que ele mede às vezes é
recurso.

Sensor com falso positivo demais é pior que sensor nenhum: o autor aprende a ignorar o
relatório. Falso positivo achado é assunto do §13 — vira calibração, não hábito de
ignorar.

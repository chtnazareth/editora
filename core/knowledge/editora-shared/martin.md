# O Martin de livro inteiro

Base de conhecimento sobre **como *A Guerra dos Tronos* é construído no nível do
livro** — não da cena.

## A divisão que não pode ser confundida

| camada | onde vive | responde |
|---|---|---|
| **Frase** | skill `prosa-<livro>` do autor | como este livro soa |
| **Cena** | skill `metodo-martin` | por onde abrir, como o mundo entra, como o texto anda |
| **Livro** | **esta base de conhecimento** | como 27 capítulos viram um romance |

Esta base **não repete** o `metodo-martin`. Ela começa onde ele termina: a cena está
construída, e agora a pergunta é como as cenas se organizam em capítulos, os capítulos
em fios, e os fios num livro que não desmonta no meio.

## Os sete movimentos

Cada um está detalhado no arquivo do agente que o usa.

1. **O capítulo é um POV.** Unidade indivisível: um capítulo, uma cabeça, do começo ao
   fim. → `editora-enredo-agent/capitulo-pov-martin.md`
2. **A roda de POVs.** A rotação entre pontos de vista é o metrônomo do livro, e o
   corte é a principal ferramenta de tensão. → `editora-enredo-agent/`
3. **Tranças.** Vários fios avançando em paralelo, cada um com relógio próprio,
   convergindo e divergindo. → `editora-desenvolvimento-agent/estrutura-martin.md`
4. **Promessa, progresso, pagamento.** Todo fio promete cedo, mostra avanço e paga —
   mas paga diferente do prometido, de um jeito que parece inevitável em retrospecto.
   → `editora-desenvolvimento-agent/`
5. **Ninguém é vilão da própria história.** Cada POV opera dentro da lógica dele, e o
   texto leva essa lógica a sério. → `editora-personagens-agent/personagem-martin.md`
6. **O passado pressiona.** A história do mundo chega como discordância entre pessoas
   que estavam em lados diferentes. → `editora-mundo-agent/mundo-martin.md`
7. **A morte que reorganiza.** Não é choque: é a retirada de um apoio estrutural em
   que o leitor estava se apoiando. → `editora-desenvolvimento-agent/`

## O exemplar

A tradução brasileira oficial de *A Guerra dos Tronos* (Suma). O prólogo está salvo em
`A Luz/06 — Notas e Pesquisa/`. **Leia um trecho antes de aplicar qualquer coisa daqui** —
o mesmo princípio de calibração que vale para a prosa vale para a estrutura.

## O aviso que vale mais que tudo aqui

Martin escreve um livro de **mil páginas com oito POVs**. Um romance de 27 capítulos
não é isso, e imitar a escala é o erro mais fácil de cometer.

O que se toma emprestado é o **mecanismo**: POV como unidade, corte no pico, promessa
que paga torto, personagem com razão própria. O que **não** se toma emprestado é o
número de fios, a contagem de páginas nem a paciência de adiar por três volumes.

Num livro de 27 capítulos, o teto prático é **2 a 4 POVs**. Acima disso, cada fio recebe
menos de sete capítulos e nenhum tem espaço para arco.

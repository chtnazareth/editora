---
id: final-de-capitulo
tipo: heuristico
comando: bun {{METODO}}/core/tools/editora-sensor.ts rodar --id final-de-capitulo --arquivo {{ARQUIVO}}
severidade_padrao: consultivo
descricao: O capítulo fecha em virada, revelação ou ameaça — nunca em repouso
categoria: estrutura-de-cena
timeout_segundos: 5
---

# Sensor `final-de-capitulo`

Codifica o teste da última linha: a frase final do capítulo é uma **virada, revelação ou ameaça**, nunca um estado de repouso.

Acusa quando a última frase é estativa (`era`, `estava`, `havia`, `permanecia`) e não traz verbo de ação. Fechar em diálogo passa sempre — fala é virada por natureza.

## Como usar de verdade

O valor real está na série, não no capítulo isolado: leia as últimas linhas dos 27 capítulos em sequência. Se mais de três forem descrição ou reflexão, o livro perdeu o metrônomo.

## Modo de falha

Consultivo. Há capítulos que devem mesmo fechar em repouso — o último, tipicamente.

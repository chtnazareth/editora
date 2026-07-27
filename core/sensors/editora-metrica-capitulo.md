---
id: metrica-capitulo
tipo: deterministico
comando: bun {{METODO}}/core/tools/editora-sensor.ts rodar --id metrica-capitulo --arquivo {{ARQUIVO}}
severidade_padrao: consultivo
descricao: Números do capítulo — palavras, frases, proporção de diálogo, maior frase
categoria: metrica
timeout_segundos: 5
---

# Sensor `metrica-capitulo`

Não julga: mede. Palavras de prosa, parágrafos, frases, maior frase e proporção de linhas de diálogo.

Serve para três coisas: acompanhar a extensão contra a meta do escopo, detectar o capítulo que virou dois, e ver a proporção diálogo/narração derivar ao longo do livro.

## Modo de falha

Nunca bloqueia. Avisa quando o capítulo está abaixo de 60% da meta declarada.

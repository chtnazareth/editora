---
id: regra-de-tres
tipo: deterministico
comando: bun {{METODO}}/core/tools/editora-sensor.ts rodar --id regra-de-tres --arquivo {{ARQUIVO}}
severidade_padrao: consultivo
descricao: O refrão triádico — três segmentos abrindo com a mesma palavra
categoria: prosa
timeout_segundos: 5
---

# Sensor `regra-de-tres`

Detecta o refrão em três tempos: *"vinte anos de espera, vinte anos de silêncio, vinte anos de nada"*. Três segmentos separados por vírgula ou ponto e vírgula abrindo com as mesmas duas palavras.

Funciona uma vez por livro, com peso. Em série vira maneirismo — e é uma das assinaturas mais reconhecíveis de texto gerado, catalogada como *Rule of Three Overuse*.

## Modo de falha

Falha a partir de dois refrões no mesmo texto. Consultivo: o recurso é legítimo em dose única, e o portão decide.

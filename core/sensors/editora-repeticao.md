---
id: repeticao
tipo: deterministico
comando: bun {{METODO}}/core/tools/editora-sensor.ts rodar --id repeticao --arquivo {{ARQUIVO}}
severidade_padrao: consultivo
descricao: Eco lexical e tique de abertura de parágrafo
categoria: prosa
timeout_segundos: 5
---

# Sensor `repeticao`

- **eco-lexical** — palavra de 7 letras ou mais repetida a menos de 400 caracteres de distância. Nomes próprios são excluídos por heurística (capitalizados fora de início de frase): personagem repete por necessidade, não é eco.
- **tique-abertura** — 3 ou mais de 6 parágrafos consecutivos abrindo com a mesma palavra.

## Modo de falha

Falha no tique de abertura; ecos são reportados como consultivos. O ouvido do autor decide quais ecos são intencionais.

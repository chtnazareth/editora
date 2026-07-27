---
id: densidade
tipo: deterministico
comando: bun {{METODO}}/core/tools/editora-sensor.ts rodar --id densidade --arquivo {{ARQUIVO}}
severidade_padrao: consultivo
descricao: Caça o veneno nº 4 e a Lei nº 2 do metodo-martin — prosa densa demais para ler de primeira
categoria: prosa
timeout_segundos: 5
---

# Sensor `densidade`

Veneno nº 4, o oposto do nº 3: subir demais também mata. Codifica a Lei nº 2 — *frase relida é frase errada*.

- **frase-longa** — acima de 45 palavras.
- **subordinacao-empilhada** — relativa dentro de relativa, calibrado para não acusar anáfora deliberada (`que…, que…, que…` em frase curta é recurso, e o manuscrito de *Cinzas* usa bem).
- **efeito-sobre-efeito** — duas ou mais comparações no mesmo parágrafo. Um efeito por parágrafo, no máximo.

## Modo de falha

Falha com qualquer frase longa, mais de duas subordinações empilhadas, ou qualquer parágrafo sobrecarregado. Reporta também a média de palavras por frase — a régua do autor fica perto de 10.

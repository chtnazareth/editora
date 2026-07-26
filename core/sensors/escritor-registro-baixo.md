---
id: registro-baixo
tipo: deterministico
comando: bun {{METODO}}/core/tools/escritor-sensor.ts rodar --id registro-baixo --arquivo {{ARQUIVO}}
severidade_padrao: bloqueante
descricao: Caça o veneno nº 3 — oralidade e coloquialismo na narração
categoria: prosa
timeout_segundos: 5
---

# Sensor `registro-baixo`

Veneno nº 3, e o único **bloqueante** dos quatro: foi o feedback mais duro e mais repetido do autor. Roda só sobre a **narração** — diálogo pode e deve ser coloquial.

- **oralidade** — `a gente`, `você`, `pra` fora de fala.
- **coloquialismo** — `né`, `tá`, `cara`, `tipo assim`, `dão o nome de`.

Nota: `num`/`numa` e `havia muito tempo` são registro literário brasileiro correto e **não** são acusados.

## Modo de falha

Qualquer ocorrência na narração falha o sensor e trava o portão. Corrija ou mova a expressão para dentro de uma fala.

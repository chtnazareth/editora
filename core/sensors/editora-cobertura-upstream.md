---
id: cobertura-upstream
tipo: deterministico
comando: bun {{METODO}}/core/tools/editora-sensor.ts rodar --id cobertura-upstream --arquivo {{ARQUIVO}} --consome {{CONSOME}}
severidade_padrao: bloqueante
descricao: Rastreabilidade — o artefato produzido referencia cada artefato que o estágio declara consumir
categoria: rastreabilidade
timeout_segundos: 5
---

# Sensor `cobertura-upstream`

Porte do `upstream-coverage`. Cada artefato nomeado no `consome:` do estágio precisa ser mencionado no texto produzido.

É o que impede o método de virar teatro: se o plano de capítulos nunca menciona os pilares criativos, ele não foi derivado deles — foi inventado ao lado.

## Modo de falha

Artefato consumido e não referenciado trava o portão. O editor-chefe confirma, no papel de revisor, que a referência é substantiva e não decorativa.

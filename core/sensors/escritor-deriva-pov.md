---
id: deriva-pov
tipo: deterministico
comando: bun {{METODO}}/core/tools/escritor-sensor.ts rodar --id deriva-pov --arquivo {{ARQUIVO}}
severidade_padrao: bloqueante
descricao: Detecta o narrador entrando na cabeça de quem não é o POV declarado
categoria: pov
timeout_segundos: 5
---

# Sensor `deriva-pov`

Compara o campo `pov:` do frontmatter do capítulo contra os verbos de cognição atribuídos a nomes próprios na narração (`sentiu`, `pensou`, `soube`, `percebeu`, `quis`, `lembrou`…).

Em terceira pessoa limitada, só o POV tem interior acessível. O que os outros sentem precisa chegar por gesto, fala e o que o POV infere.

## Modo de falha

Qualquer nome próprio diferente do POV com verbo de mente falha o sensor. Sem `pov:` declarado no frontmatter o sensor passa com aviso — não há contra o que comparar.

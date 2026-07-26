---
id: secoes-obrigatorias
tipo: deterministico
comando: bun {{METODO}}/core/tools/escritor-sensor.ts rodar --id secoes-obrigatorias --arquivo {{ARQUIVO}}
severidade_padrao: bloqueante
descricao: Checagem genérica de forma — o artefato de planejamento está estruturado
categoria: forma-documento
timeout_segundos: 5
---

# Sensor `secoes-obrigatorias`

Porte direto do `required-sections` do AI-DLC. Verifica que o artefato tem ao menos 2 seções de nível 2 (`##`).

É o piso genérico de forma: um artefato de planejamento sem estrutura costuma ser um artefato sem conteúdo.

## Modo de falha

Menos de 2 `##` trava o portão. Não se aplica a capítulos de manuscrito — prosa não tem seções.

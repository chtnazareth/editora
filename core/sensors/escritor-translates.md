---
id: translates
tipo: deterministico
comando: bun {{METODO}}/core/tools/escritor-sensor.ts rodar --id translates --arquivo {{ARQUIVO}}
severidade_padrao: consultivo
descricao: Caça o veneno nº 1 — decalque sintático do inglês em prosa portuguesa
categoria: prosa
timeout_segundos: 5
---

# Sensor `translates`

Veneno nº 1 dos quatro que o autor rejeitou. Procura marcas de tradução:

- **possessivo-redundante** — `balançou a sua cabeça`. Em português a parte do corpo leva artigo.
- **verbo-filtro** — `viu que`, `sentiu que`, `percebeu que`. Afasta o leitor do POV.
- **muleta-traduzida** — `de alguma forma`, `por um momento`, `uma espécie de`, `não pôde deixar de`.
- **cadencia-biblica** — `No começo havia…`, já rejeitada explicitamente.
- **nao-metafora** — `não era metáfora`. Se precisa dizer que é literal, a imagem falhou.
- **progressiva-excessiva** — `estava + gerúndio` acima de 4 por mil palavras.

## Modo de falha

Consultivo: nenhum destes padrões é errado isoladamente — o verbo-filtro tem uso legítimo. O sensor reporta densidade e localização; a decisão é do autor no portão. Detalhe em `<obra>/.escritor/registro/.sensores/<estagio>/translates-<correlator>.md`.

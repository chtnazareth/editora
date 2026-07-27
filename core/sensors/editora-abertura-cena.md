---
id: abertura-cena
tipo: heuristico
comando: bun {{METODO}}/core/tools/editora-sensor.ts rodar --id abertura-cena --arquivo {{ARQUIVO}}
severidade_padrao: bloqueante
descricao: Lei nº 1 do metodo-martin — a cena abre em gente e atrito, nunca em paisagem ou palestra
categoria: estrutura-de-cena
timeout_segundos: 5
---

# Sensor `abertura-cena`

Codifica a Lei nº 1: *cena, não ensaio*. É o erro-mãe do autor, cometido e corrigido de verdade — abrir com a câmera na paisagem e emendar um parágrafo de exposição de mundo.

- **abertura-descritiva** — o primeiro parágrafo começa por `Havia`, `Era uma`, `O lugar`, `Fazia frio`, `A noite`, e afins. **Bloqueante.**
- **abertura-sem-agente** — nenhuma pessoa agindo no primeiro parágrafo. Consultivo: às vezes é escolha (o POV acordando), mas o metodo-martin desaconselha.

O andaime do template (`**LUGAR** — …`, títulos, blocos de código) é ignorado — o sensor mede a prosa, não o arquivo.

## Modo de falha

Abertura descritiva trava o portão. Martin abre o próprio livro com uma fala: *"— Nós devíamos voltar"*.

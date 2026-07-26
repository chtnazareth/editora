---
slug: scaffold-vault
fase: inicializacao
execucao: SEMPRE
condicao: Sempre — a obra precisa de casa antes do primeiro artefato.
agente_lider: escritor-compositor-agent
agentes_apoio: []
modo: inline
produz:
  - mapa-do-vault
consome:
  - artefato: retrato-do-projeto
    obrigatorio: true
requer_estagio:
  - deteccao-projeto
escopos: []
sensores:
  - secoes-obrigatorias
entradas: retrato-do-projeto e o molde `_Template Livro`
saidas: mapa-do-vault.md — onde cada coisa vive nesta obra
---

# Scaffold do Vault

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão. Estágio sem portão.

## Passos

### Passo 1 — Carregar persona e retrato

Carregue `escritor-compositor-agent` e leia `retrato-do-projeto.md`.

### Passo 2 — Obra nova: copiar o molde

Copie `~/LIVROS/_Template Livro` inteiro para a pasta da obra e renomeie. Depois:

- apague `COMO USAR — Template.md` da cópia (só faz sentido no molde)
- troque o título em `README.md` e `SINOPSE.md`
- **nunca escreva dentro de `_Template Livro`** — o molde é somente leitura

### Passo 3 — Retomada: respeitar o que existe

Não copie nada por cima. Crie apenas as pastas ausentes que o método exige, preservando nomes e organização já em uso. Se o vault usa convenção própria (por exemplo `manuscrito/ato-1/cap-01/cena-01.md`), registre-a no mapa em vez de convertê-la.

### Passo 4 — Criar a área do método

Crie `.escritor/` com `registro/`, `auditoria/`, `memoria/`, `conhecimento/`. Esta pasta é do motor; o autor não escreve nela.

### Passo 5 — Conferir a convenção de nomes

Capítulos em `Cap 01`…`Cap 27` — maiúscula, espaço, dois dígitos, sem underline, numeração **contínua** entre atos (Ato 1 = 01–09, Ato 2 = 10–18, Ato 3 = 19–27). O `Painel.base` do Obsidian depende disso.

### Passo 6 — Gravar o mapa

`mapa-do-vault.md` com `## Estrutura`, `## Convenções desta obra` e `## Divergências do molde`.

## Sensores

`secoes-obrigatorias` sobre o mapa.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto**. Antes de fechar, faça a pergunta obrigatória do §13 do stage-protocol. Regra que o autor mantiver vira linha em `memoria/projeto.md` (ou `memoria/autor.md`); verificação nova vira manifesto em `core/sensors/`. Nunca edite este arquivo.

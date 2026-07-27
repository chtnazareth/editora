---
slug: scaffold-vault
fase: inicializacao
execucao: SEMPRE
condicao: Sempre — a obra precisa de casa antes do primeiro artefato.
agente_lider: editora-compositor-agent
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
entradas: retrato-do-projeto e o molde embutido em core/templates/livro/
saidas: mapa-do-vault.md — onde cada coisa vive nesta obra
---

# Scaffold do Vault

MANDATÓRIO: Siga o stage-protocol.md para portões de aprovação, formato de pergunta e mensagens de conclusão. Estágio sem portão.

O molde dos 27 capítulos vive **dentro do método**, em `core/templates/livro/`. Nada aqui depende de pasta preexistente na máquina do autor: o framework é autossuficiente e roda em qualquer lugar.

## Passos

### Passo 1 — Carregar persona e retrato

Carregue `editora-compositor-agent` e leia `retrato-do-projeto.md`.

### Passo 2 — Obra nova: um comando

```bash
bun {{METODO}}/core/tools/editora-novo.ts "<Título>" --em <pasta-pai> --escopo <escopo>
```

Faz tudo de uma vez: copia o molde, troca o título em `README.md` e `SINOPSE.md`, cria `.editora/` com registro, auditoria, memória e conhecimento, inicializa o estado, gera as unidades-capítulo e liga a memória do autor à global.

Se o autor já rodou esse comando antes de chamar o método — o caminho normal — confirme o resultado e siga para o Passo 4.

**Nunca escreva dentro de `core/templates/livro/`.** O molde é imutável; todo livro nasce de uma cópia.

### Passo 3 — Retomada: respeitar o que existe

Não copie nada por cima. Crie apenas as pastas ausentes que o método exige, preservando nomes e organização já em uso. Se o vault usa convenção própria (por exemplo `manuscrito/ato-1/cap-01/cena-01.md`), **registre-a no mapa em vez de convertê-la**.

### Passo 4 — Conferir a convenção de nomes

`Cap 01`…`Cap 27` — maiúscula, espaço, dois dígitos, sem underline, numeração **contínua** entre atos (Ato 1 = 01–09, Ato 2 = 10–18, Ato 3 = 19–27). O `Painel.base` do Obsidian depende disso.

### Passo 5 — Conferir a memória do autor

`memoria/autor.md` deve apontar para a memória global (`~/.editora/autor.md`, ou o que `EDITORA_AUTOR` indicar). É o que faz uma regra aprendida no livro anterior valer neste. Se o link não existir, registre no mapa: o autor vai precisar sincronizar à mão.

### Passo 6 — Gravar o mapa

`mapa-do-vault.md` com `## Estrutura`, `## Convenções desta obra` e `## Divergências do molde`.

## Sensores

`secoes-obrigatorias` sobre o mapa.

## Aprender

Mantenha `memoria.md` neste diretório de registro com quatro títulos — **Interpretações**, **Desvios**, **Trocas**, **Perguntas em aberto**. Antes de fechar, faça a pergunta obrigatória do §13 do stage-protocol. Regra que o autor mantiver vira linha em `memoria/projeto.md` (ou `memoria/autor.md`); verificação nova vira manifesto em `core/sensors/`. Nunca edite este arquivo.

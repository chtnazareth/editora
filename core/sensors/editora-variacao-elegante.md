---
id: variacao-elegante
tipo: deterministico
comando: bun {{METODO}}/core/tools/editora-sensor.ts rodar --id variacao-elegante --arquivo {{ARQUIVO}}
severidade_padrao: consultivo
descricao: Trocar de sinônimo por medo de repetir — exige grupos declarados
categoria: prosa
timeout_segundos: 5
---

# Sensor `variacao-elegante`

*Espada* vira *lâmina*, vira *aço*, vira *arma* em três parágrafos. O leitor perde o referente e a prosa fica pretensiosa. **Repetir o nome da coisa é mais honesto que buscar sinônimo.**

## Exige declaração, e isso é deliberado

Saber que duas palavras nomeiam o mesmo objeto é **semântica**, e semântica não se detecta por padrão de texto. Fingir que resolve produziria ruído — e sensor com falso positivo demais ensina o autor a ignorar o relatório, que é pior que não ter sensor.

Por isso o sensor lê os grupos declarados nas convenções de prosa do livro:

```markdown
## Grupos de sinônimos

- espada, lâmina, aço
- Igreja, a Ordem, os irmãos
```

Sem grupos declarados, passa com aviso.

## Modo de falha

Três ou mais nomes distintos do mesmo grupo em 600 caracteres.

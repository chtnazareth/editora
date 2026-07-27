#!/usr/bin/env bash
#
# instalar.sh — liga o Editora ao Claude Code.
#
# Cria links simbólicos de harness/claude/{skills,agents} para dentro de um
# diretório .claude. Idempotente. NÃO toca em nada que já exista lá e não seja
# nosso — em especial, preserva as skills prosa-* e metodo-martin do autor.
#
# Uso:
#   ./scripts/instalar.sh                    # instala global, em ~/.claude
#   ./scripts/instalar.sh /caminho/.claude   # instala num projeto específico
#   ./scripts/instalar.sh --desinstalar      # remove só os links que criamos
#
# O padrão é global (~/.claude) de propósito: assim /editora funciona em
# qualquer diretório, e "começar livro novo" não depende de onde você está.

set -euo pipefail

METODO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESINSTALAR=0
ALVO=""

for arg in "$@"; do
  case "$arg" in
    --desinstalar) DESINSTALAR=1 ;;
    -h|--help) sed -n '3,15p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) ALVO="$arg" ;;
  esac
done

ALVO="${ALVO:-$HOME/.claude}"
PREFIXO="editora"

azul()  { printf '\033[34m%s\033[0m\n' "$1"; }
verde() { printf '\033[32m  ✓\033[0m %s\n' "$1"; }
cinza() { printf '\033[90m  ·\033[0m %s\n' "$1"; }
erro()  { printf '\033[31m  ✗\033[0m %s\n' "$1" >&2; }

# --- desinstalação ---------------------------------------------------------
if [ "$DESINSTALAR" = 1 ]; then
  azul "Removendo links do Editora em $ALVO"
  n=0
  for p in "$ALVO/skills/$PREFIXO" "$ALVO/skills/$PREFIXO"-*; do
    [ -L "$p" ] || continue
    rm "$p"; verde "removido $(basename "$p")"; n=$((n+1))
  done
  for p in "$ALVO/agents/$PREFIXO"-*.md; do
    [ -L "$p" ] || continue
    rm "$p"; verde "removido agents/$(basename "$p")"; n=$((n+1))
  done
  [ "$n" -eq 0 ] && cinza "nada a remover"
  exit 0
fi

# --- pré-requisitos --------------------------------------------------------
command -v bun >/dev/null 2>&1 || { erro "bun não encontrado. Instale em https://bun.sh"; exit 1; }

azul "Editora → $ALVO"
echo

# Regenera e valida antes de ligar: nunca instalar um método quebrado.
cinza "compilando o grafo…"
bun "$METODO/core/tools/editora-graph.ts" compilar >/dev/null
cinza "gerando o harness…"
bun "$METODO/core/tools/editora-harness.ts" gerar >/dev/null
cinza "conferindo a saúde do método…"
if ! bun "$METODO/core/tools/editora-doctor.ts" >/dev/null 2>&1; then
  erro "doctor reprovou — rode 'bun run doctor' e corrija antes de instalar"
  exit 1
fi
echo

mkdir -p "$ALVO/skills" "$ALVO/agents"

# --- skills ----------------------------------------------------------------
for origem in "$METODO/harness/claude/skills"/*; do
  [ -d "$origem" ] || continue
  nome="$(basename "$origem")"
  destino="$ALVO/skills/$nome"
  if [ -e "$destino" ] && [ ! -L "$destino" ]; then
    erro "$destino existe e não é link — não vou sobrescrever. Mova ou renomeie."
    continue
  fi
  ln -sfn "$origem" "$destino"
  verde "skills/$nome"
done

# --- agentes ---------------------------------------------------------------
n=0
for origem in "$METODO/harness/claude/agents"/*.md; do
  [ -f "$origem" ] || continue
  nome="$(basename "$origem")"
  destino="$ALVO/agents/$nome"
  if [ -e "$destino" ] && [ ! -L "$destino" ]; then
    erro "$destino existe e não é link — pulando."
    continue
  fi
  ln -sfn "$origem" "$destino"
  n=$((n+1))
done
verde "agents/ — $n agentes ligados"

# --- variável de ambiente --------------------------------------------------
echo
if [ "${EDITORA_METODO:-}" != "$METODO" ]; then
  cinza "opcional: aponte a variável do método no seu shell"
  printf '\n      export EDITORA_METODO="%s"\n\n' "$METODO"
fi

azul "Pronto."
echo "  Abra o Claude Code em ~/LIVROS e use /editora."
echo "  As skills prosa-* e metodo-martin continuam intactas."

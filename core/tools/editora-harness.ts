#!/usr/bin/env bun
/**
 * editora-harness.ts — gera a superfície do Claude Code a partir do núcleo.
 *
 * Porte de `scripts/` + `harness/` do AI-DLC. Os agentes do harness são
 * DERIVADOS de `core/agents/`: uma fonte de verdade só. Rode depois de mexer
 * em qualquer persona.
 *
 * Uso: bun core/tools/editora-harness.ts gerar [--checar]
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { carregarAgentes, carregarGrafo, raizMetodo } from "./editora-lib.ts";

const FERRAMENTAS_POR_CAMADA: Record<string, string> = {
  // Personas de julgamento leem tudo e escrevem artefatos.
  julgamento: "Read, Write, Edit, Glob, Grep, Bash",
  // Verificadores não escrevem o artefato que auditam — só o próprio parecer.
  verificacao: "Read, Write, Glob, Grep, Bash",
  // O compositor mexe em estrutura de pastas.
  mecanica: "Read, Write, Edit, Glob, Grep, Bash",
};

function dirHarnessAgentes(): string {
  return join(raizMetodo(), "harness", "claude", "agents");
}

/** Monta o arquivo de subagente do Claude Code a partir da persona do núcleo. */
function renderizarAgente(
  slug: string,
  descricao: string,
  camada: string,
  corpo: string,
  estagiosLiderados: string[],
  ferramentasDeclaradas?: string,
): string {
  // A declaração do agente vence a camada. Sem isso, o Pesquisador — cuja
  // função inteira é levantar fato — ficava sem acesso à web, e a sabatina
  // pedia pesquisa que ninguém podia fazer.
  const ferramentas =
    ferramentasDeclaradas ??
    FERRAMENTAS_POR_CAMADA[camada] ??
    FERRAMENTAS_POR_CAMADA.julgamento;
  const lidera =
    estagiosLiderados.length > 0
      ? ` Lidera os estágios: ${estagiosLiderados.join(", ")}.`
      : "";
  const desc = `${descricao.replace(/\s+/g, " ").trim()}${lidera}`;

  return `---
name: ${slug}
description: ${desc}
tools: ${ferramentas}
---

<!--
  GERADO por core/tools/editora-harness.ts a partir de core/agents/${slug}.md
  Não edite aqui: edite a persona no núcleo e rode \`bun run harness\`.
-->

${corpo.trim()}
`;
}

function gerar(checar: boolean): number {
  const agentes = carregarAgentes();
  const grafo = carregarGrafo();
  const destino = dirHarnessAgentes();

  const arquivos = new Map<string, string>();
  for (const a of agentes) {
    const lidera = grafo.estagios
      .filter((e) => e.agente_lider === a.slug)
      .map((e) => e.slug);
    arquivos.set(
      `${a.slug}.md`,
      renderizarAgente(a.slug, a.descricao, a.camada, a.corpo, lidera, a.ferramentas),
    );
  }

  if (checar) {
    let drift = 0;
    for (const [nome, conteudo] of arquivos) {
      const p = join(destino, nome);
      if (!existsSync(p) || readFileSync(p, "utf8") !== conteudo) {
        console.error(`✗ drift: harness/claude/agents/${nome}`);
        drift++;
      }
    }
    const extras = existsSync(destino)
      ? readdirSync(destino).filter((f) => f.endsWith(".md") && !arquivos.has(f))
      : [];
    for (const e of extras) {
      console.error(`✗ órfão: harness/claude/agents/${e}`);
      drift++;
    }
    if (drift > 0) {
      console.error("  rode: bun run harness");
      return 1;
    }
    console.log(`✓ harness sem drift · ${arquivos.size} agentes`);
    return 0;
  }

  mkdirSync(destino, { recursive: true });
  for (const f of readdirSync(destino)) {
    if (f.endsWith(".md")) rmSync(join(destino, f));
  }
  for (const [nome, conteudo] of arquivos) {
    writeFileSync(join(destino, nome), conteudo);
  }
  console.log(`✓ harness gerado · ${arquivos.size} agentes em harness/claude/agents/`);
  return 0;
}

function main(): number {
  const comando = process.argv[2] ?? "gerar";
  if (comando !== "gerar") {
    console.error("uso: editora-harness.ts gerar [--checar]");
    return 2;
  }
  return gerar(process.argv.includes("--checar"));
}

if (import.meta.main) process.exit(main());

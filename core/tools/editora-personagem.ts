#!/usr/bin/env bun
/**
 * editora-personagem.ts — o briefing antes de entrevistar.
 *
 * A entrevista em si é conduzida pelo agente de personagens: um script não
 * conversa. O que um script faz de útil é reunir o material — a ficha, onde a
 * pessoa aparece na página, e o que ela já fez — para o agente responder de
 * dentro dela em vez de improvisar.
 *
 * Uso:
 *   editora personagem --nome vela
 *   editora personagem --listar
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { exigirObra } from "./editora-lib.ts";
import { lerEstado } from "./editora-state.ts";
import { procurarNoManuscrito } from "./editora-impacto.ts";
import { extrairProsa } from "./editora-sensores.ts";

/** Pastas do vault onde moram fichas de gente. */
const PASTAS_DE_FICHA = [/Personagens/i, /Elenco/i];

function fichasDaObra(obra: string): string[] {
  const saida: string[] = [];
  for (const entrada of readdirSync(obra)) {
    if (!PASTAS_DE_FICHA.some((p) => p.test(entrada))) continue;
    const dir = join(obra, entrada);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir)) {
      if (f.endsWith(".md")) saida.push(join(dir, f));
    }
  }
  return saida;
}

function acharFicha(obra: string, nome: string): string | null {
  const alvo = nome.toLowerCase();
  const fichas = fichasDaObra(obra);
  return (
    fichas.find((f) => f.toLowerCase().includes(`/${alvo}.md`)) ??
    fichas.find((f) => f.toLowerCase().includes(alvo)) ??
    null
  );
}

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main(): number {
  let obra: string;
  try {
    obra = exigirObra(arg("obra"));
  } catch (e) {
    console.error((e as Error).message);
    return 2;
  }

  if (process.argv.includes("--listar")) {
    const fichas = fichasDaObra(obra);
    if (fichas.length === 0) {
      console.log("\n  Nenhuma ficha de personagem ainda.\n");
      return 0;
    }
    console.log("");
    for (const f of fichas) console.log(`  ${relative(obra, f)}`);
    console.log("");
    return 0;
  }

  const nome = arg("nome");
  if (!nome) {
    console.error(`
  uso: editora personagem --nome <nome> [--json]
       editora personagem --listar

  Reúne a ficha e as aparições na página, para a entrevista.
`);
    return 2;
  }

  const ficha = acharFicha(obra, nome);
  if (!ficha) {
    console.error(`  ✗ nenhuma ficha encontrada para "${nome}". Use --listar.`);
    return 1;
  }

  const estado = lerEstado(obra);
  const aparicoes = procurarNoManuscrito(obra, estado, [nome]);
  const textoFicha = readFileSync(ficha, "utf8");

  if (process.argv.includes("--json")) {
    console.log(
      JSON.stringify(
        { nome, ficha: relative(obra, ficha), aparicoes, texto: textoFicha },
        null,
        2,
      ),
    );
    return 0;
  }

  console.log(`\n  ── ${nome} ──\n`);
  console.log(`  ficha: ${relative(obra, ficha)}\n`);
  console.log(extrairProsa(textoFicha).split(/\n/).filter(Boolean).map((l) => `  ${l}`).join("\n"));

  console.log(`\n  ── onde aparece na página ──\n`);
  if (aparicoes.length === 0) {
    console.log("  Em nenhum capítulo escrito ainda.");
    console.log("  A entrevista vale mais aqui: a ficha ainda não foi testada por nada.\n");
  } else {
    const total = aparicoes.reduce((s, a) => s + a.ocorrencias, 0);
    for (const a of aparicoes) {
      console.log(
        `  ${a.rotulo.padEnd(8)} ${String(a.ocorrencias).padStart(3)}×  ` +
          `${a.status === "concluida" ? "aprovado" : a.status}`,
      );
    }
    console.log(`\n  ${total} menções em ${aparicoes.length} capítulo(s).`);
    console.log(
      "  Antes de responder, leia como ele se comporta nesses capítulos:\n" +
        "  a ficha diz quem ele deveria ser; a página diz quem ele virou.\n",
    );
  }

  console.log("  ── conduzir a entrevista ──\n");
  console.log("  Assuma a pessoa. Responda em primeira pessoa, no registro dela,");
  console.log("  usando só o que a ficha e o canon estabelecem. Não invente:");
  console.log("  fato que falta vira pergunta ao autor.\n");
  console.log("  A pergunta que decide tudo, diante de uma situação que o livro");
  console.log("  ainda não mostrou:  o que você faria agora?\n");
  return 0;
}

if (import.meta.main) {
  try {
    process.exit(main());
  } catch (e) {
    console.error(`\n  ✗ ${(e as Error).message}\n`);
    process.exit(1);
  }
}

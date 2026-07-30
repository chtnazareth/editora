#!/usr/bin/env bun
/**
 * editora-doctor.ts — diagnóstico do método inteiro.
 *
 * Porte de `core/tools/aidlc-doctor-bundle.ts`. Verifica que o grafo compila,
 * que agentes/escopos/sensores referenciados existem, que cada sensor declarado
 * tem analisador de verdade e que o JSON compilado não driftou do frontmatter.
 *
 * Uso: bun core/tools/editora-doctor.ts [--consertar]
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  FASES,
  caminhoGradeEscopos,
  dirCore,
  caminhoGrafo,
  carregarAgentes,
  carregarEscopos,
  carregarEstagiosCrus,
  carregarSensores,
  type Fase,
} from "./editora-lib.ts";
import { validarGrafo, type ContextoValidacao } from "./editora-stage-schema.ts";
import { ANALISADORES } from "./editora-sensores.ts";
import { compilarGrafo } from "./editora-graph.ts";

interface Checagem {
  nome: string;
  ok: boolean;
  detalhes: string[];
}

function checar(nome: string, fn: () => string[]): Checagem {
  try {
    const detalhes = fn();
    return { nome, ok: detalhes.length === 0, detalhes };
  } catch (e) {
    return { nome, ok: false, detalhes: [(e as Error).message] };
  }
}

function main(): number {
  const estagios = carregarEstagiosCrus();
  const agentes = carregarAgentes();
  const escopos = carregarEscopos();
  const sensores = carregarSensores();

  const artefatos = new Set<string>();
  for (const e of estagios) for (const a of e.produz) artefatos.add(a);
  const ctx: ContextoValidacao = {
    agentes: new Set(agentes.map((a) => a.slug)),
    escopos: new Set(escopos.map((s) => s.nome)),
    sensores: new Set(sensores.map((s) => s.id)),
    slugs: new Set(estagios.map((e) => e.slug)),
    artefatos,
  };

  const checagens: Checagem[] = [
    checar("estágios presentes", () =>
      estagios.length === 0 ? ["nenhum estágio em core/editora-common/stages/"] : [],
    ),

    checar("frontmatter dos estágios", () =>
      validarGrafo(estagios, ctx).map(
        (p) => `${p.arquivo.slice(p.arquivo.indexOf("core/"))} → ${p.campo}: ${p.mensagem}`,
      ),
    ),

    checar("toda fase tem ao menos um estágio", () =>
      (FASES as readonly Fase[])
        .filter((f) => !estagios.some((e) => e.fase === f))
        .map((f) => `fase "${f}" está vazia`),
    ),

    checar("agentes com frontmatter válido", () =>
      agentes.flatMap((a) => {
        const p: string[] = [];
        if (!a.slug) p.push(`${a.arquivo}: campo "nome" ausente`);
        if (!a.descricao) p.push(`${a.slug || a.arquivo}: campo "descricao" ausente`);
        return p;
      }),
    ),

    checar("todo agente lidera ao menos um estágio", () =>
      agentes
        .filter(
          (a) =>
            !estagios.some(
              (e) => e.agente_lider === a.slug || e.agentes_apoio.includes(a.slug) || e.revisor === a.slug,
            ),
        )
        .map((a) => `agente "${a.slug}" não aparece em nenhum estágio — é peso morto`),
    ),

    checar("todo escopo executa algo", () =>
      escopos
        .filter((s) => !estagios.some((e) => e.escopos.includes(s.nome)))
        .map((s) => `escopo "${s.nome}" não é nomeado por nenhum estágio`),
    ),

    checar("todo agente tem conhecimento", () =>
      agentes
        .filter((a) => {
          const dir = join(dirCore(), "knowledge", a.slug);
          return (
            !existsSync(dir) ||
            readdirSync(dir).filter((f) => f.endsWith(".md")).length === 0
          );
        })
        .map(
          (a) =>
            `agente "${a.slug}" tem a pasta de conhecimento vazia — mas a persona dele promete carregá-la`,
        ),
    ),

    checar("todo sensor declarado tem analisador", () =>
      sensores.filter((s) => !ANALISADORES[s.id]).map((s) => `sensor "${s.id}" sem função em editora-sensores.ts`),
    ),

    checar("todo analisador tem manifesto", () =>
      Object.keys(ANALISADORES)
        .filter((id) => !sensores.some((s) => s.id === id))
        .map((id) => `analisador "${id}" sem manifesto em core/sensors/`),
    ),

    checar("grafo compilado presente", () => {
      const p: string[] = [];
      if (!existsSync(caminhoGrafo())) p.push("stage-graph.json ausente — rode `bun run compilar`");
      if (!existsSync(caminhoGradeEscopos())) p.push("scope-grid.json ausente — rode `bun run compilar`");
      return p;
    }),

    checar("grafo compilado sem drift", () => {
      if (!existsSync(caminhoGrafo())) return [];
      const { problemas } = compilarGrafo();
      return problemas.length > 0 ? ["frontmatter inválido impede checar drift"] : [];
    }),
  ];

  let falhas = 0;
  console.log("");
  for (const c of checagens) {
    console.log(`${c.ok ? "✓" : "✗"} ${c.nome}`);
    for (const d of c.detalhes) console.log(`    · ${d}`);
    if (!c.ok) falhas++;
  }

  console.log("");
  console.log(
    `  ${estagios.length} estágios · ${agentes.length} agentes · ${escopos.length} escopos · ${sensores.length} sensores`,
  );
  for (const f of FASES) {
    const n = estagios.filter((e) => e.fase === f).length;
    console.log(`    ${f.padEnd(16)} ${n}`);
  }
  console.log("");

  if (falhas > 0) {
    console.error(`✗ ${falhas} checagem(ns) falharam.\n`);
    return 1;
  }
  console.log("✓ método saudável.\n");
  return 0;
}

if (import.meta.main) process.exit(main());

#!/usr/bin/env bun
/**
 * escritor-graph.ts — compila os arquivos de estágio (.md com frontmatter) em
 * `core/tools/data/stage-graph.json` e `core/tools/data/scope-grid.json`.
 *
 * Porte de `core/tools/aidlc-graph.ts`. O frontmatter YAML é a fonte autoral;
 * o JSON compilado é o que o motor lê em tempo de execução. `--checar` falha se
 * os dois divergirem (guarda de drift, para o CI e para o doctor).
 *
 * Uso:
 *   bun core/tools/escritor-graph.ts compilar [--checar]
 *   bun core/tools/escritor-graph.ts mostrar [--fase ideacao] [--escopo romance]
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import {
  PREFIXO_FASE,
  agoraISO,
  carregarAgentes,
  carregarEscopos,
  carregarEstagiosCrus,
  carregarSensores,
  caminhoGradeEscopos,
  caminhoGrafo,
  type Estagio,
  type Fase,
  type Grafo,
} from "./escritor-lib.ts";
import {
  ordenarTopologicamente,
  validarGrafo,
  type ContextoValidacao,
  type Problema,
} from "./escritor-stage-schema.ts";

const VERSAO_GRAFO = "1";

function montarContexto(estagios: Estagio[]): ContextoValidacao {
  const artefatos = new Set<string>();
  for (const e of estagios) for (const a of e.produz) artefatos.add(a);
  return {
    agentes: new Set(carregarAgentes().map((a) => a.slug)),
    escopos: new Set(carregarEscopos().map((s) => s.nome)),
    sensores: new Set(carregarSensores().map((s) => s.id)),
    slugs: new Set(estagios.map((e) => e.slug)),
    artefatos,
  };
}

/**
 * Calcula `ordem` = `<prefixo-fase>.<sequência>`.
 * A sequência é a posição do estágio na ordenação topológica restrita à sua
 * própria fase, com desempate alfabético — determinística entre execuções.
 */
function calcularOrdem(estagios: Estagio[]): void {
  for (const fase of Object.keys(PREFIXO_FASE) as Fase[]) {
    const daFase = estagios.filter((e) => e.fase === fase);
    // Arestas restritas à fase: dependências fora dela não afetam a sequência.
    const slugsDaFase = new Set(daFase.map((e) => e.slug));
    const recortados = daFase.map((e) => ({
      ...e,
      requer_estagio: e.requer_estagio.filter((s) => slugsDaFase.has(s)),
    }));
    const ordenados = ordenarTopologicamente(recortados);
    ordenados.forEach((rec, i) => {
      const original = estagios.find((e) => e.slug === rec.slug)!;
      original.ordem = `${PREFIXO_FASE[fase]}.${i + 1}`;
    });
  }
}

function compilarGrafo(): { grafo: Grafo; problemas: Problema[] } {
  const estagios = carregarEstagiosCrus();
  const ctx = montarContexto(estagios);
  const problemas = validarGrafo(estagios, ctx);
  calcularOrdem(estagios);

  const enxuto = estagios
    .map((e) => ({
      slug: e.slug,
      nome: e.nome,
      fase: e.fase,
      ordem: e.ordem,
      execucao: e.execucao,
      condicao: e.condicao,
      agente_lider: e.agente_lider,
      agentes_apoio: e.agentes_apoio,
      modo: e.modo,
      para_cada: e.para_cada,
      exige_manuscrito: e.exige_manuscrito ?? false,
      produz: e.produz,
      consome: e.consome,
      requer_estagio: e.requer_estagio,
      escopos: e.escopos,
      sensores: e.sensores,
      revisor: e.revisor,
      revisor_max_iteracoes: e.revisor_max_iteracoes,
      entradas: e.entradas,
      saidas: e.saidas,
      arquivo: e.arquivo.slice(e.arquivo.indexOf("core/")),
    }))
    .sort((a, b) => {
      const [fa, sa] = a.ordem.split(".").map(Number);
      const [fb, sb] = b.ordem.split(".").map(Number);
      return fa !== fb ? fa - fb : sa - sb;
    }) as unknown as Estagio[];

  return {
    grafo: { versao: VERSAO_GRAFO, compilado_em: agoraISO(), estagios: enxuto },
    problemas,
  };
}

function compilarGradeEscopos(
  grafo: Grafo,
): Record<string, Record<string, "EXECUTA" | "PULA">> {
  const escopos = carregarEscopos();
  const grade: Record<string, Record<string, "EXECUTA" | "PULA">> = {};
  for (const escopo of escopos) {
    const linha: Record<string, "EXECUTA" | "PULA"> = {};
    for (const e of grafo.estagios) {
      // Os estágios de inicialização rodam sob todo escopo, sempre.
      const executa = e.fase === "inicializacao" || e.escopos.includes(escopo.nome);
      linha[e.slug] = executa ? "EXECUTA" : "PULA";
    }
    grade[escopo.nome] = linha;
  }
  return grade;
}

/** Serializa ignorando `compilado_em` — o timestamp não conta como drift. */
function normalizar(g: Grafo): string {
  return JSON.stringify({ versao: g.versao, estagios: g.estagios }, null, 2);
}

function gravar(caminho: string, conteudo: string): void {
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo.endsWith("\n") ? conteudo : `${conteudo}\n`);
}

function relatarProblemas(problemas: Problema[]): void {
  const porArquivo = new Map<string, Problema[]>();
  for (const p of problemas) {
    const lista = porArquivo.get(p.arquivo) ?? [];
    lista.push(p);
    porArquivo.set(p.arquivo, lista);
  }
  for (const [arquivo, lista] of porArquivo) {
    const curto = arquivo.includes("core/") ? arquivo.slice(arquivo.indexOf("core/")) : arquivo;
    console.error(`\n  ${curto}`);
    for (const p of lista) console.error(`    ✗ ${p.campo}: ${p.mensagem}`);
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function comandoCompilar(checar: boolean): number {
  const { grafo, problemas } = compilarGrafo();

  if (problemas.length > 0) {
    console.error(`✗ ${problemas.length} problema(s) no grafo de estágios:`);
    relatarProblemas(problemas);
    return 1;
  }

  const grade = compilarGradeEscopos(grafo);
  const jsonGrafo = `${JSON.stringify(grafo, null, 2)}\n`;
  const jsonGrade = `${JSON.stringify(grade, null, 2)}\n`;

  if (checar) {
    const cg = caminhoGrafo();
    const cge = caminhoGradeEscopos();
    if (!existsSync(cg) || !existsSync(cge)) {
      console.error("✗ grafo compilado ausente — rode `bun run compilar`");
      return 1;
    }
    const emDisco = JSON.parse(readFileSync(cg, "utf8")) as Grafo;
    if (normalizar(emDisco) !== normalizar(grafo)) {
      console.error("✗ drift: stage-graph.json diverge do frontmatter — rode `bun run compilar`");
      return 1;
    }
    if (readFileSync(cge, "utf8") !== jsonGrade) {
      console.error("✗ drift: scope-grid.json diverge — rode `bun run compilar`");
      return 1;
    }
    console.log(`✓ sem drift · ${grafo.estagios.length} estágios · ${Object.keys(grade).length} escopos`);
    return 0;
  }

  gravar(caminhoGrafo(), jsonGrafo);
  gravar(caminhoGradeEscopos(), jsonGrade);
  console.log(
    `✓ compilado · ${grafo.estagios.length} estágios · ${Object.keys(grade).length} escopos`,
  );
  for (const fase of Object.keys(PREFIXO_FASE) as Fase[]) {
    const n = grafo.estagios.filter((e) => e.fase === fase).length;
    if (n > 0) console.log(`    ${fase.padEnd(16)} ${n}`);
  }
  return 0;
}

function comandoMostrar(args: string[]): number {
  const { grafo, problemas } = compilarGrafo();
  if (problemas.length > 0) {
    console.error(`✗ ${problemas.length} problema(s) — corrija antes de listar.`);
    relatarProblemas(problemas);
    return 1;
  }
  const iFase = args.indexOf("--fase");
  const filtroFase = iFase >= 0 ? args[iFase + 1] : null;
  const iEscopo = args.indexOf("--escopo");
  const filtroEscopo = iEscopo >= 0 ? args[iEscopo + 1] : null;

  for (const e of grafo.estagios) {
    if (filtroFase && e.fase !== filtroFase) continue;
    if (filtroEscopo && e.fase !== "inicializacao" && !e.escopos.includes(filtroEscopo))
      continue;
    const marca = e.execucao === "SEMPRE" ? "●" : "○";
    const laco = e.para_cada ? ` ⟲ ${e.para_cada}` : "";
    console.log(
      `${e.ordem.padStart(4)} ${marca} ${e.slug.padEnd(28)} ${e.agente_lider.padEnd(34)} ${e.modo}${laco}`,
    );
  }
  return 0;
}

function main(): number {
  const [comando, ...args] = process.argv.slice(2);
  switch (comando) {
    case "compilar":
      return comandoCompilar(args.includes("--checar"));
    case "mostrar":
      return comandoMostrar(args);
    default:
      console.error("uso: escritor-graph.ts <compilar [--checar] | mostrar [--fase F] [--escopo E]>");
      return 2;
  }
}

if (import.meta.main) process.exit(main());

export { compilarGrafo, compilarGradeEscopos, calcularOrdem };

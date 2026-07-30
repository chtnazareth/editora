#!/usr/bin/env bun
/**
 * editora-impacto.ts — o que essa mudança quebrou?
 *
 * Responde a pergunta que um livro faz e software não faz: você repensou a
 * protagonista no mês 4, e os capítulos escritos no mês 1 continuam marcados
 * como `pronto` e conferidos — mesmo que agora contradigam a ficha nova.
 *
 * Em software, o compilador acha todas as referências e recusa compilar se
 * sobrou uma. Prosa não tem compilador. Isto aqui é o mais perto disso que dá
 * para chegar sem declaração nenhuma: busca de texto sobre a prosa, cruzada
 * com o status de cada capítulo.
 *
 * Uso:
 *   editora impacto --termo "Vela"
 *   editora impacto --artefato protagonista
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  carregarGrafo,
  dirRegistroEstagio,
  exigirObra,
  type Grafo,
} from "./editora-lib.ts";
import { acharArquivoCapitulo, lerEstado, type Estado } from "./editora-state.ts";
import { extrairProsa, frases } from "./editora-sensores.ts";

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Fronteira por lookaround sobre \p{L}, nunca `\b`: em português `\b` é
 * fronteira ASCII e falharia em qualquer nome com acento — "Vela" casaria,
 * "Ítalo" não. Mesma armadilha já documentada nos sensores.
 */
function regexDoTermo(termo: string): RegExp {
  return new RegExp(`(?<![\\p{L}])${escapar(termo)}(?![\\p{L}])`, "giu");
}

function contarNoTexto(texto: string, termos: string[]): { total: number; linhas: number[] } {
  const linhasDoTexto = texto.split(/\r?\n/);
  const linhas = new Set<number>();
  let total = 0;
  for (const termo of termos) {
    const re = regexDoTermo(termo);
    linhasDoTexto.forEach((l, i) => {
      const achados = l.match(re);
      if (achados) {
        total += achados.length;
        linhas.add(i + 1);
      }
    });
  }
  return { total, linhas: [...linhas].sort((a, b) => a - b) };
}

/**
 * Nomes próprios de um artefato: palavra capitalizada em posição não-inicial
 * de frase. Mesma heurística já usada e testada no sensor de repetição.
 */
export function termosDoArtefato(caminho: string): string[] {
  const prosa = extrairProsa(readFileSync(caminho, "utf8"));
  const nomes = new Set<string>();
  for (const f of frases(prosa)) {
    const palavras = f.texto.match(/\p{L}{3,}/gu) ?? [];
    for (let i = 1; i < palavras.length; i++) {
      if (/^\p{Lu}/u.test(palavras[i])) nomes.add(palavras[i]);
    }
  }
  return [...nomes];
}

// ---------------------------------------------------------------------------
// Onde o termo aparece
// ---------------------------------------------------------------------------

export interface OcorrenciaCapitulo {
  unidade: string;
  rotulo: string;
  arquivo: string;
  ocorrencias: number;
  linhas: number[];
  status: string;
  /** Capítulo já dado por concluído que cita o termo: precisa reconferência. */
  reconferir: boolean;
}

export function procurarNoManuscrito(
  obra: string,
  estado: Estado,
  termos: string[],
): OcorrenciaCapitulo[] {
  const saida: OcorrenciaCapitulo[] = [];

  for (const u of estado.unidades) {
    const alvo = acharArquivoCapitulo(obra, u.rotulo);
    if (!alvo) continue;

    const arquivos = statSync(alvo).isDirectory()
      ? readdirSync(alvo).filter((f) => f.endsWith(".md")).map((f) => join(alvo, f))
      : [alvo];

    let total = 0;
    const linhas: number[] = [];
    for (const arq of arquivos) {
      const r = contarNoTexto(extrairProsa(readFileSync(arq, "utf8")), termos);
      total += r.total;
      linhas.push(...r.linhas);
    }
    if (total === 0) continue;

    saida.push({
      unidade: u.id,
      rotulo: u.rotulo,
      arquivo: relative(obra, alvo),
      ocorrencias: total,
      linhas: linhas.sort((a, b) => a - b).slice(0, 12),
      status: u.status,
      reconferir: u.status === "concluida",
    });
  }
  return saida;
}

export interface OcorrenciaCanon {
  arquivo: string;
  estagio: string | null;
  ocorrencias: number;
}

/** Pastas do vault que são canon, e o estágio que é dono de cada uma. */
const CANON: { padrao: RegExp; estagio: string }[] = [
  { padrao: /Personagens/i, estagio: "elenco" },
  { padrao: /Lugares/i, estagio: "lugares" },
  { padrao: /B[íi]blia do Mundo/i, estagio: "biblia-mundo" },
  { padrao: /(^|\/)0?4 — Mundo/i, estagio: "biblia-mundo" },
];

function varrer(dir: string, saida: string[] = []): string[] {
  if (!existsSync(dir)) return saida;
  for (const e of readdirSync(dir)) {
    if (e.startsWith(".")) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) varrer(p, saida);
    else if (e.endsWith(".md")) saida.push(p);
  }
  return saida;
}

export function procurarNoCanon(obra: string, termos: string[]): OcorrenciaCanon[] {
  const saida: OcorrenciaCanon[] = [];
  for (const { padrao, estagio } of CANON) {
    for (const dir of readdirSync(obra)) {
      if (!padrao.test(dir)) continue;
      const completo = join(obra, dir);
      if (!statSync(completo).isDirectory()) continue;
      for (const arq of varrer(completo)) {
        const { total } = contarNoTexto(readFileSync(arq, "utf8"), termos);
        if (total > 0)
          saida.push({ arquivo: relative(obra, arq), estagio, ocorrencias: total });
      }
    }
  }
  return saida;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function caminhoDeArtefato(obra: string, grafo: Grafo, artefato: string): string | null {
  const dono = grafo.estagios.find((e) => e.produz.includes(artefato));
  if (!dono) return null;
  const p = join(dirRegistroEstagio(obra, dono.fase, dono.slug), `${artefato}.md`);
  return existsSync(p) ? p : null;
}

function main(): number {
  let obra: string;
  try {
    obra = exigirObra(arg("obra"));
  } catch (e) {
    console.error((e as Error).message);
    return 2;
  }

  const estado = lerEstado(obra);
  const grafo = carregarGrafo();

  let termos: string[];
  const termo = arg("termo");
  const artefato = arg("artefato");

  if (termo) {
    termos = [termo];
  } else if (artefato) {
    const caminho = caminhoDeArtefato(obra, grafo, artefato);
    if (!caminho) {
      console.error(`artefato "${artefato}" não existe no registro desta obra.`);
      return 2;
    }
    termos = termosDoArtefato(caminho);
    if (termos.length === 0) {
      console.error(`nenhum nome próprio encontrado em "${artefato}". Use --termo.`);
      return 2;
    }
  } else {
    console.error('uso: editora impacto (--termo "Vela" | --artefato protagonista) [--json]');
    return 2;
  }

  const capitulos = procurarNoManuscrito(obra, estado, termos);
  const canon = procurarNoCanon(obra, termos);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ termos, capitulos, canon }, null, 2));
    return 0;
  }

  console.log(`\n  Impacto de: ${termos.join(", ")}\n`);

  if (canon.length > 0) {
    console.log("  No canon:");
    for (const c of canon)
      console.log(`    ${String(c.ocorrencias).padStart(3)}×  ${c.arquivo}  (${c.estagio})`);
    console.log("");
  }

  if (capitulos.length === 0) {
    console.log("  Nenhum capítulo escrito menciona isto. Mudança sem custo retroativo.\n");
    return 0;
  }

  console.log("  Nos capítulos:");
  for (const c of capitulos) {
    const marca = c.reconferir ? "← reconferir" : c.status === "pendente" ? "(não escrito)" : "";
    console.log(
      `    ${c.rotulo.padEnd(8)} ${String(c.ocorrencias).padStart(3)}×  ` +
        `[${c.status === "concluida" ? "x" : c.status === "em-andamento" ? "-" : " "}] ${marca}`,
    );
  }

  const reconferir = capitulos.filter((c) => c.reconferir);
  console.log("");
  if (reconferir.length > 0) {
    console.log(
      `  ${reconferir.length} capítulo(s) já aprovado(s) mencionam isto e podem ter virado mentira.`,
    );
    console.log(`  Para revisar um deles:  editora revisar --unidade ${reconferir[0].unidade}\n`);
  } else {
    console.log("  Nenhum capítulo aprovado foi afetado.\n");
  }
  return 0;
}

if (import.meta.main) process.exit(main());

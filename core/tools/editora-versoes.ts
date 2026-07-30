#!/usr/bin/env bun
/**
 * editora-versoes.ts — a rede de segurança embaixo do texto.
 *
 * Escritor volta atrás. Volta para pegar um parágrafo que cortou, para comparar
 * duas aberturas, para recuperar a versão de quatro meses atrás que era pior no
 * geral mas tinha uma frase melhor.
 *
 * Sem isto, revisar um capítulo **apaga** o que existia — e o desvio, que torna
 * revisar fácil, torna a perda mais provável. A pasta do livro não é repositório
 * git e não vai ser: o autor não deve precisar saber o que é um commit.
 *
 * O arquivamento é automático — acontece ao abrir e ao aprovar toda etapa que
 * grava prosa. Versão idêntica à anterior não é guardada duas vezes.
 *
 * Uso:
 *   editora versoes --unidade cap-07
 *   editora versoes --unidade cap-07 --ver 2
 *   editora versoes --unidade cap-07 --restaurar 2
 */

import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { agoraISO, carregarGrafo, dirEscritor, exigirObra } from "./editora-lib.ts";
import { registrar } from "./editora-audit.ts";
import {
  acharArquivoCapitulo,
  contarPalavrasCorpo,
  lerEstado,
} from "./editora-state.ts";

export type EventoVersao = "antes" | "aprovado" | "antes-de-restaurar";

export interface Versao {
  id: string;
  quando: string;
  estagio: string;
  evento: EventoVersao;
  palavras: number;
  hash: string;
  tipo: "arquivo" | "pasta";
}

// ---------------------------------------------------------------------------

export function dirVersoes(obra: string, unidade: string): string {
  return join(dirEscritor(obra), "versoes", unidade);
}

function caminhoIndice(obra: string, unidade: string): string {
  return join(dirVersoes(obra, unidade), "versoes.json");
}

export function lerVersoes(obra: string, unidade: string): Versao[] {
  const c = caminhoIndice(obra, unidade);
  if (!existsSync(c)) return [];
  return JSON.parse(readFileSync(c, "utf8")) as Versao[];
}

function gravarIndice(obra: string, unidade: string, versoes: Versao[]): void {
  mkdirSync(dirVersoes(obra, unidade), { recursive: true });
  writeFileSync(caminhoIndice(obra, unidade), `${JSON.stringify(versoes, null, 2)}\n`);
}

/** Hash do conteúdo — arquivo único ou todas as cenas da pasta, em ordem. */
function hashDe(caminho: string): string {
  const h = createHash("sha256");
  if (statSync(caminho).isDirectory()) {
    for (const f of readdirSync(caminho).sort()) {
      if (f.endsWith(".md")) h.update(readFileSync(join(caminho, f)));
    }
  } else {
    h.update(readFileSync(caminho));
  }
  return h.digest("hex").slice(0, 12);
}

// ---------------------------------------------------------------------------
// Arquivar
// ---------------------------------------------------------------------------

export interface ResultadoArquivo {
  arquivado: boolean;
  motivo?: string;
  versao?: Versao;
}

/**
 * Guarda o estado atual do capítulo. Chamado pelo motor ao abrir e ao aprovar
 * toda etapa com `exige_manuscrito` — o autor nunca precisa lembrar.
 */
export function arquivar(
  obra: string,
  unidadeId: string,
  estagio: string,
  evento: EventoVersao,
): ResultadoArquivo {
  const estado = lerEstado(obra);
  const u = estado.unidades.find((x) => x.id === unidadeId);
  if (!u) return { arquivado: false, motivo: `unidade desconhecida: ${unidadeId}` };

  const origem = acharArquivoCapitulo(obra, u.rotulo);
  if (!origem) return { arquivado: false, motivo: "capítulo ainda não existe no manuscrito" };

  const palavras = contarPalavrasCorpo(origem);
  if (palavras === 0) return { arquivado: false, motivo: "capítulo sem prosa — nada a guardar" };

  const hash = hashDe(origem);
  const versoes = lerVersoes(obra, unidadeId);

  // Nada mudou desde a última: não guarda duas vezes o mesmo texto.
  if (versoes.length > 0 && versoes[versoes.length - 1].hash === hash) {
    const ultima = versoes[versoes.length - 1];
    // Mas se este momento é mais importante que o rótulo que ela tem, promove.
    // Sem isto a lista mente sobre qual versão foi a aprovada — que é
    // exatamente a que o autor procura quando quer voltar.
    if (evento === "aprovado" && ultima.evento !== "aprovado") {
      ultima.evento = "aprovado";
      ultima.estagio = estagio;
      gravarIndice(obra, unidadeId, versoes);
      return { arquivado: false, motivo: "mesma versão, promovida a aprovada", versao: ultima };
    }
    return { arquivado: false, motivo: "idêntico à versão anterior" };
  }

  const quando = agoraISO();
  // O hash entra no id porque o timestamp tem precisão de segundo: dois
  // arquivamentos no mesmo segundo colidiriam, o segundo sobrescreveria o
  // primeiro, e o texto antigo sumiria — exatamente a perda que esta
  // ferramenta existe para impedir. Conteúdo diferente, id diferente.
  const id = `${quando.replace(/[:.]/g, "-")}--${estagio}--${evento}--${hash}`;
  const destino = join(dirVersoes(obra, unidadeId), id);
  const ehPasta = statSync(origem).isDirectory();

  // Cinto e suspensório: se o alvo já existe, o conteúdo é o mesmo (o hash está
  // no nome). Nunca sobrescrever uma versão guardada.
  if (existsSync(destino) || existsSync(`${destino}.md`)) {
    return { arquivado: false, motivo: "esta versão já está guardada" };
  }

  mkdirSync(dirVersoes(obra, unidadeId), { recursive: true });
  if (ehPasta) cpSync(origem, destino, { recursive: true });
  else cpSync(origem, `${destino}.md`);

  const versao: Versao = {
    id,
    quando,
    estagio,
    evento,
    palavras,
    hash,
    tipo: ehPasta ? "pasta" : "arquivo",
  };
  versoes.push(versao);
  gravarIndice(obra, unidadeId, versoes);
  registrar(obra, "VERSAO_ARQUIVADA", {
    unidade: unidadeId,
    estagio,
    evento,
    palavras,
  });
  return { arquivado: true, versao };
}

// ---------------------------------------------------------------------------
// Restaurar
// ---------------------------------------------------------------------------

export function caminhoDaVersao(obra: string, unidade: string, v: Versao): string {
  const base = join(dirVersoes(obra, unidade), v.id);
  return v.tipo === "pasta" ? base : `${base}.md`;
}

/**
 * Devolve o capítulo a uma versão anterior — guardando a atual antes, para que
 * desfazer o desfazer também seja possível.
 */
export function restaurar(obra: string, unidadeId: string, versao: Versao): void {
  const estado = lerEstado(obra);
  const u = estado.unidades.find((x) => x.id === unidadeId)!;
  const destino = acharArquivoCapitulo(obra, u.rotulo);
  if (!destino) throw new Error(`capítulo ${u.rotulo} não existe no manuscrito`);

  arquivar(obra, unidadeId, versao.estagio, "antes-de-restaurar");

  const origem = caminhoDaVersao(obra, unidadeId, versao);
  if (versao.tipo === "pasta") {
    rmSync(destino, { recursive: true, force: true });
    cpSync(origem, destino, { recursive: true });
  } else {
    writeFileSync(destino, readFileSync(origem, "utf8"));
  }
  registrar(obra, "VERSAO_RESTAURADA", { unidade: unidadeId, versao: versao.id });
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function diasAtras(iso: string): string {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (d <= 0) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `${d} dias atrás`;
  const m = Math.floor(d / 30);
  return `${m} ${m === 1 ? "mês" : "meses"} atrás`;
}

/** Aceita o número da lista (1-based) ou um pedaço do id / da data. */
function escolher(versoes: Versao[], ref: string): Versao | null {
  const n = Number(ref);
  if (Number.isInteger(n) && n >= 1 && n <= versoes.length) return versoes[versoes.length - n];
  return versoes.find((v) => v.id.startsWith(ref) || v.quando.startsWith(ref)) ?? null;
}

function main(): number {
  let obra: string;
  try {
    obra = exigirObra(arg("obra"));
  } catch (e) {
    console.error((e as Error).message);
    return 2;
  }

  const unidade = arg("unidade");
  if (!unidade) {
    console.error(`
  uso: editora versoes --unidade cap-07 [opções]

    (sem opção)          lista as versões guardadas
    --ver <n>            mostra uma delas
    --restaurar <n>      devolve o capítulo àquela versão
    --json

  <n> é o número da lista, ou um pedaço da data (2026-03-14).
`);
    return 2;
  }

  const estado = lerEstado(obra);
  const u = estado.unidades.find((x) => x.id === unidade);
  if (!u) {
    console.error(`  ✗ unidade desconhecida: "${unidade}"`);
    return 2;
  }

  const versoes = lerVersoes(obra, unidade);
  const grafo = carregarGrafo();
  const nomeEstagio = (slug: string) =>
    grafo.estagios.find((e) => e.slug === slug)?.nome ?? slug;

  // --- ver -----------------------------------------------------------------
  const ver = arg("ver");
  if (ver) {
    const v = escolher(versoes, ver);
    if (!v) {
      console.error(`  ✗ versão "${ver}" não encontrada.`);
      return 1;
    }
    const c = caminhoDaVersao(obra, unidade, v);
    if (v.tipo === "pasta") {
      for (const f of readdirSync(c).sort()) {
        console.log(`\n───── ${f} ─────\n`);
        console.log(readFileSync(join(c, f), "utf8"));
      }
    } else {
      console.log(readFileSync(c, "utf8"));
    }
    return 0;
  }

  // --- restaurar -----------------------------------------------------------
  const alvo = arg("restaurar");
  if (alvo) {
    const v = escolher(versoes, alvo);
    if (!v) {
      console.error(`  ✗ versão "${alvo}" não encontrada.`);
      return 1;
    }
    restaurar(obra, unidade, v);
    console.log(
      `\n  ↺ ${u.rotulo} restaurado para a versão de ${v.quando.slice(0, 10)} ` +
        `(${nomeEstagio(v.estagio)}, ${v.palavras} palavras).`,
    );
    console.log(`    A versão que estava aqui foi guardada antes — nada se perdeu.\n`);
    return 0;
  }

  // --- listar --------------------------------------------------------------
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(versoes, null, 2));
    return 0;
  }

  if (versoes.length === 0) {
    console.log(`\n  Nenhuma versão guardada de ${u.rotulo} ainda.`);
    console.log(`  O motor guarda sozinho ao abrir e ao aprovar cada etapa de prosa.\n`);
    return 0;
  }

  console.log(`\n  ${versoes.length} versão(ões) de ${u.rotulo}\n`);
  [...versoes].reverse().forEach((v, i) => {
    const rotuloEvento =
      v.evento === "aprovado" ? "aprovado" : v.evento === "antes" ? "antes de" : "pré-restauro";
    console.log(
      `    ${String(i + 1).padStart(2)}.  ${v.quando.slice(0, 10)}  ` +
        `${nomeEstagio(v.estagio).padEnd(24)} ${rotuloEvento.padEnd(13)} ` +
        `${String(v.palavras).padStart(5)} palavras   ${diasAtras(v.quando)}`,
    );
  });
  console.log(`\n  editora versoes --unidade ${unidade} --ver 2`);
  console.log(`  editora versoes --unidade ${unidade} --restaurar 2\n`);
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

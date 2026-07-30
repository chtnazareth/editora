#!/usr/bin/env bun
/**
 * editora-revisar.ts — sai do caminho reto sem perder o lugar.
 *
 * Um livro leva meses e não é escrito em linha reta: você chega no capítulo 19
 * e quer repensar a protagonista; relê o capítulo 1 seis meses depois; muda o
 * nome de uma cidade. Este comando abre um **desvio** — reabre o que precisa
 * ser revisto e guarda onde você estava, para o motor te devolver ao mesmo
 * ponto quando a revisão fechar.
 *
 * Uso:
 *   editora revisar --sobre "Vela"                       # acha sozinho onde ela vive
 *   editora revisar --unidade cap-07                     # o ciclo do capítulo
 *   editora revisar --unidade cap-07 --estagio rascunho  # daí para a frente
 *   editora revisar --unidade cap-07 --estagio rascunho --so-esta
 *   editora revisar --estagio elenco                     # repensar o elenco
 *   editora revisar --cancelar
 */

import { carregarGrafo, exigirObra } from "./editora-lib.ts";
import { registrar } from "./editora-audit.ts";
import {
  abrirDesvio,
  cancelarDesvio,
  cascataDe,
  estagiosNoEscopo,
  lerEstado,
  proximoEstagio,
  type AlvoDesvio,
} from "./editora-state.ts";
import { procurarNoCanon, procurarNoManuscrito } from "./editora-impacto.ts";

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const USO = `
  uso: editora revisar [alvo] [opções]

  alvo — uma destas formas:
    --sobre "<termo>"        acha onde o termo vive e propõe o alvo
    --unidade cap-07         o ciclo inteiro daquele capítulo
    --estagio <slug>         uma etapa fora do laço (elenco, biblia-mundo…)
    --unidade cap-07 --estagio rascunho    daquela etapa para a frente

  opções:
    --so-esta                não reabre as etapas seguintes do capítulo
    --motivo "<texto>"       fica registrado na auditoria e no estado
    --cancelar               desiste do desvio aberto e restaura tudo
`;

// ---------------------------------------------------------------------------

function main(): number {
  let obra: string;
  try {
    obra = exigirObra(arg("obra"));
  } catch (e) {
    console.error((e as Error).message);
    return 2;
  }

  const grafo = carregarGrafo();
  const estado = lerEstado(obra);

  // --- cancelar ------------------------------------------------------------
  if (process.argv.includes("--cancelar")) {
    const desvio = cancelarDesvio(obra, estado);
    if (!desvio) {
      console.log("  Nenhum desvio aberto.");
      return 0;
    }
    registrar(obra, "DESVIO_FECHADO", { alvo: desvio.alvo.estagio, cancelado: "sim" });
    console.log(`\n  ↩ desvio em "${desvio.alvo.estagio}" cancelado. Tudo voltou como estava.\n`);
    return 0;
  }

  if (estado.desvio) {
    const d = estado.desvio;
    console.error(
      `\n  ✗ já existe um desvio aberto em "${d.alvo.estagio}"${d.alvo.unidade ? ` · ${d.alvo.unidade}` : ""}.\n` +
        `    Termine-o, ou desista com:  editora revisar --cancelar\n`,
    );
    return 1;
  }

  const motivo = arg("motivo");
  const soEsta = process.argv.includes("--so-esta");
  let alvo: AlvoDesvio | null = null;

  // --- --sobre: descobrir o alvo -------------------------------------------
  const sobre = arg("sobre");
  if (sobre) {
    const canon = procurarNoCanon(obra, [sobre]);
    const capitulos = procurarNoManuscrito(obra, estado, [sobre]);

    console.log(`\n  "${sobre}" aparece em:\n`);
    for (const c of canon)
      console.log(`    ${String(c.ocorrencias).padStart(3)}×  ${c.arquivo}   → estágio ${c.estagio}`);
    for (const c of capitulos)
      console.log(`    ${String(c.ocorrencias).padStart(3)}×  ${c.rotulo}${c.reconferir ? "  (aprovado)" : ""}`);
    if (canon.length === 0 && capitulos.length === 0) {
      console.log("    (nada — confira a grafia)\n");
      return 1;
    }
    console.log("");

    const estagiosCanon = [...new Set(canon.map((c) => c.estagio))].filter(Boolean) as string[];
    if (estagiosCanon.length === 1) {
      alvo = { estagio: estagiosCanon[0], unidade: null };
    } else if (estagiosCanon.length > 1) {
      console.error(
        `  ✗ o termo vive em mais de um lugar do canon (${estagiosCanon.join(", ")}).\n` +
          `    Escolha:  editora revisar --estagio <slug>\n`,
      );
      return 1;
    } else {
      console.error(
        `  ✗ o termo só aparece em capítulos, não no canon.\n` +
          `    Escolha um:  editora revisar --unidade ${capitulos[0].unidade}\n`,
      );
      return 1;
    }
  }

  // --- alvo explícito ------------------------------------------------------
  const unidade = arg("unidade") ?? null;
  const estagioArg = arg("estagio");

  if (!alvo) {
    if (estagioArg) {
      alvo = { estagio: estagioArg, unidade };
    } else if (unidade) {
      // Capítulo sem etapa nomeada: o ciclo inteiro, a partir da primeira
      // etapa de laço do escopo.
      const primeiraDoLaco = estagiosNoEscopo(grafo, estado.escopo).find((e) => e.para_cada);
      if (!primeiraDoLaco) {
        console.error("  ✗ este escopo não tem etapas em laço.");
        return 1;
      }
      alvo = { estagio: primeiraDoLaco.slug, unidade };
    } else {
      console.error(USO);
      return 2;
    }
  }

  // --- validação -----------------------------------------------------------
  const estagio = grafo.estagios.find((e) => e.slug === alvo.estagio);
  if (!estagio) {
    console.error(`  ✗ estágio desconhecido: "${alvo.estagio}"`);
    return 2;
  }
  if (!estagiosNoEscopo(grafo, estado.escopo).some((e) => e.slug === alvo.estagio)) {
    console.error(`  ✗ "${alvo.estagio}" não roda no escopo ${estado.escopo}.`);
    return 1;
  }
  if (estagio.para_cada && !alvo.unidade) {
    console.error(`  ✗ "${alvo.estagio}" é etapa de capítulo. Informe --unidade.`);
    return 2;
  }
  if (alvo.unidade && !estado.unidades.some((u) => u.id === alvo.unidade)) {
    console.error(`  ✗ unidade desconhecida: "${alvo.unidade}"`);
    return 2;
  }

  // --- abrir ---------------------------------------------------------------
  const cursorAntes = proximoEstagio(estado, grafo);
  const cascata = cascataDe(grafo, estado, alvo.estagio, alvo.unidade, soEsta);
  const desvio = abrirDesvio(obra, estado, grafo, alvo, { motivo, soEsta });
  registrar(obra, "DESVIO_ABERTO", {
    alvo: alvo.estagio,
    unidade: alvo.unidade ?? undefined,
    retorno: desvio.retorno.estagio ?? undefined,
    motivo,
  });

  const onde = alvo.unidade ? `${estagio.nome} · ${alvo.unidade}` : estagio.nome;
  console.log(`\n  ↰ desvio aberto — ${onde}`);
  if (motivo) console.log(`    motivo: ${motivo}`);
  console.log("");
  console.log("    vai revisar:");
  for (const p of cascata) {
    const e = grafo.estagios.find((x) => x.slug === p.estagio)!;
    console.log(`      ${e.ordem}  ${e.nome}${p.unidade ? ` · ${p.unidade}` : ""}`);
  }
  console.log("");
  console.log(
    cursorAntes
      ? `    ao fechar, o método volta sozinho para: ${cursorAntes.ordem} ${cursorAntes.nome}`
      : "    não havia ponto de retorno — o fluxo já estava no fim.",
  );
  console.log(`\n  Próximo passo:  editora proximo\n`);
  return 0;
}

if (import.meta.main) process.exit(main());

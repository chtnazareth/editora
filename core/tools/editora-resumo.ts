#!/usr/bin/env bun
/**
 * editora-resumo.ts — o briefing de quem volta.
 *
 * Um livro leva meses e você fecha o notebook no meio. Isto responde, em dez
 * linhas, o que você precisaria reconstruir de cabeça: onde parou, o que está
 * esperando por você, o que decidiu desde a última vez, e o que ficou em aberto.
 *
 * Uso:
 *   editora resumo [--json] [--nao-marcar]
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  carregarGrafo,
  dirAuditoria,
  dirMemoria,
  dirRegistro,
  exigirObra,
} from "./editora-lib.ts";
import {
  estagiosNoEscopo,
  gravarEstado,
  lerEstado,
  proximaUnidade,
  proximoEstagio,
  type Estado,
} from "./editora-state.ts";

// ---------------------------------------------------------------------------
// Coleta
// ---------------------------------------------------------------------------

interface EventoLido {
  quando: string;
  tipo: string;
  detalhe: string;
}

/** Eventos da auditoria posteriores ao último acesso do autor. */
export function eventosDesde(obra: string, desde: string): EventoLido[] {
  const dir = dirAuditoria(obra);
  if (!existsSync(dir)) return [];
  const eventos: EventoLido[] = [];
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith(".md")) continue;
    for (const linha of readFileSync(join(dir, f), "utf8").split(/\r?\n/)) {
      const m = /^- `([^`]+)` \*\*([A-Z_]+)\*\*(?: — (.*))?$/.exec(linha);
      if (!m) continue;
      if (m[1] <= desde) continue;
      eventos.push({ quando: m[1], tipo: m[2], detalhe: m[3] ?? "" });
    }
  }
  return eventos;
}

function varrerMd(dir: string, saida: string[] = []): string[] {
  if (!existsSync(dir)) return saida;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) varrerMd(p, saida);
    else if (e === "memoria.md") saida.push(p);
  }
  return saida;
}

/** Extrai o conteúdo de uma seção `## <titulo>` de um markdown. */
function secao(texto: string, titulo: string): string[] {
  const re = new RegExp(`^##\\s+${titulo}\\s*$`, "im");
  const m = re.exec(texto);
  if (!m) return [];
  const resto = texto.slice(m.index + m[0].length);
  const fim = /^##\s+/m.exec(resto);
  return (fim ? resto.slice(0, fim.index) : resto)
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter((l) => l.length > 0 && !l.startsWith("<!--"));
}

export interface PerguntaAberta {
  origem: string;
  texto: string;
}

export function perguntasEmAberto(obra: string): PerguntaAberta[] {
  const saida: PerguntaAberta[] = [];
  for (const arq of varrerMd(dirRegistro(obra))) {
    const estagio = arq.split("/").slice(-2)[0];
    for (const t of secao(readFileSync(arq, "utf8"), "Perguntas em aberto")) {
      saida.push({ origem: estagio, texto: t });
    }
  }
  // As adiadas da sabatina são as mais importantes: têm prazo.
  const adiadas = join(dirRegistro(obra), "ideacao", "sabatina", "perguntas-adiadas.md");
  if (existsSync(adiadas)) {
    for (const linha of readFileSync(adiadas, "utf8").split(/\r?\n/)) {
      const t = linha.replace(/^[-*]\s*/, "").trim();
      if (t.length > 3 && !t.startsWith("#") && !t.startsWith("<!--") && !t.startsWith("|"))
        saida.push({ origem: "sabatina (adiada)", texto: t });
    }
  }
  return saida;
}

// ---------------------------------------------------------------------------
// Montagem
// ---------------------------------------------------------------------------

function diasDesde(iso: string): number {
  const ms = Date.now() - Date.parse(iso);
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function montarResumo(obra: string, estado: Estado) {
  const grafo = carregarGrafo();
  const noEscopo = estagiosNoEscopo(grafo, estado.escopo);
  const feitos = noEscopo.filter((e) => {
    const s = estado.estagios[e.slug]?.status;
    return s === "concluido" || s === "pulado";
  }).length;

  const portao = noEscopo.find(
    (e) => estado.estagios[e.slug]?.status === "aguardando-aprovacao",
  );
  const proximo = proximoEstagio(estado, grafo);
  const eventos = eventosDesde(obra, estado.ultimo_acesso);

  const conta = (tipo: string) => eventos.filter((e) => e.tipo === tipo).length;

  return {
    titulo: estado.titulo,
    escopo: estado.escopo,
    progresso: { feitos, total: noEscopo.length },
    dias_parado: diasDesde(estado.ultimo_acesso),
    portao_aberto: portao
      ? { estagio: portao.slug, nome: portao.nome, unidade: estado.unidade_atual }
      : null,
    desvio: estado.desvio,
    proximo: proximo
      ? {
          estagio: proximo.slug,
          nome: proximo.nome,
          ordem: proximo.ordem,
          agente: proximo.agente_lider,
          unidade: proximo.para_cada ? proximaUnidade(estado, proximo.slug) : null,
        }
      : null,
    desde_a_ultima_sessao: {
      aprovados: conta("PORTAO_APROVADO"),
      mudancas_pedidas: conta("PORTAO_REJEITADO"),
      capitulos_fechados: conta("UNIDADE_CONCLUIDA"),
      desvios: conta("DESVIO_ABERTO"),
      total_eventos: eventos.length,
    },
    perguntas: perguntasEmAberto(obra),
    capitulos_prontos: estado.unidades.filter((u) => u.status === "concluida").length,
    capitulos_total: estado.unidades.length,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function imprimir(r: ReturnType<typeof montarResumo>): void {
  console.log(`\n  ${r.titulo} · ${r.progresso.feitos}/${r.progresso.total} estágios`);
  if (r.capitulos_total > 1)
    console.log(`  ${r.capitulos_prontos}/${r.capitulos_total} capítulos prontos`);
  console.log("");

  if (r.desvio) {
    const d = r.desvio;
    const onde = d.alvo.unidade ? `${d.alvo.estagio} · ${d.alvo.unidade}` : d.alvo.estagio;
    console.log(`  ↰ Desvio aberto: ${onde}${d.motivo ? ` — ${d.motivo}` : ""}`);
    console.log(`     ao fechar, volta para ${d.retorno.estagio ?? "o fim do fluxo"}\n`);
  }

  if (r.portao_aberto) {
    console.log(`  ⏸ Portão aberto: ${r.portao_aberto.nome}`);
    console.log(`     esperando a sua decisão\n`);
  } else if (r.proximo) {
    const u = r.proximo.unidade ? ` · ${r.proximo.unidade}` : "";
    console.log(`  ▶ Próximo: ${r.proximo.ordem} ${r.proximo.nome}${u}`);
    console.log(`     ${r.proximo.agente}\n`);
  } else {
    console.log("  🎉 O fluxo chegou ao fim.\n");
  }

  const d = r.desde_a_ultima_sessao;
  if (d.total_eventos > 0) {
    const quando = r.dias_parado === 0 ? "hoje" : `${r.dias_parado} dia(s) atrás`;
    console.log(`  Desde a última sessão (${quando}):`);
    if (d.aprovados) console.log(`    · ${d.aprovados} estágio(s) aprovado(s)`);
    if (d.mudancas_pedidas) console.log(`    · ${d.mudancas_pedidas} pedido(s) de mudança`);
    if (d.capitulos_fechados) console.log(`    · ${d.capitulos_fechados} capítulo(s) fechado(s)`);
    if (d.desvios) console.log(`    · ${d.desvios} desvio(s)`);
    console.log("");
  }

  if (r.perguntas.length > 0) {
    console.log(`  Em aberto (${r.perguntas.length}):`);
    for (const p of r.perguntas.slice(0, 6))
      console.log(`    · ${p.texto}  _(${p.origem})_`);
    if (r.perguntas.length > 6) console.log(`    · … mais ${r.perguntas.length - 6}`);
    console.log("");
  }
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
  const resumo = montarResumo(obra, estado);

  if (process.argv.includes("--json")) console.log(JSON.stringify(resumo, null, 2));
  else imprimir(resumo);

  // Marca a visita, para o próximo resumo saber o que é novidade.
  if (!process.argv.includes("--nao-marcar")) {
    estado.ultimo_acesso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    gravarEstado(obra, estado);
  }
  return 0;
}

if (import.meta.main) process.exit(main());

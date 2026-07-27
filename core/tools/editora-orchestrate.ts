#!/usr/bin/env bun
/**
 * editora-orchestrate.ts — o motor que o condutor obedece.
 *
 * Porte de `core/tools/aidlc-orchestrate.ts`. Duas responsabilidades:
 *   `proximo`   — emite a diretiva do próximo estágio (JSON) com caminhos já
 *                 resolvidos, para o condutor não precisar adivinhar nada.
 *   `reportar`  — recebe o desfecho e dirige a transição de estado + auditoria.
 *
 * Regra de ouro portada literalmente: o motor é dono de TODA transição de ciclo
 * de vida. O condutor nunca escreve estado à mão.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  NOME_FASE,
  carregarGrafo,
  dirRegistro,
  dirRegistroEstagio,
  exigirObra,
  type Estagio,
  type Grafo,
} from "./editora-lib.ts";
import { registrar, registrarBloco } from "./editora-audit.ts";
import {
  definirStatus,
  estagiosNoEscopo,
  guardaConclusao,
  lerEstado,
  gravarEstado,
  proximoDepoisDe,
  proximoEstagio,
  type Estado,
} from "./editora-state.ts";

/** Depois de 3 ciclos de "pedir mudanças" o portão ganha "Aceitar como está". */
export const CICLOS_ATE_ESCAPE = 3;

// ---------------------------------------------------------------------------
// Diretiva
// ---------------------------------------------------------------------------

export interface Diretiva {
  estagio: string;
  nome: string;
  fase: string;
  fase_exibicao: string;
  ordem: string;
  execucao: string;
  condicao: string;
  agente_lider: string;
  agentes_apoio: string[];
  modo: string;
  revisor: string | null;
  revisor_max_iteracoes: number | null;
  para_cada: string | null;
  unidade: string | null;
  exige_manuscrito: boolean;
  dir_registro: string;
  produz: { artefato: string; caminho: string; existe: boolean }[];
  consome: {
    artefato: string;
    caminho: string | null;
    existe: boolean;
    obrigatorio: boolean;
  }[];
  sensores: string[];
  entradas: string;
  saidas: string;
  proximo_estagio: string | null;
  proximo_estagio_nome: string | null;
  ciclos_revisao: number;
  escape_hatch: boolean;
  progresso: {
    feitos: number;
    total_escopo: number;
    total_compilado: number;
    fase_feitos: number;
    fase_total: number;
  };
}

/** Resolve onde vive um artefato produzido por qualquer estágio. */
function caminhoArtefato(
  obra: string,
  grafo: Grafo,
  artefato: string,
  unidade: string | null,
): string | null {
  const dono = grafo.estagios.find((e) => e.produz.includes(artefato));
  if (!dono) return null;
  const base = dirRegistroEstagio(obra, dono.fase, dono.slug);
  return dono.para_cada && unidade
    ? join(base, unidade, `${artefato}.md`)
    : join(base, `${artefato}.md`);
}

export function montarDiretiva(
  obra: string,
  estado: Estado,
  grafo: Grafo,
  estagio: Estagio,
  unidade: string | null,
): Diretiva {
  const noEscopo = estagiosNoEscopo(grafo, estado.escopo);
  const feitos = noEscopo.filter((e) => {
    const s = estado.estagios[e.slug]?.status;
    return s === "concluido" || s === "pulado";
  }).length;
  const daFase = noEscopo.filter((e) => e.fase === estagio.fase);
  const faseFeitos = daFase.filter((e) => {
    const s = estado.estagios[e.slug]?.status;
    return s === "concluido" || s === "pulado";
  }).length;

  const prox = proximoDepoisDe(estado, grafo, estagio.slug);
  const baseRegistro =
    estagio.para_cada && unidade
      ? join(dirRegistroEstagio(obra, estagio.fase, estagio.slug), unidade)
      : dirRegistroEstagio(obra, estagio.fase, estagio.slug);
  const ciclos = estado.estagios[estagio.slug]?.ciclos_revisao ?? 0;

  return {
    estagio: estagio.slug,
    nome: estagio.nome,
    fase: estagio.fase,
    fase_exibicao: NOME_FASE[estagio.fase],
    ordem: estagio.ordem,
    execucao: estagio.execucao,
    condicao: estagio.condicao,
    agente_lider: estagio.agente_lider,
    agentes_apoio: estagio.agentes_apoio,
    modo: estagio.modo,
    revisor: estagio.revisor ?? null,
    revisor_max_iteracoes: estagio.revisor_max_iteracoes ?? null,
    para_cada: estagio.para_cada ?? null,
    unidade,
    exige_manuscrito: estagio.exige_manuscrito ?? false,
    dir_registro: baseRegistro,
    produz: estagio.produz.map((a) => {
      const caminho = join(baseRegistro, `${a}.md`);
      return { artefato: a, caminho, existe: existsSync(caminho) };
    }),
    consome: estagio.consome.map((c) => {
      const caminho = caminhoArtefato(obra, grafo, c.artefato, unidade);
      return {
        artefato: c.artefato,
        caminho,
        existe: caminho !== null && existsSync(caminho),
        obrigatorio: c.obrigatorio,
      };
    }),
    sensores: estagio.sensores,
    entradas: estagio.entradas,
    saidas: estagio.saidas,
    proximo_estagio: prox?.slug ?? null,
    proximo_estagio_nome: prox?.nome ?? null,
    ciclos_revisao: ciclos,
    escape_hatch: ciclos >= CICLOS_ATE_ESCAPE,
    progresso: {
      feitos,
      total_escopo: noEscopo.length,
      total_compilado: grafo.estagios.length,
      fase_feitos: faseFeitos,
      fase_total: daFase.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Próxima unidade pendente (fase de construção)
// ---------------------------------------------------------------------------

function proximaUnidade(estado: Estado, slug: string): string | null {
  for (const u of estado.unidades) {
    const st = u.estagios[slug];
    if (st !== "concluido" && st !== "pulado") return u.id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Comandos
// ---------------------------------------------------------------------------

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function comandoProximo(obra: string): number {
  const grafo = carregarGrafo();
  const estado = lerEstado(obra);
  const estagio = proximoEstagio(estado, grafo);

  if (!estagio) {
    console.log(
      JSON.stringify(
        { fluxo: "concluido", mensagem: `"${estado.titulo}" percorreu todos os estágios do escopo ${estado.escopo}.` },
        null,
        2,
      ),
    );
    return 0;
  }

  const unidade = estagio.para_cada
    ? (arg("unidade") ?? proximaUnidade(estado, estagio.slug))
    : null;

  if (estagio.para_cada && !unidade) {
    console.log(
      JSON.stringify(
        { estagio: estagio.slug, laco: "esgotado", mensagem: "Todas as unidades já passaram por este estágio." },
        null,
        2,
      ),
    );
    return 0;
  }

  console.log(
    JSON.stringify(montarDiretiva(obra, estado, grafo, estagio, unidade), null, 2),
  );
  return 0;
}

function comandoIniciar(obra: string): number {
  const grafo = carregarGrafo();
  const estado = lerEstado(obra);
  const slug = arg("estagio");
  const estagio = grafo.estagios.find((e) => e.slug === slug);
  if (!estagio) {
    console.error(`estágio desconhecido: ${slug}`);
    return 2;
  }
  const unidade = arg("unidade") ?? null;
  definirStatus(obra, estado, estagio.slug, "em-andamento");
  if (unidade) {
    const u = estado.unidades.find((x) => x.id === unidade);
    if (u) {
      u.status = "em-andamento";
      u.estagios[estagio.slug] = "em-andamento";
      estado.unidade_atual = unidade;
      gravarEstado(obra, estado);
      registrar(obra, "UNIDADE_INICIADA", { unidade, estagio: estagio.slug });
    }
  }
  registrar(obra, "ESTAGIO_INICIADO", { estagio: estagio.slug, unidade: unidade ?? undefined });
  console.log(
    JSON.stringify(montarDiretiva(obra, lerEstado(obra), grafo, estagio, unidade), null, 2),
  );
  return 0;
}

function comandoReportar(obra: string): number {
  const grafo = carregarGrafo();
  let estado = lerEstado(obra);
  const slug = arg("estagio");
  const resultado = arg("resultado");
  const entrada = arg("entrada");
  const unidade = arg("unidade") ?? estado.unidade_atual;

  const estagio = grafo.estagios.find((e) => e.slug === slug);
  if (!estagio) {
    console.error(`estágio desconhecido: ${slug}`);
    return 2;
  }

  switch (resultado) {
    case "aguardando-aprovacao": {
      const g = guardaConclusao(obra, estagio, unidade ?? undefined);
      for (const a of g.avisos) console.warn(`⚠ ${a}`);
      if (!g.passou) {
        console.error(
          `✗ o portão não abre: "${estagio.slug}" declara produzir artefatos que não existem no disco.`,
        );
        for (const f of g.faltando) console.error(`    · ${f}`);
        console.error("  Escreva os artefatos e reporte de novo.");
        return 1;
      }
      definirStatus(obra, estado, estagio.slug, "aguardando-aprovacao");
      registrar(obra, "ESTAGIO_AGUARDANDO_APROVACAO", {
        estagio: estagio.slug,
        unidade: unidade ?? undefined,
      });
      console.log(`✓ portão aberto para "${estagio.nome}" — aguardando sua decisão.`);
      return 0;
    }

    case "aprovado":
    case "aceito-como-esta": {
      definirStatus(obra, estado, estagio.slug, "concluido");
      registrar(
        obra,
        resultado === "aprovado" ? "PORTAO_APROVADO" : "ACEITO_COMO_ESTA",
        { estagio: estagio.slug, unidade: unidade ?? undefined, escolha: entrada },
      );
      registrar(obra, "ESTAGIO_CONCLUIDO", { estagio: estagio.slug });

      estado = lerEstado(obra);
      if (unidade && estagio.para_cada) {
        const u = estado.unidades.find((x) => x.id === unidade);
        if (u) {
          u.estagios[estagio.slug] = "concluido";
          // A unidade só fecha quando passou por todos os estágios do laço.
          const doLaco = grafo.estagios.filter((e) => e.para_cada === estagio.para_cada);
          const todos = doLaco.every((e) => u.estagios[e.slug] === "concluido");
          if (todos) {
            u.status = "concluida";
            registrar(obra, "UNIDADE_CONCLUIDA", { unidade });
          }
          gravarEstado(obra, estado);
        }
      }

      // Estágio em laço volta a ficar pendente enquanto restarem unidades.
      if (estagio.para_cada) {
        const resta = proximaUnidade(estado, estagio.slug);
        if (resta) {
          definirStatus(obra, estado, estagio.slug, "em-andamento", { forcar: true });
          definirStatus(obra, lerEstado(obra), estagio.slug, "pendente", { forcar: true });
        }
      }

      estado = lerEstado(obra);
      const prox = proximoEstagio(estado, grafo);
      if (!prox) {
        registrar(obra, "FLUXO_CONCLUIDO", { titulo: estado.titulo });
        console.log(`🎉 "${estado.titulo}" percorreu todos os estágios do escopo.`);
        return 0;
      }
      const noEscopo = estagiosNoEscopo(grafo, estado.escopo);
      const feitos = noEscopo.filter((e) => {
        const s = estado.estagios[e.slug]?.status;
        return s === "concluido" || s === "pulado";
      }).length;
      const daFase = noEscopo.filter((e) => e.fase === prox.fase);
      const faseFeitos = daFase.filter((e) => {
        const s = estado.estagios[e.slug]?.status;
        return s === "concluido" || s === "pulado";
      }).length;
      console.log(
        `Progresso: ${feitos}/${noEscopo.length} estágios no escopo (${grafo.estagios.length} compilados) | ` +
          `${faseFeitos}/${daFase.length} ${NOME_FASE[prox.fase]}. Próximo: ${prox.nome}`,
      );
      return 0;
    }

    case "rejeitado": {
      definirStatus(obra, estado, estagio.slug, "revisando");
      registrar(obra, "PORTAO_REJEITADO", {
        estagio: estagio.slug,
        ciclo: lerEstado(obra).estagios[estagio.slug].ciclos_revisao,
      });
      if (entrada) registrarBloco(obra, `Pedido de mudança: ${estagio.nome}`, entrada);
      const ciclos = lerEstado(obra).estagios[estagio.slug].ciclos_revisao;
      console.log(`↩ "${estagio.nome}" em revisão (ciclo ${ciclos}).`);
      if (ciclos === CICLOS_ATE_ESCAPE - 1)
        console.log('  Após mais uma revisão, a opção "Aceitar como está" fica disponível.');
      if (ciclos >= CICLOS_ATE_ESCAPE)
        console.log('  Escape liberado: o próximo portão inclui "Aceitar como está".');
      return 0;
    }

    case "revisado": {
      definirStatus(obra, estado, estagio.slug, "aguardando-aprovacao");
      registrar(obra, "ESTAGIO_AGUARDANDO_APROVACAO", {
        estagio: estagio.slug,
        revisao: "sim",
      });
      console.log(`✓ revisão entregue — portão reaberto para "${estagio.nome}".`);
      return 0;
    }

    case "pulado": {
      definirStatus(obra, estado, estagio.slug, "pulado", { motivo: entrada });
      registrar(obra, "ESTAGIO_PULADO", { estagio: estagio.slug, motivo: entrada });
      console.log(`⤼ "${estagio.nome}" pulado.`);
      return 0;
    }

    default:
      console.error(
        "resultado inválido. Use: aguardando-aprovacao | aprovado | rejeitado | revisado | pulado | aceito-como-esta",
      );
      return 2;
  }
}

function comandoStatus(obra: string): number {
  const grafo = carregarGrafo();
  const estado = lerEstado(obra);
  const noEscopo = estagiosNoEscopo(grafo, estado.escopo);
  const feitos = noEscopo.filter((e) => {
    const s = estado.estagios[e.slug]?.status;
    return s === "concluido" || s === "pulado";
  }).length;
  const emAberto = noEscopo.find(
    (e) => estado.estagios[e.slug]?.status === "aguardando-aprovacao",
  );

  console.log(`\n  ${estado.titulo} — escopo ${estado.escopo} · profundidade ${estado.profundidade}`);
  console.log(`  ${feitos}/${noEscopo.length} estágios no escopo · registro em ${dirRegistro(obra).replace(`${obra}/`, "")}\n`);
  if (emAberto) console.log(`  ⏸ portão aberto: ${emAberto.nome} — aguardando sua decisão.\n`);
  const atual = proximoEstagio(estado, grafo);
  if (atual) console.log(`  ▶ próximo: ${atual.ordem} ${atual.nome} (${atual.agente_lider})\n`);
  else console.log("  🎉 fluxo concluído.\n");
  return 0;
}

function main(): number {
  const comando = process.argv[2];
  const obra = exigirObra(arg("obra"));
  switch (comando) {
    case "proximo":
      return comandoProximo(obra);
    case "iniciar":
      return comandoIniciar(obra);
    case "reportar":
      return comandoReportar(obra);
    case "status":
      return comandoStatus(obra);
    default:
      console.error(
        "uso: editora-orchestrate.ts <proximo|iniciar|reportar|status> [--estagio S] [--unidade U] [--resultado R] [--entrada T]",
      );
      return 2;
  }
}

if (import.meta.main) process.exit(main());

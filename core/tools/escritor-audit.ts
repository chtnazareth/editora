/**
 * escritor-audit.ts — trilha de auditoria da obra.
 *
 * Porte de `core/tools/aidlc-log.ts` + `aidlc-audit.ts`. Cada evento vira uma
 * linha em `<obra>/.escritor/auditoria/<host>-<data>.md`. O arquivo é markdown
 * de propósito: você abre no Obsidian e lê o histórico de decisões do livro.
 */

import { appendFileSync, mkdirSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { agoraISO, dirAuditoria } from "./escritor-lib.ts";

export const EVENTOS = [
  "OBRA_INICIADA",
  "ESTAGIO_INICIADO",
  "ESTAGIO_AGUARDANDO_APROVACAO",
  "ESTAGIO_REVISANDO",
  "ESTAGIO_CONCLUIDO",
  "ESTAGIO_PULADO",
  "PORTAO_APROVADO",
  "PORTAO_REJEITADO",
  "ACEITO_COMO_ESTA",
  "PERGUNTA_RESPONDIDA",
  "SENSOR_DISPARADO",
  "SENSOR_FALHOU",
  "REVISOR_DESPACHADO",
  "REVISOR_VEREDITO",
  "APRENDIZADO_REGISTRADO",
  "UNIDADE_INICIADA",
  "UNIDADE_CONCLUIDA",
  "FLUXO_CONCLUIDO",
  "ERRO",
] as const;

export type Evento = (typeof EVENTOS)[number];

/** Correlator curto para amarrar disparo de sensor ao seu arquivo de detalhe. */
export function novoCorrelator(): string {
  return Math.random().toString(16).slice(2, 10).padStart(8, "0");
}

function caminhoTrilha(obra: string): string {
  const dia = agoraISO().slice(0, 10);
  const host = hostname().replace(/[^A-Za-z0-9-]/g, "-");
  return join(dirAuditoria(obra), `${host}-${dia}.md`);
}

export function registrar(
  obra: string,
  evento: Evento,
  detalhe: Record<string, string | number | undefined> = {},
): void {
  const dir = dirAuditoria(obra);
  mkdirSync(dir, { recursive: true });
  const campos = Object.entries(detalhe)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${String(v).replace(/\|/g, "¦").replace(/\n/g, " ")}`)
    .join(" · ");
  const linha = `- \`${agoraISO()}\` **${evento}**${campos ? ` — ${campos}` : ""}\n`;
  appendFileSync(caminhoTrilha(obra), linha);
}

/** Bloco de auditoria mais longo (feedback de rejeição, veredito de revisor). */
export function registrarBloco(
  obra: string,
  titulo: string,
  corpo: string,
): void {
  const dir = dirAuditoria(obra);
  mkdirSync(dir, { recursive: true });
  const bloco = `\n### ${titulo}\n\n_${agoraISO()}_\n\n${corpo.trim()}\n`;
  appendFileSync(caminhoTrilha(obra), bloco);
}

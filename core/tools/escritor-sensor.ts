#!/usr/bin/env bun
/**
 * escritor-sensor.ts — executor dos sensores.
 *
 * Porte de `core/tools/aidlc-sensor.ts`. Roda um analisador (ou todos os
 * declarados por um estágio) sobre um arquivo e grava o detalhe em
 * `<obra>/.escritor/registro/.sensores/<estagio>/<id>-<correlator>.md`,
 * exatamente como o AI-DLC faz com `.aidlc-sensors/`.
 *
 * Uso:
 *   bun core/tools/escritor-sensor.ts rodar --id translates --arquivo cap.md
 *   bun core/tools/escritor-sensor.ts estagio --estagio rascunho --unidade cap-01
 *   bun core/tools/escritor-sensor.ts listar
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  agoraISO,
  carregarGrafo,
  carregarSensores,
  dirRegistro,
  dirRegistroEstagio,
  exigirObra,
} from "./escritor-lib.ts";
import { acharArquivoCapitulo, lerEstado } from "./escritor-state.ts";
import { novoCorrelator, registrar } from "./escritor-audit.ts";
import {
  ANALISADORES,
  lerFrontmatterCampo,
  type Achado,
  type Contexto,
  type Resultado,
} from "./escritor-sensores.ts";

export function rodarSensor(id: string, ctx: Contexto): Resultado {
  const fn = ANALISADORES[id];
  if (!fn) throw new Error(`sensor desconhecido: "${id}"`);
  return fn(ctx);
}

/**
 * Sensores que medem PROSA e por isso rodam sobre o capítulo do manuscrito.
 * Os demais medem forma de documento e rodam sobre os artefatos de registro.
 */
export const SENSORES_DE_PROSA = new Set([
  "translates",
  "aforismo",
  "registro-baixo",
  "densidade",
  "abertura-cena",
  "deriva-pov",
  "repeticao",
  "metrica-capitulo",
]);

/**
 * Resolve os arquivos de manuscrito a medir. Com unidade, mede aquele capítulo;
 * sem unidade (estágios de livro inteiro, como `passe-voz`), mede todos.
 * Capítulo dividido em cenas vira um alvo por cena.
 */
function capitulosDaObra(obra: string, unidade?: string): string[] {
  let unidades;
  try {
    unidades = lerEstado(obra).unidades;
  } catch {
    return [];
  }
  const escolhidas = unidade ? unidades.filter((u) => u.id === unidade) : unidades;
  const saida: string[] = [];
  for (const u of escolhidas) {
    const alvo = acharArquivoCapitulo(obra, u.rotulo);
    if (!alvo) continue;
    if (statSync(alvo).isDirectory()) {
      for (const f of readdirSync(alvo).sort()) {
        if (f.endsWith(".md")) saida.push(join(alvo, f));
      }
    } else {
      saida.push(alvo);
    }
  }
  return saida;
}

function severidadeDoManifesto(id: string): "bloqueante" | "consultivo" {
  const m = carregarSensores().find((s) => s.id === id);
  return m?.severidade_padrao ?? "consultivo";
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

function renderizarRelatorio(
  r: Resultado,
  arquivo: string,
  correlator: string,
): string {
  const linhas: string[] = [
    `# Sensor \`${r.id}\` — ${r.passou ? "passou" : "FALHOU"}`,
    "",
    `- **arquivo:** \`${arquivo}\``,
    `- **quando:** ${agoraISO()}`,
    `- **correlator:** \`${correlator}\``,
    "",
    "## Métricas",
    "",
  ];
  for (const [k, v] of Object.entries(r.metricas)) linhas.push(`- \`${k}\`: ${v}`);

  linhas.push("", `## Achados (${r.achados.length})`, "");
  if (r.achados.length === 0) {
    linhas.push("_Nenhum._");
  } else {
    const porRegra = new Map<string, Achado[]>();
    for (const a of r.achados) {
      const lista = porRegra.get(a.regra) ?? [];
      lista.push(a);
      porRegra.set(a.regra, lista);
    }
    for (const [regra, lista] of porRegra) {
      linhas.push(`### \`${regra}\` — ${lista.length}`, "");
      linhas.push(`> ${lista[0].mensagem}`, "");
      for (const a of lista.slice(0, 12)) {
        linhas.push(`- linha ${a.linha}: \`${a.trecho}\``);
      }
      if (lista.length > 12) linhas.push(`- _… mais ${lista.length - 12}_`);
      linhas.push("");
    }
  }
  return `${linhas.join("\n")}\n`;
}

function imprimirTerminal(r: Resultado, arquivo: string): void {
  const marca = r.passou ? "✓" : "✗";
  const metricas = Object.entries(r.metricas)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`${marca} ${r.id.padEnd(22)} ${arquivo}`);
  if (metricas) console.log(`    ${metricas}`);
  const porRegra = new Map<string, Achado[]>();
  for (const a of r.achados) {
    const lista = porRegra.get(a.regra) ?? [];
    lista.push(a);
    porRegra.set(a.regra, lista);
  }
  for (const [regra, lista] of porRegra) {
    const sev = lista[0].severidade === "bloqueante" ? "‼" : "·";
    console.log(`    ${sev} ${regra} (${lista.length})`);
    for (const a of lista.slice(0, 3)) console.log(`        L${a.linha}  ${a.trecho}`);
    if (lista.length > 3) console.log(`        … mais ${lista.length - 3}`);
  }
}

function gravarDetalhe(
  obra: string,
  estagio: string,
  r: Resultado,
  arquivo: string,
): string {
  const correlator = novoCorrelator();
  const dir = join(dirRegistro(obra), ".sensores", estagio);
  mkdirSync(dir, { recursive: true });
  const destino = join(dir, `${r.id}-${correlator}.md`);
  writeFileSync(destino, renderizarRelatorio(r, arquivo, correlator));
  registrar(obra, r.passou ? "SENSOR_DISPARADO" : "SENSOR_FALHOU", {
    sensor: r.id,
    estagio,
    correlator,
    achados: r.achados.length,
  });
  return destino;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function montarContexto(caminho: string): Contexto {
  const texto = readFileSync(caminho, "utf8");
  const consome = arg("consome");
  const alvo = arg("alvo-palavras");
  return {
    caminho,
    texto,
    pov: arg("pov") ?? lerFrontmatterCampo(texto, "pov"),
    consome: consome ? consome.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    alvo_palavras: alvo ? Number(alvo) : undefined,
  };
}

function comandoRodar(): number {
  const id = arg("id");
  const caminho = arg("arquivo");
  if (!id || !caminho) {
    console.error("uso: rodar --id <sensor> --arquivo <caminho> [--pov N] [--consome a,b]");
    return 2;
  }
  if (!existsSync(caminho)) {
    console.error(`arquivo não encontrado: ${caminho}`);
    return 2;
  }
  const r = rodarSensor(id, montarContexto(caminho));
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    imprimirTerminal(r, caminho);
  }
  const bloqueia =
    !r.passou && severidadeDoManifesto(id) === "bloqueante";
  return bloqueia ? 1 : 0;
}

function comandoEstagio(): number {
  let obra: string;
  try {
    obra = exigirObra(arg("obra"));
  } catch (e) {
    console.error((e as Error).message);
    return 2;
  }
  const slug = arg("estagio");
  const unidade = arg("unidade");
  const grafo = carregarGrafo();
  const estagio = grafo.estagios.find((e) => e.slug === slug);
  if (!estagio) {
    console.error(`estágio desconhecido: ${slug}`);
    return 2;
  }
  if (estagio.sensores.length === 0) {
    console.log(`"${slug}" não declara sensores.`);
    return 0;
  }

  const base =
    estagio.para_cada && unidade
      ? join(dirRegistroEstagio(obra, estagio.fase, estagio.slug), unidade)
      : dirRegistroEstagio(obra, estagio.fase, estagio.slug);

  const arquivoExtra = arg("arquivo");
  const sensoresProsa = estagio.sensores.filter((id) => SENSORES_DE_PROSA.has(id));
  const sensoresDocumento = estagio.sensores.filter((id) => !SENSORES_DE_PROSA.has(id));

  // Artefatos de registro → sensores de forma e rastreabilidade.
  const alvosDocumento = arquivoExtra
    ? [arquivoExtra]
    : estagio.produz.map((a) => join(base, `${a}.md`)).filter(existsSync);

  // Capítulos do manuscrito → sensores de prosa. Sem esta separação o método
  // mediria o relatório em vez do texto, que é o erro que ele existe para evitar.
  const alvosProsa =
    arquivoExtra || sensoresProsa.length === 0
      ? (arquivoExtra ? [arquivoExtra] : [])
      : capitulosDaObra(obra, unidade);

  if (alvosDocumento.length === 0 && alvosProsa.length === 0) {
    console.error(
      `nenhum alvo para "${slug}": sem artefato em ${relative(obra, base)} e sem capítulo de manuscrito resolvido`,
    );
    return 1;
  }

  // Só cobra rastreabilidade dos artefatos upstream que existem de fato — um
  // escopo que pula o produtor torna o consumo inócuo (ver stage-definition.md).
  const consomeExistente = estagio.consome
    .map((c) => c.artefato)
    .filter((a) => {
      const dono = grafo.estagios.find((e) => e.produz.includes(a));
      if (!dono) return false;
      const p =
        dono.para_cada && unidade
          ? join(dirRegistroEstagio(obra, dono.fase, dono.slug), unidade, `${a}.md`)
          : join(dirRegistroEstagio(obra, dono.fase, dono.slug), `${a}.md`);
      return existsSync(p);
    });

  let falhas = 0;
  const rodar = (alvo: string, ids: string[]): void => {
    if (ids.length === 0) return;
    const ctx = montarContexto(alvo);
    ctx.consome = consomeExistente;
    for (const id of ids) {
      const r = rodarSensor(id, ctx);
      imprimirTerminal(r, relative(obra, alvo));
      const destino = gravarDetalhe(obra, estagio.slug, r, relative(obra, alvo));
      if (!r.passou) {
        console.log(`    detalhe: ${relative(obra, destino)}`);
        if (severidadeDoManifesto(id) === "bloqueante") falhas++;
      }
    }
  };

  for (const alvo of alvosDocumento) rodar(alvo, sensoresDocumento);
  for (const alvo of alvosProsa) rodar(alvo, sensoresProsa);

  if (falhas > 0) {
    console.error(`\n✗ ${falhas} sensor(es) bloqueante(s) falharam — o portão não abre assim.`);
    return 1;
  }
  console.log("\n✓ sensores do estágio passaram.");
  return 0;
}

function comandoListar(): number {
  for (const s of carregarSensores()) {
    const temAnalisador = ANALISADORES[s.id] ? "●" : "○ (sem analisador!)";
    console.log(`${temAnalisador} ${s.id.padEnd(22)} ${s.severidade_padrao.padEnd(12)} ${s.descricao}`);
  }
  return 0;
}

function main(): number {
  switch (process.argv[2]) {
    case "rodar":
      return comandoRodar();
    case "estagio":
      return comandoEstagio();
    case "listar":
      return comandoListar();
    default:
      console.error("uso: escritor-sensor.ts <rodar|estagio|listar> [opções]");
      return 2;
  }
}

if (import.meta.main) process.exit(main());

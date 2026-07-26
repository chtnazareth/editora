/**
 * escritor-lib.ts — núcleo compartilhado do motor AI-DLC Escritor.
 *
 * Porte de `core/tools/aidlc-lib.ts` (awslabs/aidlc-workflows@v2) do domínio de
 * software para o de manuscrito. Fornece: parser de subconjunto YAML (sem
 * dependência externa), leitura de frontmatter, tipos do grafo de estágios e
 * resolução de caminhos (método × obra).
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Parser de subconjunto YAML
// ---------------------------------------------------------------------------
// Cobre exatamente o que o frontmatter dos estágios usa: mapas, listas, listas
// de mapas, escalares entre aspas, fluxo inline (`[]`, `[a, b]`) e escalares de
// bloco (`>`, `>-`, `|`, `|-`). Deliberadamente NÃO é um YAML completo — o
// frontmatter é autorado dentro deste repo e o `doctor` recusa o que fugir daqui.

interface Linha {
  indent: number;
  texto: string;
  bruta: string;
}

interface Cursor {
  i: number;
}

const RE_CHAVE = /^([A-Za-z0-9_\-.]+):\s*(.*)$/;

function tokenizar(src: string): Linha[] {
  return src.split(/\r?\n/).map((bruta) => {
    const m = /^([ \t]*)(.*)$/.exec(bruta)!;
    return { indent: m[1].length, texto: m[2], bruta };
  });
}

function pularVazias(linhas: Linha[], c: Cursor): void {
  while (c.i < linhas.length) {
    const t = linhas[c.i].texto;
    if (t === "" || t.startsWith("#")) c.i++;
    else break;
  }
}

/** Divide `a, b, {c: d}` respeitando aspas e colchetes aninhados. */
function dividirFluxo(src: string): string[] {
  const partes: string[] = [];
  let atual = "";
  let profundidade = 0;
  let aspas: string | null = null;
  for (const ch of src) {
    if (aspas) {
      atual += ch;
      if (ch === aspas) aspas = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      aspas = ch;
      atual += ch;
      continue;
    }
    if (ch === "[" || ch === "{") profundidade++;
    if (ch === "]" || ch === "}") profundidade--;
    if (ch === "," && profundidade === 0) {
      partes.push(atual.trim());
      atual = "";
      continue;
    }
    atual += ch;
  }
  if (atual.trim() !== "") partes.push(atual.trim());
  return partes;
}

export function lerEscalar(src: string): unknown {
  const t = src.trim();
  if (t === "") return "";
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null" || t === "~") return null;
  if (/^-?\d+$/.test(t)) return Number(t);
  if (/^-?\d*\.\d+$/.test(t)) return Number(t);
  if (t.length >= 2) {
    const a = t[0];
    if ((a === '"' || a === "'") && t[t.length - 1] === a) {
      return t.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, "\n");
    }
  }
  if (t.startsWith("[") && t.endsWith("]")) {
    const dentro = t.slice(1, -1).trim();
    return dentro === "" ? [] : dividirFluxo(dentro).map(lerEscalar);
  }
  if (t.startsWith("{") && t.endsWith("}")) {
    const dentro = t.slice(1, -1).trim();
    const obj: Record<string, unknown> = {};
    if (dentro === "") return obj;
    for (const parte of dividirFluxo(dentro)) {
      const idx = parte.indexOf(":");
      if (idx < 0) continue;
      obj[parte.slice(0, idx).trim()] = lerEscalar(parte.slice(idx + 1));
    }
    return obj;
  }
  return t;
}

function lerEscalarBloco(
  linhas: Linha[],
  c: Cursor,
  indentPai: number,
  marcador: string,
): string {
  const dobrar = marcador.startsWith(">");
  const coletadas: string[] = [];
  let indentFilho = -1;

  while (c.i < linhas.length) {
    const l = linhas[c.i];
    if (l.texto === "") {
      coletadas.push("");
      c.i++;
      continue;
    }
    if (l.indent <= indentPai) break;
    if (indentFilho < 0) indentFilho = l.indent;
    coletadas.push(l.bruta.slice(indentFilho));
    c.i++;
  }
  while (coletadas.length > 0 && coletadas[coletadas.length - 1] === "") coletadas.pop();

  if (!dobrar) return coletadas.join("\n");

  const paragrafos: string[] = [];
  let atual: string[] = [];
  for (const ln of coletadas) {
    if (ln.trim() === "") {
      if (atual.length > 0) paragrafos.push(atual.join(" "));
      atual = [];
    } else {
      atual.push(ln.trim());
    }
  }
  if (atual.length > 0) paragrafos.push(atual.join(" "));
  return paragrafos.join("\n\n");
}

function lerNo(linhas: Linha[], c: Cursor, indentMin: number): unknown {
  pularVazias(linhas, c);
  if (c.i >= linhas.length) return null;
  const l = linhas[c.i];
  if (l.indent < indentMin) return null;
  if (l.texto === "-" || l.texto.startsWith("- ")) return lerSequencia(linhas, c, l.indent);
  return lerMapa(linhas, c, l.indent);
}

function lerMapa(linhas: Linha[], c: Cursor, indent: number): Record<string, unknown> {
  const saida: Record<string, unknown> = {};
  for (;;) {
    pularVazias(linhas, c);
    if (c.i >= linhas.length) break;
    const l = linhas[c.i];
    if (l.indent !== indent) break;
    const m = RE_CHAVE.exec(l.texto);
    if (!m) break;
    const chave = m[1];
    const resto = m[2];
    c.i++;
    if (resto === ">" || resto === ">-" || resto === "|" || resto === "|-") {
      saida[chave] = lerEscalarBloco(linhas, c, indent, resto);
    } else if (resto === "") {
      const filho = lerNo(linhas, c, indent + 1);
      saida[chave] = filho === null ? "" : filho;
    } else {
      saida[chave] = lerEscalar(resto);
    }
  }
  return saida;
}

function lerSequencia(linhas: Linha[], c: Cursor, indent: number): unknown[] {
  const saida: unknown[] = [];
  for (;;) {
    pularVazias(linhas, c);
    if (c.i >= linhas.length) break;
    const l = linhas[c.i];
    if (l.indent !== indent) break;
    if (l.texto !== "-" && !l.texto.startsWith("- ")) break;
    const resto = l.texto === "-" ? "" : l.texto.slice(2);
    c.i++;

    if (resto === "") {
      saida.push(lerNo(linhas, c, indent + 1));
      continue;
    }
    const km = RE_CHAVE.exec(resto);
    if (!km) {
      saida.push(lerEscalar(resto));
      continue;
    }
    // Item que é um mapa: a primeira chave vem inline após "- ", as demais
    // seguem indentadas na mesma coluna dela.
    const indentChave = indent + 2;
    const obj: Record<string, unknown> = {};
    obj[km[1]] =
      km[2] === "" ? (lerNo(linhas, c, indentChave + 1) ?? "") : lerEscalar(km[2]);
    for (;;) {
      pularVazias(linhas, c);
      if (c.i >= linhas.length) break;
      const nl = linhas[c.i];
      if (nl.indent !== indentChave) break;
      const nm = RE_CHAVE.exec(nl.texto);
      if (!nm) break;
      c.i++;
      obj[nm[1]] =
        nm[2] === "" ? (lerNo(linhas, c, indentChave + 1) ?? "") : lerEscalar(nm[2]);
    }
    saida.push(obj);
  }
  return saida;
}

export function lerYaml(src: string): Record<string, unknown> {
  const linhas = tokenizar(src);
  const c: Cursor = { i: 0 };
  pularVazias(linhas, c);
  if (c.i >= linhas.length) return {};
  return lerMapa(linhas, c, linhas[c.i].indent);
}

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

export interface Documento {
  dados: Record<string, unknown>;
  corpo: string;
}

export function lerFrontmatter(texto: string): Documento {
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?([\s\S]*)$/.exec(texto);
  if (!m) return { dados: {}, corpo: texto };
  return { dados: lerYaml(m[1]), corpo: m[2] };
}

// ---------------------------------------------------------------------------
// Tipos do grafo
// ---------------------------------------------------------------------------

export const FASES = [
  "inicializacao",
  "ideacao",
  "concepcao",
  "construcao",
  "revisao",
] as const;
export type Fase = (typeof FASES)[number];

export const PREFIXO_FASE: Record<Fase, number> = {
  inicializacao: 0,
  ideacao: 1,
  concepcao: 2,
  construcao: 3,
  revisao: 4,
};

export const NOME_FASE: Record<Fase, string> = {
  inicializacao: "INICIALIZAÇÃO",
  ideacao: "IDEAÇÃO",
  concepcao: "CONCEPÇÃO",
  construcao: "CONSTRUÇÃO",
  revisao: "REVISÃO",
};

export const EXECUCOES = ["SEMPRE", "CONDICIONAL"] as const;
export type Execucao = (typeof EXECUCOES)[number];

/** Topologia de comunicação do estágio — quem fala com quem enquanto ele roda. */
export const MODOS = ["inline", "subagente", "pipeline", "mesa"] as const;
export type Modo = (typeof MODOS)[number];

export interface Consome {
  artefato: string;
  obrigatorio: boolean;
  condicionado_a?: "retomada" | "novo";
}

export interface Estagio {
  slug: string;
  fase: Fase;
  execucao: Execucao;
  condicao: string;
  agente_lider: string;
  agentes_apoio: string[];
  modo: Modo;
  para_cada?: string;
  /**
   * Marca o estágio que precisa gravar prosa no manuscrito, não só documento de
   * planejamento no registro. A guarda de conclusão recusa fechá-lo se nada foi
   * escrito fora de `.escritor/`. Análogo de `workspace_requires` no AI-DLC.
   */
  exige_manuscrito?: boolean;
  produz: string[];
  consome: Consome[];
  requer_estagio: string[];
  escopos: string[];
  sensores: string[];
  revisor?: string;
  revisor_max_iteracoes?: number;
  entradas: string;
  saidas: string;
  /** Computados pelo compilador, não autorados. */
  nome: string;
  ordem: string;
  /** Metadados de origem. */
  arquivo: string;
  corpo: string;
}

export interface Agente {
  slug: string;
  nome_exibicao: string;
  descricao: string;
  camada: string;
  arquivo: string;
  corpo: string;
}

export interface Escopo {
  nome: string;
  profundidade: "Mínima" | "Padrão" | "Completa";
  palavras_chave: string[];
  descricao: string;
  arquivo: string;
  corpo: string;
}

export interface Sensor {
  id: string;
  tipo: "deterministico" | "heuristico";
  comando: string;
  severidade_padrao: "bloqueante" | "consultivo";
  descricao: string;
  categoria: string;
  arquivo: string;
  corpo: string;
}

export interface Grafo {
  versao: string;
  compilado_em: string;
  estagios: Estagio[];
}

// ---------------------------------------------------------------------------
// Caminhos: método × obra
// ---------------------------------------------------------------------------

/** Raiz do repositório do método (este repo). */
export function raizMetodo(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function dirCore(): string {
  return join(raizMetodo(), "core");
}

export function dirEstagios(): string {
  return join(dirCore(), "escritor-common", "stages");
}

export function dirAgentes(): string {
  return join(dirCore(), "agents");
}

export function dirEscopos(): string {
  return join(dirCore(), "scopes");
}

export function dirSensores(): string {
  return join(dirCore(), "sensors");
}

export function caminhoGrafo(): string {
  return join(dirCore(), "tools", "data", "stage-graph.json");
}

export function caminhoGradeEscopos(): string {
  return join(dirCore(), "tools", "data", "scope-grid.json");
}

/**
 * Encontra a raiz da obra (o vault do livro) subindo a partir de `inicio` até
 * achar uma pasta `.escritor/`. Retorna null se não houver obra ativa.
 */
export function acharObra(inicio: string = process.cwd()): string | null {
  let atual = resolve(inicio);
  for (;;) {
    if (existsSync(join(atual, ".escritor"))) return atual;
    const pai = dirname(atual);
    if (pai === atual) return null;
    atual = pai;
  }
}

export function exigirObra(inicio?: string): string {
  const env = process.env.ESCRITOR_OBRA;
  const obra = env ? resolve(env) : acharObra(inicio);
  if (!obra) {
    throw new Error(
      "Nenhuma obra ativa. Rode a fase de inicialização (scaffold-vault) ou " +
        "defina ESCRITOR_OBRA com o caminho do vault do livro.",
    );
  }
  return obra;
}

export function dirEscritor(obra: string): string {
  return join(obra, ".escritor");
}

/** Diretório de registro: onde os artefatos de cada estágio são gravados. */
export function dirRegistro(obra: string): string {
  return join(dirEscritor(obra), "registro");
}

export function dirRegistroEstagio(obra: string, fase: string, slug: string): string {
  return join(dirRegistro(obra), fase, slug);
}

export function dirAuditoria(obra: string): string {
  return join(dirEscritor(obra), "auditoria");
}

export function dirMemoria(obra: string): string {
  return join(dirEscritor(obra), "memoria");
}

export function caminhoEstado(obra: string): string {
  return join(dirEscritor(obra), "estado.json");
}

// ---------------------------------------------------------------------------
// Carregadores
// ---------------------------------------------------------------------------

function listarMd(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const saida: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const p = join(dir, entrada);
    if (statSync(p).isDirectory()) saida.push(...listarMd(p));
    else if (entrada.endsWith(".md")) saida.push(p);
  }
  return saida.sort();
}

function comoLista(v: unknown): string[] {
  if (v === undefined || v === null || v === "") return [];
  if (Array.isArray(v)) return v.map((x) => String(x));
  return [String(v)];
}

function primeiroH1(corpo: string): string | null {
  const m = /^#\s+(.+)$/m.exec(corpo);
  return m ? m[1].trim() : null;
}

function tituloDoSlug(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/** Lê os estágios do disco (fonte autoral). NÃO aplica ordem computada. */
export function carregarEstagiosCrus(dir: string = dirEstagios()): Estagio[] {
  return listarMd(dir).map((arquivo) => {
    const { dados, corpo } = lerFrontmatter(readFileSync(arquivo, "utf8"));
    const consomeBruto = Array.isArray(dados.consome) ? dados.consome : [];
    const consome: Consome[] = consomeBruto.map((c) => {
      const o = (c ?? {}) as Record<string, unknown>;
      return {
        artefato: String(o.artefato ?? ""),
        obrigatorio: o.obrigatorio === true,
        condicionado_a: o.condicionado_a
          ? (String(o.condicionado_a) as "retomada" | "novo")
          : undefined,
      };
    });
    return {
      slug: String(dados.slug ?? ""),
      fase: String(dados.fase ?? "") as Fase,
      execucao: String(dados.execucao ?? "") as Execucao,
      condicao: String(dados.condicao ?? ""),
      agente_lider: String(dados.agente_lider ?? ""),
      agentes_apoio: comoLista(dados.agentes_apoio),
      modo: String(dados.modo ?? "inline") as Modo,
      para_cada: dados.para_cada ? String(dados.para_cada) : undefined,
      exige_manuscrito: dados.exige_manuscrito === true,
      produz: comoLista(dados.produz),
      consome,
      requer_estagio: comoLista(dados.requer_estagio),
      escopos: comoLista(dados.escopos),
      sensores: comoLista(dados.sensores),
      revisor: dados.revisor ? String(dados.revisor) : undefined,
      revisor_max_iteracoes:
        typeof dados.revisor_max_iteracoes === "number"
          ? dados.revisor_max_iteracoes
          : undefined,
      entradas: String(dados.entradas ?? ""),
      saidas: String(dados.saidas ?? ""),
      nome: primeiroH1(corpo) ?? tituloDoSlug(String(dados.slug ?? "")),
      ordem: "",
      arquivo,
      corpo,
    };
  });
}

export function carregarAgentes(dir: string = dirAgentes()): Agente[] {
  return listarMd(dir).map((arquivo) => {
    const { dados, corpo } = lerFrontmatter(readFileSync(arquivo, "utf8"));
    return {
      slug: String(dados.nome ?? ""),
      nome_exibicao: String(dados.nome_exibicao ?? ""),
      descricao: String(dados.descricao ?? ""),
      camada: String(dados.camada ?? "julgamento"),
      arquivo,
      corpo,
    };
  });
}

export function carregarEscopos(dir: string = dirEscopos()): Escopo[] {
  return listarMd(dir).map((arquivo) => {
    const { dados, corpo } = lerFrontmatter(readFileSync(arquivo, "utf8"));
    return {
      nome: String(dados.nome ?? ""),
      profundidade: String(dados.profundidade ?? "Padrão") as Escopo["profundidade"],
      palavras_chave: comoLista(dados.palavras_chave),
      descricao: String(dados.descricao ?? ""),
      arquivo,
      corpo,
    };
  });
}

export function carregarSensores(dir: string = dirSensores()): Sensor[] {
  return listarMd(dir).map((arquivo) => {
    const { dados, corpo } = lerFrontmatter(readFileSync(arquivo, "utf8"));
    return {
      id: String(dados.id ?? ""),
      tipo: String(dados.tipo ?? "deterministico") as Sensor["tipo"],
      comando: String(dados.comando ?? ""),
      severidade_padrao: String(
        dados.severidade_padrao ?? "consultivo",
      ) as Sensor["severidade_padrao"],
      descricao: String(dados.descricao ?? ""),
      categoria: String(dados.categoria ?? ""),
      arquivo,
      corpo,
    };
  });
}

/** Lê o grafo já compilado (fonte de verdade em tempo de execução). */
export function carregarGrafo(caminho: string = caminhoGrafo()): Grafo {
  if (!existsSync(caminho)) {
    throw new Error(
      `Grafo não compilado (${caminho}). Rode: bun core/tools/escritor-graph.ts compilar`,
    );
  }
  return JSON.parse(readFileSync(caminho, "utf8")) as Grafo;
}

export function carregarGradeEscopos(
  caminho: string = caminhoGradeEscopos(),
): Record<string, Record<string, "EXECUTA" | "PULA">> {
  if (!existsSync(caminho)) {
    throw new Error(
      `Grade de escopos não compilada (${caminho}). Rode: bun core/tools/escritor-graph.ts compilar`,
    );
  }
  return JSON.parse(readFileSync(caminho, "utf8"));
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

export function agoraISO(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function ordenarPorOrdem<T extends { ordem: string }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => {
    const [fa, sa] = a.ordem.split(".").map(Number);
    const [fb, sb] = b.ordem.split(".").map(Number);
    return fa !== fb ? fa - fb : sa - sb;
  });
}

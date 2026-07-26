/**
 * escritor-stage-schema.ts — contrato autoritativo do frontmatter de estágio.
 *
 * Porte de `core/tools/aidlc-stage-schema.ts`. Toda regra aqui é espelhada em
 * prosa em `core/escritor-common/protocols/stage-definition.md`; se os dois
 * divergirem, este arquivo é o que o motor obedece e o `doctor` acusa.
 */

import {
  EXECUCOES,
  FASES,
  MODOS,
  type Consome,
  type Estagio,
  type Execucao,
  type Fase,
  type Modo,
} from "./escritor-lib.ts";

export interface Problema {
  arquivo: string;
  campo: string;
  mensagem: string;
}

export interface ContextoValidacao {
  /** slugs de agentes existentes em core/agents/ */
  agentes: Set<string>;
  /** nomes de escopos existentes em core/scopes/ */
  escopos: Set<string>;
  /** ids de sensores existentes em core/sensors/ */
  sensores: Set<string>;
  /** slugs de todos os estágios (para requer_estagio) */
  slugs: Set<string>;
  /** artefatos declarados em algum `produz:` (para consome e para_cada) */
  artefatos: Set<string>;
}

const RE_KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function ehKebab(s: string): boolean {
  return RE_KEBAB.test(s);
}

function nomeArquivoSemExt(caminho: string): string {
  const base = caminho.split("/").pop() ?? "";
  return base.replace(/\.md$/, "");
}

/**
 * Valida um estágio isolado + suas referências cruzadas.
 * Retorna a lista de problemas; vazia significa válido.
 */
export function validarEstagio(e: Estagio, ctx: ContextoValidacao): Problema[] {
  const p: Problema[] = [];
  const erro = (campo: string, mensagem: string) =>
    p.push({ arquivo: e.arquivo, campo, mensagem });

  // slug ------------------------------------------------------------------
  if (!e.slug) erro("slug", "ausente");
  else {
    if (!ehKebab(e.slug)) erro("slug", `"${e.slug}" não é kebab-case`);
    const stem = nomeArquivoSemExt(e.arquivo);
    if (e.slug !== stem)
      erro("slug", `"${e.slug}" difere do nome do arquivo "${stem}"`);
  }

  // fase ------------------------------------------------------------------
  if (!FASES.includes(e.fase as Fase))
    erro("fase", `"${e.fase}" fora de [${FASES.join(", ")}]`);
  else {
    const pastaFase = e.arquivo.split("/").slice(-2)[0];
    if (pastaFase !== e.fase)
      erro("fase", `"${e.fase}" difere da pasta "${pastaFase}"`);
  }

  // execucao / condicao ---------------------------------------------------
  if (!EXECUCOES.includes(e.execucao as Execucao))
    erro("execucao", `"${e.execucao}" fora de [${EXECUCOES.join(", ")}]`);
  if (!e.condicao.trim())
    erro(
      "condicao",
      "ausente — descreva a razão de ser SEMPRE, ou a condição de ramificação se CONDICIONAL",
    );

  // agentes ---------------------------------------------------------------
  if (!e.agente_lider) erro("agente_lider", "ausente");
  else if (!ctx.agentes.has(e.agente_lider))
    erro("agente_lider", `agente desconhecido "${e.agente_lider}"`);
  for (const a of e.agentes_apoio) {
    if (!ctx.agentes.has(a)) erro("agentes_apoio", `agente desconhecido "${a}"`);
    if (a === e.agente_lider)
      erro("agentes_apoio", `"${a}" já é o líder; não repita no apoio`);
  }

  // modo ------------------------------------------------------------------
  if (!MODOS.includes(e.modo as Modo))
    erro("modo", `"${e.modo}" fora de [${MODOS.join(", ")}]`);
  if ((e.modo === "pipeline" || e.modo === "mesa") && e.agentes_apoio.length === 0)
    erro("modo", `modo "${e.modo}" exige agentes_apoio não vazio`);

  // revisor ---------------------------------------------------------------
  if (e.revisor) {
    if (!ctx.agentes.has(e.revisor))
      erro("revisor", `agente desconhecido "${e.revisor}"`);
    if (e.revisor === e.agente_lider)
      erro("revisor", "o revisor não pode ser o próprio líder — a crítica precisa de outro par de olhos");
    if (e.revisor_max_iteracoes === undefined)
      erro("revisor_max_iteracoes", "obrigatório quando `revisor` está declarado");
    else if (e.revisor_max_iteracoes < 1 || e.revisor_max_iteracoes > 5)
      erro("revisor_max_iteracoes", "fora da faixa 1..5");
  }

  // produz ----------------------------------------------------------------
  for (const a of e.produz) {
    if (!ehKebab(a)) erro("produz", `artefato "${a}" não é kebab-case`);
  }
  if (new Set(e.produz).size !== e.produz.length)
    erro("produz", "artefato duplicado na lista");

  // consome ---------------------------------------------------------------
  e.consome.forEach((c: Consome, i: number) => {
    if (!c.artefato) erro("consome", `entrada ${i}: campo artefato ausente`);
    else if (!ehKebab(c.artefato))
      erro("consome", `entrada ${i}: "${c.artefato}" não é kebab-case`);
    else if (!ctx.artefatos.has(c.artefato))
      erro(
        "consome",
        `entrada ${i}: "${c.artefato}" não é produzido por nenhum estágio`,
      );
    if (typeof c.obrigatorio !== "boolean")
      erro("consome", `entrada ${i}: campo obrigatorio deve ser booleano`);
    if (c.condicionado_a && c.condicionado_a !== "retomada" && c.condicionado_a !== "novo")
      erro("consome", `entrada ${i}: condicionado_a deve ser "retomada" ou "novo"`);
    if (e.produz.includes(c.artefato))
      erro("consome", `entrada ${i}: "${c.artefato}" é produzido pelo próprio estágio`);
  });

  // requer_estagio --------------------------------------------------------
  for (const s of e.requer_estagio) {
    if (!ctx.slugs.has(s)) erro("requer_estagio", `estágio desconhecido "${s}"`);
    if (s === e.slug) erro("requer_estagio", "um estágio não pode requerer a si mesmo");
  }

  // para_cada -------------------------------------------------------------
  if (e.para_cada) {
    if (!ctx.artefatos.has(e.para_cada))
      erro("para_cada", `"${e.para_cada}" não é produzido por nenhum estágio`);
  }

  // exige_manuscrito ------------------------------------------------------
  if (e.exige_manuscrito && e.fase !== "construcao" && e.fase !== "revisao")
    erro(
      "exige_manuscrito",
      "só faz sentido em construcao ou revisao — são as fases que tocam o manuscrito",
    );

  // escopos ---------------------------------------------------------------
  for (const s of e.escopos) {
    if (!ctx.escopos.has(s)) erro("escopos", `escopo desconhecido "${s}"`);
  }
  if (e.fase !== "inicializacao" && e.escopos.length === 0)
    erro("escopos", "estágio fora da inicialização precisa nomear ao menos um escopo, senão nunca executa");

  // sensores --------------------------------------------------------------
  for (const s of e.sensores) {
    if (!ctx.sensores.has(s)) erro("sensores", `sensor desconhecido "${s}"`);
  }

  // prosa obrigatória -----------------------------------------------------
  if (!e.entradas.trim()) erro("entradas", "ausente");
  if (!e.saidas.trim()) erro("saidas", "ausente");
  if (/^(\/|aidlc-docs|\.escritor)/.test(e.saidas.trim()))
    erro(
      "saidas",
      "não fixe a raiz do registro em `saidas:` — o motor resolve o caminho a partir de `produz` na obra ativa",
    );

  // corpo -----------------------------------------------------------------
  if (!/^##\s+Passos\s*$/m.test(e.corpo))
    erro("corpo", "falta a seção obrigatória `## Passos`");
  if (!/MANDATÓRIO: Siga o stage-protocol\.md/.test(e.corpo))
    erro(
      "corpo",
      "falta a linha MANDATÓRIO apontando para stage-protocol.md (portões de aprovação)",
    );

  return p;
}

/** Valida o conjunto inteiro, incluindo invariantes de grafo. */
export function validarGrafo(estagios: Estagio[], ctx: ContextoValidacao): Problema[] {
  const p: Problema[] = [];
  for (const e of estagios) p.push(...validarEstagio(e, ctx));

  // slug duplicado
  const vistos = new Map<string, string>();
  for (const e of estagios) {
    const anterior = vistos.get(e.slug);
    if (anterior)
      p.push({
        arquivo: e.arquivo,
        campo: "slug",
        mensagem: `slug "${e.slug}" duplicado (já usado em ${anterior})`,
      });
    vistos.set(e.slug, e.arquivo);
  }

  // artefato produzido por dois estágios
  const produtor = new Map<string, string>();
  for (const e of estagios) {
    for (const a of e.produz) {
      const anterior = produtor.get(a);
      if (anterior)
        p.push({
          arquivo: e.arquivo,
          campo: "produz",
          mensagem: `artefato "${a}" já é produzido por "${anterior}" — um artefato tem um dono só`,
        });
      else produtor.set(a, e.slug);
    }
  }

  // ciclos em requer_estagio
  const ciclo = acharCiclo(estagios);
  if (ciclo)
    p.push({
      arquivo: "(grafo)",
      campo: "requer_estagio",
      mensagem: `ciclo detectado: ${ciclo.join(" → ")}`,
    });

  // dependência de artefato que só nasce depois (ordem topológica vs consumo)
  const ordemProdutor = new Map<string, number>();
  const ordenados = ordenarTopologicamente(estagios);
  ordenados.forEach((e, i) => {
    for (const a of e.produz) ordemProdutor.set(a, i);
  });
  ordenados.forEach((e, i) => {
    for (const c of e.consome) {
      const iProd = ordemProdutor.get(c.artefato);
      if (iProd !== undefined && iProd > i)
        p.push({
          arquivo: e.arquivo,
          campo: "consome",
          mensagem: `"${c.artefato}" só é produzido depois deste estágio — falta uma aresta em requer_estagio`,
        });
    }
  });

  return p;
}

function acharCiclo(estagios: Estagio[]): string[] | null {
  const porSlug = new Map(estagios.map((e) => [e.slug, e]));
  const estado = new Map<string, 0 | 1 | 2>();
  const pilha: string[] = [];

  function visitar(slug: string): string[] | null {
    const st = estado.get(slug) ?? 0;
    if (st === 1) return [...pilha.slice(pilha.indexOf(slug)), slug];
    if (st === 2) return null;
    estado.set(slug, 1);
    pilha.push(slug);
    for (const dep of porSlug.get(slug)?.requer_estagio ?? []) {
      if (!porSlug.has(dep)) continue;
      const c = visitar(dep);
      if (c) return c;
    }
    pilha.pop();
    estado.set(slug, 2);
    return null;
  }

  for (const e of estagios) {
    const c = visitar(e.slug);
    if (c) return c;
  }
  return null;
}

/**
 * Ordenação topológica global determinística (Kahn com fila alfabética),
 * respeitando primeiro o prefixo de fase e depois as arestas requer_estagio.
 */
export function ordenarTopologicamente(estagios: Estagio[]): Estagio[] {
  const porSlug = new Map(estagios.map((e) => [e.slug, e]));
  const grau = new Map<string, number>();
  const saidas = new Map<string, string[]>();

  for (const e of estagios) {
    grau.set(e.slug, 0);
    saidas.set(e.slug, []);
  }
  for (const e of estagios) {
    for (const dep of e.requer_estagio) {
      if (!porSlug.has(dep)) continue;
      grau.set(e.slug, (grau.get(e.slug) ?? 0) + 1);
      saidas.get(dep)!.push(e.slug);
    }
  }

  const chave = (slug: string): string => {
    const e = porSlug.get(slug)!;
    return `${PREFIXO(e.fase)}|${slug}`;
  };

  const prontos = estagios
    .filter((e) => (grau.get(e.slug) ?? 0) === 0)
    .map((e) => e.slug)
    .sort((a, b) => chave(a).localeCompare(chave(b)));

  const saida: Estagio[] = [];
  while (prontos.length > 0) {
    const slug = prontos.shift()!;
    saida.push(porSlug.get(slug)!);
    for (const prox of saidas.get(slug) ?? []) {
      const g = (grau.get(prox) ?? 0) - 1;
      grau.set(prox, g);
      if (g === 0) {
        prontos.push(prox);
        prontos.sort((a, b) => chave(a).localeCompare(chave(b)));
      }
    }
  }
  // Havendo ciclo, os remanescentes entram no fim (o validador já acusou).
  for (const e of estagios) if (!saida.includes(e)) saida.push(e);
  return saida;
}

function PREFIXO(fase: string): string {
  const mapa: Record<string, string> = {
    inicializacao: "0",
    ideacao: "1",
    concepcao: "2",
    construcao: "3",
    revisao: "4",
  };
  return mapa[fase] ?? "9";
}

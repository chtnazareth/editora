#!/usr/bin/env bun
/**
 * editora-state.ts — máquina de estados da obra.
 *
 * Porte de `core/tools/aidlc-state.ts`. Guarda o progresso em
 * `<obra>/.editora/estado.json` (fonte de verdade) e espelha em `estado.md`
 * (legível no Obsidian). Nenhum estágio fecha sem passar pelas guardas.
 *
 * Uso:
 *   bun core/tools/editora-state.ts iniciar --titulo "A Luz" --escopo romance
 *   bun core/tools/editora-state.ts status [--json]
 *   bun core/tools/editora-state.ts definir-status --estagio X --valor em-andamento
 *   bun core/tools/editora-state.ts guarda --estagio X [--unidade cap-01]
 *   bun core/tools/editora-state.ts unidades --gerar 27
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import {
  NOME_FASE,
  agoraISO,
  caminhoEstado,
  carregarGradeEscopos,
  carregarGrafo,
  dirEscritor,
  dirRegistroEstagio,
  exigirObra,
  type Estagio,
  type Fase,
  type Grafo,
} from "./editora-lib.ts";
import { registrar } from "./editora-audit.ts";

// ---------------------------------------------------------------------------
// Modelo
// ---------------------------------------------------------------------------

export const STATUS = [
  "pendente",
  "em-andamento",
  "aguardando-aprovacao",
  "revisando",
  "concluido",
  "pulado",
] as const;
export type StatusEstagio = (typeof STATUS)[number];

/** Marca usada no espelho markdown — mesma convenção do AI-DLC. */
export const MARCA: Record<StatusEstagio, string> = {
  pendente: " ",
  "em-andamento": "-",
  "aguardando-aprovacao": "?",
  revisando: "R",
  concluido: "x",
  pulado: "S",
};

export interface EstadoEstagio {
  status: StatusEstagio;
  iniciado_em?: string;
  concluido_em?: string;
  ciclos_revisao: number;
  motivo_pulo?: string;
}

export interface Unidade {
  id: string;
  rotulo: string;
  ato: number;
  beat: string;
  status: "pendente" | "em-andamento" | "concluida";
  estagios: Record<string, StatusEstagio>;
}

export interface AlvoDesvio {
  estagio: string;
  unidade: string | null;
}

/**
 * Um desvio é uma volta atrás deliberada: o autor sai do caminho reto para
 * revisitar alguma coisa — um capítulo, uma ficha, uma regra do mundo — e o
 * motor guarda onde ele estava, para devolvê-lo ao mesmo ponto depois.
 *
 * É o que torna o método utilizável num livro. Software entrega e segue em
 * frente; um livro leva meses e não é escrito em linha reta.
 */
export interface Desvio {
  alvo: AlvoDesvio;
  /** O alvo mais a cascata, na ordem em que serão percorridos. */
  cascata: AlvoDesvio[];
  /** Onde o autor estava — capturado ANTES de qualquer mudança de status. */
  retorno: { estagio: string | null; unidade: string | null };
  /** Status de cada passo antes de reabrir, para o cancelamento ser honesto. */
  antes: { estagio: string; unidade: string | null; status: StatusEstagio }[];
  motivo?: string;
  aberto_em: string;
}

export interface Estado {
  versao: string;
  titulo: string;
  escopo: string;
  profundidade: "Mínima" | "Padrão" | "Completa";
  origem: "novo" | "retomada";
  criado_em: string;
  atualizado_em: string;
  estagio_atual: string | null;
  unidade_atual: string | null;
  autonomia_construcao: "indefinida" | "autonoma" | "com-portao";
  estagios: Record<string, EstadoEstagio>;
  unidades: Unidade[];
  desvio: Desvio | null;
  /** Quando o autor esteve aqui pela última vez — alimenta o resumo. */
  ultimo_acesso: string;
}

const VERSAO_ESTADO = "2";

// ---------------------------------------------------------------------------
// Persistência
// ---------------------------------------------------------------------------

export function lerEstado(obra: string): Estado {
  const c = caminhoEstado(obra);
  if (!existsSync(c))
    throw new Error(`Obra sem estado (${c}). Rode: editora-state.ts iniciar`);
  return migrar(JSON.parse(readFileSync(c, "utf8")) as Estado);
}

/**
 * Obra criada numa versão anterior do estado não pode quebrar ao abrir — um
 * livro dura meses e o método vai mudar por baixo dele.
 */
export function migrar(estado: Estado): Estado {
  if (estado.desvio === undefined) estado.desvio = null;
  if (!estado.ultimo_acesso) estado.ultimo_acesso = estado.criado_em;
  estado.versao = VERSAO_ESTADO;
  return estado;
}

export function gravarEstado(obra: string, estado: Estado): void {
  estado.atualizado_em = agoraISO();
  mkdirSync(dirEscritor(obra), { recursive: true });
  writeFileSync(caminhoEstado(obra), `${JSON.stringify(estado, null, 2)}\n`);
  writeFileSync(join(dirEscritor(obra), "estado.md"), renderizarEstado(estado));
}

// ---------------------------------------------------------------------------
// Consulta de escopo e ordem
// ---------------------------------------------------------------------------

export function estagiosNoEscopo(grafo: Grafo, escopo: string): Estagio[] {
  const grade = carregarGradeEscopos();
  const linha = grade[escopo];
  if (!linha) throw new Error(`Escopo desconhecido: "${escopo}"`);
  return grafo.estagios.filter((e) => linha[e.slug] === "EXECUTA");
}

export function proximoEstagio(estado: Estado, grafo: Grafo): Estagio | null {
  for (const e of estagiosNoEscopo(grafo, estado.escopo)) {
    const st = estado.estagios[e.slug]?.status ?? "pendente";
    if (st !== "concluido" && st !== "pulado") return e;
  }
  return null;
}

export function proximoDepoisDe(
  estado: Estado,
  grafo: Grafo,
  slug: string,
): Estagio | null {
  const lista = estagiosNoEscopo(grafo, estado.escopo);
  const i = lista.findIndex((e) => e.slug === slug);
  if (i < 0) return null;
  for (const e of lista.slice(i + 1)) {
    const st = estado.estagios[e.slug]?.status ?? "pendente";
    if (st !== "concluido" && st !== "pulado") return e;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Guardas de conclusão
// ---------------------------------------------------------------------------

export interface ResultadoGuarda {
  passou: boolean;
  faltando: string[];
  avisos: string[];
}

/** Localiza o arquivo do capítulo no manuscrito do vault. */
export function acharArquivoCapitulo(obra: string, rotulo: string): string | null {
  const manuscrito = join(obra, "05 — Manuscrito");
  if (!existsSync(manuscrito)) return null;
  for (const ato of readdirSync(manuscrito)) {
    const dirAto = join(manuscrito, ato);
    if (!statSync(dirAto).isDirectory()) continue;
    const arquivo = join(dirAto, `${rotulo}.md`);
    if (existsSync(arquivo)) return arquivo;
    // Capítulo dividido em cenas: `Cap 14/` com um .md por cena.
    const pasta = join(dirAto, rotulo);
    if (existsSync(pasta) && statSync(pasta).isDirectory()) return pasta;
  }
  return null;
}

/** Conta palavras do corpo, descontando frontmatter e callouts de andaime. */
export function contarPalavrasCorpo(caminho: string): number {
  const ler = (f: string): string => {
    const bruto = readFileSync(f, "utf8");
    const semFm = bruto.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    return semFm
      .split(/\r?\n/)
      .filter((l) => !l.trimStart().startsWith(">") && !/^#{1,6}\s/.test(l.trim()))
      .join("\n");
  };
  let texto = "";
  if (statSync(caminho).isDirectory()) {
    for (const f of readdirSync(caminho)) {
      if (f.endsWith(".md")) texto += `\n${ler(join(caminho, f))}`;
    }
  } else {
    texto = ler(caminho);
  }
  return texto.split(/\s+/).filter((w) => /[\p{L}]/u.test(w)).length;
}

/** Palavras mínimas para considerar que houve prosa de verdade. */
export const MINIMO_PALAVRAS_MANUSCRITO = 200;

/**
 * Recusa fechar um estágio que não entregou o que declarou produzir.
 * É o análogo direto da guarda de artefato do AI-DLC — e a razão de o método
 * não conseguir "avançar no papel" sem texto no disco.
 */
export function guardaConclusao(
  obra: string,
  estagio: Estagio,
  unidade?: string,
): ResultadoGuarda {
  const faltando: string[] = [];
  const avisos: string[] = [];

  const base = estagio.para_cada && unidade
    ? join(dirRegistroEstagio(obra, estagio.fase, estagio.slug), unidade)
    : dirRegistroEstagio(obra, estagio.fase, estagio.slug);

  for (const artefato of estagio.produz) {
    const alvo = join(base, `${artefato}.md`);
    if (!existsSync(alvo)) {
      faltando.push(alvo.replace(`${obra}/`, ""));
      continue;
    }
    if (readFileSync(alvo, "utf8").trim().length < 40)
      avisos.push(`${artefato}.md existe mas está praticamente vazio`);
  }

  if (estagio.exige_manuscrito) {
    if (!unidade) {
      avisos.push(
        "estágio exige manuscrito mas nenhuma unidade foi informada — guarda de prosa não pôde rodar",
      );
    } else {
      const estado = lerEstado(obra);
      const u = estado.unidades.find((x) => x.id === unidade);
      const rotulo = u?.rotulo ?? unidade;
      const arquivo = acharArquivoCapitulo(obra, rotulo);
      if (!arquivo) {
        faltando.push(`05 — Manuscrito/**/${rotulo}.md (nenhuma prosa escrita)`);
      } else {
        const n = contarPalavrasCorpo(arquivo);
        if (n < MINIMO_PALAVRAS_MANUSCRITO)
          faltando.push(
            `${basename(arquivo)} tem ${n} palavras de corpo (mínimo ${MINIMO_PALAVRAS_MANUSCRITO}) — o estágio declara exige_manuscrito`,
          );
      }
    }
  }

  return { passou: faltando.length === 0, faltando, avisos };
}

// ---------------------------------------------------------------------------
// Transições
// ---------------------------------------------------------------------------

const TRANSICOES: Record<StatusEstagio, StatusEstagio[]> = {
  pendente: ["em-andamento", "pulado"],
  "em-andamento": ["aguardando-aprovacao", "pulado", "pendente"],
  "aguardando-aprovacao": ["concluido", "revisando", "em-andamento"],
  revisando: ["aguardando-aprovacao", "em-andamento"],
  concluido: ["em-andamento"],
  pulado: ["em-andamento", "pendente"],
};

export function definirStatus(
  obra: string,
  estado: Estado,
  slug: string,
  novo: StatusEstagio,
  opcoes: { forcar?: boolean; motivo?: string } = {},
): void {
  const atual = estado.estagios[slug] ?? { status: "pendente", ciclos_revisao: 0 };
  if (!opcoes.forcar && atual.status !== novo) {
    const permitidos = TRANSICOES[atual.status];
    if (!permitidos.includes(novo))
      throw new Error(
        `Transição inválida em "${slug}": ${atual.status} → ${novo}. Permitidas: ${permitidos.join(", ")}`,
      );
  }
  if (novo === "em-andamento" && !atual.iniciado_em) atual.iniciado_em = agoraISO();
  if (novo === "concluido") atual.concluido_em = agoraISO();
  if (novo === "revisando") atual.ciclos_revisao += 1;
  if (novo === "pulado" && opcoes.motivo) atual.motivo_pulo = opcoes.motivo;
  atual.status = novo;
  estado.estagios[slug] = atual;
  estado.estagio_atual =
    novo === "concluido" || novo === "pulado" ? null : slug;
  gravarEstado(obra, estado);
}

// ---------------------------------------------------------------------------
// Desvio: sair do caminho reto e voltar ao mesmo ponto
// ---------------------------------------------------------------------------

/** Primeira unidade que ainda não passou por este estágio. */
export function proximaUnidade(estado: Estado, slug: string): string | null {
  for (const u of estado.unidades) {
    const st = u.estagios[slug];
    if (st !== "concluido" && st !== "pulado") return u.id;
  }
  return null;
}

/**
 * A fila que um desvio vai percorrer.
 *
 * Para estágio de laço: ele e os seguintes do mesmo laço, naquele capítulo —
 * porque texto que mudou precisa de passe de linha e de continuidade refeitos.
 * Deixar o capítulo reescrito marcado como "conferido" é o erro silencioso que
 * esta cascata existe para evitar. Fora do laço, só ele.
 */
export function cascataDe(
  grafo: Grafo,
  estado: Estado,
  slug: string,
  unidade: string | null,
  soEsta = false,
): AlvoDesvio[] {
  const estagio = grafo.estagios.find((e) => e.slug === slug);
  if (!estagio) throw new Error(`Estágio desconhecido: "${slug}"`);
  if (soEsta || !estagio.para_cada || !unidade) return [{ estagio: slug, unidade }];

  const noEscopo = estagiosNoEscopo(grafo, estado.escopo);
  const i = noEscopo.findIndex((e) => e.slug === slug);
  return noEscopo
    .slice(i)
    .filter((e) => e.para_cada === estagio.para_cada)
    .map((e) => ({ estagio: e.slug, unidade }));
}

/** Reabre a etapa de UMA unidade — o que hoje nenhum outro comando faz. */
export function reabrirEtapaDaUnidade(
  estado: Estado,
  slug: string,
  unidadeId: string,
): void {
  const u = estado.unidades.find((x) => x.id === unidadeId);
  if (!u) throw new Error(`Unidade desconhecida: "${unidadeId}"`);
  u.estagios[slug] = "pendente";
  u.status = "em-andamento";
}

export function abrirDesvio(
  obra: string,
  estado: Estado,
  grafo: Grafo,
  alvo: AlvoDesvio,
  opcoes: { motivo?: string; soEsta?: boolean } = {},
): Desvio {
  if (estado.desvio)
    throw new Error(
      `Já existe um desvio aberto em "${estado.desvio.alvo.estagio}". Feche-o, ou cancele com --cancelar.`,
    );

  // O retorno é capturado ANTES de mexer em qualquer status. Depois da
  // reabertura o cursor já estaria contaminado e apontaria para o próprio alvo.
  const cursor = proximoEstagio(estado, grafo);
  const retorno = {
    estagio: cursor?.slug ?? null,
    unidade: cursor?.para_cada ? proximaUnidade(estado, cursor.slug) : null,
  };

  const cascata = cascataDe(grafo, estado, alvo.estagio, alvo.unidade, opcoes.soEsta);

  // Guarda o antes de cada passo, para que desistir do desvio devolva o estado
  // exatamente como estava — e não deixe um capítulo aprovado marcado como
  // pendente porque o autor mudou de ideia.
  const antes = cascata.map((p) => ({
    estagio: p.estagio,
    unidade: p.unidade,
    status: (p.unidade
      ? estado.unidades.find((u) => u.id === p.unidade)?.estagios[p.estagio]
      : estado.estagios[p.estagio]?.status) ?? "pendente",
  }));

  for (const passo of cascata) {
    definirStatus(obra, estado, passo.estagio, "pendente", { forcar: true });
    if (passo.unidade) reabrirEtapaDaUnidade(estado, passo.estagio, passo.unidade);
  }

  estado.desvio = {
    alvo,
    cascata,
    retorno,
    antes,
    motivo: opcoes.motivo,
    aberto_em: agoraISO(),
  };
  gravarEstado(obra, estado);
  return estado.desvio;
}

/** O próximo passo pendente da cascata, ou null quando ela acabou. */
export function proximoDoDesvio(estado: Estado): AlvoDesvio | null {
  if (!estado.desvio) return null;
  for (const passo of estado.desvio.cascata) {
    const st = passo.unidade
      ? estado.unidades.find((u) => u.id === passo.unidade)?.estagios[passo.estagio]
      : estado.estagios[passo.estagio]?.status;
    if (st !== "concluido" && st !== "pulado") return passo;
  }
  return null;
}

/** Desiste do desvio e devolve cada passo ao status que tinha antes. */
export function cancelarDesvio(obra: string, estado: Estado): Desvio | null {
  const desvio = estado.desvio;
  if (!desvio) return null;
  for (const p of desvio.antes) {
    definirStatus(obra, estado, p.estagio, p.status, { forcar: true });
    if (p.unidade) {
      const u = estado.unidades.find((x) => x.id === p.unidade);
      if (u) u.estagios[p.estagio] = p.status;
    }
  }
  estado.desvio = null;
  gravarEstado(obra, estado);
  return desvio;
}

export function fecharDesvio(
  obra: string,
  estado: Estado,
): Desvio["retorno"] | null {
  if (!estado.desvio) return null;
  const retorno = estado.desvio.retorno;
  estado.desvio = null;
  gravarEstado(obra, estado);
  return retorno;
}

// ---------------------------------------------------------------------------
// Espelho markdown
// ---------------------------------------------------------------------------

export function renderizarEstado(estado: Estado): string {
  const grafo = carregarGrafo();
  const noEscopo = estagiosNoEscopo(grafo, estado.escopo);
  const feitos = noEscopo.filter((e) => {
    const s = estado.estagios[e.slug]?.status;
    return s === "concluido" || s === "pulado";
  }).length;

  const linhas: string[] = [
    "---",
    "tipo: estado-editora",
    `titulo: "${estado.titulo}"`,
    `escopo: ${estado.escopo}`,
    `profundidade: ${estado.profundidade}`,
    "---",
    "",
    `# Estado — ${estado.titulo}`,
    "",
    `> Espelho legível de \`estado.json\`. Não edite à mão: o motor reescreve.`,
    "",
    `**Escopo:** ${estado.escopo} · **Profundidade:** ${estado.profundidade} · **Origem:** ${estado.origem}`,
    `**Progresso:** ${feitos}/${noEscopo.length} estágios no escopo (${grafo.estagios.length} compilados)`,
    `**Autonomia da construção:** ${estado.autonomia_construcao}`,
    "",
  ];

  if (estado.desvio) {
    const d = estado.desvio;
    const onde = d.alvo.unidade ? `${d.alvo.estagio} · ${d.alvo.unidade}` : d.alvo.estagio;
    linhas.push(
      "> [!warning] Desvio aberto",
      `> Revisando **${onde}**${d.motivo ? ` — ${d.motivo}` : ""}, desde ${d.aberto_em.slice(0, 10)}.`,
      `> Ao fechar, o método volta sozinho para **${d.retorno.estagio ?? "o fim do fluxo"}**.`,
      "",
    );
  }

  linhas.push(
    "| marca | significado |",
    "|---|---|",
    "| `[ ]` | pendente | ",
    "| `[-]` | em andamento |",
    "| `[?]` | aguardando sua aprovação |",
    "| `[R]` | revisando após pedido de mudança |",
    "| `[x]` | concluído |",
    "| `[S]` | pulado pelo escopo |",
    "",
  );

  let faseAtual: Fase | null = null;
  for (const e of noEscopo) {
    if (e.fase !== faseAtual) {
      faseAtual = e.fase;
      linhas.push("", `## ${NOME_FASE[faseAtual]}`, "");
    }
    const est = estado.estagios[e.slug] ?? { status: "pendente", ciclos_revisao: 0 };
    const rev = est.ciclos_revisao > 0 ? ` _(${est.ciclos_revisao} revisão(ões))_` : "";
    const laco = e.para_cada ? ` ⟲ por ${e.para_cada}` : "";
    linhas.push(`- [${MARCA[est.status]}] \`${e.ordem}\` **${e.nome}** — ${e.agente_lider}${laco}${rev}`);
  }

  if (estado.unidades.length > 0) {
    linhas.push("", "## Unidades (capítulos)", "");
    let atoAtual = -1;
    for (const u of estado.unidades) {
      if (u.ato !== atoAtual) {
        atoAtual = u.ato;
        linhas.push("", `### Ato ${atoAtual}`, "");
      }
      const marca = u.status === "concluida" ? "x" : u.status === "em-andamento" ? "-" : " ";
      linhas.push(`- [${marca}] **${u.rotulo}** — ${u.beat || "_beat a definir_"}`);
    }
  }

  linhas.push("", `_Atualizado em ${estado.atualizado_em}_`, "");
  return linhas.join("\n");
}

// ---------------------------------------------------------------------------
// Criação
// ---------------------------------------------------------------------------

export function gerarUnidades(total = 27, porAto = 9): Unidade[] {
  const unidades: Unidade[] = [];
  for (let n = 1; n <= total; n++) {
    const ato = Math.min(3, Math.floor((n - 1) / porAto) + 1);
    unidades.push({
      id: `cap-${String(n).padStart(2, "0")}`,
      rotulo: `Cap ${String(n).padStart(2, "0")}`,
      ato,
      beat: "",
      status: "pendente",
      estagios: {},
    });
  }
  return unidades;
}

export function iniciarObra(
  obra: string,
  opcoes: {
    titulo: string;
    escopo: string;
    profundidade?: Estado["profundidade"];
    origem?: Estado["origem"];
  },
): Estado {
  const estado: Estado = {
    versao: VERSAO_ESTADO,
    titulo: opcoes.titulo,
    escopo: opcoes.escopo,
    profundidade: opcoes.profundidade ?? "Padrão",
    origem: opcoes.origem ?? "novo",
    criado_em: agoraISO(),
    atualizado_em: agoraISO(),
    estagio_atual: null,
    unidade_atual: null,
    autonomia_construcao: "indefinida",
    estagios: {},
    unidades: [],
    desvio: null,
    ultimo_acesso: agoraISO(),
  };
  for (const sub of ["registro", "auditoria", "memoria", "conhecimento"]) {
    mkdirSync(join(dirEscritor(obra), sub), { recursive: true });
  }
  gravarEstado(obra, estado);
  registrar(obra, "OBRA_INICIADA", {
    titulo: opcoes.titulo,
    escopo: opcoes.escopo,
    origem: estado.origem,
  });
  return estado;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(nome: string, padrao?: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : padrao;
}

function main(): number {
  const comando = process.argv[2];
  const caminhoObra = arg("obra");

  switch (comando) {
    case "iniciar": {
      const titulo = arg("titulo");
      const escopo = arg("escopo");
      if (!titulo || !escopo) {
        console.error("uso: iniciar --titulo <t> --escopo <e> [--obra <caminho>] [--origem novo|retomada]");
        return 2;
      }
      const obra = caminhoObra ?? process.cwd();
      const estado = iniciarObra(obra, {
        titulo,
        escopo,
        origem: (arg("origem") as Estado["origem"]) ?? "novo",
        profundidade: arg("profundidade") as Estado["profundidade"],
      });
      console.log(`✓ obra iniciada: ${estado.titulo} · escopo ${estado.escopo}`);
      console.log(`  ${caminhoEstado(obra)}`);
      return 0;
    }

    case "status": {
      const obra = exigirObra(caminhoObra);
      const estado = lerEstado(obra);
      if (process.argv.includes("--json")) {
        console.log(JSON.stringify(estado, null, 2));
        return 0;
      }
      console.log(renderizarEstado(estado));
      return 0;
    }

    case "definir-status": {
      const obra = exigirObra(caminhoObra);
      const estado = lerEstado(obra);
      const slug = arg("estagio");
      const valor = arg("valor") as StatusEstagio;
      if (!slug || !STATUS.includes(valor)) {
        console.error(`uso: definir-status --estagio <slug> --valor <${STATUS.join("|")}>`);
        return 2;
      }
      definirStatus(obra, estado, slug, valor, {
        forcar: process.argv.includes("--forcar"),
        motivo: arg("motivo"),
      });
      console.log(`✓ ${slug} → ${valor}`);
      return 0;
    }

    case "guarda": {
      const obra = exigirObra(caminhoObra);
      const grafo = carregarGrafo();
      const slug = arg("estagio");
      const estagio = grafo.estagios.find((e) => e.slug === slug);
      if (!estagio) {
        console.error(`estágio desconhecido: ${slug}`);
        return 2;
      }
      const r = guardaConclusao(obra, estagio, arg("unidade"));
      for (const a of r.avisos) console.warn(`  ⚠ ${a}`);
      if (!r.passou) {
        console.error(`✗ guarda reprovou "${slug}" — artefatos declarados que não existem:`);
        for (const f of r.faltando) console.error(`    · ${f}`);
        return 1;
      }
      console.log(`✓ guarda aprovou "${slug}"`);
      return 0;
    }

    case "unidades": {
      const obra = exigirObra(caminhoObra);
      const estado = lerEstado(obra);
      const gerar = arg("gerar");
      if (gerar) {
        estado.unidades = gerarUnidades(Number(gerar));
        gravarEstado(obra, estado);
        console.log(`✓ ${estado.unidades.length} unidades geradas`);
        return 0;
      }
      for (const u of estado.unidades)
        console.log(`${u.id.padEnd(8)} ato ${u.ato}  ${u.status.padEnd(12)} ${u.beat}`);
      return 0;
    }

    default:
      console.error(
        "uso: editora-state.ts <iniciar|status|definir-status|guarda|unidades> [opções]",
      );
      return 2;
  }
}

if (import.meta.main) {
  try {
    process.exit(main());
  } catch (e) {
    console.error(`\n  ✗ ${(e as Error).message}\n`);
    process.exit(1);
  }
}

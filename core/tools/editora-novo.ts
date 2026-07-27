#!/usr/bin/env bun
/**
 * editora-novo.ts — cria um livro novo, do zero, em qualquer lugar.
 *
 * É o único comando que se roda antes de existir obra. Copia o molde embutido
 * (`core/templates/livro/`), monta `.editora/`, inicializa o estado e gera as
 * unidades-capítulo. Depois disto, `/editora` sabe o que fazer.
 *
 * O framework é autossuficiente: nada aqui depende de pasta preexistente na
 * máquina do autor.
 *
 * Uso:
 *   bun core/tools/editora-novo.ts "A Torre Partida"
 *   bun core/tools/editora-novo.ts "Conto do Farol" --escopo conto --em ~/Textos
 */

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import {
  carregarEscopos,
  dirCore,
  dirEscritor,
  raizMetodo,
} from "./editora-lib.ts";
import { gerarUnidades, gravarEstado, iniciarObra, lerEstado } from "./editora-state.ts";

/** Onde vive a memória do autor, compartilhada entre todos os livros dele. */
export function dirAutorGlobal(): string {
  return process.env.EDITORA_AUTOR
    ? resolve(process.env.EDITORA_AUTOR)
    : join(homedir(), ".editora");
}

export function dirMolde(): string {
  return join(dirCore(), "templates", "livro");
}

/** Nome de pasta seguro, preservando acento (é vault de Obsidian, não URL). */
function pastaDe(titulo: string): string {
  return titulo
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function vazioOuInexistente(p: string): boolean {
  if (!existsSync(p)) return true;
  return readdirSync(p).filter((f) => f !== ".DS_Store").length === 0;
}

/**
 * Liga a memória do autor à global: o primeiro livro a criar semeia
 * `~/.editora/autor.md`; todos os seguintes apontam para o mesmo arquivo.
 * É o que faz uma regra aprendida no livro 1 valer no livro 2.
 */
function ligarMemoriaDoAutor(obra: string): "criada" | "compartilhada" {
  const global = dirAutorGlobal();
  const alvoGlobal = join(global, "autor.md");
  const naObra = join(dirEscritor(obra), "memoria", "autor.md");
  let resultado: "criada" | "compartilhada" = "compartilhada";

  if (!existsSync(alvoGlobal)) {
    mkdirSync(global, { recursive: true });
    cpSync(join(dirCore(), "memory", "autor.md"), alvoGlobal);
    resultado = "criada";
  }
  try {
    symlinkSync(alvoGlobal, naObra);
  } catch {
    // Sem permissão para link simbólico: cai para cópia, e avisa depois.
    cpSync(alvoGlobal, naObra);
  }
  return resultado;
}

function semearMemorias(obra: string, titulo: string, escopo: string): void {
  const destino = join(dirEscritor(obra), "memoria");
  mkdirSync(destino, { recursive: true });

  const projeto = readFileSync(join(dirCore(), "memory", "projeto.md"), "utf8")
    .replace("- **Título:**", `- **Título:** ${titulo}`)
    .replace("- **Escopo:**", `- **Escopo:** ${escopo}`);
  writeFileSync(join(destino, "projeto.md"), projeto);
  cpSync(join(dirCore(), "memory", "oficina.md"), join(destino, "oficina.md"));
}

function personalizarMolde(obra: string, titulo: string): void {
  const readme = join(obra, "README.md");
  if (existsSync(readme)) {
    writeFileSync(
      readme,
      readFileSync(readme, "utf8").replace(/\[Nome do Livro\]/g, titulo),
    );
  }
  const sinopse = join(obra, "SINOPSE.md");
  if (existsSync(sinopse)) {
    writeFileSync(
      sinopse,
      readFileSync(sinopse, "utf8").replace(/^# Sinopse$/m, `# Sinopse — ${titulo}`),
    );
  }
}

export interface OpcoesNovaObra {
  titulo: string;
  em?: string;
  escopo?: string;
  capitulos?: number;
}

export function criarObra(opcoes: OpcoesNovaObra): string {
  const escopo = opcoes.escopo ?? "romance";
  const conhecidos = carregarEscopos().map((e) => e.nome);
  if (!conhecidos.includes(escopo)) {
    throw new Error(`Escopo desconhecido: "${escopo}". Disponíveis: ${conhecidos.join(", ")}`);
  }

  const base = resolve(opcoes.em ?? process.cwd());
  const obra = join(base, pastaDe(opcoes.titulo));

  if (!vazioOuInexistente(obra)) {
    throw new Error(
      `"${obra}" já existe e não está vazia. Escolha outro título ou outro --em.`,
    );
  }
  if (existsSync(join(obra, ".editora"))) {
    throw new Error(`"${obra}" já é uma obra do Editora.`);
  }

  // 1. o molde embutido — nenhuma dependência externa
  mkdirSync(obra, { recursive: true });
  cpSync(dirMolde(), obra, { recursive: true });
  personalizarMolde(obra, opcoes.titulo);

  // 2. a área do método
  const estado = iniciarObra(obra, { titulo: opcoes.titulo, escopo, origem: "novo" });

  // 3. memórias: projeto e oficina locais, autor compartilhado entre livros
  semearMemorias(obra, opcoes.titulo, escopo);
  const memoriaAutor = ligarMemoriaDoAutor(obra);

  // 4. as unidades de trabalho
  const total = opcoes.capitulos ?? (escopo === "conto" || escopo === "oficina" ? 1 : 27);
  estado.unidades = gerarUnidades(total);
  gravarEstado(obra, estado);

  console.log(`\n  ✓ "${opcoes.titulo}" criado\n`);
  console.log(`    ${obra}`);
  console.log(`    escopo ${escopo} · ${total} ${total === 1 ? "unidade" : "capítulos"}`);
  console.log(
    `    memória do autor: ${memoriaAutor === "criada" ? `criada em ${dirAutorGlobal()}` : `compartilhada de ${dirAutorGlobal()}`}`,
  );

  const proximo = lerEstado(obra);
  console.log(`\n  Próximo passo — abra o Claude Code nesta pasta e use /editora.`);
  console.log(`  Ou veja o percurso:\n`);
  console.log(`    bun ${join(raizMetodo(), "core/tools/editora-graph.ts")} mostrar --escopo ${proximo.escopo}\n`);
  return obra;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main(): number {
  const titulo = process.argv[2];

  if (!titulo || titulo.startsWith("--")) {
    console.error(`
  uso: editora-novo.ts "<Título do Livro>" [opções]

    --em <caminho>       onde criar a pasta (padrão: diretório atual)
    --escopo <nome>      ${carregarEscopos().map((e) => e.nome).join(" | ")}
    --capitulos <n>      quantas unidades gerar (padrão: 27, ou 1 em conto/oficina)

  exemplo:
    bun editora-novo.ts "A Torre Partida" --em ~/Livros --escopo romance
`);
    return 2;
  }

  try {
    criarObra({
      titulo,
      em: arg("em"),
      escopo: arg("escopo"),
      capitulos: arg("capitulos") ? Number(arg("capitulos")) : undefined,
    });
    return 0;
  } catch (e) {
    console.error(`\n  ✗ ${(e as Error).message}\n`);
    return 1;
  }
}

if (import.meta.main) process.exit(main());

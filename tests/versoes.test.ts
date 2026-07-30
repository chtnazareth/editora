import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { criarObra } from "../core/tools/editora-novo.ts";
import { acharArquivoCapitulo, lerEstado } from "../core/tools/editora-state.ts";
import { arquivar, dirVersoes, lerVersoes, restaurar } from "../core/tools/editora-versoes.ts";

let raiz: string;
let obra: string;

const CAP = (texto: string) =>
  `---\ntipo: capitulo\nstatus: rascunho\npov: Tarkus\n---\n> [!summary] Beat\n> Andaime não conta como prosa.\n\n${texto}\n`;

const PROSA_A = Array(30).fill("Tarkus atravessou o pátio de pedra fria.").join(" ");
const PROSA_B = Array(40).fill("A muralha guardava o pátio inteiro sem pressa.").join(" ");

function escrever(texto: string): void {
  const estado = lerEstado(obra);
  const alvo = acharArquivoCapitulo(obra, estado.unidades[0].rotulo)!;
  writeFileSync(alvo, CAP(texto));
}

function lerCapitulo(): string {
  const estado = lerEstado(obra);
  return readFileSync(acharArquivoCapitulo(obra, estado.unidades[0].rotulo)!, "utf8");
}

beforeAll(() => {
  raiz = mkdtempSync(join(tmpdir(), "editora-versoes-"));
  process.env.EDITORA_AUTOR = join(raiz, ".autor");
});

afterAll(() => {
  rmSync(raiz, { recursive: true, force: true });
  delete process.env.EDITORA_AUTOR;
});

beforeEach(() => {
  obra = join(raiz, `obra-${Math.floor(performance.now() * 1000)}`);
  mkdirSync(obra, { recursive: true });
  criarObra({ titulo: "V", em: obra, aqui: true, escopo: "romance" });
});

describe("arquivar", () => {
  test("guarda o capítulo contando só a prosa, sem o andaime", () => {
    escrever(PROSA_A);
    const r = arquivar(obra, "cap-01", "rascunho", "antes");
    expect(r.arquivado).toBe(true);
    // Frontmatter e callout de beat não entram na conta.
    expect(r.versao!.palavras).toBe(PROSA_A.split(/\s+/).length);
  });

  test("capítulo sem prosa não vira versão — só andaime não é texto", () => {
    const r = arquivar(obra, "cap-01", "rascunho", "antes");
    expect(r.arquivado).toBe(false);
    expect(r.motivo).toMatch(/sem prosa|não existe/);
  });

  test("não guarda duas vezes o mesmo texto", () => {
    escrever(PROSA_A);
    arquivar(obra, "cap-01", "rascunho", "antes");
    const r = arquivar(obra, "cap-01", "rascunho", "antes");
    expect(r.arquivado).toBe(false);
    expect(lerVersoes(obra, "cap-01").length).toBe(1);
  });

  test("aprovar promove o rótulo da versão idêntica em vez de duplicar", () => {
    // Sem isto a lista mente sobre qual foi a versão aprovada — que é
    // exatamente a que o autor procura quando quer voltar.
    escrever(PROSA_A);
    arquivar(obra, "cap-01", "rascunho", "antes");
    arquivar(obra, "cap-01", "rascunho", "aprovado");

    const v = lerVersoes(obra, "cap-01");
    expect(v.length).toBe(1);
    expect(v[0].evento).toBe("aprovado");
  });

  test("REGRESSÃO: dois arquivamentos no mesmo segundo não se sobrescrevem", () => {
    // O timestamp tem precisão de segundo. Antes do hash entrar no id, o
    // segundo arquivamento apagava o arquivo do primeiro — perda de texto
    // dentro da própria ferramenta que existe para impedir perda de texto.
    escrever(PROSA_A);
    arquivar(obra, "cap-01", "rascunho", "antes");
    escrever(PROSA_B);
    arquivar(obra, "cap-01", "rascunho", "antes");

    const versoes = lerVersoes(obra, "cap-01");
    expect(versoes.length).toBe(2);
    expect(new Set(versoes.map((v) => v.id)).size).toBe(2);

    const arquivos = readdirSync(dirVersoes(obra, "cap-01")).filter((f) => f.endsWith(".md"));
    expect(arquivos.length).toBe(2);
  });
});

describe("restaurar", () => {
  test("devolve o texto antigo ao manuscrito", () => {
    escrever(PROSA_A);
    arquivar(obra, "cap-01", "rascunho", "aprovado");
    escrever(PROSA_B);
    arquivar(obra, "cap-01", "rascunho", "aprovado");

    expect(lerCapitulo()).toContain("A muralha");

    const antiga = lerVersoes(obra, "cap-01")[0];
    restaurar(obra, "cap-01", antiga);

    expect(lerCapitulo()).toContain("Tarkus atravessou");
    expect(lerCapitulo()).not.toContain("A muralha");
  });

  test("o texto que estava lá continua recuperável depois do restauro", () => {
    // Desfazer o desfazer precisa ser possível.
    escrever(PROSA_A);
    arquivar(obra, "cap-01", "rascunho", "aprovado");
    escrever(PROSA_B);
    arquivar(obra, "cap-01", "rascunho", "aprovado");

    restaurar(obra, "cap-01", lerVersoes(obra, "cap-01")[0]);

    const aindaTem = lerVersoes(obra, "cap-01").some((v) =>
      readFileSync(
        join(dirVersoes(obra, "cap-01"), `${v.id}.md`),
        "utf8",
      ).includes("A muralha"),
    );
    expect(aindaTem).toBe(true);
  });

  test("preserva o frontmatter do capítulo", () => {
    escrever(PROSA_A);
    arquivar(obra, "cap-01", "rascunho", "aprovado");
    escrever(PROSA_B);
    restaurar(obra, "cap-01", lerVersoes(obra, "cap-01")[0]);
    expect(lerCapitulo()).toContain("pov: Tarkus");
  });
});

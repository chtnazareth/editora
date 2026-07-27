import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { criarObra, dirMolde } from "../core/tools/editora-novo.ts";
import { lerEstado } from "../core/tools/editora-state.ts";

let raiz: string;

beforeAll(() => {
  raiz = mkdtempSync(join(tmpdir(), "editora-novo-"));
  // Sem isto, os testes escreveriam na memória real do autor em ~/.editora.
  process.env.EDITORA_AUTOR = join(raiz, ".autor");
});

afterAll(() => {
  rmSync(raiz, { recursive: true, force: true });
  delete process.env.EDITORA_AUTOR;
});

const pastaVazia = (nome: string): string => {
  const p = join(raiz, nome);
  mkdirSync(p, { recursive: true });
  return p;
};

describe("o molde embutido", () => {
  test("existe dentro do método — nada externo é necessário", () => {
    expect(existsSync(dirMolde())).toBe(true);
  });

  test("traz os 27 capítulos em 3 atos", () => {
    const manuscrito = join(dirMolde(), "05 — Manuscrito");
    const atos = readdirSync(manuscrito);
    expect(atos.length).toBe(3);
    const capitulos = atos.flatMap((a) =>
      readdirSync(join(manuscrito, a)).filter((f) => f.startsWith("Cap ")),
    );
    expect(capitulos.length).toBe(27);
  });

  test("não carrega o COMO USAR, que só faz sentido no molde original", () => {
    expect(existsSync(join(dirMolde(), "COMO USAR — Template.md"))).toBe(false);
  });
});

describe("criar com --aqui", () => {
  test("monta na pasta atual, sem criar subpasta", () => {
    const pasta = pastaVazia("torre");
    const obra = criarObra({ titulo: "A Torre Partida", em: pasta, aqui: true });

    expect(obra).toBe(pasta);
    expect(existsSync(join(pasta, ".editora", "estado.json"))).toBe(true);
    expect(existsSync(join(pasta, "05 — Manuscrito"))).toBe(true);
    expect(existsSync(join(pasta, "A Torre Partida"))).toBe(false);
  });

  test("recusa pasta que já tem conteúdo", () => {
    const pasta = pastaVazia("ocupada");
    writeFileSync(join(pasta, "rascunho.md"), "algo");
    expect(() => criarObra({ titulo: "X", em: pasta, aqui: true })).toThrow(/não está vazia/);
  });
});

describe("criar subpasta", () => {
  test("usa o título como nome da pasta", () => {
    const pai = pastaVazia("livros");
    const obra = criarObra({ titulo: "O Cartógrafo", em: pai });
    expect(obra).toBe(join(pai, "O Cartógrafo"));
    expect(existsSync(join(obra, ".editora"))).toBe(true);
  });

  test("limpa caracteres que quebram nome de pasta", () => {
    const pai = pastaVazia("livros2");
    const obra = criarObra({ titulo: "Mapas: o que/muda", em: pai });
    expect(obra).not.toContain(":");
    expect(obra).not.toContain("/muda");
  });
});

describe("o que a criação garante", () => {
  test("o título entra no README da obra", () => {
    const pasta = pastaVazia("titulo");
    criarObra({ titulo: "A Torre Partida", em: pasta, aqui: true });
    const readme = readFileSync(join(pasta, "README.md"), "utf8");
    expect(readme).toContain("A Torre Partida");
    expect(readme).not.toContain("[Nome do Livro]");
  });

  test("romance nasce com 27 unidades em 3 atos", () => {
    const pasta = pastaVazia("romance");
    criarObra({ titulo: "R", em: pasta, aqui: true, escopo: "romance" });
    const u = lerEstado(pasta).unidades;
    expect(u.length).toBe(27);
    expect(u.filter((x) => x.ato === 2).length).toBe(9);
  });

  test("conto nasce com uma unidade só", () => {
    const pasta = pastaVazia("conto");
    criarObra({ titulo: "C", em: pasta, aqui: true, escopo: "conto" });
    expect(lerEstado(pasta).unidades.length).toBe(1);
  });

  test("recusa escopo que não existe", () => {
    const pasta = pastaVazia("escopo-ruim");
    expect(() => criarObra({ titulo: "X", em: pasta, aqui: true, escopo: "novela-gráfica" })).toThrow(
      /Escopo desconhecido/,
    );
  });

  test("a área do método nasce completa", () => {
    const pasta = pastaVazia("area");
    criarObra({ titulo: "A", em: pasta, aqui: true });
    for (const sub of ["registro", "auditoria", "memoria", "conhecimento"]) {
      expect(existsSync(join(pasta, ".editora", sub))).toBe(true);
    }
    expect(existsSync(join(pasta, ".editora", "memoria", "projeto.md"))).toBe(true);
    expect(existsSync(join(pasta, ".editora", "memoria", "oficina.md"))).toBe(true);
  });

  test("o projeto já nasce sabendo o próprio título e escopo", () => {
    const pasta = pastaVazia("semeado");
    criarObra({ titulo: "A Torre Partida", em: pasta, aqui: true, escopo: "serie" });
    const projeto = readFileSync(join(pasta, ".editora", "memoria", "projeto.md"), "utf8");
    expect(projeto).toContain("A Torre Partida");
    expect(projeto).toContain("serie");
  });
});

describe("memória do autor entre livros", () => {
  test("o segundo livro herda a memória do primeiro", () => {
    const a = pastaVazia("livro-um");
    const b = pastaVazia("livro-dois");
    criarObra({ titulo: "Um", em: a, aqui: true });

    // Uma regra aprendida no livro 1…
    const global = join(process.env.EDITORA_AUTOR!, "autor.md");
    writeFileSync(global, `${readFileSync(global, "utf8")}\n- Nunca abrir capítulo com clima.\n`);

    criarObra({ titulo: "Dois", em: b, aqui: true });

    // …chega ao livro 2 sem ninguém copiar nada à mão.
    const noLivroDois = readFileSync(join(b, ".editora", "memoria", "autor.md"), "utf8");
    expect(noLivroDois).toContain("Nunca abrir capítulo com clima.");
  });
});

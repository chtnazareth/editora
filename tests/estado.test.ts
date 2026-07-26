import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { carregarGrafo } from "../core/tools/escritor-lib.ts";
import {
  contarPalavrasCorpo,
  definirStatus,
  estagiosNoEscopo,
  gerarUnidades,
  guardaConclusao,
  iniciarObra,
  lerEstado,
  proximoEstagio,
  renderizarEstado,
} from "../core/tools/escritor-state.ts";

let obra: string;
const grafo = carregarGrafo();

beforeAll(() => {
  obra = mkdtempSync(join(tmpdir(), "escritor-teste-"));
  mkdirSync(join(obra, "05 — Manuscrito", "Ato 1 — Preparação"), { recursive: true });
  iniciarObra(obra, { titulo: "Obra de Teste", escopo: "romance" });
});

afterAll(() => rmSync(obra, { recursive: true, force: true }));

describe("criação da obra", () => {
  test("grava estado legível e serializado", () => {
    const e = lerEstado(obra);
    expect(e.titulo).toBe("Obra de Teste");
    expect(e.escopo).toBe("romance");
    expect(e.origem).toBe("novo");
    expect(renderizarEstado(e)).toContain("Obra de Teste");
  });

  test("o primeiro estágio é a detecção de projeto", () => {
    expect(proximoEstagio(lerEstado(obra), grafo)?.slug).toBe("deteccao-projeto");
  });
});

describe("unidades", () => {
  test("27 capítulos em 3 atos de 9", () => {
    const u = gerarUnidades(27);
    expect(u.length).toBe(27);
    expect(u.filter((x) => x.ato === 1).length).toBe(9);
    expect(u.filter((x) => x.ato === 3).length).toBe(9);
  });

  test("numeração contínua e rótulo no padrão do template", () => {
    const u = gerarUnidades(27);
    expect(u[0].rotulo).toBe("Cap 01");
    expect(u[9].rotulo).toBe("Cap 10");
    expect(u[26].rotulo).toBe("Cap 27");
    expect(u[26].ato).toBe(3);
  });
});

describe("transições de estado", () => {
  test("aceita o caminho feliz", () => {
    const e = lerEstado(obra);
    definirStatus(obra, e, "deteccao-projeto", "em-andamento");
    definirStatus(obra, lerEstado(obra), "deteccao-projeto", "aguardando-aprovacao");
    definirStatus(obra, lerEstado(obra), "deteccao-projeto", "concluido");
    expect(lerEstado(obra).estagios["deteccao-projeto"].status).toBe("concluido");
  });

  test("recusa transição inválida", () => {
    expect(() =>
      definirStatus(obra, lerEstado(obra), "scaffold-vault", "concluido"),
    ).toThrow(/Transição inválida/);
  });

  test("conta os ciclos de revisão", () => {
    definirStatus(obra, lerEstado(obra), "scaffold-vault", "em-andamento");
    definirStatus(obra, lerEstado(obra), "scaffold-vault", "aguardando-aprovacao");
    definirStatus(obra, lerEstado(obra), "scaffold-vault", "revisando");
    expect(lerEstado(obra).estagios["scaffold-vault"].ciclos_revisao).toBe(1);
    definirStatus(obra, lerEstado(obra), "scaffold-vault", "aguardando-aprovacao");
    definirStatus(obra, lerEstado(obra), "scaffold-vault", "revisando");
    expect(lerEstado(obra).estagios["scaffold-vault"].ciclos_revisao).toBe(2);
  });
});

describe("guarda de conclusão", () => {
  const estagioDe = (slug: string) => grafo.estagios.find((e) => e.slug === slug)!;

  test("reprova quando o artefato declarado não existe", () => {
    const r = guardaConclusao(obra, estagioDe("init-estado"));
    expect(r.passou).toBe(false);
    expect(r.faltando.join(" ")).toContain("plano-de-fluxo.md");
  });

  test("aprova quando o artefato existe", () => {
    const dir = join(obra, ".escritor", "registro", "inicializacao", "init-estado");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "plano-de-fluxo.md"),
      "# Plano\n## Estágios\nromance, 28 estágios.\n## Unidades\n27 capítulos.\n",
    );
    expect(guardaConclusao(obra, estagioDe("init-estado")).passou).toBe(true);
  });

  test("exige_manuscrito reprova capítulo que só tem andaime", () => {
    const e = lerEstado(obra);
    e.unidades = gerarUnidades(27);
    definirStatus(obra, e, "deteccao-projeto", "em-andamento", { forcar: true });

    const dir = join(obra, ".escritor", "registro", "construcao", "rascunho", "cap-01");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "nota-de-rascunho.md"), "# Nota\n## A\nx\n## B\ny\n");
    writeFileSync(
      join(obra, "05 — Manuscrito", "Ato 1 — Preparação", "Cap 01.md"),
      "---\nstatus: planejado\n---\n> [!summary] Beat\n> Descobre o corpo.\n",
    );

    const r = guardaConclusao(obra, estagioDe("rascunho"), "cap-01");
    expect(r.passou).toBe(false);
    expect(r.faltando.join(" ")).toContain("mínimo 200");
  });

  test("exige_manuscrito aprova capítulo com prosa de verdade", () => {
    const prosa = Array.from({ length: 60 }, () => "Ele andou até a porta e parou ali um instante.").join(" ");
    writeFileSync(
      join(obra, "05 — Manuscrito", "Ato 1 — Preparação", "Cap 01.md"),
      `---\nstatus: rascunho\npov: Tarkus\n---\n> [!summary] Beat\n> Descobre o corpo.\n\n${prosa}\n`,
    );
    expect(guardaConclusao(obra, estagioDe("rascunho"), "cap-01").passou).toBe(true);
  });
});

describe("contagem de palavras do corpo", () => {
  test("ignora frontmatter, títulos e callouts de andaime", () => {
    const f = join(obra, "conta.md");
    writeFileSync(f, "---\na: 1\nb: 2\n---\n# Título\n> [!summary] Beat\n> um dois três\n\nquatro cinco\n");
    expect(contarPalavrasCorpo(f)).toBe(2);
  });
});

describe("escopos", () => {
  test("romance executa mais estágios que conto", () => {
    expect(estagiosNoEscopo(grafo, "romance").length).toBeGreaterThan(
      estagiosNoEscopo(grafo, "conto").length,
    );
  });

  test("oficina é o escopo mais enxuto", () => {
    const oficina = estagiosNoEscopo(grafo, "oficina").length;
    for (const e of ["romance", "serie", "novela", "conto", "retomada"]) {
      expect(estagiosNoEscopo(grafo, e).length).toBeGreaterThanOrEqual(oficina);
    }
  });

  test("escopo desconhecido dá erro claro", () => {
    expect(() => estagiosNoEscopo(grafo, "inexistente")).toThrow(/Escopo desconhecido/);
  });
});

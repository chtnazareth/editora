import { describe, expect, test } from "bun:test";
import { lerEscalar, lerFrontmatter, lerYaml } from "../core/tools/escritor-lib.ts";

describe("lerEscalar", () => {
  test("reconhece os tipos primitivos", () => {
    expect(lerEscalar("true")).toBe(true);
    expect(lerEscalar("false")).toBe(false);
    expect(lerEscalar("null")).toBe(null);
    expect(lerEscalar("42")).toBe(42);
    expect(lerEscalar("3.5")).toBe(3.5);
    expect(lerEscalar("  texto solto  ")).toBe("texto solto");
  });

  test("tira aspas", () => {
    expect(lerEscalar('"A Luz"')).toBe("A Luz");
    expect(lerEscalar("'Cinzas do Pacífico'")).toBe("Cinzas do Pacífico");
  });

  test("lê fluxo inline", () => {
    expect(lerEscalar("[]")).toEqual([]);
    expect(lerEscalar("[a, b, c]")).toEqual(["a", "b", "c"]);
  });

  test("não quebra a vírgula dentro de aspas", () => {
    expect(lerEscalar('["um, dois", tres]')).toEqual(["um, dois", "tres"]);
  });
});

describe("lerYaml", () => {
  test("mapa simples", () => {
    expect(lerYaml("slug: rascunho\nfase: construcao")).toEqual({
      slug: "rascunho",
      fase: "construcao",
    });
  });

  test("lista de escalares", () => {
    const r = lerYaml("produz:\n  - logline\n  - tema-central\nmodo: inline");
    expect(r.produz).toEqual(["logline", "tema-central"]);
    expect(r.modo).toBe("inline");
  });

  test("lista vazia inline", () => {
    expect(lerYaml("agentes_apoio: []").agentes_apoio).toEqual([]);
  });

  test("lista de mapas — a forma do `consome`", () => {
    const r = lerYaml(
      [
        "consome:",
        "  - artefato: declaracao-semente",
        "    obrigatorio: true",
        "  - artefato: retrato-do-projeto",
        "    obrigatorio: false",
        "    condicionado_a: retomada",
        "escopos:",
        "  - romance",
      ].join("\n"),
    );
    expect(r.consome).toEqual([
      { artefato: "declaracao-semente", obrigatorio: true },
      { artefato: "retrato-do-projeto", obrigatorio: false, condicionado_a: "retomada" },
    ]);
    expect(r.escopos).toEqual(["romance"]);
  });

  test("escalar de bloco dobrado", () => {
    const r = lerYaml(
      ["descricao: >", "  primeira linha", "  segunda linha", "camada: julgamento"].join("\n"),
    );
    expect(r.descricao).toBe("primeira linha segunda linha");
    expect(r.camada).toBe("julgamento");
  });

  test("escalar de bloco literal preserva quebras", () => {
    const r = lerYaml(["texto: |", "  linha um", "  linha dois"].join("\n"));
    expect(r.texto).toBe("linha um\nlinha dois");
  });

  test("ignora comentários", () => {
    expect(lerYaml("# nota\nslug: x\n# outra\nfase: ideacao")).toEqual({
      slug: "x",
      fase: "ideacao",
    });
  });
});

describe("lerFrontmatter", () => {
  test("separa dados de corpo", () => {
    const { dados, corpo } = lerFrontmatter("---\nslug: teste\n---\n# Título\n\nCorpo.");
    expect(dados.slug).toBe("teste");
    expect(corpo).toBe("# Título\n\nCorpo.");
  });

  test("sem frontmatter devolve o texto inteiro", () => {
    const { dados, corpo } = lerFrontmatter("# Só corpo");
    expect(dados).toEqual({});
    expect(corpo).toBe("# Só corpo");
  });

  test("não confunde separador horizontal do corpo com fim do frontmatter", () => {
    const { dados, corpo } = lerFrontmatter("---\nslug: x\n---\n\ntexto\n\n---\n\nmais texto");
    expect(dados.slug).toBe("x");
    expect(corpo).toContain("mais texto");
  });
});

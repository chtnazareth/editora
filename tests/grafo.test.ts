import { describe, expect, test } from "bun:test";
import {
  FASES,
  carregarAgentes,
  carregarEscopos,
  carregarEstagiosCrus,
  carregarSensores,
} from "../core/tools/editora-lib.ts";
import { compilarGrafo, compilarGradeEscopos } from "../core/tools/editora-graph.ts";
import { ANALISADORES } from "../core/tools/editora-sensores.ts";

const { grafo, problemas } = compilarGrafo();

describe("integridade do grafo", () => {
  test("compila sem nenhum problema", () => {
    if (problemas.length > 0) {
      console.error(problemas.map((p) => `${p.campo}: ${p.mensagem}`).join("\n"));
    }
    expect(problemas).toEqual([]);
  });

  test("as cinco fases existem e nenhuma está vazia", () => {
    for (const f of FASES) {
      expect(grafo.estagios.filter((e) => e.fase === f).length).toBeGreaterThan(0);
    }
  });

  test("todo estágio recebeu ordem computada", () => {
    for (const e of grafo.estagios) {
      expect(e.ordem).toMatch(/^[0-4]\.\d+$/);
    }
  });

  test("cada artefato tem um dono só", () => {
    const dono = new Map<string, string>();
    for (const e of grafo.estagios) {
      for (const a of e.produz) {
        expect(dono.has(a)).toBe(false);
        dono.set(a, e.slug);
      }
    }
  });

  test("todo artefato consumido é produzido por algum estágio", () => {
    const produzidos = new Set(grafo.estagios.flatMap((e) => e.produz));
    for (const e of grafo.estagios) {
      for (const c of e.consome) {
        expect(produzidos.has(c.artefato)).toBe(true);
      }
    }
  });

  test("nenhum estágio consome artefato que só nasce depois dele", () => {
    const posicao = new Map<string, number>();
    grafo.estagios.forEach((e, i) => {
      for (const a of e.produz) posicao.set(a, i);
    });
    grafo.estagios.forEach((e, i) => {
      for (const c of e.consome) {
        const p = posicao.get(c.artefato);
        if (p !== undefined) expect(p).toBeLessThan(i);
      }
    });
  });
});

describe("referências cruzadas", () => {
  test("todo agente lidera ao menos um estágio", () => {
    for (const a of carregarAgentes()) {
      const usado = grafo.estagios.some(
        (e) => e.agente_lider === a.slug || e.agentes_apoio.includes(a.slug) || e.revisor === a.slug,
      );
      expect(usado).toBe(true);
    }
  });

  test("nenhum revisor é o próprio líder do estágio", () => {
    for (const e of grafo.estagios) {
      if (e.revisor) expect(e.revisor).not.toBe(e.agente_lider);
    }
  });

  test("modos pipeline e mesa têm agentes de apoio", () => {
    for (const e of grafo.estagios) {
      if (e.modo === "pipeline" || e.modo === "mesa") {
        expect(e.agentes_apoio.length).toBeGreaterThan(0);
      }
    }
  });

  test("todo sensor declarado tem manifesto e analisador", () => {
    const manifestos = new Set(carregarSensores().map((s) => s.id));
    for (const e of grafo.estagios) {
      for (const id of e.sensores) {
        expect(manifestos.has(id)).toBe(true);
        expect(ANALISADORES[id]).toBeDefined();
      }
    }
  });

  test("exige_manuscrito só aparece em construcao e revisao", () => {
    for (const e of grafo.estagios) {
      if (e.exige_manuscrito) expect(["construcao", "revisao"]).toContain(e.fase);
    }
  });
});

describe("escopos", () => {
  const grade = compilarGradeEscopos(grafo);

  test("todo escopo executa ao menos um estágio fora da inicialização", () => {
    for (const escopo of carregarEscopos()) {
      const n = grafo.estagios.filter(
        (e) => e.fase !== "inicializacao" && grade[escopo.nome][e.slug] === "EXECUTA",
      ).length;
      expect(n).toBeGreaterThan(0);
    }
  });

  test("a inicialização roda sob todo escopo", () => {
    for (const escopo of carregarEscopos()) {
      for (const e of grafo.estagios.filter((x) => x.fase === "inicializacao")) {
        expect(grade[escopo.nome][e.slug]).toBe("EXECUTA");
      }
    }
  });

  test("romance é superconjunto de conto", () => {
    for (const e of grafo.estagios) {
      if (grade.conto[e.slug] === "EXECUTA") expect(grade.romance[e.slug]).toBe("EXECUTA");
    }
  });
});

describe("ordem editorial", () => {
  const ordemDe = (slug: string) =>
    grafo.estagios.findIndex((e) => e.slug === slug);

  test("a leitura beta vem antes do diagnóstico estrutural", () => {
    // O editor de desenvolvimento diagnostica COM o relatório do beta na mão.
    expect(ordemDe("leitura-beta")).toBeLessThan(ordemDe("revisao-estrutural-ato"));
  });

  test("o copidesque é a última passagem sobre o texto", () => {
    expect(ordemDe("revisao-final")).toBeGreaterThan(ordemDe("passe-voz"));
    expect(ordemDe("revisao-final")).toBeGreaterThan(ordemDe("passe-continuidade-global"));
  });

  test("as convenções de prosa vêm antes de qualquer rascunho", () => {
    expect(ordemDe("convencoes-prosa")).toBeLessThan(ordemDe("rascunho"));
  });

  test("o outline vem antes do rascunho, que vem antes do passe de linha", () => {
    expect(ordemDe("outline-cena")).toBeLessThan(ordemDe("rascunho"));
    expect(ordemDe("rascunho")).toBeLessThan(ordemDe("passe-linha"));
  });

  test("todo estágio em laço percorre a mesma unidade", () => {
    const emLaco = grafo.estagios.filter((e) => e.para_cada);
    expect(emLaco.length).toBeGreaterThan(0);
    for (const e of emLaco) expect(e.para_cada).toBe("unidade-capitulo");
  });
});

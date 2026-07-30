import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { carregarGrafo, type Grafo } from "../core/tools/editora-lib.ts";
import { criarObra } from "../core/tools/editora-novo.ts";
import {
  abrirDesvio,
  cancelarDesvio,
  cascataDe,
  fecharDesvio,
  gravarEstado,
  lerEstado,
  migrar,
  proximoDoDesvio,
  proximoEstagio,
  type Estado,
} from "../core/tools/editora-state.ts";

let raiz: string;
let obra: string;
const grafo: Grafo = carregarGrafo();

/** Livro em andamento: ideação e concepção fechadas, 3 capítulos prontos. */
function cenarioEmAndamento(): Estado {
  const estado = lerEstado(obra);
  const emLaco = grafo.estagios.filter((e) => e.para_cada).map((e) => e.slug);
  for (const e of grafo.estagios) {
    if (["inicializacao", "ideacao", "concepcao"].includes(e.fase)) {
      estado.estagios[e.slug] = { status: "concluido", ciclos_revisao: 0 };
    }
  }
  for (const u of estado.unidades.slice(0, 3)) {
    u.status = "concluida";
    for (const s of emLaco) u.estagios[s] = "concluido";
  }
  gravarEstado(obra, estado);
  return lerEstado(obra);
}

beforeAll(() => {
  raiz = mkdtempSync(join(tmpdir(), "editora-desvio-"));
  process.env.EDITORA_AUTOR = join(raiz, ".autor");
});

afterAll(() => {
  rmSync(raiz, { recursive: true, force: true });
  delete process.env.EDITORA_AUTOR;
});

beforeEach(() => {
  obra = join(raiz, `obra-${Math.floor(performance.now() * 1000)}`);
  mkdirSync(obra, { recursive: true });
  criarObra({ titulo: "Teste", em: obra, aqui: true, escopo: "romance" });
});

describe("cascata", () => {
  test("etapa de laço arrasta as seguintes do mesmo capítulo", () => {
    const estado = cenarioEmAndamento();
    const c = cascataDe(grafo, estado, "rascunho", "cap-02");
    expect(c.length).toBeGreaterThan(1);
    expect(c[0].estagio).toBe("rascunho");
    expect(c.map((p) => p.estagio)).toContain("checagem-continuidade");
    // Texto que mudou precisa de continuidade refeita — é o ponto da cascata.
    expect(c.every((p) => p.unidade === "cap-02")).toBe(true);
  });

  test("--so-esta reabre exatamente uma", () => {
    const estado = cenarioEmAndamento();
    expect(cascataDe(grafo, estado, "rascunho", "cap-02", true).length).toBe(1);
  });

  test("etapa fora do laço não arrasta ninguém", () => {
    const estado = cenarioEmAndamento();
    const c = cascataDe(grafo, estado, "elenco", null);
    expect(c).toEqual([{ estagio: "elenco", unidade: null }]);
  });
});

describe("abrir desvio", () => {
  test("captura o retorno ANTES de mexer em qualquer status", () => {
    const estado = cenarioEmAndamento();
    const cursorAntes = proximoEstagio(estado, grafo)!;

    const d = abrirDesvio(obra, estado, grafo, { estagio: "rascunho", unidade: "cap-02" });

    // Se o retorno fosse capturado depois, apontaria para o próprio alvo.
    expect(d.retorno.estagio).toBe(cursorAntes.slug);
    expect(d.retorno.estagio).not.toBe("rascunho");
  });

  test("reabre a etapa daquela unidade, e só dela", () => {
    const estado = cenarioEmAndamento();
    abrirDesvio(obra, estado, grafo, { estagio: "rascunho", unidade: "cap-02" }, { soEsta: true });

    const depois = lerEstado(obra);
    const cap02 = depois.unidades.find((u) => u.id === "cap-02")!;
    const cap01 = depois.unidades.find((u) => u.id === "cap-01")!;
    expect(cap02.estagios.rascunho).toBe("pendente");
    expect(cap01.estagios.rascunho).toBe("concluido");
  });

  test("o próximo do desvio é o alvo, não o cursor linear", () => {
    const estado = cenarioEmAndamento();
    abrirDesvio(obra, estado, grafo, { estagio: "rascunho", unidade: "cap-02" }, { soEsta: true });

    const passo = proximoDoDesvio(lerEstado(obra))!;
    expect(passo.estagio).toBe("rascunho");
    expect(passo.unidade).toBe("cap-02");
  });

  test("recusa abrir um segundo desvio por cima do primeiro", () => {
    const estado = cenarioEmAndamento();
    abrirDesvio(obra, estado, grafo, { estagio: "elenco", unidade: null });
    expect(() =>
      abrirDesvio(obra, lerEstado(obra), grafo, { estagio: "lugares", unidade: null }),
    ).toThrow(/já existe um desvio/i);
  });
});

describe("fechar e cancelar", () => {
  test("fechar devolve o ponto de retorno e limpa o desvio", () => {
    const estado = cenarioEmAndamento();
    const d = abrirDesvio(obra, estado, grafo, { estagio: "elenco", unidade: null });

    const retorno = fecharDesvio(obra, lerEstado(obra));
    expect(retorno?.estagio).toBe(d.retorno.estagio);
    expect(lerEstado(obra).desvio).toBe(null);
  });

  test("cancelar devolve cada passo ao status que tinha antes", () => {
    const estado = cenarioEmAndamento();
    const antes = lerEstado(obra);
    const statusElencoAntes = antes.estagios.elenco.status;
    const cap02Antes = antes.unidades.find((u) => u.id === "cap-02")!.estagios.rascunho;

    abrirDesvio(obra, estado, grafo, { estagio: "rascunho", unidade: "cap-02" });
    expect(lerEstado(obra).unidades.find((u) => u.id === "cap-02")!.estagios.rascunho).toBe(
      "pendente",
    );

    cancelarDesvio(obra, lerEstado(obra));
    const depois = lerEstado(obra);
    expect(depois.desvio).toBe(null);
    expect(depois.estagios.elenco.status).toBe(statusElencoAntes);
    expect(depois.unidades.find((u) => u.id === "cap-02")!.estagios.rascunho).toBe(cap02Antes);
  });

  test("cancelar sem desvio aberto não faz nada", () => {
    expect(cancelarDesvio(obra, lerEstado(obra))).toBe(null);
  });
});

describe("migração de estado", () => {
  test("obra criada antes do desvio existir continua abrindo", () => {
    // Um livro dura meses; o método vai mudar por baixo dele.
    const antigo = { criado_em: "2026-01-01T00:00:00Z", versao: "1" } as unknown as Estado;
    const m = migrar(antigo);
    expect(m.desvio).toBe(null);
    expect(m.ultimo_acesso).toBe("2026-01-01T00:00:00Z");
    expect(m.versao).toBe("2");
  });
});

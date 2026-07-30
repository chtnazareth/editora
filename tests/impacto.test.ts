import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { carregarAgentes } from "../core/tools/editora-lib.ts";
import { criarObra } from "../core/tools/editora-novo.ts";
import { gravarEstado, lerEstado } from "../core/tools/editora-state.ts";
import {
  procurarNoCanon,
  procurarNoManuscrito,
  termosDoArtefato,
} from "../core/tools/editora-impacto.ts";
import { eventosDesde, perguntasEmAberto } from "../core/tools/editora-resumo.ts";

let raiz: string;
let obra: string;

const CAP = (corpo: string) =>
  `---\ntipo: capitulo\nstatus: pronto\n---\n> [!summary] Beat\n> Andaime não conta.\n\n${corpo}\n`;

beforeAll(() => {
  raiz = mkdtempSync(join(tmpdir(), "editora-impacto-"));
  process.env.EDITORA_AUTOR = join(raiz, ".autor");
  obra = join(raiz, "livro");
  mkdirSync(obra, { recursive: true });
  criarObra({ titulo: "Livro", em: obra, aqui: true, escopo: "romance" });

  const ato1 = join(obra, "05 — Manuscrito", "Ato 1 — Preparação");
  writeFileSync(join(ato1, "Cap 01.md"), CAP("Vela atravessou o pátio. Ninguém falou com Vela."));
  writeFileSync(join(ato1, "Cap 02.md"), CAP("Ítalo esperava no muro."));
  // Menção que existe SÓ no andaime — não pode contar.
  writeFileSync(
    join(ato1, "Cap 03.md"),
    "---\ntipo: capitulo\n---\n> [!summary] Beat\n> Vela reaparece.\n",
  );

  const estado = lerEstado(obra);
  estado.unidades.find((u) => u.id === "cap-01")!.status = "concluida";
  estado.unidades.find((u) => u.id === "cap-02")!.status = "concluida";
  gravarEstado(obra, estado);

  mkdirSync(join(obra, "02 — Personagens"), { recursive: true });
  writeFileSync(
    join(obra, "02 — Personagens", "Vela.md"),
    "---\ntipo: personagem\n---\n# Ficha\nA capitã Vela comandou a Corvo por anos.\n",
  );
});

afterAll(() => {
  rmSync(raiz, { recursive: true, force: true });
  delete process.env.EDITORA_AUTOR;
});

describe("busca no manuscrito", () => {
  test("conta só o que está na prosa", () => {
    const r = procurarNoManuscrito(obra, lerEstado(obra), ["Vela"]);
    const cap01 = r.find((x) => x.unidade === "cap-01")!;
    expect(cap01.ocorrencias).toBe(2);
  });

  test("menção que só existe no andaime não conta", () => {
    // Cap 03 cita "Vela" apenas no callout de beat — é esqueleto, não texto.
    const r = procurarNoManuscrito(obra, lerEstado(obra), ["Vela"]);
    expect(r.find((x) => x.unidade === "cap-03")).toBeUndefined();
  });

  test("nome com acento é encontrado — `\\b` falharia aqui", () => {
    const r = procurarNoManuscrito(obra, lerEstado(obra), ["Ítalo"]);
    expect(r.find((x) => x.unidade === "cap-02")?.ocorrencias).toBe(1);
  });

  test("capítulo aprovado que cita o termo é marcado para reconferir", () => {
    const r = procurarNoManuscrito(obra, lerEstado(obra), ["Vela"]);
    expect(r.find((x) => x.unidade === "cap-01")?.reconferir).toBe(true);
  });

  test("capítulo ainda não escrito não é marcado", () => {
    const r = procurarNoManuscrito(obra, lerEstado(obra), ["Ítalo"]);
    // cap-02 está concluída; nenhuma pendente cita o termo
    expect(r.every((x) => x.reconferir === (x.status === "concluida"))).toBe(true);
  });

  test("termo inexistente devolve lista vazia", () => {
    expect(procurarNoManuscrito(obra, lerEstado(obra), ["Karth"]).length).toBe(0);
  });

  test("casa a palavra inteira, não pedaço de outra", () => {
    // "Vela" não pode casar dentro de "Velame" nem "Novela".
    expect(procurarNoManuscrito(obra, lerEstado(obra), ["Vel"]).length).toBe(0);
  });
});

describe("busca no canon", () => {
  test("acha a ficha e sabe de que estágio ela é", () => {
    const r = procurarNoCanon(obra, ["Vela"]);
    const ficha = r.find((x) => x.arquivo.includes("Vela.md"))!;
    expect(ficha.estagio).toBe("elenco");
    expect(ficha.ocorrencias).toBeGreaterThan(0);
  });
});

describe("nomes próprios de um artefato", () => {
  test("extrai nome do meio da frase e ignora o início", () => {
    const f = join(raiz, "ficha.md");
    writeFileSync(f, "A capitã Vela comandou a Corvo. Ela partiu.");
    const termos = termosDoArtefato(f);
    expect(termos).toContain("Vela");
    expect(termos).toContain("Corvo");
    // "A" e "Ela" abrem frase — capitalização não prova nome próprio.
    expect(termos).not.toContain("Ela");
  });
});

describe("resumo", () => {
  test("só conta eventos posteriores ao último acesso", () => {
    const todos = eventosDesde(obra, "1970-01-01T00:00:00Z");
    const nenhum = eventosDesde(obra, "2999-01-01T00:00:00Z");
    expect(todos.length).toBeGreaterThan(0);
    expect(nenhum.length).toBe(0);
  });

  test("junta perguntas em aberto de vários estágios", () => {
    for (const estagio of ["sabatina", "captura-semente"]) {
      const dir = join(obra, ".editora", "registro", "ideacao", estagio);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, "memoria.md"),
        `# Memória\n\n## Perguntas em aberto\n\n- pendência de ${estagio}\n`,
      );
    }
    const p = perguntasEmAberto(obra);
    expect(p.length).toBeGreaterThanOrEqual(2);
    expect(p.map((x) => x.origem)).toContain("sabatina");
  });
});

describe("ferramentas dos agentes", () => {
  test("quem levanta fato tem acesso à web", () => {
    // Regressão: o Pesquisador ficou sem WebSearch e a sabatina pedia pesquisa
    // que ninguém podia fazer. Achado testando de verdade.
    for (const slug of ["editora-pesquisa-agent", "editora-aquisicao-agent"]) {
      const a = carregarAgentes().find((x) => x.slug === slug)!;
      expect(a.ferramentas).toContain("WebSearch");
    }
  });

  test("quem escreve prosa NÃO tem — pesquisar no meio da cena inventa canon", () => {
    const prosista = carregarAgentes().find((x) => x.slug === "editora-prosista-agent")!;
    expect(prosista.ferramentas ?? "").not.toContain("WebSearch");
  });
});

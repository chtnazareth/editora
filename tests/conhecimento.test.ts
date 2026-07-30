import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { carregarAgentes, dirCore } from "../core/tools/editora-lib.ts";

const dirConhecimento = join(dirCore(), "knowledge");

function arquivosDe(slug: string): string[] {
  const dir = join(dirConhecimento, slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => join(dir, f));
}

function todosOsArquivos(): string[] {
  return readdirSync(dirConhecimento).flatMap((sub) => {
    const dir = join(dirConhecimento, sub);
    return readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => join(dir, f));
  });
}

describe("cobertura", () => {
  test("todo agente tem ao menos um arquivo de conhecimento", () => {
    // Treze personas afirmavam carregar core/knowledge/<agente>/ e nove dessas
    // pastas estavam vazias. Este teste é o que impede a volta desse buraco.
    for (const a of carregarAgentes()) {
      const arquivos = arquivosDe(a.slug);
      expect(arquivos.length).toBeGreaterThan(0);
    }
  });

  test("nenhum arquivo de conhecimento é esqueleto vazio", () => {
    for (const arq of todosOsArquivos()) {
      const texto = readFileSync(arq, "utf8");
      expect(texto.split(/\s+/).length).toBeGreaterThan(120);
    }
  });

  test("todo arquivo abre com um título", () => {
    for (const arq of todosOsArquivos()) {
      expect(readFileSync(arq, "utf8")).toMatch(/^#\s+.+/m);
    }
  });
});

describe("as duas camadas", () => {
  // core/knowledge/ é público e vai no git: carrega ofício de qualquer autor.
  // A calibração pessoal — registro-alvo, régua de manuscrito, gosto — vive em
  // memoria/autor.md, que é privado e por autor. Sem esta guarda, a camada
  // pública vaza preferência pessoal em poucas semanas e ninguém percebe.
  const PROIBIDO: { padrao: RegExp; oque: string }[] = [
    { padrao: /\bClaudio\b|\bNazareth\b/i, oque: "nome do autor" },
    { padrao: /Cinzas do Pac[íi]fico|cinzas-do-pacifico/i, oque: "título de obra do autor" },
    { padrao: /Primeira Incurs[ãa]o|primeira-incursao/i, oque: "título de obra do autor" },
    { padrao: /\bProject-x\b/i, oque: "título de obra do autor" },
    { padrao: /~\/LIVROS|\/LIVROS\//, oque: "caminho pessoal de manuscrito" },
    { padrao: /prosa-a-luz|prosa-cinzas|prosa-projectx|prosa-primeira/i, oque: "skill de voz de um livro específico" },
  ];

  test("a camada pública não vaza calibração pessoal", () => {
    const vazamentos: string[] = [];
    for (const arq of todosOsArquivos()) {
      const texto = readFileSync(arq, "utf8");
      for (const { padrao, oque } of PROIBIDO) {
        if (padrao.test(texto)) {
          vazamentos.push(`${arq.replace(dirConhecimento, "knowledge")} → ${oque}`);
        }
      }
    }
    expect(vazamentos).toEqual([]);
  });

  test("o crédito às fontes externas está no NOTICE, não solto no conhecimento", () => {
    // Material adaptado de terceiro precisa de crédito, e o lugar dele é o
    // NOTICE do repositório.
    const notice = readFileSync(join(dirCore(), "..", "NOTICE"), "utf8");
    expect(notice).toMatch(/Signs of AI writing|humanizer/i);
  });
});

describe("os arquivos que mais valem", () => {
  // Os quatro que não existiam em lugar nenhum do sistema, e o motivo de cada um.
  const ESSENCIAIS: [string, string, RegExp][] = [
    [
      "editora-shared",
      "processo-de-um-livro.md",
      /deserto do meio|cansaço/i,
    ],
    [
      "editora-linha-agent",
      "tells-de-ia-ptbr.md",
      /travess[ãa]o/i,
    ],
    [
      "editora-copidesque-agent",
      "pontuacao-de-dialogo-ptbr.md",
      /ênclise|enclise/i,
    ],
    [
      "editora-aquisicao-agent",
      "mercado-editorial-br.md",
      /agente/i,
    ],
  ];

  for (const [agente, arquivo, deveConter] of ESSENCIAIS) {
    test(`${agente}/${arquivo} existe e cobre o essencial`, () => {
      const caminho = join(dirConhecimento, agente, arquivo);
      expect(existsSync(caminho)).toBe(true);
      expect(readFileSync(caminho, "utf8")).toMatch(deveConter);
    });
  }

  test("o catálogo de tells avisa o que NÃO se aplica em português", () => {
    // Adotar a regra inglesa de cortar travessões quebraria o diálogo de todo
    // livro do framework. O aviso é a parte mais importante do arquivo.
    const texto = readFileSync(
      join(dirConhecimento, "editora-linha-agent", "tells-de-ia-ptbr.md"),
      "utf8",
    );
    expect(texto).toMatch(/N[ÃA]O se aplica/i);
    expect(texto).toMatch(/marca \*\*correta\*\* de diálogo|correta.{0,20}diálogo/i);
  });
});

import { describe, expect, test } from "bun:test";
import {
  extrairProsa,
  mascararFrontmatter,
  sensorAberturaCena,
  sensorAforismo,
  sensorCoberturaUpstream,
  sensorDensidade,
  sensorDerivaPov,
  sensorRegistro,
  sensorRepeticao,
  sensorSecoesObrigatorias,
  sensorTranslates,
  type Contexto,
} from "../core/tools/editora-sensores.ts";

const ctx = (texto: string, extra: Partial<Contexto> = {}): Contexto => ({
  caminho: "teste.md",
  texto,
  ...extra,
});

const regras = (r: { achados: { regra: string }[] }) => r.achados.map((a) => a.regra);

describe("extração de prosa", () => {
  test("preserva a contagem de linhas ao mascarar", () => {
    const bruto = "---\ntipo: capitulo\n---\n# Título\n\nA prosa.\n";
    expect(extrairProsa(bruto).split("\n").length).toBe(bruto.split("\n").length);
  });

  test("descarta andaime do template mas mantém a prosa", () => {
    const p = extrairProsa(
      ["# O Despertar", "", "**LUGAR** — A definir", "", "---", "", "A prosa começa aqui."].join("\n"),
    );
    expect(p).not.toContain("LUGAR");
    expect(p).not.toContain("O Despertar");
    expect(p).toContain("A prosa começa aqui.");
  });

  test("descarta blocos de código", () => {
    const p = extrairProsa(["```", "[OFFLINE] drivers", "```", "", "Texto real."].join("\n"));
    expect(p).not.toContain("OFFLINE");
    expect(p).toContain("Texto real.");
  });

  test("mascararFrontmatter mantém os títulos, que extrairProsa remove", () => {
    const bruto = "---\na: 1\n---\n## Seção\n";
    expect(mascararFrontmatter(bruto)).toContain("## Seção");
    expect(extrairProsa(bruto)).not.toContain("## Seção");
  });
});

describe("veneno 1 — translatês", () => {
  test("acusa possessivo redundante em parte do corpo", () => {
    expect(regras(sensorTranslates(ctx("Ele balançou a sua cabeça devagar.")))).toContain(
      "possessivo-redundante",
    );
  });

  test("não acusa a forma correta", () => {
    expect(regras(sensorTranslates(ctx("Ele balançou a cabeça devagar.")))).not.toContain(
      "possessivo-redundante",
    );
  });

  test("acusa verbo-filtro", () => {
    expect(regras(sensorTranslates(ctx("Ela viu que a porta estava aberta.")))).toContain(
      "verbo-filtro",
    );
  });

  test("acusa muleta traduzida", () => {
    expect(regras(sensorTranslates(ctx("De alguma forma ele sabia.")))).toContain(
      "muleta-traduzida",
    );
  });

  test("prosa limpa passa", () => {
    const r = sensorTranslates(ctx("A porta estava aberta. Ele entrou sem bater."));
    expect(r.achados).toEqual([]);
  });
});

describe("veneno 2 — aforismo de para-choque", () => {
  test("acusa o contraste esperto", () => {
    expect(regras(sensorAforismo(ctx("Aquilo não era fé, era lavoura.")))).toContain(
      "contraste-slogan",
    );
  });

  test("acusa parágrafo de uma sentença curta", () => {
    const t = "Um parágrafo comum, com alguma extensão e mais de uma ideia dentro dele.\n\nEle sabia.\n";
    expect(regras(sensorAforismo(ctx(t)))).toContain("paragrafo-sentenca");
  });

  test("parágrafo longo não é acusado", () => {
    const t = "Ele sabia que aquilo ia acabar mal, e mesmo assim continuou andando na direção da porta.";
    expect(sensorAforismo(ctx(t)).achados).toEqual([]);
  });
});

describe("veneno 3 — registro oral", () => {
  test('acusa "a gente" como pronome', () => {
    const r = sensorRegistro(ctx("Naquela noite a gente voltou tarde."));
    expect(regras(r)).toContain("oralidade");
    expect(r.passou).toBe(false);
  });

  test('NÃO acusa "a gente" como substantivo', () => {
    // "a gente da Igreja" = o povo da Igreja. Registro literário correto.
    expect(sensorRegistro(ctx("A gente da Igreja fazia aquilo com ferro.")).passou).toBe(true);
    expect(sensorRegistro(ctx("Toda a gente sabia.")).passou).toBe(true);
  });

  test('acusa "você" na narração mas não no diálogo', () => {
    expect(sensorRegistro(ctx("Você nunca saberia o que houve ali.")).passou).toBe(false);
    expect(sensorRegistro(ctx("— Você não devia ter vindo — disse ela.")).passou).toBe(true);
  });

  test("é bloqueante — qualquer ocorrência reprova", () => {
    expect(sensorRegistro(ctx("Ele foi pra casa.")).passou).toBe(false);
  });
});

describe("veneno 4 — densidade", () => {
  test("acusa frase longa demais", () => {
    const longa = `${Array.from({ length: 50 }, (_, i) => `palavra${i}`).join(" ")}.`;
    expect(regras(sensorDensidade(ctx(longa)))).toContain("frase-longa");
  });

  test("acusa efeito sobre efeito no mesmo parágrafo", () => {
    const t = "Ela caiu como um saco de pedras, e ficou parada como se estivesse dormindo.";
    expect(regras(sensorDensidade(ctx(t)))).toContain("efeito-sobre-efeito");
  });

  test("anáfora curta e deliberada NÃO é acusada", () => {
    // Padrão real do manuscrito de Cinzas do Pacífico.
    const t = "Demorou para juntar as partes: que era uma voz, que vinha de alguém, que estava ali.";
    expect(regras(sensorDensidade(ctx(t)))).not.toContain("subordinacao-empilhada");
  });

  test("reporta a média de palavras por frase", () => {
    const r = sensorDensidade(ctx("Uma frase curta. Outra frase curta aqui."));
    expect(Number(r.metricas.media_palavras_frase)).toBeGreaterThan(0);
  });
});

describe("lei nº 1 — abertura de cena", () => {
  test("bloqueia abertura descritiva", () => {
    const r = sensorAberturaCena(ctx("O acampamento ficava na última elevação antes do cinza."));
    expect(r.passou).toBe(false);
    expect(regras(r)).toContain("abertura-descritiva");
  });

  test('bloqueia abertura em "Havia"', () => {
    expect(sensorAberturaCena(ctx("Havia uma torre no fim do vale.")).passou).toBe(false);
  });

  test("aceita abertura em diálogo", () => {
    const r = sensorAberturaCena(ctx("— Nós devíamos voltar — insistiu Gared."));
    expect(r.passou).toBe(true);
    expect(r.metricas.abre_em_dialogo).toBe("sim");
  });

  test("aceita abertura em ação com agente", () => {
    expect(sensorAberturaCena(ctx("Tarkus parou na soleira e olhou o corpo.")).passou).toBe(true);
  });

  test("ignora o andaime antes da prosa", () => {
    const t = "# Cap 01\n\n**POV** — Tarkus\n\n— Você não devia ter vindo — disse Vela.";
    expect(sensorAberturaCena(ctx(t)).metricas.abre_em_dialogo).toBe("sim");
  });
});

describe("deriva de POV", () => {
  test("acusa mente alheia", () => {
    const r = sensorDerivaPov(ctx("Tarkus olhou em volta. Vela sentiu o frio subir.", { pov: "Tarkus" }));
    expect(r.passou).toBe(false);
    expect(regras(r)).toContain("mente-alheia");
  });

  test("o POV pode pensar à vontade", () => {
    expect(sensorDerivaPov(ctx("Tarkus sentiu o frio subir.", { pov: "Tarkus" })).passou).toBe(true);
  });

  test("sem pov declarado, passa com aviso", () => {
    const r = sensorDerivaPov(ctx("Vela sentiu o frio."));
    expect(r.passou).toBe(true);
    expect(regras(r)).toContain("pov-ausente");
  });
});

describe("repetição", () => {
  test("acusa eco lexical próximo", () => {
    expect(regras(sensorRepeticao(ctx("A muralha cedeu. Atrás da muralha, ninguém."))))
      .toContain("eco-lexical");
  });

  test("nome próprio repetido NÃO é eco", () => {
    const t = "Tarkus entrou. O corpo de Tarkus doía, e Tarkus não parou por isso.";
    expect(regras(sensorRepeticao(ctx(t)))).not.toContain("eco-lexical");
  });

  test("acusa tique de abertura de parágrafo", () => {
    const t = ["Ele entrou.", "Ele parou.", "Outra coisa.", "Ele olhou.", "Mais uma.", "Fim."].join("\n\n");
    expect(regras(sensorRepeticao(ctx(t)))).toContain("tique-abertura");
  });
});

describe("forma de documento", () => {
  test("exige duas seções de nível 2", () => {
    expect(sensorSecoesObrigatorias(ctx("# T\n\n## A\n\ntexto\n\n## B\n")).passou).toBe(true);
    expect(sensorSecoesObrigatorias(ctx("# T\n\n## A\n")).passou).toBe(false);
  });
});

describe("cobertura upstream", () => {
  test("passa quando o artefato consumido é citado", () => {
    const r = sensorCoberturaUpstream(
      ctx("## A\nDerivado da declaracao-semente.\n## B\nfim", { consome: ["declaracao-semente"] }),
    );
    expect(r.passou).toBe(true);
  });

  test("aceita a menção por extenso, sem hífen", () => {
    const r = sensorCoberturaUpstream(
      ctx("Partimos da declaracao semente do autor.", { consome: ["declaracao-semente"] }),
    );
    expect(r.passou).toBe(true);
  });

  test("reprova quando o artefato nunca é mencionado", () => {
    const r = sensorCoberturaUpstream(ctx("Texto qualquer.", { consome: ["pilares-criativos"] }));
    expect(r.passou).toBe(false);
  });

  test("sem consome declarado, passa", () => {
    expect(sensorCoberturaUpstream(ctx("Texto.")).passou).toBe(true);
  });
});

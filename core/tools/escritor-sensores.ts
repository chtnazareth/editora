/**
 * escritor-sensores.ts — as verificações determinísticas sobre o texto.
 *
 * Porte dos sensores do AI-DLC (`linter`, `type-check`, `required-sections`,
 * `upstream-coverage`) para prosa em português brasileiro. Cada analisador
 * mede uma coisa medível; julgamento continua sendo humano no portão.
 *
 * Os quatro primeiros são a codificação dos **quatro venenos** que o autor
 * rejeitou em iterações seguidas; `abertura-cena` e `densidade` codificam as
 * Leis nº 1 e nº 2 do metodo-martin.
 */

export type Severidade = "bloqueante" | "consultivo";

export interface Achado {
  linha: number;
  regra: string;
  trecho: string;
  mensagem: string;
  severidade: Severidade;
}

export interface Contexto {
  caminho: string;
  texto: string;
  /** POV declarado no frontmatter do capítulo, se houver. */
  pov?: string;
  /** Artefatos que o estágio declara consumir (para cobertura-upstream). */
  consome?: string[];
  /** Meta de palavras do capítulo, se declarada. */
  alvo_palavras?: number;
}

export interface Resultado {
  id: string;
  passou: boolean;
  achados: Achado[];
  metricas: Record<string, number | string>;
}

// ---------------------------------------------------------------------------
// Utilidades de texto
// ---------------------------------------------------------------------------

/**
 * Apaga o conteúdo mas PRESERVA a contagem de linhas — todo achado precisa
 * apontar para a linha real do arquivo que o autor vai abrir no Obsidian.
 */
function apagarLinha(): string {
  return "";
}

/** Mascara só o frontmatter. Para sensores de forma de documento. */
export function mascararFrontmatter(texto: string): string {
  const linhas = texto.split(/\r?\n/);
  if (linhas[0]?.trim() !== "---") return texto;
  const fim = linhas.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (fim < 0) return texto;
  return linhas.map((l, i) => (i <= fim ? apagarLinha() : l)).join("\n");
}

/**
 * Isola a PROSA: tira frontmatter, títulos, blocos de código, citações,
 * separadores e linhas de andaime do template (`**LUGAR** — ...`).
 *
 * Sem isso os sensores medem o esqueleto do arquivo em vez do texto — foi
 * exatamente o que aconteceu no primeiro teste contra o manuscrito real.
 */
export function extrairProsa(texto: string): string {
  const linhas = mascararFrontmatter(texto).split(/\r?\n/);
  let dentroDeCerca = false;
  return linhas
    .map((l) => {
      const t = l.trim();
      if (/^(```|~~~)/.test(t)) {
        dentroDeCerca = !dentroDeCerca;
        return apagarLinha();
      }
      if (dentroDeCerca) return apagarLinha();
      if (/^#{1,6}\s/.test(t)) return apagarLinha();
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) return apagarLinha();
      if (/^>/.test(t)) return apagarLinha();
      if (/^<!--/.test(t)) return apagarLinha();
      // Andaime do template: `**LUGAR** — ...`, `**POV** — ...`
      if (/^\*\*[^*]{1,40}\*\*\s*[—–:-]/.test(t)) return apagarLinha();
      if (/^\[!\w+\]/.test(t)) return apagarLinha();
      return l;
    })
    .join("\n");
}

/** Mantido para quem só precisa do corpo sem se importar com linha. */
export function removerFrontmatter(texto: string): string {
  return texto.replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/, "");
}

export function lerFrontmatterCampo(texto: string, campo: string): string | undefined {
  const m = new RegExp(`^---[\\s\\S]*?^${campo}:\\s*(.+)$`, "m").exec(texto);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : undefined;
}

/** Índice de caractere → número da linha (1-indexado). */
function mapaLinhas(texto: string): (idx: number) => number {
  const quebras: number[] = [];
  for (let i = 0; i < texto.length; i++) if (texto[i] === "\n") quebras.push(i);
  return (idx: number) => {
    let lo = 0;
    let hi = quebras.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (quebras[mid] < idx) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };
}

export function ehLinhaDeDialogo(linha: string): boolean {
  return /^\s*[—–-]\s+/.test(linha);
}

/** Separa narração de diálogo — vários sensores só valem sobre a narração. */
export function separarNarracao(texto: string): string {
  return texto
    .split(/\r?\n/)
    .map((l) => (ehLinhaDeDialogo(l) ? "" : l))
    .join("\n")
    .replace(/[«"“][^»"”]{0,400}[»"”]/g, " ");
}

export function paragrafos(texto: string): { inicio: number; texto: string }[] {
  const saida: { inicio: number; texto: string }[] = [];
  const re = /(^|\n)[ \t]*\n/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    const bloco = texto.slice(cursor, m.index);
    if (bloco.trim() !== "") saida.push({ inicio: cursor, texto: bloco });
    cursor = re.lastIndex;
  }
  const resto = texto.slice(cursor);
  if (resto.trim() !== "") saida.push({ inicio: cursor, texto: resto });
  return saida;
}

export function frases(texto: string): { inicio: number; texto: string }[] {
  const saida: { inicio: number; texto: string }[] = [];
  const re = /[^.!?…]+[.!?…]+["'»”]?|\S[^.!?…]*$/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    const t = m[0].trim();
    if (t.length > 0) saida.push({ inicio: m.index, texto: t });
  }
  return saida;
}

export function contarPalavras(texto: string): number {
  return texto.split(/\s+/).filter((w) => /[\p{L}]/u.test(w)).length;
}

const PARADAS = new Set(
  ("de da do das dos que para com uma um os as no na nos nas por como mas ele ela eles elas " +
    "seu sua seus suas isso esse essa este esta aquele aquela quando onde ainda depois antes " +
    "sobre entre havia tinha estava foram sendo pelo pela pelos pelas mesmo mesma muito pouco " +
    "todo toda todos todas outro outra outros outras qualquer cada nada tudo algum alguma " +
    "porque então também já não sim se sem até desde contra sob após durante numa num").split(
    /\s+/,
  ),
);

function achado(
  linhaDe: (i: number) => number,
  idx: number,
  regra: string,
  trecho: string,
  mensagem: string,
  severidade: Severidade = "consultivo",
): Achado {
  return {
    linha: linhaDe(idx),
    regra,
    trecho: trecho.trim().slice(0, 120),
    mensagem,
    severidade,
  };
}

// ---------------------------------------------------------------------------
// VENENO 1 — translatês (decalque do inglês)
// ---------------------------------------------------------------------------

const PADROES_TRANSLATES: { re: RegExp; regra: string; msg: string }[] = [
  {
    re: /\b(balançou|coçou|esfregou|ergueu|abaixou|cerrou|apertou|virou|inclinou|sacudiu|estalou|acenou)\s+(a|o|as|os)?\s*(sua|seu|suas|seus)\s+/giu,
    regra: "possessivo-redundante",
    msg: 'decalque de "his/her": em português a parte do corpo leva artigo — "balançou a cabeça", não "balançou a sua cabeça".',
  },
  {
    re: /\b(seus|suas)\s+(olhos|mãos|ombros|lábios|dedos)\s+se\s+\w+ram\b/giu,
    regra: "possessivo-redundante",
    msg: '"his eyes narrowed" traduzido literalmente. Prefira "os olhos se estreitaram" ou reescreva pela ação.',
  },
  {
    re: /\b(viu|sentiu|percebeu|notou|observou|reparou|ouviu|soube|entendeu)\s+que\b/giu,
    regra: "verbo-filtro",
    msg: "verbo-filtro afasta o leitor do POV. Corte o filtro e mostre direto o que ele viu.",
  },
  {
    re: /\b(de alguma forma|de algum modo|por alguma razão|por algum motivo|algo como|um tipo de|uma espécie de|não pôde deixar de|não conseguiu deixar de|se viu|deixou escapar|por um momento|por um instante)\b/giu,
    regra: "muleta-traduzida",
    msg: "muleta de tradução (somehow / for some reason / a kind of / couldn't help but). Corte ou substitua por algo concreto.",
  },
  {
    re: /^\s*No (começo|princípio) havia\b/gimu,
    regra: "cadencia-biblica",
    msg: 'cadência bíblica decalcada ("In the beginning there was"). O autor já rejeitou esta abertura.',
  },
  {
    re: /\bnão\s+(era\s+)?(uma\s+|um\s+)?(metáfora|exagero|figura de linguagem|força de expressão)\b/giu,
    regra: "nao-metafora",
    msg: 'decalque de "not a metaphor". Se precisa dizer que é literal, a imagem anterior falhou.',
  },
];

export function sensorTranslates(ctx: Contexto): Resultado {
  const texto = extrairProsa(ctx.texto);
  const linhaDe = mapaLinhas(texto);
  const narracao = separarNarracao(texto);
  const achados: Achado[] = [];

  for (const { re, regra, msg } of PADROES_TRANSLATES) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    const alvo = regra === "verbo-filtro" ? narracao : texto;
    while ((m = re.exec(alvo)) !== null) {
      achados.push(achado(linhaDe, m.index, regra, m[0], msg));
      if (re.lastIndex === m.index) re.lastIndex++;
    }
  }

  // Perífrase progressiva: correta em doses; anglicizada quando vira hábito.
  const prog = [...narracao.matchAll(/\b(estava|estavam|estivera|estariam)\s+\p{L}+ndo\b/giu)];
  const palavras = contarPalavras(narracao);
  const densidade = palavras > 0 ? (prog.length / palavras) * 1000 : 0;
  if (densidade > 4 && prog.length >= 3) {
    for (const m of prog.slice(0, 5)) {
      achados.push(
        achado(
          linhaDe,
          m.index ?? 0,
          "progressiva-excessiva",
          m[0],
          `${prog.length} perífrases "estava + gerúndio" em ${palavras} palavras (${densidade.toFixed(1)}/mil). Em português o pretérito simples costuma bastar.`,
        ),
      );
    }
  }

  return {
    id: "translates",
    passou: achados.filter((a) => a.severidade === "bloqueante").length === 0,
    achados,
    metricas: { ocorrencias: achados.length, progressivas: prog.length },
  };
}

// ---------------------------------------------------------------------------
// VENENO 2 — aforismo de para-choque
// ---------------------------------------------------------------------------

export function sensorAforismo(ctx: Contexto): Resultado {
  const texto = extrairProsa(ctx.texto);
  const linhaDe = mapaLinhas(texto);
  const achados: Achado[] = [];

  // "isso não é fé, é lavoura" — o contraste esperto que vira slogan.
  const contraste =
    /\bnão\s+(é|era|foi|são|eram)\s+[^,.;:]{2,45},\s*(é|era|foi|são|eram)\s+[^.;:!?]{2,45}/giu;
  let m: RegExpExecArray | null;
  while ((m = contraste.exec(texto)) !== null) {
    achados.push(
      achado(
        linhaDe,
        m.index,
        "contraste-slogan",
        m[0],
        'aforismo de para-choque: "não é X, é Y". Fecha o parágrafo num truque. Diga a coisa sem o contraste.',
      ),
    );
  }

  // Parágrafo de uma frase curta e sentenciosa, fora de diálogo.
  const paras = paragrafos(texto).filter(
    (p) => !ehLinhaDeDialogo(p.texto) && !/^#{1,6}\s/.test(p.texto.trim()) && !/^>/.test(p.texto.trim()),
  );
  const sentenciosos = paras.filter((p) => {
    const fs = frases(p.texto);
    if (fs.length !== 1) return false;
    const n = contarPalavras(p.texto);
    // Piso 1: "Ele sabia." — quanto mais curto, mais o efeito de slogan.
    return n >= 1 && n <= 9 && /[.!]$/.test(p.texto.trim());
  });
  for (const p of sentenciosos) {
    achados.push(
      achado(
        linhaDe,
        p.inicio,
        "paragrafo-sentenca",
        p.texto,
        "parágrafo de uma frase curta e fechada — o efeito de slogan. Um por cena passa; em série, vira tique.",
      ),
    );
  }

  const total = paras.length || 1;
  const proporcao = sentenciosos.length / total;
  const passou = proporcao <= 0.12 && achados.filter((a) => a.regra === "contraste-slogan").length <= 1;

  return {
    id: "aforismo",
    passou,
    achados,
    metricas: {
      paragrafos_sentenca: sentenciosos.length,
      paragrafos: total,
      proporcao: Number(proporcao.toFixed(3)),
    },
  };
}

// ---------------------------------------------------------------------------
// VENENO 3 — registro oral / baixo
// ---------------------------------------------------------------------------

const PADROES_REGISTRO: { re: RegExp; regra: string; msg: string }[] = [
  {
    // Só o pronome coloquial ("a gente foi"), nunca o substantivo legítimo
    // ("a gente da Igreja", "toda a gente"), que é registro literário correto.
    re: /(?<!toda\s)\ba gente\b(?!\s+(?:de|da|do|das|dos|d[ao]quel[ae]s?|daqui|dali|comum|miúda|humilde|simples|pobre|boa|velha|graúda))/giu,
    regra: "oralidade",
    msg: '"a gente" como pronome derruba o registro. Use "nós" ou reescreva impessoal com "se". (O substantivo — "a gente da Igreja" — é correto e não é acusado.)',
  },
  {
    // ATENÇÃO: `\b` em JS é fronteira ASCII — `\bvocê\b` NUNCA casa, porque o
    // `ê` final não é caractere de palavra ASCII. Em português é obrigatório
    // usar lookaround sobre \p{L}. Vale para todo padrão com acento na ponta.
    re: /(?<![\p{L}])você(?![\p{L}])/giu,
    regra: "oralidade",
    msg: '"você" na narração quebra a terceira pessoa impessoal. Só em diálogo.',
  },
  {
    re: /(?<![\p{L}])pra(?![\p{L}])/giu,
    regra: "oralidade",
    msg: '"pra" é fala. Na narração, "para".',
  },
  {
    re: /(?<![\p{L}])(né|tá|cara|galera|beleza|tipo assim|pra caramba|meio que)(?![\p{L}])/giu,
    regra: "coloquialismo",
    msg: "coloquialismo — o autor já devolveu prosa por isso.",
  },
  {
    re: /\b(dão|davam|deram)\s+o\s+nome\s+de\b/giu,
    regra: "coloquialismo",
    msg: '"dão o nome de" é registro baixo. Prefira "chamam", "é conhecido como", ou nomeie direto.',
  },
];

export function sensorRegistro(ctx: Contexto): Resultado {
  const texto = extrairProsa(ctx.texto);
  const linhaDe = mapaLinhas(texto);
  const narracao = separarNarracao(texto);
  const achados: Achado[] = [];

  for (const { re, regra, msg } of PADROES_REGISTRO) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(narracao)) !== null) {
      achados.push(achado(linhaDe, m.index, regra, m[0], msg, "bloqueante"));
      if (re.lastIndex === m.index) re.lastIndex++;
    }
  }

  return {
    id: "registro-baixo",
    passou: achados.length === 0,
    achados,
    metricas: { ocorrencias: achados.length },
  };
}

// ---------------------------------------------------------------------------
// VENENO 4 / LEI Nº 2 — densidade (clareza primeiro)
// ---------------------------------------------------------------------------

export const MAX_PALAVRAS_FRASE = 45;

export function sensorDensidade(ctx: Contexto): Resultado {
  const texto = extrairProsa(ctx.texto);
  const linhaDe = mapaLinhas(texto);
  const achados: Achado[] = [];
  const narracao = separarNarracao(texto);

  const todasFrases = frases(narracao);
  let longas = 0;
  let empilhadas = 0;

  for (const f of todasFrases) {
    const n = contarPalavras(f.texto);
    if (n > MAX_PALAVRAS_FRASE) {
      longas++;
      achados.push(
        achado(
          linhaDe,
          f.inicio,
          "frase-longa",
          f.texto,
          `${n} palavras numa frase só. Frase relida é frase errada — quebre em duas.`,
        ),
      );
    }
    const relativas = (f.texto.match(/\bque\b/giu) ?? []).length;
    const virgulas = (f.texto.match(/,/g) ?? []).length;
    // Anáfora deliberada ("que…, que…, que…") é recurso, não defeito — o
    // manuscrito de Cinzas usa e funciona. Só acusa quando o empilhamento vem
    // junto de frase comprida, que é quando o leitor precisa reler.
    if (
      relativas >= 4 ||
      (relativas >= 3 && n > 32) ||
      (relativas >= 2 && virgulas >= 4 && n > 25)
    ) {
      empilhadas++;
      achados.push(
        achado(
          linhaDe,
          f.inicio,
          "subordinacao-empilhada",
          f.texto,
          `${relativas} "que" e ${virgulas} vírgulas na mesma frase — relativa dentro de relativa. Duas frases claras valem mais que uma esperta.`,
        ),
      );
    }
  }

  // Um efeito por parágrafo: símile é o efeito mais fácil de contar.
  const paras = paragrafos(narracao);
  let paragrafosSobrecarregados = 0;
  for (const p of paras) {
    const similes = (p.texto.match(/\bcomo\s+(um|uma|o|a|os|as|se)\b/giu) ?? []).length;
    if (similes >= 2) {
      paragrafosSobrecarregados++;
      achados.push(
        achado(
          linhaDe,
          p.inicio,
          "efeito-sobre-efeito",
          p.texto,
          `${similes} comparações no mesmo parágrafo. Um efeito por parágrafo, no máximo.`,
        ),
      );
    }
  }

  const media =
    todasFrases.length > 0
      ? todasFrases.reduce((s, f) => s + contarPalavras(f.texto), 0) / todasFrases.length
      : 0;

  return {
    id: "densidade",
    passou: longas === 0 && empilhadas <= 2 && paragrafosSobrecarregados === 0,
    achados,
    metricas: {
      frases: todasFrases.length,
      media_palavras_frase: Number(media.toFixed(1)),
      frases_longas: longas,
      subordinacao_empilhada: empilhadas,
      paragrafos_sobrecarregados: paragrafosSobrecarregados,
    },
  };
}

// ---------------------------------------------------------------------------
// LEI Nº 1 — cena, não ensaio (abertura)
// ---------------------------------------------------------------------------

// Fronteira final por lookahead sobre \p{L}, e não `\b`: palavras como "manhã"
// e "salão" terminam em caractere não-ASCII e escapariam de `\b`.
const ABERTURAS_PROIBIDAS =
  /^(havia|era uma|era o|era a|fazia (frio|calor)|o (lugar|acampamento|vilarejo|povoado|castelo|salão|quarto|céu|sol|vento|rio|mar)|a (cidade|vila|aldeia|noite|manhã|tarde|chuva|neve|estrada|torre|floresta)|as (montanhas|ruínas|muralhas)|os (bosques|campos|muros))(?![\p{L}])/iu;

export function sensorAberturaCena(ctx: Contexto): Resultado {
  const texto = extrairProsa(ctx.texto);
  const linhaDe = mapaLinhas(texto);
  const achados: Achado[] = [];

  const primeiro = paragrafos(texto).find(
    (p) => !/^#{1,6}\s/.test(p.texto.trim()) && !/^>/.test(p.texto.trim()) && p.texto.trim() !== "",
  );

  if (!primeiro) {
    return { id: "abertura-cena", passou: true, achados, metricas: { abertura: "vazia" } };
  }

  const t = primeiro.texto.trim();
  const abreEmDialogo = ehLinhaDeDialogo(t);
  const abreEmDescricao = ABERTURAS_PROIBIDAS.test(t);

  if (abreEmDescricao) {
    achados.push(
      achado(
        linhaDe,
        primeiro.inicio,
        "abertura-descritiva",
        t,
        "Lei nº 1: a cena abre com a câmera na paisagem. Martin abre por gente e atrito. Apague e recomece por uma voz ou uma ação com tensão.",
        "bloqueante",
      ),
    );
  }

  // Exposição de mundo na abertura: parágrafo sem sujeito humano agindo.
  const temAgente = /\b(\p{Lu}\p{Ll}+)\s+(disse|falou|gritou|virou|ergueu|puxou|correu|parou|olhou|cuspiu|insistiu|respondeu|riu|avançou|recuou)\b/u.test(t);
  if (!abreEmDialogo && !temAgente && !abreEmDescricao) {
    achados.push(
      achado(
        linhaDe,
        primeiro.inicio,
        "abertura-sem-agente",
        t,
        "Lei nº 1: nenhuma pessoa agindo no primeiro parágrafo — isso lê como ensaio, não cena. Entre tarde, no meio de uma coisa.",
      ),
    );
  }

  return {
    id: "abertura-cena",
    passou: !abreEmDescricao,
    achados,
    metricas: {
      abre_em_dialogo: abreEmDialogo ? "sim" : "não",
      tem_agente: temAgente ? "sim" : "não",
    },
  };
}

// ---------------------------------------------------------------------------
// Deriva de POV
// ---------------------------------------------------------------------------

const VERBOS_MENTE =
  "sentiu|pensou|soube|percebeu|quis|desejou|lembrou|imaginou|entendeu|compreendeu|temeu|esperava|acreditava|sabia|pensava|sentia";

export function sensorDerivaPov(ctx: Contexto): Resultado {
  const texto = extrairProsa(ctx.texto);
  const linhaDe = mapaLinhas(texto);
  const narracao = separarNarracao(texto);
  const achados: Achado[] = [];
  const pov = (ctx.pov ?? lerFrontmatterCampo(ctx.texto, "pov") ?? "").trim();

  if (!pov) {
    return {
      id: "deriva-pov",
      passou: true,
      achados: [
        {
          linha: 1,
          regra: "pov-ausente",
          trecho: "",
          mensagem: "sem `pov:` no frontmatter — o sensor não tem contra o que comparar.",
          severidade: "consultivo",
        },
      ],
      metricas: { pov: "não declarado" },
    };
  }

  const primeiroNomePov = pov.split(/\s+/)[0];
  const re = new RegExp(`\\b(\\p{Lu}\\p{Ll}+)\\s+(${VERBOS_MENTE})\\b`, "gu");
  let m: RegExpExecArray | null;
  const infratores = new Set<string>();
  while ((m = re.exec(narracao)) !== null) {
    const nome = m[1];
    if (nome === primeiroNomePov) continue;
    // Palavras que abrem frase e não são nome próprio.
    if (["Ele", "Ela", "Eles", "Elas", "Depois", "Quando", "Mas", "Então", "Ainda", "Talvez"].includes(nome))
      continue;
    infratores.add(nome);
    achados.push(
      achado(
        linhaDe,
        m.index,
        "mente-alheia",
        m[0],
        `POV é ${pov}, mas o narrador entra na cabeça de ${nome}. Em terceira limitada, mostre por gesto e fala.`,
        "bloqueante",
      ),
    );
  }

  return {
    id: "deriva-pov",
    passou: achados.length === 0,
    achados,
    metricas: { pov, personagens_invadidos: infratores.size },
  };
}

// ---------------------------------------------------------------------------
// Repetição / tique
// ---------------------------------------------------------------------------

export function sensorRepeticao(ctx: Contexto): Resultado {
  const texto = extrairProsa(ctx.texto);
  const linhaDe = mapaLinhas(texto);
  const achados: Achado[] = [];

  // Nome próprio repete por necessidade — personagem e lugar não são eco.
  // Heurística: palavra capitalizada em posição não-inicial de frase.
  const nomesProprios = new Set<string>();
  for (const f of frases(texto)) {
    const ps = f.texto.match(/\p{L}+/gu) ?? [];
    for (let i = 1; i < ps.length; i++) {
      if (/^\p{Lu}/u.test(ps[i])) nomesProprios.add(ps[i].toLowerCase());
    }
  }

  // Palavra incomum repetida perto o bastante para o ouvido pegar.
  const tokens: { palavra: string; idx: number }[] = [];
  const re = /\p{L}{7,}/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    const p = m[0].toLowerCase();
    if (!PARADAS.has(p) && !nomesProprios.has(p)) tokens.push({ palavra: p, idx: m.index });
  }

  const JANELA_CARACTERES = 400;
  const jaAcusado = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      if (tokens[j].idx - tokens[i].idx > JANELA_CARACTERES) break;
      if (tokens[i].palavra !== tokens[j].palavra) continue;
      if (jaAcusado.has(tokens[i].palavra)) break;
      jaAcusado.add(tokens[i].palavra);
      achados.push(
        achado(
          linhaDe,
          tokens[j].idx,
          "eco-lexical",
          tokens[j].palavra,
          `"${tokens[j].palavra}" repetida a ${tokens[j].idx - tokens[i].idx} caracteres de distância. Eco audível — troque ou corte.`,
        ),
      );
      break;
    }
  }

  // Tique de abertura de parágrafo.
  const paras = paragrafos(texto).filter((p) => !/^#{1,6}\s/.test(p.texto.trim()));
  const aberturas = paras.map((p) => ({
    inicio: p.inicio,
    palavra: (p.texto.trim().match(/^\p{L}+/u)?.[0] ?? "").toLowerCase(),
  }));
  for (let i = 0; i + 5 < aberturas.length; i++) {
    const janela = aberturas.slice(i, i + 6);
    const contagem = new Map<string, number>();
    for (const a of janela) if (a.palavra) contagem.set(a.palavra, (contagem.get(a.palavra) ?? 0) + 1);
    for (const [palavra, n] of contagem) {
      if (n >= 3) {
        achados.push(
          achado(
            linhaDe,
            janela[0].inicio,
            "tique-abertura",
            palavra,
            `${n} de 6 parágrafos seguidos abrem com "${palavra}". Varie a entrada.`,
          ),
        );
        i += 5;
        break;
      }
    }
  }

  return {
    id: "repeticao",
    passou: achados.filter((a) => a.regra === "tique-abertura").length === 0,
    achados,
    metricas: { ecos: achados.filter((a) => a.regra === "eco-lexical").length },
  };
}

// ---------------------------------------------------------------------------
// Forma de documento
// ---------------------------------------------------------------------------

export function sensorSecoesObrigatorias(ctx: Contexto): Resultado {
  const texto = mascararFrontmatter(ctx.texto);
  const h2 = [...texto.matchAll(/^##\s+(.+)$/gmu)].map((m) => m[1].trim());
  const passou = h2.length >= 2;
  return {
    id: "secoes-obrigatorias",
    passou,
    achados: passou
      ? []
      : [
          {
            linha: 1,
            regra: "forma-documento",
            trecho: "",
            mensagem: `artefato tem ${h2.length} seção(ões) de nível 2; o piso é 2. Estruture o documento.`,
            severidade: "bloqueante",
          },
        ],
    metricas: { h2: h2.length, titulos: h2.join(" · ") },
  };
}

export function sensorCoberturaUpstream(ctx: Contexto): Resultado {
  const texto = removerFrontmatter(ctx.texto).toLowerCase();
  const esperados = ctx.consome ?? [];
  const ausentes = esperados.filter((a) => {
    const termo = a.replace(/-/g, " ");
    return !texto.includes(a) && !texto.includes(termo);
  });
  return {
    id: "cobertura-upstream",
    passou: ausentes.length === 0,
    achados: ausentes.map((a) => ({
      linha: 1,
      regra: "upstream-nao-referenciado",
      trecho: a,
      mensagem: `o estágio declara consumir "${a}" mas o texto produzido nunca o menciona — decisão sem rastro até a origem.`,
      severidade: "bloqueante",
    })),
    metricas: { esperados: esperados.length, ausentes: ausentes.length },
  };
}

// ---------------------------------------------------------------------------
// Métrica de capítulo
// ---------------------------------------------------------------------------

export function sensorMetricaCapitulo(ctx: Contexto): Resultado {
  const texto = extrairProsa(ctx.texto);
  const linhas = texto.split(/\r?\n/);
  const linhasDialogo = linhas.filter(ehLinhaDeDialogo).length;
  const linhasCheias = linhas.filter((l) => l.trim() !== "" && !/^#{1,6}\s/.test(l.trim())).length;
  const palavras = contarPalavras(texto);
  const fs = frases(separarNarracao(texto));
  const maiorFrase = fs.reduce((max, f) => Math.max(max, contarPalavras(f.texto)), 0);
  const proporcaoDialogo = linhasCheias > 0 ? linhasDialogo / linhasCheias : 0;

  const achados: Achado[] = [];
  const alvo = ctx.alvo_palavras;
  if (alvo && palavras < alvo * 0.6)
    achados.push({
      linha: 1,
      regra: "abaixo-da-meta",
      trecho: "",
      mensagem: `${palavras} palavras contra meta de ${alvo}. O capítulo ainda está curto.`,
      severidade: "consultivo",
    });

  return {
    id: "metrica-capitulo",
    passou: true,
    achados,
    metricas: {
      palavras,
      paragrafos: paragrafos(texto).length,
      frases: fs.length,
      maior_frase: maiorFrase,
      proporcao_dialogo: Number(proporcaoDialogo.toFixed(2)),
    },
  };
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export const ANALISADORES: Record<string, (ctx: Contexto) => Resultado> = {
  translates: sensorTranslates,
  aforismo: sensorAforismo,
  "registro-baixo": sensorRegistro,
  densidade: sensorDensidade,
  "abertura-cena": sensorAberturaCena,
  "deriva-pov": sensorDerivaPov,
  repeticao: sensorRepeticao,
  "secoes-obrigatorias": sensorSecoesObrigatorias,
  "cobertura-upstream": sensorCoberturaUpstream,
  "metrica-capitulo": sensorMetricaCapitulo,
};

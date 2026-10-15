(function () {
  "use strict";
  var S = window.SERIES, esc = U.esc, num = U.num;
  var GOV = [["FHC I", 1995, 1998], ["FHC II", 1999, 2002], ["Lula I", 2003, 2006], ["Lula II", 2007, 2010], ["Dilma I", 2011, 2014],
    ["Dilma II", 2015, 2016], ["Temer", 2017, 2018], ["Jair", 2019, 2022], ["Lula III", 2023, 2026]];
  var MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  // ---------- tempo ----------
  function X(t) {
    var m;
    if (/^\d{4}$/.test(t)) return +t + 0.5;
    if ((m = /^(\d{4})-(\d{2})$/.exec(t))) return +m[1] + (+m[2] - 1) / 12 + 1 / 24;
    if ((m = /^(\d{4})-T(\d)$/.exec(t))) return +m[1] + (+m[2] - 1) / 4 + 1 / 8;
    return NaN;
  }
  function rotulo(t) {
    var m;
    if ((m = /^(\d{4})-(\d{2})$/.exec(t))) return MESES[+m[2] - 1] + "/" + m[1];
    if ((m = /^(\d{4})-T(\d)$/.exec(t))) return m[2] + "º tri " + m[1];
    return t;
  }
  function govDe(x) { var a = Math.floor(x); for (var i = 0; i < GOV.length; i++) if (a >= GOV[i][1] && a <= GOV[i][2]) return GOV[i][0]; return ""; }
  function pontos(def) {
    var arr;
    if (def.derive) {
      var A = S[def.derive[0]].pontos, B = {}; S[def.derive[1]].pontos.forEach(function (p) { B[p.t] = p.v; });
      arr = A.filter(function (p) { return B[p.t] !== undefined; }).map(function (p) { return { t: p.t, v: Math.round((p.v - B[p.t]) * 100) / 100 }; });
    } else arr = S[def.id].pontos;
    return arr.map(function (p) { return { t: p.t, x: X(p.t), v: p.v }; });
  }
  function ticks(min, max, n) {
    var span = max - min || 1, raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p, out = [];
    for (var v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(Math.round(v / step * 1e6) / 1e6 * step);
    return out;
  }
  function fmtv(v, c) { return num(v, c.casas == null ? 2 : c.casas) + (c.sufixo || ""); }

  // ---------- gráficos ----------
  var P = [{ de: 2020.17, ate: 2022, rot: "Pandemia" }];
  var CONFIG = [
    { id: "pib", sec: "Crescimento e emprego", curto: "PIB", titulo: "PIB: variação real anual", sub: "Quanto a produção do país cresceu, descontada a inflação.",
      series: [{ id: "pib_var_anual", rot: "PIB", cor: 1, tipo: "bar" }, { id: "pib_percapita_var_anual", rot: "PIB per capita (até 2023)", cor: 2, tipo: "line" }],
      unidade: "% ao ano", sufixo: "%", casas: 1, zero: true, gov: true, ev: P,
      leitura: "Média anual por governo: Lula II 4,65% (com o boom de commodities), Lula I 3,52%, Lula III 2,97% (2023–25), Dilma I 2,35%, FHC II 2,35%, FHC I 1,97%, Temer 1,55%, Jair 1,43% e Dilma II −3,40%. Em 2020 o PIB caiu 3,3%. O acumulado de 4 trimestres de 2026 é de 2,0% (1º tri) e 1,9% (2º tri), resultado parcial.",
      limites: "Não mostra distribuição: o PIB pode crescer sem que a renda de todos cresça. O PIB per capita só está disponível até o último ano fechado pelo IBGE (2023). O rebote de 2021 vem da queda de 2020; comparar só mandatos sem isso distorce." },
    { id: "investimento", sec: "Crescimento e emprego", curto: "Investimento", titulo: "Taxa de investimento (FBCF / PIB)", sub: "Quanto do PIB vira máquina, obra e construção, públicos e privados.",
      series: [{ id: "taxa_investimento", rot: "Investimento / PIB", cor: 1, tipo: "line" }], unidade: "% do PIB", sufixo: "%", casas: 1, zero: false, gov: true, ev: [],
      leitura: "Lula III (2023–25) tem média de 16,7%, quase igual à do governo de 2019–22 (16,9%). Os picos foram em Dilma I (20,5% de média) e Lula II (19,3%). O investimento público total ficou em ~2% do PIB em 2021 e ~3% em 2024 (FGV IBRE), então a maior parte é privada.",
      limites: "A série soma público e privado e não separa por setor. Cálculo próprio: soma de 4 trimestres de FBCF dividida pelo PIB, ambos a preços correntes. O investimento de uma empresa depende de juros e de expectativa, não só do governo." },
    { id: "desemprego", sec: "Crescimento e emprego", curto: "Desemprego", titulo: "Taxa de desocupação (PNAD Contínua)", sub: "Pessoas sem trabalho que procuraram e estavam disponíveis. Série trimestral desde 2012.",
      series: [{ id: "desocupacao_trimestral", rot: "Desocupação", cor: 3, tipo: "line" }], unidade: "% da força de trabalho", sufixo: "%", casas: 1, zero: true, gov: true, ev: P,
      leitura: "A média anual de 2025 é 5,88%, a menor da série; o IBGE reportou 5,4% em jun/2026. Médias por governo na PNAD: Dilma I 7,2% (2012–14), Dilma II 10,1%, Temer 12,6%, Jair 12,1% e Lula III 6,9%. Receber Bolsa Família não altera a classificação (Aos Fatos, 03/08/2026).",
      limites: "A PNAD só existe desde 2012; não há comparação com FHC e Lula I e II na mesma metodologia. O 1º trimestre costuma ser mais alto (sazonalidade). Quem desistiu de procurar emprego não é contado, e 'ocupado' inclui trabalho informal e de poucas horas." },
    { id: "ipca", sec: "Preços e renda", curto: "Inflação", titulo: "Inflação (IPCA acumulado em 12 meses)", sub: "Quanto os preços subiram nos últimos 12 meses.",
      series: [{ id: "ipca_12m", rot: "IPCA 12 meses", cor: 3, tipo: "line" }], unidade: "% em 12 meses", sufixo: "%", casas: 2, zero: true, gov: true, ev: P,
      leitura: "Em dezembro: 4,52% (2020), 10,06% (2021), 5,79% (2022), 4,62% (2023), 4,83% (2024) e 4,26% (2025); 4,58% em set/2026. Média por governo: Temer 3,35%, Lula III 4,57%, Lula II 5,14%, Jair 6,17%, Lula I 6,43%. Em 2024 alimentação subiu 7,69%; em 2025, só 2,95%, e habitação, 6,79%.",
      limites: "Inflação menor não significa preço menor: um IPCA de 4% quer dizer que os preços ainda subiram 4%. Quem gasta mais com comida, aluguel ou energia sente uma inflação diferente da média. A série não mostra o preço de cada produto." },
    { id: "renda", sec: "Preços e renda", curto: "Renda", titulo: "Rendimento real do trabalho (PNAD Contínua)", sub: "Renda média mensal habitual, em reais de hoje, de quem trabalha.",
      series: [{ id: "rendimento_real", rot: "Rendimento médio", cor: 2, tipo: "line" }], unidade: "R$ (preços constantes)", sufixo: "", casas: 0, zero: false, gov: true, ev: P,
      leitura: "Em dezembro de cada ano: R$ 3.351 (2018), 3.442 (2020), 3.068 (2021), 3.317 (2022), 3.418 (2023), 3.563 (2024) e 3.742 (2025). Entre as médias anuais de 2022 e 2025 o aumento é de 14%; no governo de 2019–22 houve queda de 4,4%. De 2024 para 2025 o aumento é de cerca de 4% (a IA dissera 5,7%).",
      limites: "É média: ela sobe quando saem do mercado os de menor renda (como em 2020) e esconde quem ganha pouco, por isso a mediana seria mais informativa e não está nesta série. Não inclui quem está desempregado nem o custo de vida (aluguel, comida)." },
    { id: "divida", sec: "Contas públicas", curto: "Dívida", titulo: "Dívida pública (% do PIB)", sub: "Dívida bruta do governo geral e dívida líquida do setor público.",
      series: [{ id: "divida_bruta", rot: "Dívida bruta (governo geral)", cor: 1, tipo: "line" }, { id: "divida_liquida", rot: "Dívida líquida (setor público)", cor: 4, tipo: "line" }],
      unidade: "% do PIB", sufixo: "%", casas: 1, zero: false, gov: true, ev: P,
      leitura: "Bruta: 75,3% (dez/2018), 86,9% (2020, pico da pandemia), 71,7% (2022), 78,6% (2025) e 82,9% (ago/2026), +11,2 p.p. desde o fim de 2022. A queda de 2021–22 veio principalmente do PIB nominal inflado (IPCA de 10% em 2021), com superávit primário. Líquida em ago/2026: 69,3%.",
      limites: "A razão dívida/PIB cai quando o PIB cresce (em reais, com inflação) mesmo sem pagar dívida. Metodologias do BCB e do FMI diferem e não devem ser misturadas; o número do fim de 2022 varia de 71,7% a 73,5% conforme a revisão. O gráfico não mostra o motivo do aumento." },
    { id: "fiscal", sec: "Contas públicas", curto: "Déficit e juros", titulo: "Déficit primário, juros e déficit nominal (12 meses)", sub: "Acima de zero = déficit. Resultado nominal = primário + juros.",
      series: [{ id: "resultado_primario_12m", rot: "Primário", cor: 2, tipo: "line" }, { derive: ["resultado_nominal_12m", "resultado_primario_12m"], id: "juros", rot: "Juros nominais", cor: 3, tipo: "line" }, { id: "resultado_nominal_12m", rot: "Nominal", cor: 4, tipo: "line" }],
      unidade: "% do PIB (acima de 0 = déficit)", sufixo: "%", casas: 2, zero: true, gov: true, ev: P,
      leitura: "Em 12 meses até ago/2026: déficit nominal 9,48%, primário 0,62% e, portanto, juros de 8,86% do PIB. Primário: superávit de 0,72% (2021) e 1,25% (2022); déficit de 2,28% (2023), 0,40% (2024) e 0,43% (2025). Em 2020 o déficit primário chegou a 9,24% do PIB.",
      limites: "A origem do aumento da dívida com Lula III é disputada: um técnico do BCB cita o déficit primário de 2023; um think tank ligado ao PT diz que ~90% veio dos juros. Os juros dependem da Selic, definida pelo Banco Central, e não só do governo. Não separa receita extraordinária." },
    { id: "familias", sec: "Famílias", curto: "Endividamento", titulo: "Endividamento e comprometimento de renda das famílias", sub: "Dívida das famílias com bancos, em relação à renda (Banco Central).",
      series: [{ id: "endividamento_renda", rot: "Endividamento (% da renda anual)", cor: 1, tipo: "line" }, { id: "comprometimento_renda", rot: "Comprometimento (% da renda mensal)", cor: 3, tipo: "line" }],
      unidade: "%", sufixo: "%", casas: 1, zero: true, gov: true, ev: P,
      leitura: "O endividamento foi de 39,0% da renda (2018) para 49,5% (2021) e 49,7% (2025); o comprometimento de renda, de 22,6% (2018) para 28,1% (2025), com 28,7% em jul/2026. A CNC mede outra coisa: 81,7% das famílias tinham alguma dívida em set/2026, a primeira queda do ano.",
      limites: "Não são os 80–85% de que se fala na conversa: aquele número é a parcela das famílias com alguma dívida (CNC), não a dívida sobre a renda (BCB). A série não distingue financiamento de casa de cartão de crédito. O código SGS 29037 foi identificado pelo valor; confirmar no portal do BCB." },
    { id: "fome", sec: "Fome e pobreza", curto: "Fome", titulo: "Fome e insegurança alimentar: quatro medidas", sub: "Cada pesquisa mede de um jeito; compare a direção, não o nível.",
      series: [{ id: "inseguranca_moderada_grave", rot: "FAO: moderada ou grave", cor: 1, tipo: "line" }, { id: "inseguranca_grave", rot: "FAO: grave", cor: 3, tipo: "line" }, { id: "subalimentacao_pct", rot: "FAO: subalimentação", cor: 4, tipo: "line", oculta: true },
        { id: "fome_penssan_grave", rot: "Rede PENSSAN: grave", cor: 5, tipo: "points" }, { id: "fome_ibge_grave", rot: "IBGE: grave (domicílios)", cor: 2, tipo: "points" }, { id: "fome_ibge_moderada_grave", rot: "IBGE: moderada ou grave (domic.)", cor: 6, tipo: "points", oculta: true }],
      unidade: "% da população (ou dos domicílios)", sufixo: "%", casas: 1, zero: true, gov: true, ev: [], anual: true,
      leitura: "Em todas as medidas a fome subiu até 2021–22 e caiu desde então. IBGE: insegurança grave em 4,1% (2023) e 3,2% (2024) dos domicílios. Rede PENSSAN: 19,1 milhões de pessoas (2020) e 33,1 milhões (2022). FAO: o Brasil saiu do Mapa da Fome (média 2022–24).",
      limites: "As pesquisas não são comparáveis em nível: o PENSSAN deu 15,5% em 2022 e a FAO, 6,6% para o mesmo período. As séries da FAO são médias de 3 anos (rótulo do ano final, inferido). Os valores de IBGE e PENSSAN vêm de reportagens; a tabela original não foi conferida. Pandemia, auxílio e retomada confundem a atribuição." },
    { id: "pobreza", sec: "Fome e pobreza", curto: "Pobreza", titulo: "Pobreza e pobreza extrema no Brasil", sub: "Banco Mundial: população abaixo de US$ 6,85 e de US$ 2,15 por dia (PPC 2017).",
      series: [{ id: "pobreza_685", rot: "Abaixo de US$ 6,85/dia", cor: 1, tipo: "line" }, { id: "pobreza_extrema_215", rot: "Abaixo de US$ 2,15/dia", cor: 3, tipo: "line" }],
      unidade: "% da população", sufixo: "%", casas: 1, zero: true, gov: true, ev: P,
      leitura: "A pobreza (US$ 6,85/dia) foi de 28,7% (2018) para 20,8% em 2020, com o auxílio emergencial, 30,6% em 2021 e 20,6% em 2024.",
      limites: "Linhas de pobreza internacionais não são as linhas nacionais. O auxílio emergencial derrubou a pobreza em 2020 e a retirada elevou em 2021, então o efeito de governo e o de política temporária se misturam." },
    { id: "gini", sec: "Fome e pobreza", curto: "Desigualdade", titulo: "Desigualdade de renda (Gini, IBGE)", sub: "0 = todos recebem igual; 1 = uma pessoa recebe tudo.",
      series: [{ id: "gini", rot: "Gini do rendimento domiciliar per capita", cor: 2, tipo: "line" }], unidade: "índice", sufixo: "", casas: 3, zero: false, gov: true, ev: P, anual: true,
      leitura: "O Gini foi de 0,540 (2012) para 0,543 (2021), 0,517 (2022 e 2023), 0,504 (2024) e 0,511 (2025).",
      limites: "A renda declarada em pesquisa domiciliar subestima os rendimentos mais altos; outras medidas (Receita, WID) dão desigualdade maior. A série começa só em 2012." },
    { id: "china", sec: "Comparação com a China", curto: "China", titulo: "Pobreza extrema: China e Brasil", sub: "Banco Mundial: população abaixo de US$ 2,15 por dia (PPC 2017).",
      series: [{ id: "china_pobreza_extrema", rot: "China", cor: 3, tipo: "line" }, { id: "pobreza_extrema_215", rot: "Brasil", cor: 1, tipo: "line" }],
      unidade: "% da população", sufixo: "%", casas: 1, zero: true, gov: false, ev: [], anual: true,
      leitura: "A pobreza extrema na China caiu de 97% (1981) para 0,7% (2018). É o dado que sustenta a afirmação 'a China tirou a população da pobreza'.",
      limites: "Mostra o resultado, não o regime que o produziu nem o custo político. Se isso é 'capitalismo controlado' ou 'socialismo de mercado' é uma discussão de definições (ver glossário). Os 1980 da China partiam de renda muito baixa." }
  ];

  // ---------- gráfico ----------
  function Grafico(cfg) {
    var el = document.createElement("section");
    el.className = "card gcard"; el.id = "g-" + cfg.id; el.setAttribute("data-anc", "");
    var ser = cfg.series.map(function (d, i) { return { def: d, pts: pontos(d), cor: "var(--s" + d.cor + ")", oculta: !!d.oculta }; });
    var anual = cfg.anual || ser.every(function (s) { return /^\d{4}$/.test(s.pts[0].t); });
    var estado = { desde: null, pin: null };
    var span = Math.max.apply(null, ser.map(function (s) { return s.pts[s.pts.length - 1].x; })) - Math.min.apply(null, ser.map(function (s) { return s.pts[0].x; }));
    var ranges = span > 12 ? [["Tudo", null], ["Desde 2012", 2012], ["Desde 2019", 2019]] : [];
    if (cfg.id === "china" || cfg.id === "pobreza") ranges = [["Tudo", null], ["Desde 2000", 2000], ["Desde 2012", 2012]];
    el.innerHTML = "<h3>" + esc(cfg.titulo) + '</h3><p class="gsub">' + esc(cfg.sub) + '</p><div class="gctl" data-leg></div><div class="gctl" data-rng></div>' +
      '<div class="plot" data-plot><div class="tip" data-tip hidden></div></div>' +
      '<div class="leit"><div><b>O que o gráfico mostra</b><p>' + esc(cfg.leitura) + '</p></div><div><b>O que ele não mostra</b><p>' + esc(cfg.limites) + "</p></div></div>" +
      '<details class="gdet"><summary>Ver os dados em tabela</summary><div class="tabela" data-tab></div><p style="margin:8px 0 0"><button type="button" class="gbtn" data-csv>Baixar CSV</button></p></details>' +
      '<p class="gfonte">' + ser.filter(function (s, i, a) { return !s.def.derive; }).map(function (s) {
        var sr = S[s.def.id]; return "<span>" + esc(sr.fonte) + (sr.url ? ' (<a href="' + U.url(sr.url) + '" target="_blank" rel="noopener noreferrer">fonte</a>)' : "") + (sr.baixado_em ? ", baixado em " + esc(sr.baixado_em) : "") + (sr.lida_na_fonte === false ? ". Valor de reportagem; tabela original não conferida" : "") + ".</span>";
      }).join(" ") + "</p>";
    var plot = U.$("[data-plot]", el), tip = U.$("[data-tip]", el), DICA = '<span class="muted">Toque ou arraste sobre o gráfico para ver os valores. Toque num ponto para marcá-lo no link.</span>', det = U.$("details.gdet", el);

    function visiveis() { return ser.filter(function (s) { return !s.oculta; }); }
    function legenda() {
      U.$("[data-leg]", el).innerHTML = ser.map(function (s, i) {
        var u = s.pts[s.pts.length - 1];
        return '<button type="button" class="gbtn" data-i="' + i + '" aria-pressed="' + !s.oculta + '"><span class="sw" style="background:' + s.cor + '"></span>' + esc(s.def.rot) + " · " + fmtv(u.v, cfg) + "</button>";
      }).join("");
      U.$("[data-rng]", el).innerHTML = ranges.map(function (r, i) { return '<button type="button" class="gbtn rng" data-r="' + i + '" aria-pressed="' + (estado.desde === r[1]) + '">' + r[0] + "</button>"; }).join("");
    }

    function desenhar() {
      var vis = visiveis(), W = plot.clientWidth || 320, H = W < 480 ? 280 : 340, movel = W < 520; tip.classList.toggle("fixa", movel); if (movel) { tip.hidden = false; tip.innerHTML = DICA; } else tip.hidden = true; var m = { l: 44, r: 12, t: cfg.gov ? 26 : 12, b: 28 };
      var dados = vis.map(function (s) { return { s: s, p: s.pts.filter(function (p) { return estado.desde == null || p.x >= estado.desde; }) }; }).filter(function (d) { return d.p.length; });
      if (!dados.length) { plot.querySelector("svg") && plot.querySelector("svg").remove(); return; }
      var xs = [].concat.apply([], dados.map(function (d) { return d.p.map(function (p) { return p.x; }); }));
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
      var todosAnuais = dados.every(function (d) { return /^\d{4}$/.test(d.p[0].t); });
      if (todosAnuais) { x0 = Math.floor(x0); x1 = Math.floor(x1) + 1; } else { var pad = (x1 - x0) * 0.02 + 0.02; x0 -= pad; x1 += pad; }
      var vs = [].concat.apply([], dados.map(function (d) { return d.p.map(function (p) { return p.v; }); }));
      var y0 = Math.min.apply(null, vs), y1 = Math.max.apply(null, vs);
      var barras = dados.some(function (d) { return d.s.def.tipo === "bar"; });
      if (cfg.zero || barras) { y0 = Math.min(y0, 0); y1 = Math.max(y1, 0); }
      var py = (y1 - y0) * 0.07 || 1; y1 += py; if (y0 !== 0) y0 -= py;
      var yt = ticks(y0, y1, 5); y0 = Math.min(y0, yt[0]); y1 = Math.max(y1, yt[yt.length - 1]);
      var sx = function (x) { return m.l + (x - x0) / (x1 - x0) * (W - m.l - m.r); };
      var sy = function (y) { return H - m.b - (y - y0) / (y1 - y0) * (H - m.t - m.b); };
      var g = "";
      // faixas de governo
      if (cfg.gov) GOV.forEach(function (gv, i) {
        var a = Math.max(x0, gv[1]), b = Math.min(x1, gv[2] + 1); if (b <= a) return;
        g += '<rect x="' + sx(a).toFixed(1) + '" y="' + m.t + '" width="' + (sx(b) - sx(a)).toFixed(1) + '" height="' + (H - m.t - m.b) + '" fill="' + (i % 2 ? "var(--band)" : "transparent") + '"/>';
        if (sx(b) - sx(a) > 38) g += '<text x="' + ((sx(a) + sx(b)) / 2).toFixed(1) + '" y="' + (m.t - 9) + '" text-anchor="middle" font-size="10.5" font-weight="700">' + gv[0] + "</text>";
      });
      (cfg.ev || []).forEach(function (e) {
        var a = Math.max(x0, e.de), b = Math.min(x1, e.ate); if (b <= a) return;
        g += '<rect x="' + sx(a).toFixed(1) + '" y="' + m.t + '" width="' + (sx(b) - sx(a)).toFixed(1) + '" height="' + (H - m.t - m.b) + '" fill="var(--band2)"/><text x="' + ((sx(a) + sx(b)) / 2).toFixed(1) + '" y="' + (H - m.b - 6) + '" text-anchor="middle" font-size="10">' + e.rot + "</text>";
      });
      // grade e eixos
      yt.forEach(function (t) { g += '<line class="' + (Math.abs(t) < 1e-9 ? "zero" : "gl") + '" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + sy(t).toFixed(1) + '" y2="' + sy(t).toFixed(1) + '"/><text x="' + (m.l - 6) + '" y="' + (sy(t) + 3.5).toFixed(1) + '" text-anchor="end">' + num(t, Math.abs(t) < 10 && t % 1 ? 1 : 0).replace(",0", "") + "</text>"; });
      var rr = (x1 - x0) / 6, step = [1, 2, 5, 10, 20][[rr <= 1, rr <= 2, rr <= 5, rr <= 10].indexOf(true)] || 20;
      for (var yr = Math.ceil(x0 / step) * step; yr <= x1; yr += step) {
        var xx = todosAnuais ? yr + 0.5 : yr; if (xx < x0 || xx > x1) continue;
        g += '<text x="' + sx(xx).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + yr + "</text>";
      }
      // séries
      var unit = (W - m.l - m.r) / (x1 - x0);
      dados.forEach(function (d) {
        var def = d.s.def, c = d.s.cor;
        if (def.tipo === "bar") {
          var bw = Math.max(2, unit * 0.62);
          d.p.forEach(function (p) { var yb = sy(Math.max(p.v, 0)), yh = Math.abs(sy(p.v) - sy(0)); g += '<rect x="' + (sx(p.x) - bw / 2).toFixed(1) + '" y="' + yb.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, yh).toFixed(1) + '" rx="1.5" fill="' + c + '" opacity=".85"/>'; });
        } else {
          if (def.tipo !== "points" && d.p.length > 1) g += '<path d="' + d.p.map(function (p, i) { return (i ? "L" : "M") + sx(p.x).toFixed(1) + " " + sy(p.v).toFixed(1); }).join("") + '" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>';
          if (def.tipo === "points" || d.p.length <= 40) d.p.forEach(function (p) { g += '<circle cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.v).toFixed(1) + '" r="' + (def.tipo === "points" ? 4.5 : 2.6) + '" fill="' + c + '" stroke="var(--surface)" stroke-width="1.2"/>'; });
        }
      });
      g += '<line data-guia class="gl" x1="0" x2="0" y1="' + m.t + '" y2="' + (H - m.b) + '" stroke="var(--ink-2)" stroke-dasharray="3 3" style="display:none"/><g data-marc></g>';
      g += '<text x="' + m.l + '" y="' + (m.t - (cfg.gov ? 20 : 2)) + '" font-size="10" style="display:none">' + esc(cfg.unidade) + "</text>";
      g += '<rect data-hit x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="transparent" style="touch-action:pan-y"/>';
      var old = plot.querySelector("svg"); if (old) old.remove();
      plot.insertAdjacentHTML("afterbegin", '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(cfg.titulo + ". " + cfg.leitura.split(". ")[0]) + '">' + g + "</svg>");
      var svg = plot.querySelector("svg"), hit = U.$("[data-hit]", svg), guia = U.$("[data-guia]", svg), marc = U.$("[data-marc]", svg);
      var todos = [].concat.apply([], dados.map(function (d) { return d.p; }));
      var ultimo = null;
      function mostrarX(xm) {
        var r = svg.getBoundingClientRect();
        var base = dados[0].p.reduce(function (a, p) { return Math.abs(p.x - xm) < Math.abs(a.x - xm) ? p : a; }), x = base.x, linhas = "", mk = "";
        var tol = Math.max(0.6, (x1 - x0) / 40); ultimo = base.t;
        dados.forEach(function (d) {
          var p = d.p.reduce(function (a, q) { return Math.abs(q.x - x) < Math.abs(a.x - x) ? q : a; });
          if (Math.abs(p.x - x) > tol) return;
          linhas += '<div class="row"><span><i style="background:' + d.s.cor + '"></i>' + esc(d.s.def.rot) + "</span><span>" + fmtv(p.v, cfg) + "</span></div>";
          mk += '<circle cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.v).toFixed(1) + '" r="5" fill="' + d.s.cor + '" stroke="var(--surface)" stroke-width="2"/>';
        });
        guia.setAttribute("x1", sx(x)); guia.setAttribute("x2", sx(x)); guia.style.display = ""; marc.innerHTML = mk;
        var gv = cfg.gov ? govDe(x) : ""; tip.innerHTML = "<b>" + esc(rotulo(base.t)) + (estado.pin === base.t ? ' <span class="small muted">(marcado no link)</span>' : "") + "</b>" + (gv ? '<div class="gv">Governo: ' + gv + (govDe(x) === "Lula III" && x >= 2026 ? " (parcial)" : "") + "</div>" : "") + linhas;
        tip.hidden = false; if (!movel) { var tw = tip.offsetWidth, left = sx(x) * (r.width / W) + 12; if (left + tw > r.width) left = sx(x) * (r.width / W) - tw - 12; tip.style.left = Math.max(0, left) + "px"; }
      }
      function mover(ev) { var r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * (W / r.width); mostrarX(x0 + (px - m.l) / (W - m.l - m.r) * (x1 - x0)); }
      function sair() { guia.style.display = "none"; marc.innerHTML = ""; if (movel) tip.innerHTML = DICA; else tip.hidden = true; }
      function repouso() { var p = estado.pin && dados[0].p.filter(function (q) { return q.t === estado.pin; })[0]; if (p) mostrarX(p.x); else sair(); }
      hit.addEventListener("pointermove", mover); hit.addEventListener("pointerdown", mover);
      // Soltar marca (ou desmarca) o ponto mostrado: ele vai para o endereço.
      hit.addEventListener("pointerup", function () { if (ultimo == null) return; estado.pin = estado.pin === ultimo ? null : ultimo; salvar(); repouso(); });
      hit.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") repouso(); });
      repouso();
    }

    function tabela() {
      var vis = visiveis(), ts = {}; vis.forEach(function (s) { s.pts.forEach(function (p) { ts[p.t] = ts[p.t] || { x: p.x }; ts[p.t][s.def.id] = p.v; }); });
      var ord = Object.keys(ts).sort(function (a, b) { return ts[b].x - ts[a].x; });
      U.$("[data-tab]", el).innerHTML = "<table><thead><tr><th>Período</th>" + vis.map(function (s) { return "<th>" + esc(s.def.rot) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        ord.map(function (t) { return "<tr><td>" + esc(rotulo(t)) + "</td>" + vis.map(function (s) { var v = ts[t][s.def.id]; return "<td>" + (v === undefined ? "–" : fmtv(v, cfg)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
    }
    function csv() {
      var vis = ser, ts = {}; vis.forEach(function (s) { s.pts.forEach(function (p) { ts[p.t] = ts[p.t] || { x: p.x }; ts[p.t][s.def.id] = p.v; }); });
      var ord = Object.keys(ts).sort(function (a, b) { return ts[a].x - ts[b].x; });
      var linhas = ["periodo;" + vis.map(function (s) { return '"' + s.def.rot.replace(/"/g, "'") + '"'; }).join(";")].concat(ord.map(function (t) { return t + ";" + vis.map(function (s) { var v = ts[t][s.def.id]; return v === undefined ? "" : String(v).replace(".", ","); }).join(";"); }));
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + linhas.join("\n")], { type: "text/csv;charset=utf-8" })); a.download = cfg.id + ".csv"; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.i != null) { var s = ser[+b.dataset.i]; if (!s.oculta && visiveis().length === 1) return; s.oculta = !s.oculta; legenda(); desenhar(); tabela(); salvar(); }
      else if (b.dataset.r != null) { estado.desde = ranges[+b.dataset.r][1]; legenda(); desenhar(); salvar(); }
      else if (b.hasAttribute("data-csv")) csv();
    });
    // Estado no endereço: <id>.r = período (ano inicial), .h = séries ocultas, .t = tabela aberta, .p = ponto marcado.
    var KR = cfg.id + ".r", KH = cfg.id + ".h", KT = cfg.id + ".t", KP = cfg.id + ".p";
    function ocultas() { var a = ser.map(function (x, i) { return x.oculta ? i : null; }).filter(function (x) { return x != null; }); return a.length ? a.join(",") : "-"; }
    var padrao = ocultas();
    function restaurar() {
      var h = Estado.get(KH);
      if (h != null) { var L = h === "-" ? [] : h.split(","); ser.forEach(function (x, i) { x.oculta = L.indexOf(String(i)) >= 0; }); if (!visiveis().length) ser[0].oculta = false; }
      var r = Estado.get(KR); estado.desde = r != null && ranges.some(function (x) { return String(x[1]) === r; }) ? +r : null;
      estado.pin = Estado.get(KP) || null;
      det.open = Estado.get(KT) === "1";
    }
    function salvar() { var o = {}; o[KH] = ocultas() === padrao ? null : ocultas(); o[KR] = estado.desde; o[KP] = estado.pin; o[KT] = det.open; Estado.set(o); }
    var ro = window.ResizeObserver ? new ResizeObserver(function () { desenhar(); }) : null;
    restaurar(); legenda(); tabela(); det.addEventListener("toggle", salvar);
    return { el: el, init: function () { desenhar(); if (ro) ro.observe(plot); else window.addEventListener("resize", desenhar); } };
  }

  // ---------- comparador por governo ----------
  var COMP = {
    pib: { rot: "PIB: variação real média por ano (%)", sufixo: "%", nota: "Média simples das variações anuais do PIB em cada mandato. Lula III cobre 2023–2025.", f: function (a, b) { return media(S.pib_var_anual.pontos, a, b); } },
    ipca: { rot: "IPCA: média anual, dezembro a dezembro (%)", sufixo: "%", nota: "Média dos IPCA acumulados de cada ano. Inflação menor não significa preços menores.", f: function (a, b) { return media(S.ipca_12m.pontos.filter(function (p) { return /-12$/.test(p.t); }).map(function (p) { return { t: p.t.slice(0, 4), v: p.v }; }), a, b); } },
    desoc: { rot: "Desocupação: média anual (%), PNAD, só desde 2012", sufixo: "%", nota: "A PNAD começa em 2012. Dilma I cobre só 2012–14; antes disso não há série comparável.", f: function (a, b) { if (a < 2012 && b < 2012) return null; var p = S.desocupacao_trimestral.pontos, an = {}; p.forEach(function (q) { var y = q.t.slice(0, 4); (an[y] = an[y] || []).push(q.v); }); var arr = Object.keys(an).filter(function (y) { return an[y].length === 4; }).map(function (y) { return { t: y, v: an[y].reduce(function (s, v) { return s + v; }, 0) / 4 }; }); return media(arr, Math.max(a, 2012), b); } },
    inv: { rot: "Taxa de investimento: média (% do PIB)", sufixo: "%", nota: "FBCF/PIB, público e privado somados.", f: function (a, b) { return media(S.taxa_investimento.pontos, a, b); } },
    divida: { rot: "Dívida bruta: variação durante o mandato (p.p. do PIB)", sufixo: " p.p.", nota: "Dezembro do último ano menos dezembro do ano anterior ao mandato. A série do BCB começa em 2006; Dilma II e Jair incluem o pico da pandemia em 2020.", f: function (a, b) { var m = {}; S.divida_bruta.pontos.forEach(function (p) { if (/-12$/.test(p.t)) m[p.t.slice(0, 4)] = p.v; }); var i = m[a - 1], f = m[Math.min(b, 2025)]; return i == null || f == null ? null : Math.round((f - i) * 10) / 10; } },
    renda: { rot: "Rendimento real do trabalho: variação no mandato (%)", sufixo: "%", nota: "Média anual do último ano contra a média do ano anterior ao mandato, em preços constantes. A PNAD começa em 2012.", f: function (a, b) { var an = {}; S.rendimento_real.pontos.forEach(function (p) { var y = p.t.slice(0, 4); (an[y] = an[y] || []).push(p.v); }); var mm = function (y) { return an[y] && an[y].length >= 10 ? an[y].reduce(function (s, v) { return s + v; }, 0) / an[y].length : null; }; var i = mm(a - 1), f = mm(Math.min(b, 2025)); return i == null || f == null ? null : Math.round((f / i - 1) * 1000) / 10; } }
  };
  function media(pts, a, b) { var v = pts.filter(function (p) { var y = +p.t.slice(0, 4); return y >= a && y <= b; }).map(function (p) { return p.v; }); return v.length ? Math.round(v.reduce(function (s, x) { return s + x; }, 0) / v.length * 100) / 100 : null; }

  function comparador(sec) {
    sec.innerHTML = '<h3>Resumo por governo</h3><p class="gsub">Escolha um indicador e veja os mandatos lado a lado. Barras sem valor indicam que a série não cobre o período.</p>' +
      '<label class="sr" for="sel-comp">Indicador</label><select class="sel" id="sel-comp">' + Object.keys(COMP).map(function (k) { return '<option value="' + k + '">' + esc(COMP[k].rot) + "</option>"; }).join("") + '</select><div id="comp-out"></div><p class="gfonte" id="comp-nota"></p>';
    function r() {
      var c = COMP[U.$("#sel-comp").value], vals = GOV.map(function (g) { var fim = g[0] === "Lula III" ? 2025 : g[2]; return { n: g[0] === "Lula III" ? "Lula III" : g[0], per: g[1] + "–" + String(fim).slice(2), v: c.f(g[1], fim) }; });
      var nums = vals.filter(function (v) { return v.v != null; }).map(function (v) { return v.v; });
      var lo = Math.min(0, Math.min.apply(null, nums)), hi = Math.max(0, Math.max.apply(null, nums)), rng = hi - lo || 1, z = (0 - lo) / rng * 100;
      U.$("#comp-out").innerHTML = vals.map(function (v) {
        if (v.v == null) return '<div class="comp-row vazio"><span class="nome">' + v.n + '</span><span class="small muted">' + v.per + '</span><span class="comp-val">sem série</span></div>';
        var a = Math.min(z, (v.v - lo) / rng * 100), w = Math.abs(v.v) / rng * 100;
        return '<div class="comp-row"><span class="nome">' + v.n + '<br><span class="small muted" style="font-weight:400">' + v.per + '</span></span><div class="comp-trilho" style="--zero:' + z.toFixed(1) + '%"><div class="comp-barra" style="left:' + a.toFixed(1) + "%;width:" + Math.max(w, 0.6).toFixed(1) + '%"></div></div><span class="comp-val">' + num(v.v, 1) + (c.sufixo.trim() === "p.p." ? "" : "") + "</span></div>";
      }).join("");
      U.$("#comp-nota").textContent = c.nota + " Calendário: anos civis; 2016 foi atribuído a Dilma II.";
    }
    var cv = Estado.get("c"); if (cv && COMP[cv]) U.$("#sel-comp").value = cv;
    U.$("#sel-comp").addEventListener("change", function () { Estado.set({ c: U.$("#sel-comp").value === "pib" ? null : U.$("#sel-comp").value }); r(); }); r();
  }

  // ---------- montagem ----------
  comparador(U.$("#g-governo"));
  var host = U.$("#graficos"), grafs = [], ult = "";
  CONFIG.forEach(function (c) {
    if (c.sec !== ult) { host.insertAdjacentHTML("beforeend", '<h2 data-anc id="sec-' + c.sec.replace(/\W+/g, "-").toLowerCase() + '">' + esc(c.sec) + "</h2>"); ult = c.sec; }
    var g = Grafico(c); host.appendChild(g.el); grafs.push(g);
  });
  grafs.forEach(function (g) { g.init(); });
  U.$("#g-governo").setAttribute("data-anc", "");
  U.$("#anc").innerHTML = '<a href="#s=g-governo" data-ir="g-governo">Por governo</a>' + CONFIG.map(function (c) { return '<a href="#s=g-' + c.id + '" data-ir="g-' + c.id + '">' + esc(c.curto) + "</a>"; }).join("");
  // Atalhos do topo: levam ao gráfico sem perder o resto do estado.
  U.$("#anc").addEventListener("click", function (e) { var a = e.target.closest("[data-ir]"); if (!a) return; e.preventDefault(); Estado.set({ s: a.dataset.ir }, true); Estado.ir(); });
  Estado.aoMudar(Estado.ir);
  Estado.rastrear("main [data-anc]");
  Estado.irDepois();
})();

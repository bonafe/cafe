(function () {
  "use strict";
  var D = window.DADOS, M = D.matriz, CRIT = M.criterios;
  // Ordem alfabética (Flávio, Lula) para não privilegiar ninguém na posição.
  var CANDS = M.meta.candidatos.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt"); });
  var K = { f: CANDS.filter(function (c) { return c.id === "flavio"; })[0], l: CANDS.filter(function (c) { return c.id === "lula"; })[0] };
  var PESO_ROT = ["Ignorar", "Pouco", "Algum", "Médio", "Alto", "Decisivo"];
  var NOTA_ROT = ["", "muito desfavorável", "desfavorável", "neutro", "favorável", "muito favorável"];
  var TOP = {}; D.topicos.forEach(function (t) { TOP[t.id] = t; });
  var PERFIS = [{ id: "pessoa_a", nome: "Pessoa A" }, { id: "pessoa_b", nome: "Pessoa B" }, { id: "convidado", nome: "Convidado" }];
  var KEY = "matriz-v1";

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function safeUrl(u) { return /^https?:\/\//.test(u) ? u : "#"; }

  // ---------- estado ----------
  var estado = { perfil: "pessoa_a", dados: {} };
  PERFIS.forEach(function (p) { estado.dados[p.id] = { pesos: {}, notas: {} }; });

  function carregar() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && s.dados) { estado.perfil = s.perfil || estado.perfil; PERFIS.forEach(function (p) { if (s.dados[p.id]) estado.dados[p.id] = s.dados[p.id]; }); }
    } catch (e) { /* sem armazenamento: segue em memória */ }
    if (!estado.dados[estado.perfil]) estado.perfil = PERFIS[0].id; // estado salvo por versão antiga
    importarHash();
  }
  function salvar() { try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch (e) {} }

  function importarHash() {
    var h = location.hash.replace(/^#/, "");
    if (h.indexOf("w=") < 0) return;
    var q = {}; h.split("&").forEach(function (kv) { var a = kv.split("="); q[a[0]] = a[1]; });
    if (!q.w || q.w.length !== CRIT.length) return;
    var d = { pesos: {}, notas: {} };
    CRIT.forEach(function (c, i) { var n = parseInt(q.w[i], 10); if (n >= 0 && n <= 5) d.pesos[c.id] = n; });
    (q.o || "").split(",").forEach(function (t) {
      var a = t.split(":").map(Number);
      if (a.length === 3 && CRIT[a[0]] && a[1] >= 1 && a[1] <= 5 && a[2] >= 1 && a[2] <= 5) d.notas[CRIT[a[0]].id] = { flavio: a[1], lula: a[2] };
    });
    estado.dados.convidado = d; estado.perfil = "convidado";
  }
  function linkAtual() {
    var d = atual(), w = CRIT.map(function (c) { return peso(c); }).join(""), o = [];
    CRIT.forEach(function (c, i) { var n = d.notas[c.id]; if (n) o.push(i + ":" + (n.flavio || base(c, "flavio")) + ":" + (n.lula || base(c, "lula"))); });
    return location.origin + location.pathname + "#w=" + w + (o.length ? "&o=" + o.join(",") : "");
  }

  function atual() { return estado.dados[estado.perfil]; }
  function peso(c) { var p = atual().pesos[c.id]; return p === undefined ? 3 : p; }
  function base(c, cand) { return c.notas[cand].nota; }
  function nota(c, cand, soForte) {
    var o = atual().notas[c.id]; if (o && o[cand]) return o[cand];
    if (soForte && c.notas[cand].confianca === "baixa") return 3;
    return base(c, cand);
  }
  function mudada(c, cand) { var o = atual().notas[c.id]; return !!(o && o[cand] && o[cand] !== base(c, cand)); }

  // ---------- cálculo ----------
  function calcular(soForte, zerar) {
    var sw = 0, sf = 0, sl = 0, contrib = [];
    CRIT.forEach(function (c) {
      var w = c.id === zerar ? 0 : peso(c); if (!w) return;
      sw += w; sf += w * nota(c, "flavio", soForte); sl += w * nota(c, "lula", soForte);
    });
    if (!sw) return { sw: 0 };
    CRIT.forEach(function (c) {
      var w = peso(c); contrib.push({ c: c, w: w, v: w ? w * (nota(c, "lula", soForte) - nota(c, "flavio", soForte)) / sw : 0 });
    });
    return { sw: sw, f: sf / sw, l: sl / sw, d: sl / sw - sf / sw, contrib: contrib };
  }
  function lider(d) { return Math.abs(d) < 0.05 ? 0 : d > 0 ? 1 : -1; }
  function tamanho(d) {
    var a = Math.abs(d);
    if (a < 0.25) return "empate técnico";
    if (a < 0.6) return "vantagem pequena";
    if (a < 1.1) return "vantagem moderada";
    return "vantagem grande";
  }

  // ---------- render estático ----------
  function iniciar() {
    $("#escala").textContent = "Escala das notas: " + M.meta.escala.join(" · ") + ".";
    $("#regras").innerHTML = M.meta.regras.map(esc).join(" ");
    $("#aviso").textContent = M.meta.aviso;
    $("#limites").innerHTML = [
      "As notas resumem evidências que podem mudar; as fichas e os vereditos estão no repositório e podem ser corrigidos.",
      "Flávio nunca governou o país. As notas dele usam o governo de 2019–2022 apenas como referência de afinidade política, o plano de governo e declarações, e por isso têm menos confiança.",
      "O critério 'Segurança pública' não foi discutido na conversa; zere o peso se não for relevante.",
      "Pesos e notas ficam só neste aparelho (e no link, se você copiar)."
    ].map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    $("#criterios").innerHTML = CRIT.map(cardHTML).join("");
    montarTabs();
  }

  function montarTabs() {
    $("#tabs").innerHTML = PERFIS.map(function (p) {
      return '<button type="button" class="tab" data-perfil="' + p.id + '" aria-pressed="' + (estado.perfil === p.id) + '">' + esc(p.nome) + "</button>";
    }).join("");
    $("#perfil-dica").textContent = estado.perfil === "convidado"
      ? "O perfil Convidado recebe os pesos de um link compartilhado. Você pode editá-lo."
      : "Os pesos começam todos em 'Médio'. Nesta versão não foram chutados pesos para ninguém; cada um define os seus.";
  }

  function cardHTML(c) {
    var cit = c.citado_por || {};
    var citado = [["pessoa_a", "Pessoa A"], ["pessoa_b", "Pessoa B"]].filter(function (p) { return (cit[p[0]] || []).length; })
      .map(function (p) { return p[1] + " falou disso na conversa (" + cit[p[0]].length + " msg)"; }).join(" · ");
    return '<article class="card crit" id="c-' + c.id + '" data-crit="' + c.id + '">' +
      '<div class="crit-head"><div class="crit-titulo"><h3>' + esc(c.nome) + '</h3><span class="tipo">' + esc({ dados: "dados", valores: "valores", misto: "misto" }[c.tipo]) + "</span></div>" +
      '<p class="crit-perg muted small">' + esc(c.pergunta) + "</p>" +
      '<div class="peso-linha"><label class="sr" for="p-' + c.id + '">Peso de ' + esc(c.nome) + '</label>' +
      '<input type="range" id="p-' + c.id + '" min="0" max="5" step="1" data-peso="' + c.id + '">' +
      '<output class="peso-rot" for="p-' + c.id + '"></output></div></div>' +
      '<div class="pills" data-pills></div>' +
      '<button class="abrir" type="button" aria-expanded="false" aria-controls="b-' + c.id + '"><span>Ver evidências e ajustar notas</span><span class="seta" aria-hidden="true">⌄</span></button>' +
      '<div class="crit-corpo" id="b-' + c.id + '" hidden>' +
      CANDS.map(function (k) { return candHTML(c, k); }).join("") +
      '<div class="contra"><b>Contraponto</b>' + esc(c.contraponto) + "</div>" +
      (c.nota_criterio ? '<p class="small muted" style="margin-top:10px">' + esc(c.nota_criterio) + "</p>" : "") +
      (citado ? '<p class="citado">' + esc(citado) + ".</p>" : "") +
      "</div></article>";
  }

  function candHTML(c, k) {
    var n = c.notas[k.id], cls = k.id === "lula" ? "l" : "f";
    var ev = n.evidencias.map(function (e, i) {
      var id = c.id + "-" + k.id + "-" + i, ref = String(e.ref), claim = D.claims[ref], topico = ref.charAt(0) === "t" ? TOP[ref.slice(1)] : null;
      var chip = "", ficha = "";
      if (claim) {
        var v = D.veredito[claim.veredito];
        chip = '<span class="chip v-' + claim.veredito + '"><span aria-hidden="true">' + v.icone + "</span>" + esc(v.rotulo) + "</span>";
        ficha = "<p><b>Afirmação " + esc(ref) + " (" + esc(claim.quem) + "):</b> " + esc(claim.texto) + "</p><p>" + esc(claim.nota) + "</p>" +
          (claim.fontes.length ? "<ul>" + claim.fontes.map(function (f) { return '<li><a href="' + safeUrl(f.url) + '" target="_blank" rel="noopener noreferrer">' + esc(f.titulo) + "</a></li>"; }).join("") + "</ul>" : "") +
          '<p class="muted">' + (claim.lida ? "Fonte lida diretamente." : "Fonte não lida na íntegra: conferir antes de citar.") + "</p>";
      } else if (topico) {
        ficha = "<p><b>" + esc(topico.titulo) + "</b></p>" + (topico.achados.length ? "<ul>" + topico.achados.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" : "<p>Sem achados registrados.</p>");
        chip = '<span class="chip v-pendente">Contexto</span>';
      }
      return "<li><span>" + esc(e.texto) + "</span>" +
        '<div class="ev-acoes">' + (ficha ? '<button type="button" class="ficha-btn" aria-expanded="false" aria-controls="f-' + id + '">' + chip + '<span class="rot">ver ficha</span></button>' : "") +
        (e.fonte ? '<a class="small" href="' + safeUrl(e.fonte) + '" target="_blank" rel="noopener noreferrer">fonte do plano</a>' : "") + "</div>" +
        (ficha ? '<div class="ficha" id="f-' + id + '" hidden>' + ficha + "</div>" : "") + "</li>";
    }).join("");
    return '<section class="cand ' + cls + '" data-cand="' + k.id + '"><h4><span>' + esc(k.nome) + '</span><span class="n" data-nota-txt></span>' +
      '<span class="badge ' + (n.confianca === "baixa" ? "baixa" : "") + '">confiança ' + esc(n.confianca) + '</span><span class="badge">base: ' + esc(n.base) + "</span></h4>" +
      '<p class="resumo">' + esc(n.resumo) + "</p>" +
      '<div class="stepper" role="group" aria-label="Nota de ' + esc(k.nome) + ' em ' + esc(c.nome) + '"><button type="button" data-step="-1" aria-label="Diminuir nota">−</button><output data-nota-out aria-live="polite"></output><button type="button" data-step="1" aria-label="Aumentar nota">+</button><span class="rot" data-nota-rot></span></div>' +
      '<button type="button" class="reset" data-reset hidden>voltar à nota proposta</button>' +
      '<ul class="ev">' + ev + "</ul></section>";
  }

  // ---------- atualização dinâmica ----------
  function sincronizar() {
    CRIT.forEach(function (c) {
      var el = $("#c-" + c.id), w = peso(c);
      var r = $("[data-peso]", el); r.value = w; $("output.peso-rot", el).textContent = PESO_ROT[w];
      $("[data-pills]", el).innerHTML = CANDS.map(function (k) {
        var cls = k.id === "lula" ? "l" : "f", baixa = c.notas[k.id].confianca === "baixa" && !mudada(c, k.id);
        return '<span class="pill ' + cls + (baixa ? " baixa" : "") + '" title="' + esc(k.nome) + ": " + nota(c, k.id) + (baixa ? ", confiança baixa" : "") + '">' + esc(k.nome) + " " + nota(c, k.id) + "</span>";
      }).join("");
      CANDS.forEach(function (k) {
        var s = $('[data-cand="' + k.id + '"]', el), n = nota(c, k.id);
        $("[data-nota-out]", s).textContent = n; $("[data-nota-rot]", s).textContent = NOTA_ROT[n];
        $("[data-nota-txt]", s).textContent = "nota " + n + (mudada(c, k.id) ? " (sua)" : "");
        $("[data-reset]", s).hidden = !mudada(c, k.id);
      });
    });
    $$tabs();
    renderResultado();
    salvar();
  }
  function $$tabs() {
    document.querySelectorAll(".tab").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.perfil === estado.perfil)); });
    $("#perfil-dica").textContent = estado.perfil === "convidado"
      ? "O perfil Convidado recebe os pesos de um link compartilhado. Você pode editá-lo."
      : "Os pesos começam todos em 'Médio'. Nesta versão não foram chutados pesos para ninguém; cada um define os seus.";
  }

  function renderResultado() {
    var r = calcular(false), rf = calcular(true);
    var bar = function (cls, nome, v) {
      return '<div class="barra ' + cls + '"><span class="nome c-' + (cls === "l" ? "lula" : "flavio") + '">' + esc(nome) + '</span><div class="trilho"><div class="preench" style="width:' + ((v - 1) / 4 * 100).toFixed(1) + '%"></div></div><span class="valor">' + fmt(v) + "</span></div>";
    };
    if (!r.sw) {
      $("#res-barras").innerHTML = ""; $("#res-msg").textContent = "Todos os pesos estão em zero. Aumente algum para ver o resultado.";
      $("#res-forte").textContent = ""; $("#decide").innerHTML = ""; $("#sens").innerHTML = "";
      $("#pl-f").textContent = "–"; $("#pl-l").textContent = "–"; $("#pl-d").textContent = "sem pesos"; return;
    }
    $("#res-barras").innerHTML = bar("f", K.f.nome, r.f) + bar("l", K.l.nome, r.l);
    var t = tamanho(r.d), who = lider(r.d), nome = who > 0 ? K.l.nome : K.f.nome;
    $("#res-msg").textContent = !who || t === "empate técnico"
      ? "Empate técnico: a diferença (" + fmt(Math.abs(r.d)) + " ponto) é menor que a incerteza das notas."
      : "Com estes pesos e notas, " + nome + " tem " + t + " (" + fmt(Math.abs(r.d)) + " ponto de 4 possíveis).";
    var baixas = CRIT.reduce(function (a, c) { return a + (peso(c) ? ["flavio", "lula"].filter(function (k) { return c.notas[k].confianca === "baixa" && !mudada(c, k); }).length : 0); }, 0);
    var tot = CRIT.filter(function (c) { return peso(c); }).length * 2;
    $("#res-forte").textContent = "Considerando só as notas de confiança média ou alta (as demais viram 3): Flávio " + fmt(rf.f) + " · Lula " + fmt(rf.l) + " (" + (lider(rf.d) === 0 || tamanho(rf.d) === "empate técnico" ? "empate técnico" : (rf.d > 0 ? K.l.nome : K.f.nome) + ", " + tamanho(rf.d)) + "). " + baixas + " de " + tot + " notas têm confiança baixa.";
    $("#pl-f").textContent = fmt(r.f); $("#pl-l").textContent = fmt(r.l);
    $("#pl-d").textContent = !who || t === "empate técnico" ? "empate técnico" : nome + " à frente";

    // O que decide
    var max = Math.max.apply(null, r.contrib.map(function (x) { return Math.abs(x.v); })) || 1;
    var ordem = r.contrib.slice().sort(function (a, b) { return Math.abs(b.v) - Math.abs(a.v); });
    $("#decide").innerHTML = '<div class="dec-leg"><span class="c-flavio">← ' + esc(K.f.nome) + '</span><span class="c-lula">' + esc(K.l.nome) + " →</span></div>" +
      ordem.map(function (x) {
        var w = (Math.abs(x.v) / max * 50).toFixed(1);
        return '<div class="dec-row"><div class="dec-top"><span>' + esc(x.c.nome) + '</span><span class="peso">peso ' + x.w + " · " + (Math.abs(x.v) < 0.005 ? "empate" : (x.v > 0 ? K.l.nome : K.f.nome) + " +" + fmt(Math.abs(x.v))) + '</span></div><div class="dec-eixo" aria-hidden="true">' +
          (Math.abs(x.v) >= 0.005 ? '<div class="dec-barra ' + (x.v > 0 ? "l" : "f") + '" style="width:' + w + '%"></div>' : "") + "</div></div>";
      }).join("");

    // Sensibilidade
    var base0 = lider(r.d);
    var linhas = CRIT.filter(function (c) { return peso(c); }).map(function (c) {
      var z = calcular(false, c.id); if (!z.sw) return null;
      var vira = lider(z.d) !== base0;
      return { c: c, z: z, vira: vira };
    }).filter(Boolean).sort(function (a, b) { return (b.vira - a.vira) || (Math.abs(b.z.d - r.d) - Math.abs(a.z.d - r.d)); });
    var qtd = linhas.filter(function (l) { return l.vira; }).length;
    $("#sens").innerHTML = '<p class="small muted">' + (qtd ? qtd + " critério(s) mudam o resultado se forem ignorados (em destaque)." : "Nenhum critério sozinho muda o resultado se for ignorado.") + "</p>" +
      linhas.map(function (l) {
        var res = lider(l.z.d) === 0 || tamanho(l.z.d) === "empate técnico" ? "empate técnico" : (l.z.d > 0 ? K.l.nome : K.f.nome) + " à frente";
        return '<div class="sens-row' + (l.vira ? " vira" : "") + '"><span>Sem ' + esc(l.c.nome) + '</span><span class="sens-tag">' + esc(res) + (l.vira ? " ⚑" : "") + "</span></div>";
      }).join("");
  }

  // ---------- eventos ----------
  function ligar() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("button, a"); if (!t) return;
      if (t.dataset.perfil) { estado.perfil = t.dataset.perfil; sincronizar(); return; }
      if (t.classList.contains("abrir")) {
        var open = t.getAttribute("aria-expanded") === "true"; t.setAttribute("aria-expanded", String(!open));
        $("#" + t.getAttribute("aria-controls")).hidden = open; return;
      }
      if (t.classList.contains("ficha-btn")) {
        var o = t.getAttribute("aria-expanded") === "true"; t.setAttribute("aria-expanded", String(!o));
        $("#" + t.getAttribute("aria-controls")).hidden = o; return;
      }
      if (t.dataset.step || t.hasAttribute("data-reset")) {
        var art = t.closest("[data-crit]"), c = CRIT.filter(function (x) { return x.id === art.dataset.crit; })[0];
        var k = t.closest("[data-cand]").dataset.cand, d = atual(), cur = nota(c, k);
        d.notas[c.id] = d.notas[c.id] || {};
        if (t.hasAttribute("data-reset")) delete d.notas[c.id][k];
        else d.notas[c.id][k] = Math.max(1, Math.min(5, cur + Number(t.dataset.step)));
        sincronizar(); return;
      }
      if (t.id === "copiar") {
        var url = linkAtual(), ok = function () { $("#copiado").textContent = "Link copiado."; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { prompt("Copie o link:", url); });
        else { $("#copiado").textContent = url; }
      }
    });
    document.addEventListener("input", function (e) {
      if (e.target.dataset && e.target.dataset.peso) { atual().pesos[e.target.dataset.peso] = Number(e.target.value); sincronizar(); }
    });
  }

  carregar(); iniciar(); ligar(); sincronizar();
})();

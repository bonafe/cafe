(function () {
  "use strict";
  var NAV = [["./", "Início", "index"], ["topicos.html", "Tópicos", "topicos"], ["graficos.html", "Gráficos", "graficos"],
    ["verificacao.html", "Verificação", "verificacao"], ["diario.html", "Diário", "diario"], ["matriz.html", "Matriz", "matriz"], ["glossario.html", "Glossário", "glossario"]];
  var aqui = document.body.dataset.pagina || "";

  window.U = {
    $: function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); },
    esc: function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); },
    url: function (u) { return /^https?:\/\//.test(u) ? u : "#"; },
    num: function (n, d) { return n.toLocaleString("pt-BR", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); },
    chip: function (v) {
      var x = (window.DADOS && DADOS.veredito[v]) || { rotulo: v, icone: "" };
      return '<span class="chip v-' + v + '" title="' + U.esc(x.desc || "") + '"><span aria-hidden="true">' + x.icone + "</span>" + U.esc(x.rotulo) + "</span>";
    },
    status: function (s) { var x = DADOS.status[s]; return '<span class="tag ' + s + '" title="' + U.esc(x.desc) + '">' + U.esc(x.rotulo) + "</span>"; }
  };

  var nav = document.getElementById("nav");
  if (nav) {
    nav.className = "sitenav";
    nav.innerHTML = '<div class="sitenav-in"><a class="brand" href="./">Café com política</a><nav class="menu" aria-label="Principal">' +
      NAV.map(function (n) { return '<a href="' + n[0] + '"' + (n[2] === aqui ? ' aria-current="page"' : "") + ">" + n[1] + "</a>"; }).join("") +
      '</nav><button class="iconbtn" id="tema" type="button" aria-label="Alternar tema claro e escuro">◐</button></div>';
  }
  var cur = nav && nav.querySelector('[aria-current="page"]'); if (cur) { var mn = nav.querySelector(".menu"); mn.scrollLeft = Math.max(0, cur.offsetLeft - mn.clientWidth / 2 + cur.offsetWidth / 2); }
  var rod = document.getElementById("rodape");
  if (rod) {
    rod.className = "rodape";
    rod.innerHTML = "<p><strong>Café com política</strong> organiza uma conversa entre duas pessoas sobre o 2º turno de 2026 (Lula × Flávio). Não recomenda voto.</p>" +
      "<p>Dados: BCB (SGS), IBGE (SIDRA), Banco Mundial/FAO e reportagens citadas em cada ficha. Veredito e notas são provisórios e podem ser corrigidos. " +
      "Parte da pesquisa usou IA; os números que dependem de fonte primária estão marcados.</p>" +
      "<p>Atualizado em " + (window.DADOS ? U.esc(DADOS.gerado_em) : "") + ".</p>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("#tema"); if (!b) return;
    var cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var nx = cur === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = nx;
    try { localStorage.setItem("tema", nx); } catch (er) {}
    document.dispatchEvent(new Event("tema"));
  });
})();

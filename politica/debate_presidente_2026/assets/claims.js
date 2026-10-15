(function () {
  "use strict";
  // Cartão de uma afirmação verificada (usado em Tópicos e Verificação).
  var GRAF = { pib: "PIB", ipca: "Inflação", desemprego: "Desemprego", investimento: "Investimento", divida: "Dívida", fiscal: "Contas públicas", renda: "Renda", familias: "Famílias", fome: "Fome", pobreza: "Pobreza", gini: "Desigualdade", china: "China" };
  U.claimHTML = function (id, mostrarTopico) {
    var c = DADOS.claims[id]; if (!c) return "";
    var top = DADOS.topicos.filter(function (t) { return t.id === c.topico; })[0];
    return '<details class="claim" data-anc id="a-' + U.esc(id) + '" data-v="' + c.veredito + '">' +
      '<summary><span class="cl-id">' + U.esc(id) + "</span><span class=\"cl-txt\">" + U.esc(c.texto) + '</span>' + U.chip(c.veredito) + "</summary>" +
      '<div class="cl-corpo"><p class="small muted">Dita por <b>' + U.esc(c.quem) + "</b>" +
      (mostrarTopico && top ? ' · tópico <a href="topicos.html#' + top.id + '">' + top.id + ". " + U.esc(top.titulo) + "</a>" : "") + "</p>" +
      "<p>" + U.esc(c.nota || "Sem nota.") + "</p>" +
      (c.graficos.length ? '<p class="small">Gráficos: ' + c.graficos.map(function (g) { return '<a href="graficos.html#g-' + g + '">' + (GRAF[g] || g) + "</a>"; }).join(" · ") + "</p>" : "") +
      (c.fontes.length ? '<ul class="fontes">' + c.fontes.map(function (f) { return '<li><a href="' + U.url(f.url) + '" target="_blank" rel="noopener noreferrer">' + U.esc(f.titulo) + "</a></li>"; }).join("") + "</ul>" : '<p class="small muted">Sem fonte registrada.</p>') +
      '<p class="small muted">' + (c.lida ? "Fonte lida diretamente (API ou página original)." : "Fonte não lida na íntegra: base em resumo de busca. Conferir antes de citar.") + "</p></div></details>";
  };
})();

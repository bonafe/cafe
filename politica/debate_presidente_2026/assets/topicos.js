(function () {
  "use strict";
  // Estado no endereço: t = tópico aberto, f = filtro de status, o = ordem, a = afirmações abertas, s = posição.
  var D = DADOS, T = D.topicos.slice().sort(function (a, b) { return a.id - b.id; }), main = U.$("#main");

  function lista() {
    document.title = "Tópicos";
    var filtro = Estado.get("f", "todos"), ordem = Estado.get("o", "numero");
    var itens = T.filter(function (t) { return filtro === "todos" || t.status === filtro; });
    if (ordem === "prioridade") itens = itens.slice().sort(function (a, b) { return a.prioridade - b.prioridade || a.id - b.id; });
    var cont = { todos: T.length }; T.forEach(function (t) { cont[t.status] = (cont[t.status] || 0) + 1; });
    main.innerHTML = '<p class="kicker" style="margin-top:28px">Fase 1</p><h1>Os 15 tópicos</h1>' +
      '<p class="lede">Cada tópico reúne a preocupação de cada um, o desenrolar da conversa, as dúvidas e as afirmações conferidas.</p>' +
      '<div class="filtros" role="group" aria-label="Filtrar por status">' +
      [["todos", "Todos"], ["convergencia", "Convergência"], ["divergencia", "Divergência"], ["aberto", "Em aberto"]].map(function (f) {
        return '<button type="button" class="fbtn" data-f="' + f[0] + '" aria-pressed="' + (filtro === f[0]) + '">' + f[1] + " (" + (cont[f[0]] || 0) + ")</button>";
      }).join("") + "</div>" +
      '<div class="filtros" role="group" aria-label="Ordenar"><button type="button" class="fbtn" data-o="numero" aria-pressed="' + (ordem === "numero") + '">Por número</button><button type="button" class="fbtn" data-o="prioridade" aria-pressed="' + (ordem === "prioridade") + '">Por prioridade de pesquisa</button></div>' +
      '<div class="grid g2">' + itens.map(function (t) {
        var n = t.afirmacoes.length;
        return '<a class="card tcard" data-anc id="t-' + t.id + '" href="' + Estado.href({ t: t.id, a: null, s: null }) + '"><span class="kicker">Tópico ' + t.id + (ordem === "prioridade" ? " · prioridade " + t.prioridade : "") + "</span>" + U.status(t.status) +
          "<h3>" + U.esc(t.titulo) + "</h3><p>" + U.esc(t.conclusao) + '</p><p class="small muted" style="margin-top:8px">' + n + (n === 1 ? " afirmação conferida" : " afirmações conferidas") + "</p></a>";
      }).join("") + "</div>";
  }

  function h2(id, texto) { return '<h2 id="' + id + '" data-anc>' + texto + "</h2>"; }

  function detalhe(id) {
    var t = T.filter(function (x) { return x.id === id; })[0]; if (!t) return lista();
    document.title = t.titulo;
    var i = T.indexOf(t), ant = T[i - 1], prox = T[i + 1], abertas = Estado.lista("a");
    main.innerHTML = '<a class="voltar" href="' + Estado.href({ t: null, a: null, s: null }) + '">← Todos os tópicos</a>' +
      '<p class="kicker">Tópico ' + t.id + "</p><h1>" + U.esc(t.titulo) + '</h1><p style="margin-top:10px">' + U.status(t.status) + "</p>" +
      h2("pensam", "O que cada um pensa") + '<div class="col2"><section class="card pad2 pessoa i"><h3>Pessoa A</h3><p>' + U.esc(t.pessoa_a) + '</p></section><section class="card pad2 pessoa f"><h3>Pessoa B</h3><p>' + U.esc(t.pessoa_b) + "</p></section></div>" +
      h2("andou", "Como a conversa andou") + "<p>" + U.esc(t.desenrolar) + "</p>" +
      '<div class="callout"><p><strong>Conclusão provisória:</strong> ' + U.esc(t.conclusao) + "</p></div>" +
      (t.citacoes.length ? h2("trechos", "Trechos") + t.citacoes.map(function (c) { return '<blockquote class="quote">“' + U.esc(c.trecho) + "”<span>" + U.esc(c.autor) + "</span></blockquote>"; }).join("") : "") +
      h2("afirmacoes", "Afirmações conferidas") + (t.afirmacoes.length ? t.afirmacoes.map(function (a) { return U.claimHTML(a, false); }).join("") : '<p class="muted">Este tópico não tem afirmações de fato a verificar; é sobre método e valores.</p>') +
      (t.achados.length ? h2("achados", "Achados da pesquisa") + '<ul class="lista">' + t.achados.map(function (a) { return "<li>" + U.esc(a) + "</li>"; }).join("") + "</ul>" : "") +
      h2("duvidas", "Dúvidas para aprofundar") + '<ul class="lista">' + t.duvidas.map(function (d) { return "<li>" + U.esc(d) + "</li>"; }).join("") + "</ul>" +
      '<nav class="prox" aria-label="Outros tópicos">' + (ant ? '<a class="card" href="' + Estado.href({ t: ant.id, a: null, s: null }) + '"><span class="small muted">← Anterior</span><br>' + U.esc(ant.titulo) + "</a>" : "<span></span>") +
      (prox ? '<a class="card" href="' + Estado.href({ t: prox.id, a: null, s: null }) + '"><span class="small muted">Próximo →</span><br>' + U.esc(prox.titulo) + "</a>" : "<span></span>") + "</nav>";
    abertas.forEach(function (a) { var el = document.getElementById("a-" + a); if (el) el.open = true; });
  }

  var primeira = true;
  function rota() {
    var id = parseInt(Estado.get("t", ""), 10);
    id ? detalhe(id) : lista();
    if (primeira) Estado.irDepois(); else if (!Estado.get("s")) window.scrollTo(0, 0);
    primeira = false;
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-f],[data-o]"); if (!b) return;
    if (b.dataset.f) Estado.set({ f: b.dataset.f === "todos" ? null : b.dataset.f, s: null });
    if (b.dataset.o) Estado.set({ o: b.dataset.o === "numero" ? null : b.dataset.o, s: null });
    lista();
  });
  // Afirmações abertas/fechadas vão para o endereço (o evento toggle não borbulha, por isso captura).
  document.addEventListener("toggle", function (e) {
    if (!e.target.classList || !e.target.classList.contains("claim")) return;
    var abertas = U.$$("details.claim[open]").map(function (d) { return d.id.replace(/^a-/, ""); });
    Estado.set({ a: abertas.join(",") });
  }, true);

  Estado.aoMudar(rota);
  Estado.rastrear("main [data-anc]");
  rota();
})();

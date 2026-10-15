(function () {
  "use strict";
  // Estado da página no endereço (#chave=valor&...), para que qualquer link colado leve ao mesmo ponto.
  // Chaves comuns: s = elemento em que a pessoa estava (posição da rolagem).
  function parse() {
    var h = location.hash.replace(/^#/, ""), p = {}, m;
    if (!h) return p;
    if (h.indexOf("=") < 0) { // links antigos: #3, #g-pib, #a-3.3
      if (/^\d+$/.test(h)) p.t = h;
      else if ((m = /^a-(.+)$/.exec(h))) { p.a = m[1]; p.s = h; }
      else p.s = h;
      return p;
    }
    h.split("&").forEach(function (kv) {
      var i = kv.indexOf("="); if (i < 1) return;
      try { p[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")); } catch (e) { /* ignora par malformado */ }
    });
    return p;
  }
  function ser(p) {
    return Object.keys(p).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(p[k]).replace(/%2C/g, ",").replace(/%3A/g, ":");
    }).join("&");
  }
  function mesclar(obj) {
    var p = parse();
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (v == null || v === "" || v === false) delete p[k]; else p[k] = v === true ? "1" : String(v);
    });
    return p;
  }

  var E = window.Estado = {
    todos: parse,
    get: function (k, d) { var v = parse()[k]; return v == null ? d : v; },
    lista: function (k) { var v = parse()[k]; return v ? v.split(",").filter(Boolean) : []; },
    // Atualiza o endereço sem recarregar. push=true cria uma entrada no histórico (botão voltar).
    set: function (obj, push) {
      var s = ser(mesclar(obj)), url = location.pathname + location.search + (s ? "#" + s : "");
      if (url === location.pathname + location.search + location.hash) return;
      try { history[push ? "pushState" : "replaceState"](null, "", url); } catch (e) { /* ambiente sem history */ }
    },
    // Texto de hash (para href) já com o estado atual mesclado.
    href: function (obj) { var s = ser(mesclar(obj)); return "#" + s; },
    aoMudar: function (fn) {
      var t, f = function () { clearTimeout(t); t = setTimeout(fn, 10); };
      window.addEventListener("hashchange", f); window.addEventListener("popstate", f);
    },
    // Guarda em "s" o primeiro elemento visível, para reabrir na mesma posição.
    rastrear: function (sel) {
      var t;
      window.addEventListener("scroll", function () {
        clearTimeout(t);
        t = setTimeout(function () {
          // O elemento mais interno que cruza a linha logo abaixo da barra fixa; se não houver, o próximo.
          var els = document.querySelectorAll(sel), pick = null, prox = null, LINHA = 140;
          for (var i = 0; i < els.length; i++) {
            var r = els[i].getBoundingClientRect();
            if (r.top <= LINHA && r.bottom > LINHA) pick = els[i];
            else if (r.top > LINHA && !prox) prox = els[i];
          }
          pick = pick || prox;
          E.set({ s: (window.scrollY < 60 || !pick || !pick.id) ? null : pick.id });
        }, 300);
      }, { passive: true });
    },
    ir: function () {
      var s = E.get("s"); if (!s) return;
      var el = document.getElementById(s); if (el) el.scrollIntoView({ block: "start" });
    },
    // Chama ir() depois que o layout assentar (fontes, gráficos).
    irDepois: function () { setTimeout(E.ir, 80); setTimeout(E.ir, 500); }
  };
})();

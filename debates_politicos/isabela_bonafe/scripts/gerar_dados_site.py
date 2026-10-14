#!/usr/bin/env python3
"""Gera site/data/dados.js (window.DADOS) e site/data/series.js (window.SERIES) a partir de data/.

O site é estático e abre também via file://, por isso os dados vão em .js em vez de fetch().
Privacidade: o texto bruto da conversa NÃO é publicado; só ids de mensagem e as fichas escritas à mão
(incluindo as citações curtas curadas em topicos.json).

Uso: python3 -I scripts/gerar_dados_site.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
D = RAIZ / "data"
OUT = RAIZ / "site" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def js(nome, valor):
    (OUT / nome).write_text(f"window.{nome.split('.')[0].upper()} = " + json.dumps(valor, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"site/data/{nome}: {(OUT / nome).stat().st_size} bytes")


topicos = json.load(open(D / "topicos.json", encoding="utf-8"))
matriz = json.load(open(D / "matriz.json", encoding="utf-8"))

# série -> gráfico (âncora em graficos.html)
SERIE_GRAFICO = {
    "pib_var_anual": "pib", "pib_percapita_var_anual": "pib", "ipca_12m": "ipca", "desocupacao_trimestral": "desemprego",
    "taxa_investimento": "investimento", "divida_bruta": "divida", "divida_liquida": "divida",
    "resultado_primario_12m": "fiscal", "resultado_nominal_12m": "fiscal", "rendimento_real": "renda",
    "endividamento_renda": "familias", "comprometimento_renda": "familias", "inseguranca_grave": "fome",
    "inseguranca_moderada_grave": "fome", "subalimentacao_pct": "fome", "china_pobreza_extrema": "china",
    "gini": "gini", "pobreza_685": "pobreza", "pobreza_extrema_215": "pobreza",
}

claims, tops = {}, []
for t in topicos["topicos"]:
    ids = []
    for a in t["afirmacoes"]:
        ids.append(a["id"])
        claims[a["id"]] = {
            "topico": t["id"], "quem": a["quem"], "texto": a["texto"], "veredito": a["veredito"],
            "nota": a.get("nota", ""), "fontes": a.get("fontes", []), "lida": a.get("lida_na_fonte", False),
            "graficos": sorted({SERIE_GRAFICO[s] for s in a.get("series", []) if s in SERIE_GRAFICO}),
        }
    tops.append({
        "id": t["id"], "titulo": t["titulo"], "status": t["status"], "prioridade": t["prioridade"],
        "pessoa_a": t["pessoa_a"], "pessoa_b": t["pessoa_b"], "desenrolar": t["desenrolar"], "conclusao": t["conclusao_provisoria"],
        "citacoes": [{"autor": c["autor"], "trecho": c["trecho"]} for c in t["citacoes"]],
        "duvidas": t["duvidas"], "achados": t.get("achados", []), "afirmacoes": ids,
    })

dados = {
    "gerado_em": matriz["meta"]["versao"],
    "meta": {k: topicos["meta"][k] for k in ("escopo", "convencoes", "governos")},
    "matriz": matriz,
    "claims": claims,
    "topicos": tops,
    "veredito": {
        "verificado": {"rotulo": "Verificado", "icone": "✓", "desc": "A fonte primária confirma o que foi dito."},
        "parcial": {"rotulo": "Parcial", "icone": "◐", "desc": "Há fundo de verdade, mas falta contexto ou a conclusão vai além do dado."},
        "falso": {"rotulo": "Falso", "icone": "✕", "desc": "A fonte primária contradiz a afirmação."},
        "sem_fonte": {"rotulo": "Sem fonte", "icone": "?", "desc": "Não achei evidência nem a favor nem contra."},
        "nao_aplica": {"rotulo": "Não se aplica", "icone": "–", "desc": "Opinião, valor ou relato pessoal: não é fato verificável."},
        "pendente": {"rotulo": "Pendente", "icone": "…", "desc": "Ainda não pesquisado."},
    },
    "status": {
        "convergencia": {"rotulo": "Convergência", "desc": "Os dois concordam."},
        "divergencia": {"rotulo": "Divergência", "desc": "Os dois discordam."},
        "aberto": {"rotulo": "Em aberto", "desc": "Ainda não foi discutido a fundo."},
    },
}
js("dados.js", dados)

series = {}
for p in sorted((D / "series").glob("*.json")):
    s = json.load(open(p, encoding="utf-8"))
    series[s["id"]] = {k: s[k] for k in ("id", "titulo", "unidade", "fonte", "url", "periodicidade", "baixado_em", "pontos", "nota") if k in s}
for k, s in json.load(open(D / "series_manuais.json", encoding="utf-8")).items():
    series[k] = s
js("series.js", series)

#!/usr/bin/env python3
"""Baixa séries históricas oficiais (BCB/SGS, IBGE/SIDRA, Banco Mundial) para data/series/*.json.

Uso: python3 -I scripts/baixar_series.py
Cada arquivo: {"id","titulo","unidade","fonte","url","periodicidade","baixado_em","pontos":[{"t":"2019-01","v":1.2}]}
"""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "series"
OUT.mkdir(parents=True, exist_ok=True)
HOJE = datetime.date.today().isoformat()


def http(url, tentativas=4):
    for i in range(tentativas):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.load(r)
        except Exception as e:
            err = e
            time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"{url}: {err}")


def salvar(id, titulo, unidade, fonte, url, per, pontos, nota=None):
    d = {"id": id, "titulo": titulo, "unidade": unidade, "fonte": fonte, "url": url,
         "periodicidade": per, "baixado_em": HOJE, "pontos": pontos}
    if nota:
        d["nota"] = nota
    (OUT / f"{id}.json").write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    print(f"{id}: {len(pontos)} pontos, {pontos[0]['t']} -> {pontos[-1]['t']}")


def bcb(codigo, inicio=1995):
    pts, ano = [], inicio
    while ano <= datetime.date.today().year:
        fim = min(ano + 9, datetime.date.today().year)
        url = (f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json"
               f"&dataInicial=01/01/{ano}&dataFinal=31/12/{fim}")
        for r in http(url):
            d, m, a = r["data"].split("/")
            pts.append({"t": f"{a}-{m}" if d == "01" else f"{a}-{m}-{d}", "v": float(r["valor"])})
        ano = fim + 1
    return sorted({p["t"]: p for p in pts}.values(), key=lambda p: p["t"])


def sidra(path):
    return http("https://apisidra.ibge.gov.br/values" + path)[1:]


def bcb_serie(id, cod, titulo, unidade, per="mensal", inicio=1995, nota=None):
    salvar(id, titulo, unidade, f"Banco Central do Brasil, SGS {cod}",
           f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{cod}/dados?formato=json", per, bcb(cod, inicio), nota)


# --- Banco Central ---
bcb_serie("divida_bruta", 13762, "Dívida bruta do governo geral (% do PIB)", "% do PIB", inicio=2006)
bcb_serie("divida_liquida", 4513, "Dívida líquida do setor público (% do PIB)", "% do PIB", inicio=2001)
bcb_serie("resultado_primario_12m", 5793, "Déficit primário do setor público, acumulado em 12 meses (% do PIB; positivo = déficit)", "% do PIB", inicio=2002)
bcb_serie("resultado_nominal_12m", 5727, "Déficit nominal do setor público, acumulado em 12 meses (% do PIB; positivo = déficit)", "% do PIB", inicio=2002)
bcb_serie("ipca_12m", 13522, "IPCA acumulado em 12 meses", "%", inicio=1995)
bcb_serie("ipca_mensal", 433, "IPCA variação mensal", "%", inicio=1995)
bcb_serie("desocupacao_pnadc", 24369, "Taxa de desocupação (PNAD Contínua, trimestre móvel)", "%", inicio=2012)
bcb_serie("endividamento_renda", 29037, "Endividamento das famílias com o SFN (% da renda acumulada em 12 meses)", "% da renda", inicio=2005,
          nota="Rótulo conferido manualmente; ver data/series/_notas.md")
bcb_serie("comprometimento_renda", 29034, "Comprometimento de renda das famílias com serviço da dívida no SFN", "% da renda", inicio=2005,
          nota="Rótulo conferido manualmente; ver data/series/_notas.md")

# --- IBGE: PIB (taxa acumulada em 4 trimestres no 4º trim = variação anual) ---
rows = sidra("/t/5932/n1/all/v/all/p/all/c11255/90707")
anual = {}
for r in rows:
    if r["D2N"].startswith("Taxa acumulada em quatro") and r["D3C"].endswith("04") and r["V"] not in ("-", "..."):
        anual[r["D3C"][:4]] = float(r["V"])
salvar("pib_var_anual", "PIB: variação real anual (acumulada em 4 trimestres, 4º trim.)", "%", "IBGE, Contas Nacionais Trimestrais, SIDRA tabela 5932",
       "https://sidra.ibge.gov.br/tabela/5932", "anual", [{"t": a, "v": v} for a, v in sorted(anual.items())])
parcial = [r for r in rows if r["D2N"].startswith("Taxa acumulada em quatro") and r["D3C"][:4] == "2026"]
(OUT / "pib_2026_parcial.json").write_text(json.dumps(
    {"id": "pib_2026_parcial", "titulo": "PIB 2026: acumulado em 4 trimestres, resultado parcial", "unidade": "%",
     "fonte": "IBGE, SIDRA tabela 5932", "baixado_em": HOJE,
     "pontos": [{"t": r["D3N"], "v": float(r["V"])} for r in parcial if r["V"] not in ("-", "...")]}, ensure_ascii=False), encoding="utf-8")

# per capita (anual, tabela 6784) e população
r6784 = sidra("/t/6784/n1/all/v/9814/p/all")
salvar("pib_percapita_var_anual", "PIB per capita: variação real anual", "%", "IBGE, SIDRA tabela 6784", "https://sidra.ibge.gov.br/tabela/6784", "anual",
       [{"t": r["D3C"], "v": float(r["V"])} for r in r6784 if r["V"] not in ("-", "...")],
       nota="A tabela anual termina no último ano fechado pelo IBGE; anos posteriores não aparecem.")


# desocupação trimestral (PNAD Contínua, tabela 4099) — base para médias anuais
r = sidra("/t/4099/n1/all/v/4099/p/all")
salvar("desocupacao_trimestral", "Taxa de desocupação (PNAD Contínua, trimestre)", "%", "IBGE, SIDRA tabela 4099", "https://sidra.ibge.gov.br/tabela/4099", "trimestral",
       [{"t": f"{x['D3C'][:4]}-T{int(x['D3C'][4:])}", "v": float(x["V"])} for x in r if x["V"] not in ("-", "...")])

# --- IBGE: taxa de investimento = soma de 4 trimestres de FBCF / PIB (valores correntes) ---
q = sidra("/t/1846/n1/all/v/all/p/all/c11255/90707,93406")
tot = {}
for r in q:
    if r["V"] in ("-", "..."):
        continue
    a, tri = r["D3C"][:4], r["D3C"][4:]
    tot.setdefault(a, {}).setdefault(r["D4C"], {})[tri] = float(r["V"])
inv = []
for a, d in sorted(tot.items()):
    if len(d.get("90707", {})) == 4 and len(d.get("93406", {})) == 4:
        inv.append({"t": a, "v": round(100 * sum(d["93406"].values()) / sum(d["90707"].values()), 2)})
salvar("taxa_investimento", "Taxa de investimento (FBCF / PIB, valores correntes)", "% do PIB", "IBGE, Contas Nacionais Trimestrais, SIDRA tabela 1846 (cálculo próprio: soma de 4 trimestres)",
       "https://sidra.ibge.gov.br/tabela/1846", "anual", inv)

# --- IBGE: renda e Gini ---
r = sidra("/t/6390/n1/all/v/5933/p/all")
salvar("rendimento_real", "Rendimento médio real habitual do trabalho (PNAD Contínua, trimestre móvel)", "R$ (preços do último trimestre)", "IBGE, SIDRA tabela 6390",
       "https://sidra.ibge.gov.br/tabela/6390", "trimestre móvel",
       [{"t": f"{x['D3C'][:4]}-{x['D3C'][4:]}", "v": float(x["V"])} for x in r if x["V"] not in ("-", "...")])
r = sidra("/t/7435/n1/all/v/10681/p/all")
if r:
    salvar("gini", "Índice de Gini do rendimento domiciliar per capita", "índice (0 a 1)", "IBGE, SIDRA tabela 7435", "https://sidra.ibge.gov.br/tabela/7435", "anual",
           [{"t": x["D3C"], "v": float(x["V"])} for x in r if x["V"] not in ("-", "...")])

# --- Banco Mundial: China (para o tópico de ideologia) ---
def wb_pais(pais, indicador, id, titulo, unidade):
    url = f"https://api.worldbank.org/v2/country/{pais}/indicator/{indicador}?format=json&per_page=100"
    pts = sorted([{"t": d["date"], "v": d["value"]} for d in http(url)[1] if d["value"] is not None], key=lambda p: p["t"])
    salvar(id, titulo, unidade, f"Banco Mundial, indicador {indicador} ({pais})", url, "anual", pts)

wb_pais("CHN", "SI.POV.DDAY", "china_pobreza_extrema", "China: pobreza extrema (abaixo de US$ 2,15/dia, PPC 2017)", "% da população")

# --- Banco Mundial / FAO ---
def wb(indicador, id, titulo, unidade):
    url = f"https://api.worldbank.org/v2/country/BRA/indicator/{indicador}?format=json&per_page=100"
    dados = http(url)[1] or []
    pts = [{"t": d["date"], "v": d["value"]} for d in dados if d["value"] is not None]
    pts.sort(key=lambda p: p["t"])
    salvar(id, titulo, unidade, f"Banco Mundial (dados da FAO), indicador {indicador}", url, "anual", pts)

wb("SN.ITK.DEFC.ZS", "subalimentacao_pct", "Prevalência de subalimentação (média móvel de 3 anos)", "% da população")
wb("SN.ITK.DEFC", "subalimentacao_milhoes", "Pessoas subalimentadas (média móvel de 3 anos)", "milhões")
wb("SN.ITK.MSFI.ZS", "inseguranca_moderada_grave", "Insegurança alimentar moderada ou grave (média de 3 anos)", "% da população")
wb("SN.ITK.SVFI.ZS", "inseguranca_grave", "Insegurança alimentar grave (média de 3 anos)", "% da população")
wb("SI.POV.GINI", "gini_bm", "Índice de Gini (Banco Mundial)", "0 a 100")
wb("SI.POV.UMIC", "pobreza_685", "Pobreza: população abaixo de US$ 6,85/dia (PPC 2017)", "% da população")
wb("SI.POV.DDAY", "pobreza_extrema_215", "Pobreza extrema: população abaixo de US$ 2,15/dia (PPC 2017)", "% da população")

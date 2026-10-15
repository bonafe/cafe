#!/usr/bin/env python3
"""Taxa de desocupação refeita sem quem recebe Bolsa Família (e sem quem recebe qualquer programa social).

Fonte: microdados da PNAD Contínua anual, visita 5 (2024, o mais recente publicado), com as colunas lidas por posição
(layout em input_PNADC_2024_visita5.txt do IBGE): peso V1032, idade V2009, V5001A (BPC), V5002A (Bolsa Família),
V5003A (outro programa), VD4001/VD4002 (condição na força de trabalho e na ocupação).
Os pesos da visita 5 não somam a população, então só as proporções e taxas valem; os totais absolutos não.

Baixar e descompactar (arquivo de ~1,5 GB) em uma pasta vazia, fora do projeto:
  https://ftp.ibge.gov.br/Trabalho_e_Rendimento/Pesquisa_Nacional_por_Amostra_de_Domicilios_continua/Anual/Microdados/Visita/Visita_5/Dados/PNADC_2024_visita5.zip
Uso: python3 -I scripts/desemprego_sem_beneficiarios.py CAMINHO/PNADC_2024_visita5.txt
"""
import sys, collections
W = collections.defaultdict(float); N = collections.defaultdict(int)
with open(sys.argv[1], encoding="latin1") as fh:
    for ln in fh:
        try: idade = int(ln[102:105])
        except ValueError: continue
        if idade < 14: continue
        ft, oc = ln[674], ln[675]
        cond = "ocup" if (ft=="1" and oc=="1") else "desoc" if (ft=="1" and oc=="2") else "fora" if ft=="2" else None
        if not cond: continue
        p = float(ln[57:72]); tri = ln[4]
        bf = ln[476]=="1"; bpc = ln[467]=="1"; out = ln[485]=="1"
        prog = bf or bpc or out
        for t in (tri, "ano"):
            for k, v in (("", True), ("bf", bf), ("prog", prog)):
                if v: W[(t, cond, k)] += p; N[(t, cond, k)] += 1
for t in ("1","2","3","4","ano"):
    d, o, f = (W[(t,c,"")] for c in ("desoc","ocup","fora"))
    out = [f"T{t}" if t!="ano" else "ANO", f"desoc={d/1e6:.2f}M", f"FT={(d+o)/1e6:.2f}M", f"taxa={100*d/(d+o):.2f}%"]
    for k in ("bf","prog"):
        db, ob, fb = (W[(t,c,k)] for c in ("desoc","ocup","fora"))
        out += [f"| {k}: desoc_c/={db/1e6:.2f}M ({100*db/d:.1f}%) ocup_c/={ob/1e6:.2f}M fora_c/={fb/1e6:.2f}M ({100*fb/f:.1f}% dos fora) taxa_sem={100*(d-db)/((d+o)-db-ob):.2f}% n_desoc_bf={N[(t,'desoc',k)]}"]
    print(" ".join(out))

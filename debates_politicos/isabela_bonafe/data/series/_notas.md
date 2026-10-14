# Notas sobre as séries (data/series)

Baixadas por `scripts/baixar_series.py` das APIs oficiais (BCB/SGS, IBGE/SIDRA, Banco Mundial). Cada JSON traz fonte, URL e data do download.

## Convenções
- **Governos** (anos civis, 31/12 a 31/12): FHC I 1995–98 · FHC II 1999–2002 · Lula I 2003–06 · Lula II 2007–10 · Dilma I 2011–14 · Dilma II 2015–16 · Temer 2017–18 · Jair 2019–22 · Lula III 2023–25 (2026 só como parcial). Em 2016 o mandato mudou em agosto; o ano foi atribuído a Dilma II.
- **PIB anual** = taxa acumulada em 4 trimestres no 4º trimestre (SIDRA 5932). **PIB per capita** (SIDRA 6784) só até 2023.
- **Taxa de investimento** = soma de 4 trimestres de FBCF / soma de 4 trimestres do PIB, a preços correntes (SIDRA 1846), cálculo próprio.
- **Desocupação**: a PNAD Contínua só existe desde 2012, então não há comparação com FHC e Lula I/II na mesma metodologia. A média anual usa os 4 trimestres (SIDRA 4099).
- **Resultado primário e nominal**: sinal positivo = déficit. Juros nominais = nominal − primário.
- **Insegurança alimentar (Banco Mundial/FAO)**: médias móveis de 3 anos. A data parece ser o ano final do triênio (a série chega a 2,5% em 2024 e o relatório SOFI 2025 aponta o Brasil fora do Mapa da Fome em 2022–24). Isso é inferência; conferir no SOFI.

## Incertezas
- `endividamento_renda` (SGS 29037): o código foi identificado pelo valor (≈49,8% da renda) e pela definição de endividamento do BCB; a página oficial da série não pôde ser aberta. Confirmar em dadosabertos.bcb.gov.br.
- `comprometimento_renda` (SGS 29034): confirmado pelo BCB (com ajuste sazonal).
- A dívida bruta de dez/2022 é 71,68% na série atual do BCB; outras publicações citam 72,9% e 73,5% por causa de revisões.

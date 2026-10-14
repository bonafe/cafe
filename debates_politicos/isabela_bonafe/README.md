# Café com política

Site estático (HTML/CSS/JS, sem build) criado a partir de uma conversa de WhatsApp sobre o 2º turno de 2026 (Lula × Flávio).

## Páginas (`site/`)
- `index.html`: visão geral, status dos tópicos, linha da conversa.
- `topicos.html`: as 15 fichas (`#N` abre o tópico).
- `graficos.html`: séries oficiais interativas (BCB, IBGE, Banco Mundial/FAO) e resumo por governo.
- `verificacao.html`: as 42 afirmações com veredito, nota e fontes.
- `matriz.html`: matriz de decisão com pesos e notas editáveis por pessoa.
- `glossario.html`: termos.

## Dados (`data/`) e como regenerar
- `topicos.json`, `matriz.json`: fichas e matriz, escritas à mão (fonte da verdade).
- `series/*.json`: baixadas das APIs oficiais por `scripts/baixar_series.py` (convenções em `series/_notas.md`).
- `series_manuais.json`: três séries de fome que vêm de reportagens (marcadas como não conferidas na fonte).
- `mensagens.json` e o `.txt` original contêm a conversa inteira. **Não publicar.**

```bash
python3 -I scripts/baixar_series.py       # atualiza as séries (precisa de internet)
python3 -I scripts/gerar_dados_site.py    # gera site/data/dados.js e site/data/series.js
cd site && python3 -m http.server 8000    # abrir http://localhost:8000
```

## Publicação
Publique **somente** a pasta `site/`. As páginas têm `noindex`, mas link não listado continua acessível a quem tiver o endereço.
O texto bruto da conversa não vai para o site; só as fichas escritas à mão (inclusive as citações curtas em `topicos.json`).

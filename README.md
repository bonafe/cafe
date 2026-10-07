# bonafe.cafe

A sala de café virtual do Bonafé: um feed vertical de vídeos, imagens e links (estilo Shorts/Reels), feito para o celular. No desktop vira uma landing page com o mesmo feed numa coluna 9:16.

Feito com [UltimaJS](../ultima) (web components reativos em JavaScript puro, sem build).

## Rodar

```
./serve.sh        # imprime os endereços da rede local; abra um deles no celular
```

Use `serve.sh` e não `python -m http.server`: o iPhone só toca vídeo se o servidor aceitar requisições `Range`.

## Conteúdo

Tudo vem de `feed.json`. Cada item tem `id`, `type` (`video`, `image` ou `link`), `title`, `text` e, opcionalmente, `src`, `poster`, `bg`, `cta_label`, `cta_url` e `download_name`. O endereço `bonafe.cafe/#/<id>` abre direto no item.

Vídeos: H.264 + AAC, vertical 720p, 2 a 4 MB, `ffmpeg ... -movflags +faststart`.

## Estrutura

- `components/cafe-feed.*`: scroll-snap, item ativo, `#/id`, teclado
- `components/cafe-item.*`: um slide (vídeo só carrega quando está a no máximo um item de distância)
- `vendor/ultima/`: cópia do núcleo do ultima (ver o README dela)
- `media/`: vídeos de exemplo

Deploy: GitHub Pages, com o `CNAME` já apontando para `bonafe.cafe`.

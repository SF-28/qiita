---
title: LivebookでKino.DataTableが表示されない
tags:
  - Elixir
  - Docker
  - Livebook
  - Kino
private: false
updated_at: '2023-07-14T18:12:49+09:00'
id: caa6bcfc001b0cef536d
organization_url_name: oec
slide: false
ignorePublish: false
---
# 現象

- docker-composeで動かしているLivebook上で、Kino.DataTableが表示されない
- Mix.installは成功している
- その他の処理も実行できる

# 解決策

8081ポートを繋げる

```yaml:compose.yaml
---

version: "3.2"

services:
  livebook:
    build: .
    container_name: livebook
    ports:
      - "8080:8080"
      - "8081:8081" # これがないとエラーになる
    environment:
      - LIVEBOOK_HOME=/data
    volumes:
      - ./data:/data
```

# 原因

デバッグツールで通信を確認
→ `http://localhost:8081/iframe/v4.html`へのアクセスがエラーになっていた

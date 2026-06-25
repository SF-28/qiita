---
title: UbuntuコンテナでEXLAが動かない
tags:
  - Ubuntu
  - Elixir
  - Docker
  - nx
  - EXLA
private: false
updated_at: '2023-07-14T18:11:45+09:00'
id: 8b6b84b22bb8d684afbc
organization_url_name: oec
slide: false
ignorePublish: false
---
# 本記事について

UbuntuコンテナでEXLAを動かそうとしたら依存関係で詰まったので、備忘録として残しておく

# 環境

- macOS Ventura 13.2.1
- Rancher Desktop 1.7.0
- Ubuntu 22.04.1 LTS (Jammy Jellyfish)
- Erlang 25.2.3
- Elixir 1.14.3
- Nx 0.5.1
- EXLA 0.5.1

# 解決方法

```dockerfile:Dockerfile
FROM hexpm/elixir:1.14.3-erlang-25.2.3-ubuntu-jammy-20221130

# For EXLA (xla)
RUN apt-get upgrade -y \
  && apt-get update \
  && apt-get install --no-install-recommends -y \
  curl \
  build-essential \
  ca-certificates \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*
```

# 遭遇したエラーと対策

```bash
** (RuntimeError) expected either curl or wget to be available in your system, but neither was found
```

→ curl をインストール

```bash
** (RuntimeError) could not find v0.4.4 release under https://github.com/elixir-nx/xla/releases
```

→ ca-certificates をインストール ( HTTPS接続に対応させるため )

```bash
** (Mix) "make" not found in the path. If you have set the MAKE environment variable,
please make sure it is correct.
```

→ build-essential をインストール

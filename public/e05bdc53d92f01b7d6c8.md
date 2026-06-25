---
title: Elixir 挑戦記 - 衛星データからNDVI算出
tags:
  - Elixir
  - Phoenix
  - 衛星画像
  - Tellus
  - LiveView
private: false
updated_at: '2023-07-14T18:11:25+09:00'
id: e05bdc53d92f01b7d6c8
organization_url_name: oec
slide: false
ignorePublish: false
---
# Elixir 挑戦記

- 統合的アプローチによる学習
- とりあえず手を動かしてみるシリーズ
- 調べたり取り組んだりした内容をひたすら書いていく
- あとで整理してまとめたい

# やりたいこと

## 衛星データからNDVIを算出

### mixプロジェクトの作成

https://qiita.com/nishiuchikazuma/items/be911dd1d202c1227d19

https://elixir-lang.jp/getting-started/mix-otp/introduction-to-mix.html

https://elixirschool.com/en/lessons/basics/mix

### kmlの読み込み

https://github.com/socrata/exkml

### Tellus APIからのデータ取得~NDVI算出

https://qiita.com/RyoWakabayashi/items/c87fe1256bcd105d370c

Livebook -> exs へのエクスポートで適宜module化していきたい

## Phoenix + LiveViewで可視化

https://qiita.com/piacerex/items/6714e1440e3f25fb46a1

NDVIはjsonに吐き出して参照するなどして、プロジェクトをわけてもいいかも
## 開発環境構築

### dockerで構築

とりあえず必要そうなものは入れてしまう？

https://github.com/RyoWakabayashi/elixir-learning/blob/main/Dockerfile

Elixir自体やライブラリのインストールについて学ぶため、ubuntuで試してみるのもありか?

### リモートサーバの開発用コンテナで作業する

以下でお手軽接続

- VSCode
    - Remote Explorer
    - Dev Containers

### なるべく軽量化したい（後から)

以下が参考になりそう

https://zenn.dev/gr8distance/articles/f5590c87bbdd14

### デプロイも試してみたい

- [fly.io](https://fly.io/)
- [Gigalixir](https://www.gigalixir.com/)

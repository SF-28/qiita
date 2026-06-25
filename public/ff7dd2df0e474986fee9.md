---
title: pre-commit + commitizen + commitlint で快適なコミットを実現する
tags:
  - commit
  - githooks
  - pre-commit
  - commitlint
  - commitizen
private: false
updated_at: '2025-05-19T10:42:12+09:00'
id: ff7dd2df0e474986fee9
organization_url_name: oec
slide: false
ignorePublish: false
---
# コミットのイメージ

![usage_example.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/c6b41bfc-8d2c-1bc3-110b-6f6fb19108ce.gif)

- コミット前に静的解析やフォーマッター、セキュリティチェックが自動で走る
- コミットメッセージを対話的に作成できる(もし所定の形式に沿わない場合、エラーとして弾く)

→ あまり意識しなくとも、品質を高めつつ、コミットメッセージを統一できる
→ ただし、あくまでローカルでのチェックになるので、リポジトリ側でのチェックは別で必要

# サンプルリポジトリ

https://github.com/SF-28/git_hooks_sample/tree/for_qiita

# 利用ツールについて

## [pre-commit](https://pre-commit.com/)

- `.pre-commit-config.yaml`で各種hooksを一元管理できる
- 静的解析やフォーマッタ、セキュリティ検査などをコミット前に自動実行

## [commitizen](https://github.com/commitizen/cz-cli) + [cz-customizable](https://github.com/leoforfree/cz-customizable#steps)

- コミットメッセージを対話的に作成できる
- `.cz_config.js` で設定することで、テンプレートは変更可能

## [commitlint](https://commitlint.js.org/#/) + [commitlint-config-gitmoji](https://github.com/arvinxx/gitmoji-commit-workflow/tree/master/packages/commitlint-config)

- `commitlint.config.js`でコミットメッセージのフォーマットを指定
- 上記フォーマットに当てはまらなければ、エラーとしてコミットを止めてくれる
- 絵文字を使いたかったので[gitmoji](https://gitmoji.dev/)を選択

# 環境構築

## pre-commit

### インストール

以下を参考に、`pre-commit`コマンドが使えるようにする

https://pre-commit.com/#install

- `asdf`が使える場合は、そちらでも可
- `pip`が使えない場合は、Pythonのインストールからやってみること

### 設定

- 以下を参考にhooksを設定

https://pre-commit.com/#plugins

- [Supported hooks](https://pre-commit.com/hooks.html) が参考になる
  - 各hooksの設定はそれぞれの紹介ページを参照


## Node.js

### インストール

以下から Node.js をインストールし、`npm`コマンドが使えるようにする

https://nodejs.org/ja/download

`yarn`を使いたい場合は入れておく

```sh
npm install -g yarn
```

## commitizen、cz-customizable

### インストール

```sh
npm install --save-dev commitizen cz-customizable

or

yarn add -D commitizen cz-customizable
```

### 設定

対話形式で組み立てるメッセージのテンプレートを設定する

- package.json で coonfig設定

```json:package.json
...
  "config": {
    "commitizen": {
      "path": "node_modules/cz-customizable"
    },
    "cz-customizable": {
      "config": "./.cz_config.js"
    }
  },
...
```

- `.cz_config.js`を作成して編集する
    - [公式サンプル](https://github.com/leoforfree/cz-customizable/blob/master/cz-config-EXAMPLE.js)
    - [絵文字対応のサンプル](https://github.com/SF-28/git_hooks_sample/blob/main/.cz_config.js)

## commit-lint, commitlint-config-gitmoji

### インストール

```sh
npm install --save-dev @commitlint/cli commitlint-config-gitmoji

or

yarn add -D @commitlint/cli commitlint-config-gitmoji
```

### 設定

- `commitlint.config.js`を作成して設定
    - [絵文字対応のサンプル](https://github.com/SF-28/git_hooks_sample/blob/main/commitlint.config.js)

## commitlint を git_hooksに追加

- `commit-msg`ファイルを作成

```text:./git_hooks/commit-msg
#!/bin/sh
npx --no-install commitlint --edit "$1"
```

- package.json で scripts設定
    - リポジトリをクローンしたとき、個別設定が不要なように`prepare`で定義
    - ついでにコミットのためのコマンドも設定

```json:package.json
...
  "scripts": {
    "prepare": "bash -c \"cp ./git_hooks/commit-msg ./.git/hooks/\"",
    "commit": "pre-commit run && npx cz"
  },
...
```

```json:Windowsの場合
・・・
    "prepare": "cmd /c \"COPY .\\git_hooks\\commit-msg .\\.git\\hooks\\\"",
・・・
```

- git_hooksに追加

```sh
npm install

or

yarn install
```

# いざコミット

pre-commit → commitizen の順に実施したいため、コマンドでコミットする
(pre-commitが後になると、エラーが出た場合に折角コミットメッセージ組み立てたのにやり直し、となってしまうため)

```sh
npm run commit

or

yarn commit
```

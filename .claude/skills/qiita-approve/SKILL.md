---
name: qiita-approve
description: Qiita 記事の社内承認申請に必要な情報を出力するスキル。「承認に出したい」「ワークフロー申請」「承認申請」「公開申請」などで使用する。記事が push 済みで Qiita に反映されている必要がある。
---

# Qiita 承認準備

限定共有で公開済みの記事について、社内ワークフローでの承認申請に必要な情報を出力する。

## 事前同期（CI 反映の確認と最新化）

承認準備を始める前に、push 済みの記事が CI で Qiita にアップロードされたかを確認し、済みならローカルを最新化する。CI は公開時に frontmatter（`id`、`updated_at`）を `Updated by qiita-cli` コミットで書き戻すため、これを取り込んでから処理する。

1. アップロードを確認する
   - `gh run list --workflow=publish.yml --limit 3` で直近の Publish articles が成功しているか確認する
   - または `git fetch origin` 後、`git log origin/main` に push 以降の `Updated by qiita-cli` コミットがあるか確認する
2. アップロード済みなら最新化する
   - 未コミットの変更があれば `git stash` で退避する
   - `git pull --rebase` で origin の `Updated by qiita-cli`（`id`、`updated_at`）を取り込む
   - Qiita の Web 編集も反映する場合は `pnpm pull -- --force`。plain な `pnpm pull` はローカルで変更済みの記事をスキップするため `--force` が要る（限定共有記事は `qiita.config.json` の `includePrivate: true` が前提）
   - 退避した変更は `git stash pop` で戻す
3. まだアップロードされていない場合は、CI の完了を待つようユーザーに案内し、ここで止める

## 前提確認

対象記事の frontmatter で `id` が `null` でないことを確認する。

- `id` が `null` → 記事がまだ Qiita に反映されていない。push + CI 反映を先に行うよう案内する
- `id` が値を持つ → 承認準備に進む

## 手順

1. 対象記事を特定する（ユーザーに聞くか、直近の git diff から推定する）
2. frontmatter から `title` と `id` を取得する
3. 記事本文を読み、2-3 行で概要を作成する
4. 以下のフォーマットで出力する:

```
## 承認申請情報

以下を社内ワークフローに入力してください。
https://oec.cybozu.com/g/workflow/send_form.csp?cid=33&fid=150

| 項目 | 内容 |
|---|---|
| 標題 | <title から取得> |
| 記事概要 | <記事内容から 2-3 行で要約> |
| 記事URL | https://qiita.com/SF-28/private/<id> |
```

概要は記事の主張と対象読者が伝わるように書く。社内の非技術者が読んでも何についての記事かわかる粒度にする。

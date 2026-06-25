# CLAUDE.md

Qiita 記事管理リポジトリ。Qiita CLI で記事を Markdown 管理し、GitHub Actions で自動公開する。

## 構成

```
public/          記事ファイル (.md)
scripts/new.sh   記事作成ラッパー (private: true デフォルト)
```

## 記事管理

- 新規作成: `pnpm new <basename>` → `public/<basename>.md` が `private: true` で生成される
- プレビュー: `pnpm preview`
- 同期: `pnpm pull` (Qiita → ローカル)
- 公開: main への push で GitHub Actions が自動実行

## 記事ファイルの規約

- ファイル名は記事内容を表す kebab-case (例: `elixir-s3-upload.md`)
- Qiita との紐付けは frontmatter の `id` フィールドで行われる。ファイル名は自由
- 新規記事は `private: true` (限定共有) で作成し、公開時に手動で `false` に変更する
- `ignorePublish: true` にすると CI での公開対象から除外される

## Verification

```bash
./harness/init.sh
```

## Startup

1. `./harness/init.sh` で環境確認
2. `harness/feature_list.json` で作業状態を確認

## Working Rules

- 記事の内容を勝手に変更しない。指示された記事のみ編集する
- push は必ずユーザー承認を得る（push で即公開されるため）
- 機密情報・個人情報を記事に含めない
- Out-of-scope な発見は `harness/deferred.md` に記録する

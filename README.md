# qiita

[Qiita CLI](https://github.com/increments/qiita-cli) による記事管理リポジトリ。

main ブランチへの push で GitHub Actions が自動的に Qiita へ記事を公開・更新する。

## セットアップ

```bash
pnpm install
pnpm exec qiita login
```

## 使い方

| コマンド | 説明 |
|---|---|
| `pnpm new <basename>` | 新規記事を作成（限定共有で作成される） |
| `pnpm preview` | ローカルプレビューを起動 |
| `pnpm pull` | Qiita から記事を同期 |

## 記事ファイルの規約

- 配置: `public/` ディレクトリ
- ファイル名: `YYYY-MM-DD_タイトル.md`（日付は `updated_at`）
- 新規記事は `private: true`（限定共有）で作成される。公開する場合は `private: false` に変更して push する
- `ignorePublish: true` にすると CI の公開対象から除外される

## 公開フロー

```
記事を編集 → commit → push to main → GitHub Actions が Qiita に反映
```

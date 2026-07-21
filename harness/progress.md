# Session Progress Log

## Current State

**Last Updated:** 2026-07-21
**Active Feature:** 記事作成（qiita-create スキル実行）

## Status

### What's Done

- [x] リポジトリ初期セットアップ (feat-001)
- [x] navi 記録から Qiita 記事ネタを棚卸しし、記事候補 5 件を seed 化
  - s-56 worktree ワークフロー / s-57 sandbox・permission 摩擦最適化 / s-58 LLM-as-judge 評価
  - s-59 AWS 研修環境の Terraform 管理 / s-60 ALB の SLR 事前作成
  - s-52（Claude で PowerPoint）は t-231 を作成して done、promote 済み
- [x] qiita-create スキルで新規記事作成（s-56 起点）:
  `public/2026-07-21_git-worktree-の依存と-envの欠落を-symlinkで解決する.md`
  - タイトル: 「git worktree で node_modules や .env が毎回消える問題を symlink で解決する」
  - dotfiles の setup-worktree / merge-worktree スキル作成の実体験ベース
  - stop-ai-slop-jp 適用、セルフレビュー 41/50、命題型 H2・禁止記号なしを確認
  - ステータス: private: true（限定共有）
  - 追記修正: `.worktreeinclude`（非 native の誤記）を削除、ユーザーグローバル設定
    （~/.claude/skills + ~/.claude/CLAUDE.md）節を追加
  - 追記修正: 「数百 MB 再インストール」の誇張を訂正。pnpm store（~/Library/pnpm/store）/
    uv cache（~/.cache/uv）で再DL不要なことを踏まえ、動機を .env 欠落・install ステップ省略・
    サンドボックス下の store fallback 再DL に再構成
  - レビュー修正（実機検証）: 「bare/submodule でも git-dir≠git-common」は誤り（実測は両方一致）→
    正しい記述に置換。store パスを OS 依存として一般化
  - 改善 A/B/C 反映: 理由節を統合、「スキルの限界」を独立 H2 化、「リンクしたあとの検証」節を追加

### What's Done（追記 2026-07-21）

- [x] s-56 記事を push 済み（`6961c9f` docs / `0352c03` chore、CI で限定共有反映）
  - navi: s-56 → t-235（done）promote、log l-819 記録

### What's In Progress

- [ ] **要ユーザー判断**: `public/2026-06-29_slide-md…ai に作らせる.md` がワークツリーで削除されている
  - 私の操作ではなく原因不明。HEAD には残存、コミット/push には含めていない（未ステージのまま）
  - 選択肢: 復元（`git checkout -- <file>`・安全側・推奨） / 削除を確定コミット / 保留

### What's Next

1. SLIDE.md 削除の扱いを決める（上記）
2. 必要に応じて `/qiita-approve` → `/qiita-publish` で一般公開
3. 残りの記事ネタ seed（s-57〜s-60）から次の記事を執筆
4. dotfiles 側スクリプトの誤り2件（deferred 記録済み）を別セッションで修正

## Notes for Next Session

- pre-commit の初回 fetch は sandbox 無効化が必要（actionlint の clone）
- push 時も sandbox 無効化が必要な場合がある（.git/config への書き込み）
- QIITA_TOKEN シークレットは設定済み（GitHub Actions 成功確認済み）

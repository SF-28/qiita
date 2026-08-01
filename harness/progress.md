# Session Progress Log

## Current State

**Last Updated:** 2026-07-31
**Active Feature:** ツールチェーン整備（mise 導入 + qiita-cli バージョンアップ）

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

### What's Done（追記 2026-07-22）

- [x] s-56 記事を push 済み（CI で限定共有反映、`id: c98c7f3e843d7a3186da` 取得）
  - navi: s-56 → t-235（done）promote、log l-819 / l-820
- [x] `/qiita-approve` 実行: id を同期し承認申請情報を出力（社内ワークフロー入力待ち）
- [x] 原因不明の SLIDE.md ワークツリー削除を安全側で復元（HEAD 一致・working tree clean）

### What's Done（追記 2026-07-31）

- [x] node / pnpm を mise 管理に移行: `mise.toml` を新規作成
      （`node = "24.16.0"` / `"npm:pnpm" = "11.5.3"`）
  - 従来は global `~/.config/mise/config.toml` の node 23.11.1 に暗黙依存していた。
    23 系は EOL の奇数リリースのため、ユーザー判断で LTS の 24.16.0 にピン
  - README のセットアップに `mise install` を追記
- [x] `@qiita/qiita-cli` を `^1.8.0` → `^1.10.0` に更新（lockfile 更新済み）
  - `pnpm outdated` は 1.9.1 と表示したがキャッシュが古く、レジストリ実値は 1.10.0
  - pnpm v11 既定の minimumReleaseAge に引っかかり、pnpm が `pnpm-workspace.yaml` を自動生成して
    `minimumReleaseAgeExclude: ['@qiita/qiita-cli@1.10.0']` を記録。再現性のためコミット対象に含める
  - CI は `increments/qiita-cli/actions/publish@v1` を使うため、この更新は公開パイプラインに影響しない
- [x] 検証: `mise x -- node -v` → v24.16.0 / `pnpm -v` → 11.5.3 /
      `pnpm exec qiita version` → 1.10.0 / `./harness/init.sh` → Verification Complete
- [x] コマンドを mise task に統一（`package.json` の scripts は全削除）
  - `mise.toml` の `[tasks]` に install / login / new / preview / pull / publish を定義
  - 副次効果: 旧 `"publish"` script は `pnpm publish`（レジストリ公開の組み込みコマンド）に
    シャドウされて呼べなかったが、task 化で名前衝突が解消
  - 追随更新: README / CLAUDE.md / `scripts/new.sh` の usage / `harness/init.sh`（`mise run install`）/
    `harness/feature_list.json` の acceptance / `.claude/skills/qiita-create` / `.claude/skills/qiita-approve`
  - `scripts/new.sh` の `npx qiita` を `pnpm exec qiita` に統一
  - 検証: `mise tasks` で 6 タスク表示、`mise run --dry-run new sample` →
    `bash scripts/new.sh sample`、`mise run --dry-run pull -- --force` →
    `pnpm exec qiita pull --force`、`./harness/init.sh` → Verification Complete

- [x] 粒度別に 3 コミット（いずれも未 push）
  - `4c37756` chore: node/pnpm を mise 管理に移行し qiita-cli を 1.10.0 に更新
  - `023b8ef` chore: 記事管理コマンドを mise task に統一
  - `1b80bdd` chore: qiita pull で記事の frontmatter を同期（40 記事・+80 行）
- [x] `mise run pull` 実行後、`public/` の差分は 40 記事への
  `posting_campaign_uuid` / `agreed_posting_campaign_term` 追加のみ（本文変更なし）と確認して同期をコミット
- [x] `.pre-commit-config.yaml` の `check-yaml` に `--allow-multiple-documents` を追加
  - pnpm-lock.yaml は「供給網検証セクション + lockfile 本体」の複数ドキュメント構成。
    pre-commit は変更ファイルのみ検査するため、lockfile を触るまで顕在化していなかった
- [x] navi: t-284 を作成して in_progress、log l-1089 / l-1090 を紐付け
- [x] `e0e29c7` docs: 記事「Graph Engineeringから考える、Agentシステム設計で大切なこと」を追加
  - 空だった tags に AI / LLM / AIエージェント / LangGraph / 設計 を設定（Qiita 上限の 5 個）
  - `private: true` のまま。`organization_url_name` は承認後 `/qiita-publish` で設定する
  - `updated_at` / `id` は空のまま（push 後に CI が `Updated by qiita-cli` で書き戻す）
  - 検証: frontmatter を YAML パースして 10 キーと tags 5 件を確認
  - commitlint の `subject-case` が件名冒頭の英大文字を弾くため、件名を日本語始まりにした
- [x] `483784c` ファイル名を規約準拠にリネーム
  （`2026-07-31_graph-engineeringから考える-agentシステム設計で大切なこと.md`）
- [x] `0e466ea` ファクトチェックを実施し結果を反映
  - 出典 10 件を一次ソースで検証。**事実誤認なし**（年月・論文タイトル・引用内容すべて一致）
  - 検証済み: LangChain の Graph Engineering 記事(2026-07-22) / Awesome Graph Engineering の
    3 条件 / ReAct(2022-10) / AutoGen(2023-08) / DyLAN(2023-10, T-FFN と early stopping) /
    LangGraph 公開(2024-01-17) / GPTSwarm(ICML 2024, edge 最適化は REINFORCE) /
    Workflow Optimization サーベイ(arXiv 2603.22386, 2026-03-23) /
    MAST(arXiv 2503.13657, 3 分類が原文と一致) / Anthropic Multi-Agent(2025-06-13, 約 15 倍)
  - 修正 5 点: utm_source=chatgpt.com を 6 件除去 / Deep Research 事例の主語を GPT Researcher に
    明示 / トークン消費を「約 15 倍」へ具体化 / 参考リンク [5] を正式タイトルへ /
    LangGraph 記事に無い「状態に応じて Prompt を変える」を「出力形式を固定する」へ差し替え

### What's Done（追記 2026-07-31 夕方）

- [x] s-56 記事（`c98c7f3e843d7a3186da`）は **7/23 に承認・一般公開済み**だったと判明
  （`private: false` / `organization_url_name: oec`）。前回の「承認申請の入力が未完了」は誤りだった
- [x] `4f3323c` CI 失敗（run `30608185473` / `30609019747`）を解消
  - 真因: 上記の公開状態がローカル未反映で、publish が「Qiita 上の記事より古い」と判定して exit 1。
    `qiita publish --all` は 1 件でも Qiita 側が新しいと**全体を中断**するため、新規記事も作成されなかった
  - `mise run pull -- --force` で同期。差分は frontmatter 3 行のみ、本文の変更なし
  - `qiita.com` はサンドボックスの DNS 制限で弾かれるため、pull は sandbox 無効化が必要

### What's Done（追記 2026-08-01）

- [x] Graph Engineering 記事の**出典の位置づけと主張の強度**を調整（ユーザー指摘 6 点、未コミット）
  - `Awesome Graph Engineering` を「コミュニティ資料」→「個人が公開したキュレーション資料」に修正。
    分野の合意ではなくキュレーターの作業定義である旨を明記
  - LangChain を「LangGraph の開発元」と明示し、両者を同格の定義主体に見せない構成へ
  - 「定義もまだ固まっていない」→「今回確認した資料の範囲では、指す対象もまだ一定していない」に限定
  - 記事独自の定義の直後に「業界標準ではなく本記事の作業定義」と注記
  - 参考リンクを**種別（査読論文 / プレプリント / 企業公式ブログ / 個人キュレーション）付きの表**に変更
  - 査読版がある 4 件を正式版へ差し替え（arXiv は併記）。本文の出典マーカーも `[arXiv]` から
    発表先表記へ変更
    - ReAct → ICLR 2023 (openreview `WE_vluYUL-X`)
    - AutoGen → COLM 2024 (Microsoft Research 出版ページ)
    - GPTSwarm → ICML 2024 (PMLR v235 `zhuge24a`)
    - MAST → NeurIPS 2025 Datasets and Benchmarks Track (proceedings.neurips.cc)
  - DyLAN は COLM 2024 採択の可能性があるが一次ソースで確認できず、arXiv／プレプリント表記のまま

- [x] CI 失敗（run `30692957123`）を解消
  - 真因: Qiita 上の記事が **8/1 11:58 に Web 側で更新**されており、ローカルの
    `updated_at`（7/31 15:45）が古いと判定された
  - リモート本文を scratch ディレクトリへ `qiita pull --root <scratch>` して非破壊で比較
    （実リポジトリは触らない。`--force` を実リポジトリへ当てるのは危険）
  - リモート独自の編集は 6 箇所。うち 5 箇所はローカル版が実質カバー済み
    （`通常プログラム` → `コードで規定する処理` への言い換えを含む）。
    残る 1 箇所（Schema検証〜条件判定の散文化）はローカルの箇条書きを採用する方針で
    **ユーザー判断によりローカル優先で上書き**
  - `updated_at` をリモート値（`2026-08-01T11:58:19+09:00`）へ合わせて再 push

### What's In Progress

- 未 push（5 コミット + 上記の未コミット変更）。push は即公開に繋がるためユーザー承認待ち

### What's Next

0. `4f3323c` を push して CI を復旧させる。成功すれば新規記事が**限定共有**で Qiita に作成される
   （`id` の書き戻しコミットが origin/main に載る）
1. push 後に `/qiita-approve` で承認申請情報を出力し、社内ワークフローへ入力
2. 承認後に `/qiita-publish` で Organization 紐づけ・一般公開
4. 残りの記事ネタ seed（s-57〜s-60）から次の記事を執筆
5. dotfiles 側スクリプトの誤り2件（deferred 記録済み）を別セッションで修正

## Notes for Next Session

- pre-commit の初回 fetch は sandbox 無効化が必要（actionlint の clone）
- push 時も sandbox 無効化が必要な場合がある（.git/config への書き込み）
- QIITA_TOKEN シークレットは設定済み（GitHub Actions 成功確認済み）

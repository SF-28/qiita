# Session Progress Log

## Current State

**Last Updated:** 2026-10-22
**Active Feature:** `qiita-create` スキルへの説明設計レイヤー統合

## Status

### What's Done

- [x] リポジトリ初期セットアップ (feat-001)
- [x] pnpm を `npm:pnpm` から mise コア pnpm へ統一 (feat-003): packageManager を pnpm@12.8.2 にし、
  mise.toml に `idiomatic_version_file_enable_tools = ["pnpm"]` を設定。pnpm-lock.yaml は
  pnpm 12 の `packageManagerDependencies` 文書が先頭に追加された (v9.0 形式のまま)
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

- [x] Graph Engineering 記事の Mermaid 図を多段構成へ差し替え（`690257b` / push 済み、
  `29f1613` で qiita-cli が書き戻し）
  - 分類ノードを廃止し `コード → Agent → コード → …` の多段構成へ。再試行の戻り先を
    粒度別に 2 系統（検証失敗 → 草案 / レビュー指摘 → 計画）に分離

- [x] `qiita-create` スキルへ「説明設計」レイヤーを統合（**未コミット**）
  - 入力: `記事執筆スキルメモ.md`（Zenn の解説記事を ChatGPT が分析した 15 項目の型 +
    標準テンプレート + レビューチェックリスト）。統合完了後、ユーザー指示により削除
  - 背景: 既存 SKILL.md は文体レイヤー（AI っぽさ排除・ですます調・主語「私」）が中心で、
    「読者の理解モデルをどう作るか」の説明設計レイヤーが空白だった
  - ユーザー決定（3 論点すべて推奨案を採用）:
    1. 適用範囲 → 記事タイプで出し分け。普遍原則（11 項目）は全記事、
       「新概念A/B」テンプレートは概念解説型のみ
    2. ファイル構成 → `SKILL.md`(211 行) + `references/explaining.md`(229 行, 新規)
    3. 冒頭・末尾の衝突 → 見出し名の禁止だけ維持。全体地図と因果の再構築は
       内容のある見出しで置く
  - 追加の制約（ユーザー指示）: **既存記事には一切手を入れない**。検証は読み取り専用
  - 変更箇所: Step 1（表に「読者の現在地」「断絶」2 行 + 記事タイプ判定 4 分類）/
    Step 2（軸を 3〜5 個・冒頭末尾の役割 + 衝突の解消文と見出し例）/
    Step 4（新セクション「説明の組み立て」8 項目）/ Step 5（新チェックリスト「説明設計」9 項目）
  - 検証: 読み取り専用ドライランを 2 記事で実施
    - `2026-06-29_Ragasの評価指標を具体例で理解する.md`（概念解説型）→ 有効な指摘 3 件
      （読者の現在地が暗黙 / `retrieved_contexts` 等を役割説明なしで初出 /
        末尾が `## まとめ` で指標一覧の再掲）
    - `2023-08-29_プライベートサブネットでecs-fargate…つまずきポイント.md`（ハマりどころ型）
      → **過剰判定 4 件を検出し、SKILL.md 側を修正**（専門用語の項目に「読者の現在地に
      照らして未知の」を追加 / 図・単純化・末尾因果の項目を条件付きに変更）。
      修正後の残指摘は 1 件のみ
    - `git status` で `public/` 配下の無変更を確認済み
  - 親セッションで追加修正 1 件: Step 2 の「冒頭は本題から入り」と新項目の字面上の矛盾を、
    解消文に「儀式的な前置きの禁止であって、現在地と断絶の提示は本題の入口」を明記して解消

- [x] 記事タイプ別の出し分けを実装レベルまで具体化（**ユーザー指摘による追補・未コミット**）
  - 指摘: 「体験記型に読者の現在地・断絶・一貫した理解モデル・説明設計は必要か。
    タイプごとに変わるのでは」→ **その通り**。初回実装は「体験記型は説明設計を最小限」と
    書いたまま「最小限」を未定義にしており、チェックリスト 9 項目が全タイプへ一律に当たっていた
  - Step 1: 「冒頭で示すもの / 記事を駆動する軸 / 末尾で閉じるもの」のタイプ別対応表を追加。
    体験記型の冒頭は**読者の現在地ではなく書き手の現在地**（着手時点の状態と動機）
  - Step 4: 「説明の組み立て」8 項目の適用範囲を明示（新しい概念・技術を導入する 3 タイプ向け。
    うち専門用語・抽象と具体・図・単純化・トレードオフの 5 項目は体験記型にも効く）。
    新セクション「体験記型で効くこと」5 項目を追加（時系列と判断理由 / 失敗と遠回りを削らない /
    数字 / 再現条件 / 一般論に逃げない）
  - Step 5: チェックリストを「全タイプ共通」6 項目 + 「タイプ別」（3 タイプ向け 4 項目 /
    体験記型 7 項目）へ再編
  - 検証: 読み取り専用ドライラン 2 記事（SAP-C02 合格体験記 / Amazon Q CLI でテトリス）
    - 過剰判定の指摘 3 件は**根拠が弱いと判断して却下**（「抽象説明の連続禁止は体験記の
      前提説明節には過剰」等。抽象が続くと読者が離れる理由は体験記にも等しく効く）
    - 不足の指摘 2 件を採用: 「冒頭で示した動機・目的が末尾で回収されているか」を新規追加
      （テトリス記事は Tシャツ応募の動機を冒頭で提示しながら結果に触れず終わる）、
      「着手前に何をどこまで知っていたか」を再現条件の項目へ統合
  - SKILL.md は 250 行。`references/explaining.md` の markdownlint MD060 も修正

- [x] 記事タイプごとに参照ファイルを分割（**ユーザー提案による再編・未コミット**）
  - 提案: 「記事の種類によって参照する情報を変える(explaining.md みたいにファイルを分ける)のは
    どう？」→ 採用。ただし Step 4「説明の組み立て」8 項目は 3 タイプで共有するため
    SKILL.md 側に残す（タイプ別ファイルへ落とすと 3 重複するか、どこにも書かれなくなる）
  - 構成: `SKILL.md`(225 行) + `references/` 配下 4 ファイル
    - `concept.md`(248 行, 旧 explaining.md をリネーム) 概念解説型
    - `troubleshooting.md`(88 行, 新規) ハマりどころ型
    - `howto.md`(92 行, 新規) 手順型
    - `experience.md`(50 行, 新規) 体験記型
  - 4 ファイルとも「いつ読むか → 記事の骨格 → 固有の書き方 → セルフレビュー項目」で節構成を統一
  - Step 1 でタイプ判定 → 該当ファイル 1 つだけを読んでから Step 2 へ進む（参照漏れ防止のため
    表 + 「必ず読む」を明記）
  - **`troubleshooting.md` / `howto.md` は元メモに無い新規コンテンツ**。想像で書かず、
    該当タイプの既存記事 8 本（ECS Fargate / AFT OU / pyenv / exla、mkdocs / pnpm 移行 /
    pre-commit / devcontainer）から原則を導出。うまくいっている点だけでなく
    **欠落からも導出**（例: 「バージョンを固定する」「失敗したときの戻し方」は 4 記事すべてで
    欠けていたため原則化）。既存記事は読み取りのみ、無変更
  - 親セッションで追加修正 1 件: Step 2 が全タイプ共通節なのに「冒頭の節に読者の現在地 → 断絶
    → この記事で分かることを置き」と概念解説型の語彙で固定されていた。Step 1 のタイプ別表を
    参照する形へ変更し、見出し例もハマりどころ型として整合させた
    （分割の副作用で浮き上がった既存の不整合）

- [x] SKILL.md をコントロールプレーン化（**ユーザー指摘による再編・未コミット**）
  - 指摘: 「まだまだ SKILL.md が厚すぎる」。実行フロー / 執筆の知識・原則 / 品質チェックリスト
    の 3 種類が混在し、同じ判断基準が複数箇所に重複している
  - 採用した診断: SKILL.md は記事執筆マニュアルではなく「記事作成を制御するコントロールプレーン」。
    残すのは実行フローと参照先の振り分けのみ
  - **SKILL.md: 225 → 91 行**。7 セクション構成（Workflow / 記事の核 / 記事タイプ / 構成 /
    ファイル作成 / 執筆 / レビューと完了）
  - 新規参照ファイル 3 件: `planning.md`(40) / `writing.md`(84) / `review.md`(76)。
    タイプ別 4 ファイルには「必要な入力」節を追加（concept 264 / troubleshooting 103 /
    howto 108 / experience 66）
  - 解消した重複 3 件:
    1. タイプ別の冒頭・駆動軸・締めが Step 1 の表・Step 2・Step 5 とタイプ別ファイルの
       4 箇所に存在 → タイプ別ファイルのみに集約
    2. Step 4「説明の組み立て」8 項目と Step 5「説明設計」6 項目が同内容の言い換え
       → 規則は `writing.md`、点検は `review.md`（症状 → 修正方法）へ分離
    3. Step 5「stop-ai-slop-jp チェック」6 項目は別スキルの再掲 → 削除し適用指示 1 行のみ
  - `writing.md` は規則を **必須 / 原則 / 推奨** の 3 段階に分けた（従来は全部同じ強さで
    重要度が判別できなかった）
  - `review.md` はチェックリストではなく「症状 → 修正方法」形式。採点ではなく修正処理にした
  - ゲート緩和 2 件: 「すべて埋まるまで執筆に入らない」→「不足時だけ確認」/
    「構成の合意を得てから執筆」→「対話なら確認、完成稿依頼なら仮定を置いて進む」
  - `description` を差し替え。ワークフロー要約と「記事の執筆に少しでも関わるときは必ず使う」
    を削り、トリガ条件と非対象（既存記事の校正・タイトルだけの案出し・一般的な文章相談）を明記
  - **不採用**: 提案にあった `agents/openai.yaml`（このリポジトリに置く理由がなく、
    Claude Code のスキル構成に存在しないディレクトリ。提案元の別文脈の混入と判断）
  - **修正して採用**: `writing.md` / `review.md` の分割。提案は「執筆ガイドとレビューを
    1 ファイルに」と書きながら構成案で 2 分割しており内部矛盾。規則は writing、
    症状と修正は review、と責務を切って重複を回避した
  - `qiita-create` / `qiita-edit` の分離は deferred.md へ記録（2026-08-03 行）

- [x] 核の確定をフォーム記入から対話へ変更（**ユーザー指摘による修正・未コミット**）
  - 指摘: 「いきなり 主張/読者/差分/スコープ/根拠 を入力させるワークフローは重すぎる。
    対話をとおして整理し、共に作成する形に。入り口はテーマを聞くところから」
  - 診断: 核の 5 項目は**ユーザーが最初から答えられるものではない**。テーマを話しながら
    形になる。一括で聞けば「エンジニア全般」「Terraform について」という、
    自分で悪い例として書いていたものが返ってくる
  - **ワークフローの順序も誤っていた**: タイプ判定を核の確定の後に置いていたが逆。
    タイプが決まれば聞くべきことが変わる（ハマりどころ型なら症状と環境、
    体験記型なら着手時の状態）。タイプを先に推定すれば質問を絞れる
  - 新しい順序: テーマを聞く → タイプ推定 → 対話で核を固める → 構成 → ファイル作成 →
    執筆 → レビュー → 完了報告（7 → 8 ステップ）
  - SKILL.md(91 → 104 行): 「テーマ」節を新設。核の節に
    「**この項目名でユーザーに問いを投げない**。項目はこちらの確認用チェックリストであって
    質問票ではない」を明記。「一度に複数ステップを進めない」を追加（「一気に書いて」の
    escape hatch 付き）
  - planning.md(40 → 97 行): 「対話の原則」5 項目と「進め方」4 段階を新設
    - 原則: 一度に 1〜2 問 / 先に仮案を出す / 分かることは聞かない / 項目名で聞かない /
      3 往復で絞れないなら一番強い案を宣言して収束させる
    - 進め方: ①素材から仮案を提示（テンプレート付き）→ ②弱い項目から 1 つずつ
      （項目名を出さない聞き方の表）→ ③まとめて確認 → ④打ち切り判断の表
    - 既存の 5 項目表は「核の判定基準」へ改称し、「この表をそのままユーザーに見せて
      埋めさせない」を明記（こちら側の判定用と位置づけ）

### What's In Progress

- [ ] 上記スキル変更のコミット（**ユーザー承認待ち**）
  - 変更: `.claude/skills/qiita-create/SKILL.md`(M) / `references/` 7 ファイル(新規) /
    `harness/progress.md`(M) / `harness/deferred.md`(M) /
    `記事執筆スキルメモ.md`(削除・未追跡だったため差分に出ない)
  - **未検証（最大のリスク）**: このスキルで実際に記事を書いた検証をしていない。
    再編で参照ファイルが 2 → 5（SKILL.md + planning + タイプ別 + writing + review）に増えたため、
    参照漏れが起きると品質が静かに落ちる。次の記事執筆で、どのファイルが実際に読まれたかを
    確認すること

### What's Next

1. スキル変更をコミット
2. 残りの記事ネタ seed（s-57〜s-60）から次の記事を執筆し、統合したスキルを実地で検証する。
   過剰判定や不足があれば SKILL.md へフィードバック
3. dotfiles 側スクリプトの誤り 2 件（deferred 記録済み）を別セッションで修正

## Notes for Next Session

- pre-commit の初回 fetch は sandbox 無効化が必要（actionlint の clone）
- push 時も sandbox 無効化が必要な場合がある（.git/config への書き込み）
- QIITA_TOKEN シークレットは設定済み（GitHub Actions 成功確認済み）

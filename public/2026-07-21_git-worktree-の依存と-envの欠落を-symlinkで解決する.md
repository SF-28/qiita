---
title: git worktree で node_modules や .env が毎回消える問題を symlink で解決する
tags:
  - Git
  - ClaudeCode
  - worktree
  - symlink
private: true
updated_at: ''
id: null
organization_url_name: null
slide: false
ignorePublish: false
---

Claude Code で機能ごとにブランチを切るとき、私は git worktree を使っています。
作業ツリーが物理的に分かれるので、片方でレビュー中でも、もう片方で別の実装を進められます。

ところが worktree を作って中に入り、いつものように検証しようとすると止まります。

```bash
git worktree add ../feat-login -b feat-login
cd ../feat-login
pnpm test
# → Cannot find module ... : node_modules が無い
```

`node_modules` がありません。
`pnpm install` で作り直せますが、worktree を切るたびに走らせるのは手間です。
Python の `.venv` も同じ。
そしてもっと厄介なのが `.env` で、これが無いと環境変数を読む処理がそもそも動かず、検証自体ができません。

この記事では、この欠落を切り出し元からの symlink で消す方法と、それを Claude Code のスキルにして worktree に入った瞬間に走らせる方法を書きます。
git worktree 自体の使い方や、Claude Code の導入手順は扱いません。

## 追跡済みファイルしか展開しない worktree

なぜ毎回消えるのか。
git worktree が作業ツリーに展開するのは、git が追跡しているファイルだけだからです。

`node_modules` も `.venv` も `.env` も gitignore 済みで、git の管理下にありません。
だから新しい worktree には最初から存在しません。
これは設定ミスではなく、worktree の仕組み上そうなります。

worktree は `.git` の本体（git-common-dir）を切り出し元と共有しつつ、作業ツリーだけを独立して持ちます。
この性質は判定にも使えて、`git rev-parse --git-dir` と `--git-common-dir` が食い違えば linked worktree だと分かります。

```bash
git_dir=$(cd "$(git rev-parse --git-dir)" && pwd -P)
git_common=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)
# 一致 → 通常のチェックアウト / 食い違い → linked worktree
```

このあと出てくるスクリプトは、まずこの判定で「今 worktree の中にいるか」を確かめます。
なお bare リポジトリと submodule では git-dir と git-common-dir が一致するので、この比較だけだと「通常のチェックアウト」と同じ判定になります。
そこはスクリプト側で `--is-bare-repository` と `--show-superproject-working-tree` を使い、別途弾いています。

## 切り出し元からの symlink

切り出し元（main worktree）には、動いている `node_modules` も `.env` も既にあります。
だったら worktree からそこへ symlink を張れば、実体をコピーも再インストールもせずに使い回せます。

```bash
ln -s /path/to/main/node_modules ./node_modules
```

一行で済むように見えます。
実際、一度きりなら手で打てばいい。
ただ複数のリポジトリと worktree で回すと、条件を忘れて事故ります。
追跡対象のディレクトリにうっかりリンクを張る、あるいは古い依存のまま検証して通ったつもりになる。
この 2 つが怖いので、安全条件を機械に判定させます。

## symlink を安全に張る 4 条件

私が使っているスクリプト（`link-artifacts.sh`）は、対象ごとに次の 4 条件を全部満たしたときだけリンクを張ります。

1. 切り出し元に対象が存在する（無ければ後述の origin-missing として扱う）
2. worktree 側に同名が未だ無い（既存の実体は絶対に壊さない）
3. worktree 側で gitignore 済み（追跡対象には張らない）
4. 依存ディレクトリは lockfile が切り出し元と一致する（不一致なら symlink せず通常インストールに委ねる）

4 が要点です。
lockfile が違うのに切り出し元の `node_modules` へリンクすると、古い依存で検証して通ったと誤判定します。
だから lockfile を diff で突き合わせ、違えば skip します。

```bash
# lockfile が一致するときだけ symlink する（抜粋）
for lf in "$@"; do
  if [ -f "$BASE_REPO/$lf" ] || [ -f "$WORKTREE_DIR/$lf" ]; then
    if ! diff -q "$BASE_REPO/$lf" "$WORKTREE_DIR/$lf" >/dev/null 2>&1; then
      report+=("skip $name (lockfile $lf が不一致 → 通常インストール)")
      return 0
    fi
  fi
done
ln -s "$src" "$dst"
```

`node_modules` は `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`、`.venv` は `uv.lock` / `poetry.lock` / `requirements.txt`、というように対象と lockfile を対応づけています。
`.env` 系は lockfile 判定が要らないので、存在と gitignore だけ見て張ります。

## 実装でハマった 2 点

1 つめは `check-ignore` の末尾スラッシュでした。

gitignore の判定に `git check-ignore` を使うのですが、`node_modules/` のように末尾スラッシュ付き（dir-only）で書かれたパターンは、実体が無い worktree では `git check-ignore node_modules` に一致しません。
ディレクトリとして存在しないと、ディレクトリ専用パターンにマッチしないからです。
スラッシュ有り無しの両方で問い合わせて回避しました。

```bash
if ! { git -C "$WORKTREE_DIR" check-ignore -q "$name" \
    || git -C "$WORKTREE_DIR" check-ignore -q "$name/"; }; then
  report+=("skip $name (gitignore 対象外のため symlink しない)")
  return 0
fi
```

これに気づくまで、`node_modules` だけリンクされずスキップされ続けて悩みました。

2 つめは、切り出し元にも依存が無いときの扱いです。

切り出し元でまだ一度も `pnpm install` していないと、リンク元がありません。
ここで worktree 側でインストールすると、worktree を切るたびにインストールが走って、手間を省くという目的が崩れます。
そこでスクリプトは、lockfile はあるのに依存ディレクトリが無い状態を origin-missing として報告し、切り出し元で先に入れてから貼り直すよう促すだけにしています。

```bash
if [ ! -e "$src" ]; then
  for probe in "$@"; do
    if [ -f "$BASE_REPO/$probe" ] || [ -f "$WORKTREE_DIR/$probe" ]; then
      report+=("origin-missing $name (切り出し元で先にインストール → 再実行)")
      return 0
    fi
  done
  return 0   # lockfile も無い = そのエコシステムは未使用
fi
```

## `pnpm install` で十分ではないのか

ここまで読んで、素直に `pnpm install` を打てばいいのでは、と思うかもしれません。
実際、pnpm はグローバルな store（私の macOS では `~/Library/pnpm/store`、Linux なら `~/.local/share/pnpm/store` など）を、uv は `~/.cache/uv` のキャッシュを持ちます。
一度取得したパッケージはそこに残るので、別の worktree で入れ直しても再ダウンロードは基本的に起きません。
store から hardlink を張るだけなので速く、ディスクもほとんど増えません。

それでも symlink する理由は 3 つあります。

まず、install の実行そのものを省けます。
再ダウンロードが無くても、lockfile の解決と node_modules ツリーの生成には時間がかかります。
symlink なら worktree を作った直後にそのまま検証へ進めます。

次に、`.env` は store もキャッシュも助けません。
env は秘密情報なので、リポジトリにも store にも入りません。
切り出し元からリンクする以外に、worktree へ安く持ち込む手段がありません。

そして、エージェントのサンドボックス下では事情が変わります。
Claude Code はコマンドをサンドボックスで実行するので、書き込み許可に含めていない `~/Library/pnpm/store` へは書けません。
すると pnpm は store をカレントの `.pnpm-store` へフォールバックし、そこは空なので再ダウンロードが起きます。
グローバル store を共有できないぶん、切り出し元の `node_modules` を symlink で使い回す利点が大きくなります。

## Claude Code スキルとしての発火

ここまでのスクリプトを、Claude Code の setup-worktree というスキルにまとめました。
狙いは、リポジトリごとに設定を置かずにすませることです。

スキルは `~/.claude/skills/setup-worktree/` に置いています（私は dotfiles から symlink して配っています）。
ユーザーレベルの skills はどのリポジトリからでも見えるので、プロジェクトごとに何かを配置する必要がありません。
そのうえでスキルの description に「worktree で作業を始めるとき」と書いておくと、worktree に入った直後の文脈で Claude が自分で呼び出します。
私が毎回コマンドを思い出す必要はありません。

発火を運用として固定するために、全プロジェクトに効く `~/.claude/CLAUDE.md` に手順そのものを書いています。

```markdown
## Worktree
- 実質的な変更は worktree で行う。次の流れで進める:
  1. worktree + ブランチを新規作成して中へ移動する
  2. setup-worktree スキルで依存と .env を切り出し元から symlink する
  3. worktree 内で作業・検証する
  4. 仕上げは merge-worktree スキル(レビュー → ff-merge → 撤収)
- symlink 自体はコミットに含めない
```

これで新しいリポジトリでも、私が指示しなくても同じ手順を踏みます。
リポジトリ側に置くのは gitignore の設定くらいで、worktree 専用のファイルは要りません。

## リンクしたあとの検証

symlink を張ったら、そのプロジェクトのテストを一度通して確かめます。

```bash
pnpm test
# Python なら uv run pytest、Go なら go test ./... など
```

再インストールを挟まずにここまで来て、テストが通れば worktree は検証可能になっています。
`origin-missing`（切り出し元にも依存が無い）や lockfile 不一致で skip された対象だけ、そこは通常どおりインストールしてから再検証します。

## スキルの限界

スキルには発火条件の限界があります。
スキルはモデルのターンがあって初めて動きます。
`claude --worktree` で最初から worktree を起動したり、並列セッションや subagent の isolation で入ったりすると、そこにモデルの判断が挟まらないので発火しません。
この経路まで塞ぐなら、`post-checkout` のような git hook をリポジトリ側に置く必要があります。
今のところ私は対話で作業を始めることがほとんどなので、そこは塞いでいません。

https://git-scm.com/docs/git-worktree

最後に一点。
symlink なので、`.env` を worktree 側で編集すると切り出し元の実体も書き換わります。
検証で環境変数を読むぶんには困りませんが、worktree ごとに別の値を使いたいときはリンクを外して実体を置きます。
撤収は対になる merge-worktree スキルに任せていて、この setup 側では symlink をコミットに含めないことだけ守っています。

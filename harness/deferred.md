# Deferred Items

Out-of-scope findings discovered during feature work. Record here and keep
working on the active feature — do not expand the current scope.

Promote an item by turning it into a new entry in `feature_list.json` with
intake fields (`scope`, `acceptance`, `verify`) filled in.

| Date | Found while | Item | Suggested next step |
|------|-------------|------|---------------------|
| YYYY-MM-DD | feat-XXX | [what was discovered] | [new feature / fix / investigate] |
| 2026-07-21 | 記事執筆(s-56) | dotfiles の setup-worktree/SKILL.md が `.worktreeinclude` を「native の git 機能」と記載。git 2.54.0 の man に該当なし（誤り） | dotfiles 側で SKILL.md の該当記述を修正（native 記述の削除 or post-checkout hook 等の正しい記述へ） |
| 2026-07-21 | 記事レビュー(s-56) | dotfiles の detect-worktree.sh のコメント「submodule 内でも git_dir != git_common になる」は不正確。実測では submodule/bare とも git-dir と git-common-dir は一致（別々の判定で弾くのが実装の実態） | dotfiles 側で detect-worktree.sh のコメントを実挙動に合わせて修正 |

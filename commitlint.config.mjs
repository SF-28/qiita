// Conventional Commits の検証設定。commit-gate の commit-msg ステージで commitlint が読む。
// 規約を調整する場合は rules を追記する: https://commitlint.js.org/reference/rules.html
export default {
  extends: ['@commitlint/config-conventional']
};

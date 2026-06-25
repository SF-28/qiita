---
name: qiita-publish
description: 社内承認後の Qiita 記事を Organization に紐づけて公開設定するスキル。「承認された」「公開して」「Organization に紐づけて」「公開設定」などで使用する。
---

# Qiita 公開設定

社内承認が完了した記事の frontmatter を変更し、Organization 紐づけで公開する状態にする。

## 手順

1. 対象記事を特定する（ユーザーに聞くか、直近の承認準備から推定する）
2. frontmatter を以下のように変更する:
   - `private: false`
   - `organization_url_name: oec`
3. 変更内容をユーザーに提示する:

```
## 公開設定完了

- **ファイル**: public/<basename>.md
- **変更内容**:
  - `private: true` → `false`
  - `organization_url_name: null` → `oec`

### 次のステップ
push してください。CI が Qiita に反映し、Organization 紐づけで一般公開されます。
```

push は行わない。ユーザーが手動で push し、CI が Qiita へ反映する。

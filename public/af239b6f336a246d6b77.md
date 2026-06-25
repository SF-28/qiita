---
title: LivebookのSecretsを使う
tags:
  - Elixir
  - secrets
  - Livebook
private: false
updated_at: '2023-07-14T18:12:05+09:00'
id: af239b6f336a246d6b77
organization_url_name: oec
slide: false
ignorePublish: false
---
# Livebookとは

Elixir版 JupyterNotebook のようなものです

https://livebook.dev/

@torifukukaiou さんの記事が勉強になります

https://qiita.com/torifukukaiou/items/223ad0fe1aa67a9fb151

# Secrets

名前の通り、秘密情報です
ノートブックに直接記載したくない値（ID、パスワード、トークンなど）を設定できます

## 設定

ノートブックを開き、左側の鍵マークを選択

<img width="799" alt="Screenshot 2023-02-21 16.41.47.jpg" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/318ca890-45c6-11a5-2ba3-89f3fe99bb91.jpeg">


`+New secret` を選択

<img width="800" alt="Screenshot 2023-02-21 16.23.02.jpg" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/9e613663-2bff-42e3-9c15-79477ff6ab3b.jpeg">

各値を設定して`+Add`

Storage について
- only this session
    - ノートブックのSessionを閉じるまで保存される値
    - 他のノートブックから参照することはできない
- in the Livebook app
    - Livebookアプリ自体に保存される値
    - 複数のノートブックから利用できる
    - Livebookを再起動しても残ったまま
    - トグルボタンで各Secretの有効/無効を切り替えられる

## 利用

- 設定したSecretは、環境変数と同じように使うことができる
- ただし、**変数名の頭に `LB_` をつける**
- 出力でSecretの値が表示される
    - 出力は`.livemd`ファイルに書き込まれないので、ソース管理への混入は心配なし
    - セッションを閉じると出力セルも消えるので、セッション情報として管理されている？

<img width="676" alt="Screenshot 2023-02-21 16.44.43.jpg" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/41e643d0-c595-5c5f-4b87-cfca9ba6509c.jpeg">


## 削除

Secretを選択して、ゴミ箱マークで削除できる

<img width="375" alt="Screenshot 2023-02-21 16.40.51.jpg" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/486ac41a-fde8-7ff5-a17f-26135f2024eb.jpeg">

# 参考

https://hackmd.io/@hugobarauna/By6ulTnMi

# 感想

- トグルスイッチで簡単に切り替えられるのは便利そう
- セッションを閉じたタイミングで消したい値を扱う際に使える？
    - `Kino.Input`のほうが便利な気がする
- プレフィックス(`LB_`)が分かりづらく、export前提だと扱いづらい
    - ホストの環境変数と干渉しない点がメリットかと思ったけど、Livebook自体がそうだった
        - → Livebook上で確認できる環境変数とホストの環境変数がそもそも違った
- 個人利用だと、Settings → Environment variables で十分な印象
    - こちらだとプレフィックスがいらないので、export前提でもOK
    - 同じLivebookで大量のノートを複数人で扱う、みたいな場合は干渉しないよう注意が要るかもしれない

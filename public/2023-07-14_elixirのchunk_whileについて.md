---
title: Elixirのchunk_whileについて
tags:
  - Elixir
  - chunk_while
private: false
updated_at: '2023-07-14T18:13:53+09:00'
id: 27432d9cf64f253fab84
organization_url_name: oec
slide: false
ignorePublish: false
---
## この記事について

chunk_while を理解するのに時間がかかったので、
理解定着の意味合いも込めて自分なりの言葉で残してみたいと思います。

本記事で使う関数は`Enum.chunk_while/4`で統一しておきます。
`Stream.chunk_while/4`は遅延処理になるけど、考え方は一緒です。

https://hexdocs.pm/elixir/Enum.html#chunk_while/4

https://hexdocs.pm/elixir/Stream.html#chunk_while/4

## chunk_while って？

Enumerable(列挙可能)な値を、chunkという単位にまとめて返す関数です。
どのようにchunkを分けるのかは自分で定義するので、きめ細かい制御が可能です。
戻り値はchunkのListになります。

## サンプルコード

```elixir
# 公式リファレンスより、偶数でchunkを区切る処理
chunk_fun = fn element, acc ->
  if rem(element, 2) == 0 do
    {:cont, Enum.reverse([element | acc]), []}
  else
    {:cont, [element | acc]}
  end
end

after_fun = fn
  [] -> {:cont, []}
  acc -> {:cont, Enum.reverse(acc), []}
end

[1, 2, 3, 5, 6, 8, 9, 11]
|> Enum.chunk_while([], chunk_fun, after_fun)
# [[1, 2], [3, 5, 6], [8], [9, 11]]
```

なんとなく書いてあることは分かるけど、具体的な流れを掴むのは難しい気がします。

以降、細かく見ていきましょう。

## 仕様

公式リファレンスより

```elixir
Enum.chunk_while(enumerable, acc, chunk_fun, after_fun)

@spec chunk_while(
  t(),
  acc(),
  (element(), acc() -> {:cont, chunk, acc()} | {:cont, acc()} | {:halt, acc()}),
  (acc() -> {:cont, chunk, acc()} | {:cont, acc()})
) :: Enumerable.t()
when chunk: any()

# t(), acc(), element() については以下の通り
@type t() :: Enumerable.t()
@type acc() :: any()
@type element() :: any()
```

引数について、それぞれ見てみましょう。

- enumerable
    - chunk単位にまとめたい値を指定します。
    - とりあえず List `[1, 2, 3]` をイメージすればOKです。
        - 他には Range `1..10`や File.Stream `File.stream!("ファイルパス")` なんかも指定出来ます。
- acc
    - accumulatorの初期値を指定します。
- chunk_fun
    - chunk単位に分割する処理を定義した関数です。
    - 詳細は後述します。
- after_fun
    - 全要素についてchunk_funが完了したときに行う処理を定義する関数です
    - 詳細は後述します。

## acc (accumulator)

accumulator ＝ 蓄積者、蓄財家、蓄電池、累算器

徐々に値を溜め込んでいく容器みたいなイメージでしょうか。

https://ejje.weblio.jp/content/accumulator

`Enum.reduce/2`とかで既に知ってる方は、それと一緒です。

列挙可能な値を先頭要素から順次処理していくとき、
n番目の要素の処理から、n+1番目の要素の処理へ値を持ち越したい場合に使えるようです。

具体的には、
1番目の処理でaccを出力→2番目処理の引数としてaccを受け取る
2番目の処理でaccを出力→3番目処理の引数としてaccを受け取る
3番目の処理でaccを出力→4番目処理の引数としてaccを受け取る
・
・
というイメージです。

## chunk_fun

chunk単位に分割する処理を定義する関数です。

```elixir
element(), acc() -> {:cont, chunk, acc()} | {:cont, acc()} | {:halt, acc()}
```

### 引数

chunk_fun は element と acc の2つを引数に持ちます。

- element
    - enumerable(chunk_whileの第1引数)の各要素を先頭から順に受け取ります。
    - その性質から chunk_fun は `Enum.count(enumerable)` 回実行されます。
- acc
    - 最初は、chunk_whileの第2引数で指定した値を受け取ります。
    - 2回目以降は、前回実行された chunk_fun の戻り値に含まれる acc を受け取ります。

### 戻り値

３パターンの戻り値を持ちます。
タプルの要素数や先頭のAtomで挙動が大きく変わってきます。

- `{:cont, chunk, acc()}`
    - **chunkを出力します。**
    - 次回処理を続行します。
    - 次回処理に引き継ぐ値はaccで渡します。
    - これが最後の処理の場合は、after_funを実行します。
- `{:cont, acc()}`
    - 次回処理を続行します。
    - 次回処理に引き継ぐ値はaccで渡します。
    - これが最後の処理の場合は、after_funを実行します。
- `{:halt, acc()}`
    - 次回以降の処理は行わず、after_funを実行します。

改めてサンプルコードを見てみましょう。

```elixir
chunk_fun = fn element, acc ->
  if rem(element, 2) == 0 do # 今回の要素が2の倍数であれば
    {:cont, Enum.reverse([element | acc]), []} # {:cont, chunk, acc()}
    # `Enum.reverse([element | acc])` をchunkとして出力
    # 次回処理には空リストを渡す

  else # 今回の要素が2の倍数でなければ
    {:cont, [element | acc]} # {:cont, acc()}
    # accの先頭に今回の要素を加えて、次回処理に渡す
  end
end
```

処理の流れがなんとなく見えてきたのではないでしょうか。

リスト先頭に加えていって最後に反転しているのは、
リスト末尾に加えていくより処理が速くなるからのようです。
この方式の場合、`Enum.reverse/1`を出力の目印とできそうですね。

## after_fun

全要素についてchunk_funが完了したときに行う処理を定義する関数です。
もしくは、chunk_funで `{:halt, acc()}` が呼び出されたタイミングでも実行されます。

```elixir
acc() -> {:cont, chunk, acc()} | {:cont, acc()}
```

### 引数

- acc
    - 最後に実行されたchunk_funの戻り値に含まれるaccを受け取ります。

### 戻り値

- `{:cont, chunk, acc()}`
    - **chunk**を出力します。
    - 戻り値のaccはchunk_funと形式を揃えるためで特に意味はないようです。
        - サンプルコードでは空リストを指定していますが、nilでも動作に支障はなかったです。
- `{:cont, acc()}`
    - 引数のaccに何か残っていたとしても、何も出力せずに終わります。
    - 戻り値のaccについては同上。

こちらもサンプルコードを見てみましょう。

```elixir
after_fun = fn
  [] -> {:cont, []} # accが空リストであれば、何も出力せず終わる
  acc -> {:cont, Enum.reverse(acc), []} # accが空リストでなければ、それを反転してchunkとして出力する
end
```

## サンプルコード読解

ここまで理解できていれば、サンプルコード全体を理解できるようになっているはずです。

```elixir
chunk_fun = fn element, acc ->
  if rem(element, 2) == 0 do
    {:cont, Enum.reverse([element | acc]), []} # {:cont, chunk, acc()}
  else
    {:cont, [element | acc]} # {:cont, acc()}
  end
end

after_fun = fn
  [] -> {:cont, []} # {:cont, acc()}
  acc -> {:cont, Enum.reverse(acc), []} #{:cont, chunk, acc()}
end

[1, 2, 3, 5, 6, 8, 9, 11]
|> Enum.chunk_while([], chunk_fun, after_fun)
# [[1, 2], [3, 5, 6], '\b', '\t\v'] === [[1, 2], [3, 5, 6], [8], [9, 11]]
```

各要素に対応する処理とacc,出力の対応は以下の通りです。

| 処理 | acc | 出力 |
| - | - | - |
| chunk_fun(1, []) | [1] | [] |
| chunk_fun(2, [1]) | [] | [[1, 2]] |
| chunk_fun(3, []) | [3] | [[1, 2]] |
| chunk_fun(5, [3]) | [5, 3] | [[1, 2]] |
| chunk_fun(6, [5, 3]) | [] | [[1, 2], [3, 5, 6]] |
| chunk_fun(8, []) | [] | [[1, 2], [3, 5, 6], [8]] |
| chunk_fun(9, []) | [9] | [[1, 2], [3, 5, 6], [8]] |
| chunk_fun(11, [9]) | [11, 9] | [[1, 2], [3, 5, 6], [8]] |
| after_fun([11, 9]) | [] | [[1, 2], [3, 5, 6], [8], [9, 11]] |

ポイントは以下になるでしょうか。

- 第1引数で渡されたListの先頭から順にchunk_funで処理されている。
- 前回処理結果のaccが引き継がれている。(初回は第2引数で指定した初期値)
- chunk_funとafter_funで出力された各chunkは、出力のListに加えられていく。

ちなみに途中で`{:halt, acc()}`が返された場合、
残りのchunk_funを飛ばしてafter_funが実行される流れになります。

## 感想

- リストの要素をちょっと複雑な条件でまとめたいときに重宝しそうです。
    - 実際、ZIPストリームをnバイト単位に区切る処理を組む際に使いました。後日記事作成予定。
- 間接的にreduce処理のイメージ理解も深めることが出来ました。
- 戻り値の型によって、全然意味合いが変わってくるケースもあるのは気をつけなければと思いました。
    - 個人的に`{:cont, chunk, acc()}`と`{:cont, acc()}`について、2番目要素の意味が大きく変わって分かりづらく感じました。
- 公式リファレンスを理解するのも大事だけど、まずは手を動かしてみるほうが理解が進む。

## 参考

以下の記事がきめ細かい検証をされていたので、理解を助けてくれました。

https://qiita.com/ken_hamada/items/a993de1dd094b12f8964

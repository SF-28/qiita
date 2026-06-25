---
title: Elixirでbinary streamをNバイトのchunkに分ける
tags:
  - Elixir
  - Stream
  - Binary
  - chunk
private: false
updated_at: '2023-07-14T18:14:02+09:00'
id: 9f6a97a371b3d0a19d92
organization_url_name: oec
slide: false
ignorePublish: false
---
# この記事について

binaryのstreamをNバイト単位にまとめる方法を記載します。

## 結論

```elixir
defmodule BinaryStream do
  @doc """
  byte_sizeのchunkにまとめる関数

  ## Examples:
  iex> Stream.cycle([<<1>>, <<2, 3>>, <<4, 5, 6>>, <<7, 8, 9, 10>>])
  iex> |> BinaryStream.chunk_by_byte(7)
  iex> |> Enum.take(3)
  [<<1, 2, 3, 4, 5, 6, 7>>, <<8, 9, 10, 1, 2, 3, 4>>, <<5, 6, 7, 8, 9, 10, 1>>]

  iex> Stream.cycle([<<195>>, <<166, 195>>, <<167, 195, 168>>])
  iex> |> BinaryStream.chunk_by_byte(4)
  iex> |> Enum.take(3)
  [<<195, 166, 195, 167>>, <<195, 168, 195, 166>>, <<195, 167, 195, 168>>]
  """
  @spec chunk_by_byte(Enumerable.t(), pos_integer()) :: Enumerable.t()
  def chunk_by_byte(enum, chunk_size) when is_integer(chunk_size) and chunk_size > 0 do
    chunk_fn = fn element, acc ->
      binary = acc <> element

      if byte_size(binary) >= chunk_size do
        {chunk_list, rest} = do_chunks(binary, chunk_size, [])
        {:cont, chunk_list, rest}
      else
        {:cont, binary}
      end
    end

    after_fn = fn
      <<>> -> {:cont, nil}
      acc -> {:cont, [acc], nil}
    end

    enum
    |> Stream.chunk_while(<<>>, chunk_fn, after_fn)
    |> Stream.flat_map(& &1)
  end

  defp do_chunks(binary, chunk_size, acc) when byte_size(binary) < chunk_size do
    {Enum.reverse(acc), binary}
  end

  defp do_chunks(binary, chunk_size, acc) do
    <<chunk::binary-size(chunk_size), rest::binary>> = binary
    do_chunks(rest, chunk_size, [chunk | acc])
  end
end

```

## 使い方

```elixir
Stream.cycle([<<1>>, <<2, 3>>, <<4, 5, 6>>, <<7, 8, 9, 10>>])
|> BinaryStream.chunk_by_byte(7)
|> Enum.take(3)
# [<<1, 2, 3, 4, 5, 6, 7>>, <<8, 9, 10, 1, 2, 3, 4>>, <<5, 6, 7, 8, 9, 10, 1>>]

Stream.cycle([<<195>>, <<166, 195>>, <<167, 195, 168>>])
|> BinaryStream.chunk_by_byte(4)
|> Enum.take(3)
# ["æç", "èæ", "çè"] === [<<195, 166, 195, 167>>, <<195, 168, 195, 166>>, <<195, 167, 195, 168>>]
```

## 簡単な説明

`Stream.chunk_while/4`を使って、各バイナリを読み込んでいます。
バイナリのサイズによって、複数chunkを作ったり、もしくは次のバイナリと結合したりする必要があるので、accと結合してサイズを判定し、分割する必要があれば再帰処理でchunkを切り出すことにしました。

chunk_whileについては以下の記事にまとめています。

https://qiita.com/SF-28/items/27432d9cf64f253fab84

## なぜこの処理が必要になったのか？

S3へのマルチパートアップロードにおけるパートサイズ制限(5MiB以上)に対応したかったため。

`File.stream!/3`や`ExAws.S3.stream_file/2`を使えばある程度対応できるんですが、ZIPストリームを扱いたい時に上手いやり方が見つけられなかったので、色々調べて実装してみました。

## 雑感

- もう少しスマートな実装方法がありそうな気がしている。
    - もっと言うと、見つけられなかっただけで、既に同等の機能を提供するモジュールがありそう。
- Enumと同じ使用感でStreamを扱えるのが素晴らしい。
    - 巨大データでも全然メモリを使わずに処理できて感動する。
    - エッジコンピュータから大量のデータをアップロードしたりする場合とか役立ちそう。
    - これをさらに並列処理できれば・・・mapと違って各要素が独立した処理ではないから厳しい？
- ある程度のchunkにまとめることで、オーバヘッドの割合が小さくなって通信効率も改善しそう。
- [Packmatic](https://hexdocs.pm/packmatic/readme.html)や[unzip](https://hex.pm/packages/unzip)と組み合わせると、もはやローカルにファイルがなくても作業できちゃう。
    - データ保存容量(=ストレージコスト)を抑えつつ、そのままアクセスできるという欲張りセット。
    - 流石に読込時間は長くなりそうだけど、アクセス頻度が低いデータならZIP解凍の手間もなくて快適になりそう。

## 参考

以下記事のコードを参考にさせていただきました。
Streamに対応するため `Stream.chunk_while/4`と組み合わせ、分割する単位を bitstring -> binary に変更しています。

https://stackoverflow.com/questions/38734845/how-to-split-a-binary-into-n-bit-chunks

---
title: ElixirでS3+ZipStream
tags:
  - S3
  - Elixir
  - zip
  - Stream
  - mix
private: false
updated_at: '2026-06-25T11:59:10+09:00'
id: 3d6e1eb8fa0527de4f97
organization_url_name: oec
slide: false
ignorePublish: false
---
# この記事について

- ローカルのフォルダをZipStreamで取り込みます。
- 5MiB単位のchunkにまとめ、S3にマルチパートアップロードします。
- S3に保存したZIPファイルをストリームとして読み込み、必要なファイル情報に絞って取得します。

# 動作環境

- macOS Ventura
- Erlang 24.3.4.9
- Elixir 1.14.3

# mixプロジェクト作成

```sh
mix new zip_stream
cd zip_stream
```

## 依存パッケージ

depsを以下のように設定します。

```diff_elixir:mix.exs
defmodule ZipStream.MixProject do
  use Mix.Project

  def project do
    [
      app: :zip_stream,
      version: "0.1.0",
      elixir: "~> 1.14",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
+     {:ex_aws, "~> 2.4"},
+     {:ex_aws_s3, "~> 2.4"},
+     {:jason, "~> 1.4"},
+     {:hackney, "~> 1.18"},
+     {:sweet_xml, "~> 0.7"},
+     {:packmatic, "~> 1.1.2"},
+     {:unzip, "~> 0.8"}
    ]
  end
end
```

以下コマンドで取得しておきます。

```sh
mix local.hex --force
mix local.rebar --force
mix deps.get
```

# config設定

ファイルを生成します。

```sh
mkdir config
touch config/config.exs
touch .env
```

それぞれ以下のように設定します。
今回は`.env`ファイルから情報を取得するようにしてみました。

```elixir:config/config.exs
import Config

config :ex_aws,
  access_key_id: System.get_env("AWS_ACCESS_KEY_ID"),
  secret_access_key: System.get_env("AWS_SECRET_ACCESS_KEY"),
  region: System.get_env("AWS_REGION")
```

```text:.env
export AWS_ACCESS_KEY_ID="xxxx"
export AWS_SECRET_ACCESS_KEY="xxxx"
export AWS_REGION="ap-northeast-1"
export AWS_BUCKET="xxxx"
```

# モジュール作成

いくつか必要な処理をモジュールとして定義していきます。

## BinaryStream

マルチパートアップロードのサイズ制限(5MiB)に対応するため、ストリームを指定したバイトサイズのchunkにまとめる関数を定義します。

詳細は以下記事に記載しています。

https://qiita.com/SF-28/items/9f6a97a371b3d0a19d92

```sh
touch lib/binary_stream.ex
```

```elixir:lib/binary_stream.ex
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

## Unzip.S3File

S3のZIPファイルを扱うための関数を定義します。

Unzipのドキュメントに記載されているコードをそのまま持ってきました。

https://hexdocs.pm/unzip/readme.html

```sh
mkdir lib/unzip
touch lib/unzip/s3file.ex
```

```elixir:lib/unzip/s3file.ex
defmodule Unzip.S3File do
  defstruct [:bucket, :key, :s3_config]
  alias __MODULE__

  def new(bucket, key, s3_config) do
    %S3File{bucket: bucket, key: key, s3_config: s3_config}
  end
end

defimpl Unzip.FileAccess, for: Unzip.S3File do
  alias ExAws.S3

  def size(file) do
    %{headers: headers} = S3.head_object(file.bucket, file.key) |> ExAws.request!(file.s3_config)

    size =
      headers
      |> Enum.find(fn {k, _} -> String.downcase(k) == "content-length" end)
      |> elem(1)
      |> String.to_integer()

    {:ok, size}
  end

  def pread(file, offset, length) do
    {_, chunk} =
      S3.Download.get_chunk(
        %S3.Download{bucket: file.bucket, path: file.key, dest: nil},
        %{start_byte: offset, end_byte: offset + length - 1},
        file.s3_config
      )

    {:ok, chunk}
  end
end
```


## ZipStream

メインとなる処理を作成します。
今回は(個人的なニーズを満たすため)以下の処理を実装してみました。

- フォルダをZIPとしてS3へアップロードする処理
- S3上のZIPを展開しながらダウンロードする処理
- S3上のZIPに含まれるファイル一覧を取得する処理
- S3上のZIPに含まれる特定のファイルのみをダウンロードする処理

ファイル単位のアップロードや、複数ファイル指定のダウンロードなんかも簡単に実装できそうです。

```elixir:lib_zip_stream.ex
defmodule ZipStream do
  @moduledoc """
  ## Functions

  - put_folder/3
  - get_folder/3
  - list_files/2
  - get_file/4
  """

  defp stream_zip_folder(folder_path) do
    entries =
      File.ls!(folder_path)
      |> Enum.sort()
      |> Enum.map(fn file_name ->
        file_path = Path.join([folder_path, file_name])

        zip_path =
          file_path
          |> Path.dirname()
          |> Path.split()
          |> Enum.at(-1)
          |> then(&Path.join([&1, file_name]))

        [source: {:file, file_path}, path: zip_path]
      end)

    Packmatic.build_stream(entries)
    |> Stream.flat_map(&List.flatten(&1))
  end

  @doc """
  フォルダをZIPとしてS3へアップロードする関数

  - folder_path : 対象フォルダのパス
  - bucket : S3バケット名
  - key : S3上の名前

  ## Examples
  iex> ZipStream.put_folder("./target", "my-bucket", "key.zip")
  """
  def put_folder(folder_path, bucket, key) do
    IO.puts("Uploading:  #{folder_path}")

    stream_zip_folder(folder_path)
    |> BinaryStream.chunk_by_byte(5 * 1024 * 1024)
    |> ExAws.S3.upload(bucket, key)
    |> ExAws.request!()
    |> then(fn
      %{status_code: 200} -> IO.puts("Complete :  #{folder_path}")
      _ -> IO.puts("Failed to upload...")
    end)
  end

  defp get_unzip(bucket, key) do
    s3_config =
      ExAws.Config.new(:s3,
        access_key_id: [System.get_env("AWS_ACCESS_KEY_ID"), :instance_role],
        secret_access_key: [System.get_env("AWS_SECRET_ACCESS_KEY"), :instance_role]
      )

    s3_zip_file = Unzip.S3File.new(bucket, key, s3_config)
    {:ok, unzip} = Unzip.new(s3_zip_file)

    unzip
  end

  @doc """
  S3上のZIPを展開しながらダウンロードする関数

  - bucket : S3バケット名
  - key : S3上のZIPのkey
  - to : ダウンロード先を指定(デフォルトはカレントディレクトリ)

  ## Examples
  iex> ZipStream.get_folder("my-bucket", "key.zip")

  iex> ZipStream.get_folder("my-bucket", "key.zip", "./data")
  """
  def get_folder(bucket, key, to \\ ".") do
    unzip = get_unzip(bucket, key)
    file_list = Unzip.list_entries(unzip)

    file_list
    |> Enum.map(fn file ->
      file_name = file.file_name
      dist = "#{to}/#{file_name}"
      dir_path = Path.dirname(dist)

      unless File.exists?(dir_path) do
        File.mkdir_p!(dir_path)
      end

      unless File.exists?(dist) do
        IO.puts("Downloading:  #{file_name}")

        Unzip.file_stream!(unzip, file_name)
        |> Stream.into(File.stream!(dist))
        |> Stream.run()

        IO.puts("Complete   :  #{dist}")
      else
        IO.puts("Already exists.  #{dist}")
      end
    end)
  end

  @doc """
  S3上のZIPに含まれるファイル一覧を取得する関数

  - bucket : S3バケット名
  - key : S3上のZIPのkey

  ## Examples
  iex> ZipStream.list_files("my-bucket", "key.zip")
  """
  def list_files(bucket, key) do
    unzip = get_unzip(bucket, key)

    Unzip.list_entries(unzip)
    |> Enum.map(&Map.get(&1, :file_name))
  end

  @doc """
  S3上のZIPに含まれる特定のファイルのみをダウンロードする関数

  - bucket : S3バケット名
  - key : S3上のZIPのkey
  - file_name : ZIPに含まれるファイル名(`list_file/2`で確認可能)
  - to : ダウンロード先を指定

  ## Examples
  iex> ZipStream.get_file("my-bucket", "key.zip", "example.txt", "./example.txt")
  """
  def get_file(bucket, key, file_name, to) do
    unzip = get_unzip(bucket, key)

    dir_path = Path.dirname(to)

    unless File.exists?(dir_path) do
      File.mkdir_p!(dir_path)
    end

    unless File.exists?(to) do
      IO.puts("Downloading:  #{file_name}")

      Unzip.file_stream!(unzip, file_name)
      |> Stream.into(File.stream!(to))
      |> Stream.run()

      IO.puts("Complete   :  #{to}")
    else
      IO.puts("Already exists.  #{to}")
    end
  end
end
```

# アップロード用のフォルダを作成

実際に動かすため、S3にアップロードするフォルダを作りたいと思います。

```sh
mkdir tmp
touch tmp/test.txt
echo "Test txt." >> tmp/test.txt

touch tmp/test.json
echo '{
  "glossary": {
    "title": "example glossary",
    "GlossDiv": {
      "title": "S",
      "GlossList": {
        "GlossEntry": {
          "ID": "SGML",
          "SortAs": "SGML",
          "GlossTerm": "Standard Generalized Markup Language",
          "Acronym": "SGML",
          "Abbrev": "ISO 8879:1986",
          "GlossDef": {
            "para": "A meta-markup language, used to create markup languages such as DocBook.",
            "GlossSeeAlso": ["GML", "XML"]
          },
          "GlossSee": "markup"
        }
      }
    }
  }
}' >> tmp/test.json
```

ついでに30MB超のpngファイルもtmpフォルダに入れてみました。

https://sample-videos.com/download-sample-png-image.php

# 動かしてみる

実際にiexで動かしてみます。
`source .env`を入れないと、`.env`が読み込まれないので注意です。

```bash
source .env && iex -S mix
```

```elixir
# 今回利用するbucketとkeyを指定します。
bucket = System.get_env("AWS_BUCKET")
key = "tmp.zip"

import ZipStream

# S3にアップロード
put_folder("./tmp", bucket, key)
```

AWSコンソールで、ちゃんとアップロードされていることが確認できました。

![Screenshot 2023-03-31 13.51.09.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/e15b622c-aeb6-187a-88c7-7885c277c76d.jpeg)

```elixir
# S3からダウンロード
get_folder(bucket, key, "./download")

# JSONを比較
original_json = File.read!("./tmp/test.json")
zip_json = File.read!("./download/tmp/test.json")
original_json === zip_json
# true
```

次は、ZIPから特定のファイルだけ取得してみたいと思います。

```elixir
# ZIPに含まれるファイル名を取得
file_list = list_files(bucket, key)
# ["tmp/test.json", "tmp/test.png", "tmp/test.txt"]

# jsonだけダウンロード
file_list
|> Enum.at(0)
|> then(& get_file(bucket, key, &1, "./download/test.json"))

# 比較
zip_json2 = File.read!("./download/test.json")
original_json === zip_json2
# true
```

ZIPから特定のファイルだけダウンロードすることができました。

# まとめ

ローカルとS3をZipStreamで繋いでみました。

ストリームなので、サイズが大きくてもメモリをあまり使わずに処理できていい感じです。

ZIPの中から特定のファイルだけを選んで取ってこれるのも嬉しいですね。

S３をデータレイクとして使う場合、ファイルに出力せず直接変数として受け取って処理してもいいかも。

ちなみにentriesのところはローカルだけでなくURLも指定することができるので、少し改造すれば色々応用が利きそうです。

# 参考

https://hexdocs.pm/ex_aws/readme.html

https://hexdocs.pm/ex_aws_s3/ExAws.S3.html

https://hexdocs.pm/packmatic/readme.html

https://hexdocs.pm/unzip/readme.html

# 余談

- 自動生成されたプロジェクトにconfigフォルダがなくて、少し迷いました。事情を調べると以下経緯のようです。

    >mix newでconfig/config.exsをつくらなくなりました。設定ファイルに依存することは、ライブラリやその作者にとって望ましくないとされてきたからです。

https://dev.to/gumi/elixir-elixir-1-9-1dmp

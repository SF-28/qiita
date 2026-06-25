---
title: PythonでDynamoDBのデータ型記述子を取り除く
tags:
  - Python
  - JSON
  - DynamoDB
  - データ型記述子
private: false
updated_at: '2023-12-21T09:36:21+09:00'
id: d22fc20dae35c2aec27d
organization_url_name: oec
slide: false
ignorePublish: false
---
# 本記事について

- DynamoDB Streams などでデータを扱う場合、データ型記述子が混ざっていて扱いづらい
- Pythonで上記の解決方法が見つけづらかったため、備忘録として残しておく

# 解決方法

boto3 にちゃんと備わっていた

```python
from boto3.dynamodb.types import TypeDeserializer

def conv_dynamodbjson_to_json(item):
    td = TypeDeserializer()
    return {k: td.deserialize(value=v) for k, v in item.items()}

converted_json = conv_dynamodbjson_to_json(dynamodb_json)
```

# 実行例

"N"、"L"、"S"などのデータ型記述子が入っていて扱いにくい

```json:sample.json
{
  "Age": { "N": "8" },
  "Colors": {
    "L": [{ "S": "White" }, { "S": "Brown" }, { "S": "Black" }]
  },
  "Name": { "S": "Fido" },
  "Vaccinations": {
    "M": {
      "Rabies": {
        "L": [
          { "S": "2009-03-17" },
          { "S": "2011-09-21" },
          { "S": "2014-07-08" }
        ]
      },
      "Distemper": { "S": "2015-10-13" }
    }
  },
  "Breed": { "S": "Beagle" },
  "AnimalType": { "S": "Dog" }
}
```

上記を読み込んで変換して出力する処理を作成 (ついでにDecimalも変換)

```python
import json
from decimal import Decimal
from boto3.dynamodb.types import TypeDeserializer


def conv_dynamodbjson_to_json(item):
    td = TypeDeserializer()
    return {k: td.deserialize(value=v) for k, v in item.items()}


def conv_decimal_to_int_or_float(obj):
    if isinstance(obj, Decimal):
        if int(obj) == obj:
            return int(obj)
        else:
            return float(obj)


with open("sample.json", "r") as sample_json:
    dynamodb_json = json.load(sample_json)

converted_json = conv_dynamodbjson_to_json(dynamodb_json)
plain_json = json.dumps(converted_json, default=conv_decimal_to_int_or_float)
print(plain_json)
```

無事、扱いやすい形になった

```json
{
  "Age": 8,
  "Colors": ["White", "Brown", "Black"],
  "Name": "Fido",
  "Vaccinations": {
    "Rabies": ["2009-03-17", "2011-09-21", "2014-07-08"],
    "Distemper": "2015-10-13"
  },
  "Breed": "Beagle",
  "AnimalType": "Dog"
}
```

## 雑感

- boto3 にも知らない機能が沢山眠っているんだろうなと思った
    - 時間があれば公式リファレンスを隅々まで読み漁ってみたい
- parquet に変換する前処理が終わった
    - DynamoDB Streams → Lambda → S3 に履歴データを蓄積して Athena で分析したい
    - データ分析サービス多すぎて迷ってしまう・・・このあたりも要勉強
- データ型記述子が役立つ場面はあるのだろうか

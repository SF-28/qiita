---
title: プライベートサブネットでECS Fargateを利用する際のつまずきポイント
tags:
  - AWS
private: false
updated_at: '2023-08-29T14:51:04+09:00'
id: e3e09dd7becf205884d1
organization_url_name: oec
slide: false
ignorePublish: false
---
プライベートサブネットで ECS(Fargate) を利用しようとしましたが、
つまずきポイントが多かったので備忘録として残したいと思います。

## ざっくり構成

- プライベートサブネット
- ECS(Fargate)
- コンテナイメージは ECR Public Gallery のものを利用
- コンテナイメージはVPCエンドポイントで取得
- ALBのターゲットとして指定

## コンテナイメージの取得に失敗する

プライベートサブネット内から、ECRリポジトリにアクセスする通信経路が存在しないことが原因

👉 `VPCエンドポイント` or `NATゲートウェイ & インターネットゲートウェイ` のどちらかが必須

- VPCエンドポイントの場合、パブリックなコンテナイメージは取得できない仕様
- プルスルーキャッシュルールを設定してプライベートリポジトリを経由することで、擬似的にパブリックなイメージも取得できるようになる

### 必要な設定

- 必要なVPCエンドポイントを作成する : [参考](https://docs.aws.amazon.com/ja_jp/AmazonECR/latest/userguide/vpc-endpoints.html)
    - Linux プラットフォームバージョン 1.3.0 以前
        - com.amazonaws.`region`.ecr.dkr (インターフェース)
        - com.amazonaws.ap-northeast-1.s3 (ゲートウェイ)
    - Linux プラットフォームバージョン 1.4.0 以降
        - com.amazonaws.`region`.ecr.dkr (インターフェース)
        - com.amazonaws.`region`.ecr.api (インターフェース)
        - com.amazonaws.ap-northeast-1.s3 (ゲートウェイ)
    - Windows プラットフォームバージョン 1.0.0 以降
        - com.amazonaws.`region`.ecr.dkr (インターフェース)
        - com.amazonaws.`region`.ecr.api (インターフェース)
        - com.amazonaws.ap-northeast-1.s3 (ゲートウェイ)
- S3のVPCエンドポイント(ゲートウェイ)は有効なルートテーブルに関連付けること
- (パブリックなイメージの場合)[プルスルーキャッシュルール]((https://docs.aws.amazon.com/ja_jp/AmazonECR/latest/userguide/pull-through-cache.html)
)を作成する( IAM許可も忘れず )

## ALBのヘルスチェックが失敗し、ECSタスクの停止→起動が繰り返される

コンテナ起動後、ヘルスチェック応答が可能な状態になるまでに時間がかかる場合、
ターゲットグループのヘルスチェック失敗判定までの時間をそれより長く設定する必要がある

なお、ECSサービスに`ヘルスチェックの猶予期間`という設定があるが、
これはヘルスチェックに失敗した場合でもその秒数間はタスクを停止しないという設定であり、
ヘルスチェックの開始を遅らせてくれたり、その間のヘルスチェック失敗を見逃してくれたりする設定ではない
(ヘルスチェック失敗時の停止猶予期間、と表現したほうが適切かもしれない)

https://docs.aws.amazon.com/ja_jp/AmazonECS/latest/userguide/service_definition_parameters.html#sd-networkconfiguration
## その他、見落としがちな設定

- com.amazonaws.ap-northeast-1.s3 (ゲートウェイ) のポリシー設定で必要な通信をブロックしていないか
- VPC設定のDNSホスト名、DNS解決が有効になっているか
- ルートテーブルがサブネットに関連付けられているか
- セキュリティグループで通信が遮断されていないか
- IAM許可が適切に割り当てられているか

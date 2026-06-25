---
title: '[Terraform] RDS Proxyをリーダーエンドポイント(Aurora Replicas)に対応させる'
tags:
  - AWS
  - Terraform
  - Aurora
  - readonly
  - RDSProxy
private: false
updated_at: '2023-07-31T13:41:20+09:00'
id: 55a07eb2dd5a369473ff
organization_url_name: oec
slide: false
ignorePublish: false
---
# はじめに

Auroraを利用する場合、データ取得はリーダーエンドポイントに繋ぐと効率的です。(詳細は以下リンクを参照)

https://docs.aws.amazon.com/ja_jp/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.Endpoints.html#Aurora.Overview.Endpoints.Types

その上で VPC Lambda からアクセスするなど RDS Proxy を挟みたいケースについて、設定方法が少し分かりづらかったので備忘録として残したいと思います。

# 結論

`aws_db_proxy_endpoint`を追加する

https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_proxy_endpoint

```terraform:作成例
resource "aws_db_proxy_endpoint" "rds_proxy_reader_endpoint" {
  db_proxy_name          = aws_db_proxy.rds_proxy.name
  db_proxy_endpoint_name = "reader_endpoint"
  vpc_security_group_ids = [aws_security_group.rds_proxy_security_group.id]
  vpc_subnet_ids         = [aws_subnet.subnet_a.id, aws_subnet.subnet_c.id]
  target_role            = "READ_ONLY"
}
```

`aws_db_proxy_endpoint.rds_proxy_reader_endpoint.endpoint`で読み取り専用のエンドポイントを取得できます。

# 補足

- RDS Proxyを作成したとき、Auroraのクラスターエンドポイント(ライターエンドポイント)に対応するRDS Proxyのエンドポイントは自動作成されます。
    - その値は`aws_db_proxy.<リソース名>.endpoint`で取得可能。
- Auroraのリーダーエンドポイントに対応するRDS Proxyの読み取り専用エンドポイントは、本記事のように明示的に指定しないと作成されません。
- サブネットやセキュリティグループについても、エンドポイントごとに指定する必要があります。

# 料金

読み取り専用エンドポイントには追加料金がかかります。(デフォルトのエンドポイントは無料)

https://aws.amazon.com/jp/rds/proxy/pricing/

>RDS プロキシを作成したときに得られるデフォルトのエンドポイントに関連する、追加料金はかかりません。また、読み取り専用または読み取り/書き込み可能なプロキシのエンドポイントを追加することができ、それぞれ独自の VPC 設定を行うことができます。RDS プロキシエンドポイントを追加すると、AWS PrivateLink インターフェイスエンドポイントがプロビジョニングされ、[PrivateLink の料金ページ](https://aws.amazon.com/jp/privatelink/pricing/)に記載されているように追加料金が発生します。

![Screenshot 2023-07-18 15.22.19.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/34d85346-c9da-50e5-45b5-e6d4f1cb5a66.jpeg)

https://aws.amazon.com/jp/privatelink/pricing/

# 参考

https://aws.amazon.com/jp/about-aws/whats-new/2021/03/amazon-rds-proxy-adds-read-only-endpoints-for-amazon-aurora-replicas/

https://dev.classmethod.jp/articles/rds-proxy-adds-read-only-endpoints-for-amazon-aurora-replicas/

---
title: TerraformでAWS Control Tower Account Factoryを使ったら「OU is not enrolled」で詰まった話
tags:
  - AWS
  - Terraform
  - ServiceCatalog
  - ControlTower
  - accountfactory
private: false
updated_at: '2026-06-19T09:02:43+09:00'
id: 8472b2dee28be8a6e2cc
organization_url_name: oec
slide: false
ignorePublish: false
---
## はじめに

Terraform で AWS Control Tower の Account Factory を使って AWS アカウントを作成しようとしたところ、以下のエラーで詰まりました。

```text
Error: waiting for Service Catalog Provisioned Product (pp-xxxx) create:
InvalidParametersException:
The parent organizational unit 'ou-xxxx' is not enrolled in AWS Control Tower.
```

最初はエラーメッセージの通り、

* 対象 OU が AWS Control Tower に登録されていない
* 親 OU が AWS Control Tower に登録されていない
* Control Tower 側のベースライン適用が失敗している

あたりを疑いました。

しかし、実際の原因は Terraform から渡していた `ManagedOrganizationalUnit` の値でした。

## 環境

* Terraform
* AWS Organizations
* AWS Control Tower
* AWS Service Catalog
* AWS Control Tower Account Factory

Terraform では `aws_servicecatalog_provisioned_product` を使って、Service Catalog 経由で AWS Control Tower Account Factory を起動していました。

## やりたかったこと

AWS Control Tower 管理下の OU に対して、Terraform から新規 AWS アカウントを作成したかった。

イメージとしては以下です。

```text
AWS Organizations
└── Sandbox
    └── Training
        └── 新規 AWS アカウントを作成したい
```

Terraform 側では、`Training` OU を `ManagedOrganizationalUnit` に指定して Account Factory を実行しようとしていました。

## 発生したエラー

Terraform apply 時に以下のエラーが出ました。

```text
Error: waiting for Service Catalog Provisioned Product (pp-xxxx) create:
InvalidParametersException:
The parent organizational unit 'ou-xxxx' is not enrolled in AWS Control Tower.
```

エラーメッセージだけ見ると、指定した OU または親 OU が Control Tower に登録されていないように見えます。

しかし、Control Tower コンソール上では対象 OU は登録済みに見えていました。

## 最初に疑ったこと

まず以下を確認しました。

* 対象 OU が AWS Control Tower に登録済みか
* 親 OU が AWS Control Tower に登録済みか
* Control Tower のホームリージョンで操作しているか
* Service Catalog の Account Factory 製品を正しく参照しているか
* Terraform provider の region が Control Tower のホームリージョンになっているか

それでも解消しませんでした。

## Control Tower, Account Factory, Service Catalog の関係

今回ややこしかったのは、Terraform が直接 AWS アカウントを作っているわけではない点です。

関係性はざっくり以下です。

```text
Terraform
  ↓
aws_servicecatalog_provisioned_product
  ↓
AWS Service Catalog
  ↓
AWS Control Tower Account Factory
  ↓
AWS Control Tower
  ↓
AWS Organizations
```

それぞれの役割は以下のようなイメージです。

```text
AWS Organizations
  OU や AWS アカウントの実体を管理する土台

AWS Control Tower
  Organizations の上に統制、ベースライン、ガードレールを載せるサービス

Account Factory
  Control Tower 管理下に新規 AWS アカウントを作成する仕組み

AWS Service Catalog
  Account Factory を「製品」として起動するための実行基盤

Terraform
  Service Catalog の ProvisionProduct 相当を実行している
```

つまり Terraform の `aws_servicecatalog_provisioned_product` は、Service Catalog 上の `AWS Control Tower Account Factory` 製品を起動しているだけです。

そのため、Terraform の値は AWS Organizations の都合ではなく、Service Catalog / Account Factory 側が期待する入力形式に合わせる必要があります。

## 原因

原因は `ManagedOrganizationalUnit` に OU ID だけを渡していたことでした。

問題のコードは以下です。

```hcl
provisioning_parameters {
  key   = "ManagedOrganizationalUnit"
  value = aws_organizations_organizational_unit.training.id
}
```

`aws_organizations_organizational_unit.training.id` は、以下のような Organizations の OU ID を返します。

```text
ou-xxxx-yyyyyyyy
```

しかし、AWS Control Tower Account Factory の `ManagedOrganizationalUnit` は、OU ID 単体ではなく、Account Factory が認識できる OU 表記を期待します。

具体的には、以下のような形式です。

```text
OUName (OU-ID)
```

そのため、OU 自体は Control Tower に登録済みでも、OU ID だけを渡すと Account Factory 側で正しく解釈できず、結果的に以下のようなエラーになっていました。

```text
The parent organizational unit 'ou-xxxx' is not enrolled in AWS Control Tower.
```

## 修正前

修正前は以下のように書いていました。

```hcl
provisioning_parameters {
  key   = "ManagedOrganizationalUnit"
  value = aws_organizations_organizational_unit.training.id
}
```

これは一見正しそうに見えます。

Terraform 的には `training` OU の ID を渡しているので自然に見えます。

しかし、Service Catalog の Account Factory 製品が期待する値としては不十分でした。

## 修正後

以下のように、OU 名と OU ID を組み合わせた形式に変更しました。

```hcl
provisioning_parameters {
  key = "ManagedOrganizationalUnit"
  value = format(
    "%s (%s)",
    aws_organizations_organizational_unit.training.name,
    aws_organizations_organizational_unit.training.id
  )
}
```

これにより、実際に渡される値は以下のようになります。

```text
Training (ou-xxxx-yyyyyyyy)
```

この形式であれば、Account Factory 側が対象 OU を正しく解釈できます。

## コンソールでの確認方法

`ManagedOrganizationalUnit` は、コンソール上ではその名前で表示されるというより、Account Factory の `Organizational unit` の選択欄として確認できます。

確認手順は以下です。

```text
AWS 管理アカウントにログイン
→ Control Tower のホームリージョンに切り替え
→ Service Catalog
→ Products
→ AWS Control Tower Account Factory
→ Launch product
→ Organizational unit の選択欄を確認
```

この選択欄に表示される OU の形式が、Terraform の `ManagedOrganizationalUnit` に渡す値の参考になります。

## 親 OU も関係する

今回のエラーでは `parent organizational unit` と出ていたため、親 OU も確認しました。

例えば以下のような構成です。

```text
Root
└── Sandbox
    └── Training
```

この場合、新規アカウントを `Training` に作成したいなら、少なくとも `Training` が Control Tower 管理下の OU として認識されている必要があります。

また、親の `Sandbox` 側が Control Tower に登録済みかどうかも確認対象になります。

ただし今回のように `ManagedOrganizationalUnit` に OU ID だけを渡している場合、エラー文だけでは本当に OU が未登録なのか、入力値の形式が悪いのかが分かりづらいです。

そのため、以下の順番で切り分けるのがよさそうです。

```text
1. エラーに出ている ou-xxxx がどの OU か確認する
2. その OU が Control Tower に登録済みか確認する
3. 親 OU も Control Tower に登録済みか確認する
4. ManagedOrganizationalUnit に OU ID だけを渡していないか確認する
5. OUName または OUName (OU-ID) 形式に修正する
```

OU ID から OU 名を確認する場合は、以下のように確認できます。

```bash
aws organizations describe-organizational-unit \
  --organizational-unit-id ou-xxxx-yyyyyyyy
```

## 参考

AWS Control Tower Account Factory のアカウントプロビジョニングに関する公式ドキュメントです。

https://docs.aws.amazon.com/ja_jp/controltower/latest/userguide/provision-as-end-user.html

AFT のドキュメントでは、`ManagedOrganizationalUnit` の形式として `OUName` または `OUName (OU-ID)` が説明されています。

https://docs.aws.amazon.com/ja_jp/controltower/latest/userguide/aft-provision-account.html

## まとめ

今回の原因は、Control Tower に OU が登録されていないことではなく、Terraform から `ManagedOrganizationalUnit` に渡していた値の形式でした。

修正前は以下です。

```hcl
value = aws_organizations_organizational_unit.training.id
```

これは Organizations の OU ID 単体を渡します。

修正後は以下です。

```hcl
value = format(
  "%s (%s)",
  aws_organizations_organizational_unit.training.name,
  aws_organizations_organizational_unit.training.id
)
```

これにより、以下の形式で Account Factory に渡せます。

```text
Training (ou-xxxx-yyyyyyyy)
```

Terraform の属性をそのまま渡せばよさそうに見えても、Service Catalog 経由で Account Factory を呼び出す場合は、Service Catalog 製品側が期待するパラメータ形式に合わせる必要がありました。

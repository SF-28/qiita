---
title: App Service ドメインで独自ドメインを取得する
tags:
  - Azure
  - ドメイン
  - AzureCLI
  - AppServiceドメイン
private: false
updated_at: '2024-01-17T08:32:24+09:00'
id: 80a03c3b8a6e1cbe2765
organization_url_name: oec
slide: false
ignorePublish: false
---
# 本記事について

サブスクリプションやロールに対する権限がないユーザーでドメインを取得しようとした際、何度もつまづいたので備忘録として残しておく。

# 結論

- リソースプロバイダー `Microsoft.DomainRegistration` を登録する
- カスタムロールを作成し、以下権限を許可して対象ユーザーに割り当てる
  - `Microsoft.DomainRegistration/domains/providers/locks/write`
  - `Microsoft.DomainRegistration/domains/write`
  - `Microsoft.Network/dnszones/providers/locks/write`
  - `Microsoft.Network/dnszones/write`
  - `Microsoft.DomainRegistration/checkDomainAvailability/action`
- Azure CLI で実行する ([`az appservice domain create`](https://learn.microsoft.com/ja-jp/cli/azure/appservice/domain?view=azure-cli-latest))

# 試行錯誤の足跡

まずは、Azure Portal でドメイン取得を試みた。
App Service ドメイン にアクセスして項目を入力中、エラー発生。

:::note alert
リソースプロバイダー Microsoft.DomainRegistration はサブスクリプション XXXX に登録されておらず、サブスクリプション XXXX のリソースプロバイダーを登録するためのアクセス許可がありません
:::

以下リソースプロバイダーの登録をサブスクリプション管理者に依頼し、解決。

- `Microsoft.DomainRegistration`

具体的な手順は以下参考

https://learn.microsoft.com/ja-jp/azure/azure-resource-manager/management/resource-providers-and-types

改めて Azure Portal に戻り、項目を入力中、再度別のエラーが発生。

:::note alert
次のアクセス許可
(Microsoft.DomainRegistration/domains/providers/locks/write,
Microsoft.DomainRegistration/domains/write,
Microsoft.Network/dnszones/providers/locks/write,
Microsoft.Network/dnszones/write)がすべてないと、このサブスクリプション内にリソースを作成できません
:::

必要な権限を割り当ててもらうため、以下で対象となる組み込みロールを探した。

https://learn.microsoft.com/ja-jp/azure/role-based-access-control/built-in-roles

しかし `Microsoft.DomainRegistration` に対応する組み込みロールが見つからなかったので、以下を依頼した。

- カスタムロールの作成
- 以下権限を許可
  - `Microsoft.DomainRegistration/domains/providers/locks/write`
  - `Microsoft.DomainRegistration/domains/write`
  - `Microsoft.Network/dnszones/providers/locks/write`
  - `Microsoft.Network/dnszones/write`
- ユーザーへの割り当て

具体的な手順は以下参考

https://learn.microsoft.com/ja-jp/azure/role-based-access-control/custom-roles

これで Azure Portal 上のエラーは解消。

必要な内容を入力していくが、ドメインを指定する部分の挙動がどうもおかしい。
具体的には、空きドメインを指定しても以下の警告が出る。

:::note warn
このドメインは使用できません。使用可能な類似のドメインをいくつかこちらに表示します。
:::

<details><summary>Azure Portal イメージ</summary>

![Screenshot 2024-01-16 9.17.47.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/c251b375-8f1b-d336-2445-ad599a085785.jpeg)
> ↑ 記事掲載のイメージ画像のため`example.com`になっているが、空きドメインを入れても同じ警告が出ていた。

</details>

下部に提示されたドメインを直接入力しても、なぜか警告は消えない。
仕方なく`使用できるドメイン`から選択してチェックボックスを入れ、次に進む。

連絡先情報、詳細、タグを入力し、確認および作成に移るも、
`検証中` という表示のまま動かない。

以前 [Azure Portal だと設定が行えなかったが、Azure CLI なら問題なく行えたケースがあった](https://qiita.com/SF-28/items/75ab84f53c52f313d915)ので、今回も試してみることに。

https://learn.microsoft.com/ja-jp/cli/azure/appservice/domain?view=azure-cli-latest

[上記記事中のリンク](https://github.com/AzureAppServiceCLI/appservice_domains_templates/blob/master/contact_info.json)を参考に、`contact_info.json`を作成して、以下コマンドを実行。

```sh
az appservice domain create --contact-info=@contact_info.json \
  --hostname <取得したいドメイン> \
  --resource-group <リソースグループ名> \
  --accept-terms \
  --tags <キー>=<バリュー>
```

すると、以下エラーが発生。

:::note alert
(AuthorizationFailed) The client 'xxxxxx' with object id 'xxxxxx' does not have authorization to perform action 'Microsoft.DomainRegistration/checkDomainAvailability/action' over scope '/subscriptions/xxxxxx' or the scope is invalid. If access was recently granted, please refresh your credentials.
Code: AuthorizationFailed
Message: The client 'xxxxxx' with object id 'xxxxxx' does not have authorization to perform action 'Microsoft.DomainRegistration/checkDomainAvailability/action' over scope '/subscriptions/xxxxxx' or the scope is invalid. If access was recently granted, please refresh your credentials.
:::

どうやら、必要な権限がまだ不足していた様子。
`Microsoft.DomainRegistration/checkDomainAvailability/action` をカスタムロールで追加設定してもらうよう依頼。

完了後、再度コマンドを実行することで、ついにドメインを取得することができた！

ちなみに Azure CLI から取得できたドメインは、(権限付与された後でも) Azure Portal 上では `このドメインは使用できません` と警告されて指定できなかった。

上記挙動から、現時点でドメイン取得を考える際には Azure CLI のほうが良さそう。

# 最後に

可能なら強い権限を持ったユーザーで実施することを勧めます。

# 参考

https://learn.microsoft.com/ja-jp/azure/app-service/manage-custom-dns-buy-domain

https://learn.microsoft.com/ja-jp/cli/azure/appservice/domain?view=azure-cli-latest

https://learn.microsoft.com/ja-jp/azure/azure-resource-manager/management/resource-providers-and-types

https://learn.microsoft.com/ja-jp/azure/role-based-access-control/resource-provider-operations

https://learn.microsoft.com/ja-jp/azure/role-based-access-control/built-in-roles

https://learn.microsoft.com/ja-jp/azure/role-based-access-control/custom-roles

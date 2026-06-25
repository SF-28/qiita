---
title: Azure API Management stv2 用の NetworkSecurityGroup を作成する
tags:
  - Azure
  - SecurityGroup
  - AzureCLI
  - ApiManagement
  - stv2
private: false
updated_at: '2024-01-04T11:30:46+09:00'
id: 75ab84f53c52f313d915
organization_url_name: oec
slide: false
ignorePublish: false
---
# この記事について

 Azure API Management (APIM) を VNet でホストする場合、特定の通信を許可するようにNetwork Security Group (NSG) を設定する必要がある。

今回、Azure Portal 上から APIM stv2 用の NSG を作成しようとしたらつまずいたので、備忘録として残しておく。

# APIM 用の NSG で許可すべきルールについて

公式ページに具体的な設定項目が示されている。

[仮想ネットワークの構成のリファレンス: API Management](https://learn.microsoft.com/ja-jp/azure/api-management/virtual-network-reference?tabs=stv2)

![Screenshot 2023-12-28 13.52.47.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/55e87f03-eca7-1b33-ccda-262cec33d613.jpeg)

![Screenshot 2023-12-28 13.53.06.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/4328e930-02c3-2fdf-a5ee-e39fa3a5fa18.jpeg)

ソース/ターゲットはサービスタグで統一されている。

# つまずきポイント

Azure Portal から NSG の 受信/送信セキュリティ規則 を作成しようとすると、ほとんどのサービスタグが選べない。

![Screenshot 2023-12-28 13.39.17.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/9daeced8-71fd-5374-0218-41a51acc73bb.jpeg)
↑ Internet, VirtualNetwork, AzureLoadBalancer しか選択肢に出てこない

直接入力もできないため、「ApiManagement」などのサービスタグが使えない。

# 解決策

Azure CLI を使ってルールを作成することはできた

```shMyResourceGroup=oecms-dev00001
MyNetworkSecurityGroup=oecms-aoai-api-nsg

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n ClientToVnet --protocol Tcp --priority 100 --source-address-prefixes Internet --destination-address-prefixes VirtualNetwork --destination-port-ranges 443 --direction Inbound --access Allow --description "API Management へのクライアント通信"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n ApiManagementToEndpoint --priority 200 --source-address-prefixes ApiManagement --destination-address-prefixes VirtualNetwork --destination-port-ranges 3443 --direction Inbound --access Allow --protocol Tcp --description "Azure Portal と PowerShell 用の管理エンドポイント"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToStorage --protocol Tcp --priority 300 --source-address-prefixes VirtualNetwork --destination-address-prefixes Storage --destination-port-ranges 443 --direction Outbound --access Allow --description "Azure Storage への依存関係"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToActiveDirectory --protocol Tcp --priority 400 --source-address-prefixes VirtualNetwork --destination-address-prefixes AzureActiveDirectory --destination-port-ranges 443 --direction Outbound --access Allow --description "Microsoft Entra ID、Microsoft Graph、 Azure Key Vault の依存関係"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToAzureConnectors --protocol Tcp --priority 500 --source-address-prefixes VirtualNetwork --destination-address-prefixes AzureConnectors --destination-port-ranges 443 --direction Outbound --access Allow --description "マネージド接続 の依存関係"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToSql --protocol Tcp --priority 600 --source-address-prefixes VirtualNetwork --destination-address-prefixes Sql --destination-port-ranges 1443 --direction Outbound --access Allow --description "Azure SQL エンドポイントへのアクセス"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToKeyVault --protocol Tcp --priority 700 --source-address-prefixes VirtualNetwork --destination-address-prefixes AzureKeyVault --destination-port-ranges 443 --direction Outbound --access Allow --description "Azure Key Vault へのアクセス"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToEventHub --protocol Tcp --priority 800 --source-address-prefixes VirtualNetwork --destination-address-prefixes EventHub --destination-port-ranges 5671 5672 443 --direction Outbound --access Allow --description "Azure Event Hubs へのログ ポリシーおよび Azure Monitor の依存関係"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToStorageForGit --protocol Tcp --priority 900 --source-address-prefixes VirtualNetwork --destination-address-prefixes Storage --destination-port-ranges 445 --direction Outbound --access Allow --description "Git のための Azure ファイル共有への依存関係"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToMonitor --protocol Tcp --priority 1000 --source-address-prefixes VirtualNetwork --destination-address-prefixes AzureMonitor --destination-port-ranges 1886 443 --direction Outbound --access Allow --description "診断ログとメトリック、リソース正常性、アプリケーション インサイトの発行"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToExternalRedisInbound --protocol Tcp --priority 1100 --source-address-prefixes VirtualNetwork --destination-address-prefixes VirtualNetwork --destination-port-ranges 6380 --direction Inbound --access Allow --description "マシン間のキャッシュ ポリシーのために外部の Azure Cache for Redis サービスにアクセスする"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToExternalRedisOutbound --protocol Tcp --priority 1100 --source-address-prefixes VirtualNetwork --destination-address-prefixes VirtualNetwork --destination-port-ranges 6380 --direction Outbound --access Allow --description "マシン間のキャッシュ ポリシーのために外部の Azure Cache for Redis サービスにアクセスする"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToInternalRedisInbound --protocol Tcp --priority 1200 --source-address-prefixes VirtualNetwork --destination-address-prefixes VirtualNetwork --destination-port-ranges 6381-6383 --direction Inbound --access Allow --description "マシン間のキャッシュ ポリシーのために内部の Azure Cache for Redis サービスにアクセスする"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToInternalRedisOutbound --protocol Tcp --priority 1200 --source-address-prefixes VirtualNetwork --destination-address-prefixes VirtualNetwork --destination-port-ranges 6381-6383 --direction Outbound --access Allow --description "マシン間のキャッシュ ポリシーのために内部の Azure Cache for Redis サービスにアクセスする"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToRateLimitInbound --protocol Tcp --priority 1300 --source-address-prefixes VirtualNetwork --destination-address-prefixes VirtualNetwork --destination-port-ranges 4290 --direction Inbound --access Allow --description "マシン間のレート制限ポリシーのために同期カウンターにアクセスする"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n VNetToRateLimitOutbound --protocol Tcp --priority 1300 --source-address-prefixes VirtualNetwork --destination-address-prefixes VirtualNetwork --destination-port-ranges 4290 --direction Outbound --access Allow --description "マシン間のレート制限ポリシーのために同期カウンターにアクセスする"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n LoadBalancerToVnet --protocol Tcp --priority 1400 --source-address-prefixes AzureLoadBalancer --destination-address-prefixes VirtualNetwork --destination-port-ranges 6390 --direction Inbound --access Allow --description "Azure インフラストラクチャの Load Balancer"

az network nsg rule create -g $MyResourceGroup --nsg-name $MyNetworkSecurityGroup -n TrafficManagerToVnet --protocol Tcp --priority 1500 --source-address-prefixes AzureTrafficManager --destination-address-prefixes VirtualNetwork --destination-port-ranges 443 --direction Inbound --access Allow --description "複数リージョンへのデプロイ用の Azure Traffic Manager ルーティング"
```

# オマケ

[仮想ネットワーク サービス タグ](https://learn.microsoft.com/ja-jp/azure/virtual-network/service-tags-overview) のページにあった以下記載で迷うことになった。

![Screenshot 2023-12-28 13.44.39.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1666407/c8c5e0ec-5a9a-e5ab-6f88-bc99cab6d104.jpeg)

ちょうど Azure Portal 上で確認できるサービスタグと一致していたし、意図せずクラシックデプロイモデルを使っていたのか？という方向で調査して時間を使ってしまった。

# 雑感

Azure は不慣れなのでとりあえず Portalから〜と安易に考えていたが、しっかり Terraform で管理しようと思った

---
title: AWS Certified Solutions Architect - Professional (SAP-C02) 合格体験記
tags:
  - AWS認定ソリューションアーキテクト
  - 試験勉強
  - AWS認定試験
  - AWS認定ソリューションアーキテクトプロフェッショナル
private: false
updated_at: '2023-12-19T08:32:59+09:00'
id: 0537b8c9601f93878bcb
organization_url_name: oec
slide: false
ignorePublish: false
---
# この記事について

この度 AWS Certified Solutions Architect - Professional (SAP-C02)　を受験し、
無事合格しました!

https://www.credly.com/badges/84190c29-5866-40bf-8ea7-b87ce22efd7c/public_url

これから受験を考えている方に向けて、自身の体験をまとめたいと思います。

# Solutions Architect - Professional について

基本的に Solutions Architect - Associate の上位という位置付けなので、未取得の方はそちらから取得することをオススメします。([AWS認定パス](https://d1.awsstatic.com/training-and-certification/docs/AWS_certification_paths.pdf
) でも、Cloud Practitioner から順に取得することが奨められています)

Associate との比較ですが、**セキュリティ、コスト、パフォーマンスなどの要件を踏まえて最適なアーキテクチャを選択できる力** を求められる点が大きな違いです。

サンプル問題を見比べると分かりやすいのですが、Associate では技術的な条件から選択肢を1つに絞り込める問題が多い一方、Professional では様々な要件を加味した上で最適な選択肢を選ばせることが多いです。

そのため出題文も長くなる傾向にありますが、180分で75問を解かねばならないので、長文から素早く正確に要件を把握して、的確に選択肢を絞り込む力がより重要になってきます。

# はじめに

何はともあれ、まずは公式ページの情報確認からです。

https://aws.amazon.com/jp/certification/certified-solutions-architect-professional/

以下項目について記載があります。

- ターゲットとなる受験者像
- 試験ガイド
- サンプル問題
- 公式練習問題集
- デジタルトレーニング

特に試験ガイドやサンプル問題は、難易度や出題傾向を確認する上で役立ちますので、しっかり目を通しておきましょう。学習前の試金石としても有用だと感じます。

公式練習問題集は貴重な無料の模擬試験(20問)なので、学習後の理解度確認用に取っておくと良いと思います。

# 学習方法

大きく以下のプロセスで学習しました。

1. 対象範囲全体を満遍なく学習する
1. 問題を解く
1. 回答・解説を確認する
1. 理解が曖昧な部分について追加で学習する
1. 2に戻る

１問のボリュームが多いので、2~5 は細かく回すのが効果的だと思います。
素早くフィードバックを得られることで、モチベーションアップにも繋がります。

言うまでもなく、実際にサービスに触れてみることが一番の学びになります。とりあえずマネコンで開いて設定項目を眺めてみるだけでも、理解度が変わってくると思います。

ただ、AWS Outposts や Direct Connect など手が出しにくい(出せない)サービスも多いので、そこは座学で頑張りました。

## 利用した書籍やサイト

- [AWS認定資格試験テキスト＆問題集　AWS認定ソリューションアーキテクト - プロフェッショナル　改訂第2版 (ＡＷＳ認定資格試験テキスト)](https://www.amazon.co.jp/AWS%E8%AA%8D%E5%AE%9A%E8%B3%87%E6%A0%BC%E8%A9%A6%E9%A8%93%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%EF%BC%86%E5%95%8F%E9%A1%8C%E9%9B%86-AWS%E8%AA%8D%E5%AE%9A%E3%82%BD%E3%83%AA%E3%83%A5%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E3%82%A2%E3%83%BC%E3%82%AD%E3%83%86%E3%82%AF%E3%83%88-%E3%83%97%E3%83%AD%E3%83%95%E3%82%A7%E3%83%83%E3%82%B7%E3%83%A7%E3%83%8A%E3%83%AB-%E6%94%B9%E8%A8%82%E7%AC%AC2%E7%89%88-%EF%BC%A1%EF%BC%B7%EF%BC%B3%E8%AA%8D%E5%AE%9A%E8%B3%87%E6%A0%BC%E8%A9%A6%E9%A8%93%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88-%E5%B1%B1%E4%B8%8B%E5%85%89%E6%B4%8B/dp/4815617929/ref=asc_df_4815617929/?tag=jpgo-22&linkCode=df0&hvadid=624450295427&hvpos=&hvnetw=g&hvrand=15711623235114021595&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=1009769&hvtargid=pla-1945183960042&psc=1&mcid=bec0989a96ff335a96ebbf1bdaa8cd61&th=1&psc=1)
    - これだけ読めばバッチリ！という感じではありませんでしたが、しっかりと押さえておきたい内容が詰め込まれていたと思います。
    - 問題も多く収録されていて、理解度を確認できる点が良かったです。
    - 問題難易度：易しめ
- [Skill Builder | Exam Readiness: AWS Certified Solutions Architect – Professional (Japanese) (Sub) 日本語字幕版](https://explore.skillbuilder.aws/learn/course/779/exam-readiness-aws-certified-solutions-architect-professional-japanese-sub-ri-ben-yu-zi-mu-ban)
    - 公式の試験準備コンテンツ(無料)。
    - 試験に臨むにあたり必要な知識が備わっているか？を確認できます。
    - 問題難易度：難しめ
- [AWS Certified Solutions Architect – Professional Official Practice Question Set (SAP-C02 - Japanese)](https://explore.skillbuilder.aws/learn/course/13272/aws-certified-solutions-architect-professional-official-practice-question-set-sap-c02-japanese)
    - 公式問題集(無料)。
    - 20問限定ですが、模擬試験感覚で利用できます。
    - １問解くのにかかる時間も表示されるので、スピード感を掴みやすいです。
    - 問題難易度：適切
- その他
    - 公式ドキュメント 多数
    - 個別のサービスに関する記事 多数

上記だけだと演習が不足している感じは否めないので、他サービスを活用すると尚良いと思います。

# 問題の解き方

1. 問題文から要件に関わる情報を素早く抜き出します。
2. その要件に照らし合わせて、明らかにNGな部分がある選択肢を候補から除外します。
3. 残った選択肢を吟味し、より要件に合っていると感じる選択肢を選びます。

王道の消去法で解きました。
大体２択まではすぐ絞り込めるのですが、そこから先が勝負どころです。

「要件を満たすこと」が最重要なのであって、「ベストプラクティスに則ること」が必ずしも正解ではない、というのが難しいところです。

特定項目についての厳しい要件を満たすため一部項目をトレードオフするような選択肢も、要件に合致していれば候補となりえます。

# さいごに

AWSの上位資格ということもあり、相応の難易度だと感じました。

試験では要件が決まった状態で最適なアーキテクチャについて問われますが、実務では要件を定める段階から関わっていくケースもあると思います。

そのようなケースでも、本試験で学習するような引き出しを多くもっておくことは、より良い提案に繋げるために有用だと感じました。

本記事が、合格を目指す方の一助になれば幸いです。

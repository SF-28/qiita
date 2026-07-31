---
title: Graph Engineeringから考える、Agentシステム設計で大切なこと
tags:
  - AI
  - LLM
  - AIエージェント
  - LangGraph
  - 設計
private: true
updated_at:
id:
organization_url_name: null
slide: false
ignorePublish: false
posting_campaign_uuid: null
agreed_posting_campaign_term: false
---

最近、AIエージェント開発の文脈で `Graph Engineering` という言葉を見かけるようになった。

2026年7月には「LoopからGraphへ移ったのか」という議論が実務家の間で注目され、LangChainもGraph Engineeringをテーマにした記事を公開している。ただし、その記事自身が、AgentシステムをGraphとして表現する考え方は以前から存在しており、Graph Engineeringは新しい名前であって新しい発想ではないと説明している。([langchain.com][1])

当初は、次のような技術を想像していた。

> 複数のAgentをNodeとして接続すれば、単一のAgent Loopよりも自律性が高まり、人間の手離れも良くなるのではないか。

しかし、関連する研究や実装の歴史を追ってみると、それほど単純な進化関係ではなかった。

Graph Engineeringは、Agentをさらに自由に動かすためだけの考え方ではない。むしろ、Agent、ツール、通常プログラム、検証、人間の判断などを含む複雑なシステムについて、その実行構造自体を設計・観測・評価・改善の対象として扱う視点だと考えると理解しやすい。

---

## Graph Engineeringという言葉はまだ定まっていない

今回確認した範囲では、AIエージェント分野における `Graph Engineering` に、広く合意された定義や標準仕様は見つけられなかった。

実際、現在の資料でも扱う範囲には違いがある。

LangChainは、単一Agentの循環的な処理や、通常プログラムとAgentを組み合わせた実行構造も含めて、AgentシステムをGraphとして表現する考え方をGraph Engineeringと呼んでいる。([langchain.com][1])

一方、コミュニティ資料の `Awesome Graph Engineering` は、Graph Engineeringを新興の非標準用語と明記したうえで、複数の独立したAgent、明示的な協調関係、検査可能なGraph構造を最低条件とする、より狭い作業定義を採用している。([GitHub][2])

つまり、現時点では次のような点も統一されていない。

* 単一Agent内部のGraphを含めるか
* 複数Agentが必須か
* 設計図としてのGraphまで含めるか
* 実行可能なGraphだけを対象とするか
* 固定Graphだけでなく、動的に生成されるGraphも含めるか

そのため、本記事では特定の定義を正解とはせず、次のように広く捉える。

> LLMを含む実行システムの構成要素と関係をGraphとして表し、その構造を設計・実行・観測・評価・改善する実践。

---

## 言葉は新しいが、背景にある技術は新しくない

Graph Engineeringという呼称が注目されたのは最近だが、その背景にある技術は段階的に発展してきた。

単純な一本道ではないものの、大まかには次のような関心の広がりとして見ることができる。

```text
単一Agentの思考と行動
        ↓
複数Agentやツールの協調
        ↓
Stateを持つ長時間・循環的な実行
        ↓
実行構造自体の評価・最適化
```

### Agent Loop

2022年に公開されたReActは、LLMによる推論と外部環境に対する行動を交互に実行する方法を示した。

Agentが状況を観察し、考え、ツールを使い、その結果を再び観察するという現在のAgent Loopにつながる代表的な研究である。([アーカイブ][3])

```text
考える
  ↓
行動する
  ↓
結果を観察する
  ↓
再び考える
```

この構造では、次に何をするかの大部分を一つのモデルが判断する。

柔軟性は高い一方、すべての判断をモデルへ委ねるため、特定の順序を守らせたい場合や、権限・検証・停止条件を厳密に制御したい場合には、追加の仕組みが必要になる。

### Multi-Agentの協調

2023年に公開されたAutoGenは、LLM、ツール、人間などを組み合わせた複数Agentが、会話を通じて協調するフレームワークを提示した。

固定された対話順序だけでなく、LLMが次に呼ぶAgentを選択する動的な構成も扱っている。([アーカイブ][4])

同年のDyLANは、Agentをネットワーク上のNode、Agent間のメッセージをEdgeとして表現し、タスクに応じたAgent選択や早期停止によって、協調構造を動的に変える方法を研究している。([アーカイブ][5])

この段階になると、問題は個々のAgentの能力だけではなくなる。

* どのAgentを参加させるか
* 誰が誰へ情報を渡すか
* どの順序で処理するか
* どこで合意・検証するか
* いつ処理を終了するか

といった、Agent間の関係もシステム性能を左右する。

### StatefulなGraph Runtime

LangGraphは2024年1月に、Agent Runtimeで必要となる循環的な処理を、共有State、Node、Edgeを持つGraphとして構築するために公開された。

単純なAgent Loopへすべての判断を任せるのではなく、特定のツールを先に呼ばせる、状態に応じてPromptを変える、人間の確認を挟むといった制御を加えやすくすることが、当初からの目的として説明されている。([langchain.com][6])

ここで重要なのは、Graphが必ずしもDAGではないことだ。

Agentシステムでは、再試行、追加調査、修正、ユーザーへの確認などが必要になるため、実際のGraphには循環が含まれることが多い。LangChainも、Agent Graphは一般にDAGとは限らず、Loopは循環Graphの単純な形として捉えられると説明している。([langchain.com][1])

### Graph構造自体の最適化

2024年にICMLで発表されたGPTSwarmは、LLM呼び出しやツール利用をNode、処理や通信の関係をEdgeとして表し、Agentや複数Agentの構成を最適化可能なGraphとして扱った。

Promptだけでなく、NodeやEdge、Agent間の接続構造そのものを、進化的手法や強化学習などによって改善する方向性を示している。([アーカイブ][7])

2026年のWorkflow Optimizationに関するサーベイでは、LLM呼び出し、検索、ツール利用、コード実行、メモリ更新、検証などを組み合わせたWorkflowを `Agentic Computation Graph` として統一的に整理している。

そこでは、固定されたGraphだけでなく、実行前にGraphを生成・選択する方法や、実行途中に構造を変更する方法まで研究対象に含まれている。([アーカイブ][8])

この流れを踏まえると、Graph Engineeringは突然生まれた新技術というより、

> Agent Loop、Multi-Agent協調、Stateful Workflow、Workflow構造の最適化といった流れを、Graphという共通の視点で捉え直す動き

と理解するのが近そうだ。

---

## なぜ今、Graph Engineeringが注目されたのか

初期のAgentでは、一つのモデルがツールを使いながらLoopを回す構成でも、多くのことを試せた。

しかし、Agentシステムが実務へ広がるにつれて、次のような構成が増えている。

* LLMによる意味判断
* 通常プログラムによる確定的な処理
* 検索やコード実行などのツール
* 長時間処理のためのStateやMemory
* 専門性の異なるAgent
* 出力を確認するVerifier
* 人間による承認
* 失敗時の再試行やエスカレーション

2026年のWorkflow Optimizationサーベイも、現在のAgentシステムでは、個々のモデル呼び出しだけでなく、何を、いつ呼び、どのように情報を流すかというWorkflow構造が、品質と効率の双方へ影響すると整理している。([アーカイブ][8])

さらに、LangChainは最近の変化として、GraphのNodeに単純なLLM呼び出しだけでなく、独自のLoopを持つAgent全体を配置できるようになったことを挙げている。

つまり、現在は「処理をGraphにする」だけでなく、`自律的に動くAgent同士をGraphとして組み合わせる` ことが現実的な選択肢になりつつある。([langchain.com][1])

この複雑化によって、関心の対象がAgent単体からシステム全体へ広がった。

```text
Agent単体をどう賢くするか
        ↓
Agentや処理をどう組み合わせるか
        ↓
その構造をどう観測・評価・改善するか
```

これが、Graph Engineeringという言葉が今あらためて注目されている背景だと考えられる。

---

## Graph Engineeringの目的をどう捉えるか

Graph Engineeringの目的は、単にNodeやAgentを増やすことではない。

本記事では、次のように捉えている。

> Agentシステムの実行構造を第一級の設計対象とし、Agent、通常プログラム、ツール、State、検証、人間判断を、適切な関係と境界で組み合わせること。

概念的には、次のような構成になる。

```mermaid
flowchart LR
    A[入力] --> B[分類・計画]
    B --> C[Agent Loop]
    B --> D[通常プログラム]

    C --> E[検証Gate]
    D --> E

    E -->|再実行| C
    E -->|要確認| F[人間による判断]
    E -->|合格| G[結果出力]
    F --> G
```

このGraphには、異なる性質の処理が混在している。

* 曖昧な意味判断はLLMへ任せる
* 厳密な計算や検証は通常プログラムへ任せる
* Agentには必要な範囲だけ自律性を与える
* 重要な処理には検証や人間承認を置く
* Stateを使って中断・再開や再試行を管理する

Graph Engineeringの価値は、Agentを増やすことよりも、`どこへ、どの程度の自律性を配置するか` をシステム全体で考えられることにある。

---

## Graphを設計対象にすることで期待できること

以下は、Graphを採用すれば自動的に実現する効果ではない。

Graphと実行基盤を適切に設計した場合に、取り組みやすくなることとして整理する。

### システム構造に起因する問題を扱える

Agentシステムの失敗は、個々のPromptやモデル能力だけが原因とは限らない。

たとえば、次のような問題が考えられる。

* 必要な情報が後続Agentへ渡らない
* 同じ処理が複数Agentで重複する
* Verifierが必要な場所に存在しない
* 誤ったAgentへタスクが割り当てられる
* 終了条件が不適切で処理が続きすぎる
* 一つのAgentへ権限や責務が集中しすぎる

2025年のMulti-Agent System Failure Taxonomyに関する研究では、複数のMulti-Agentフレームワークの実行Traceを分析し、システム設計、Agent間の不整合、タスク検証に関する失敗パターンを分類している。([アーカイブ][9])

このような失敗は、個々のPromptを改善するだけでは解消できない可能性がある。

Graphとして関係を表現すれば、問題をNode単体ではなく、情報経路、役割分担、検証位置、終了条件などの構造から分析できる。

### 決定的処理とAgent処理を組み合わせやすい

AgentシステムのすべてをLLMへ任せる必要はない。

* Schema検証
* 数値計算
* ファイル存在確認
* テスト実行
* 権限チェック
* 集計
* 条件判定

といった処理は、通常プログラムの方が低コストで再現性も高い。

LangChainも、Graphを利用する価値の一つとして、モデルによる推論が必要な箇所と、コードで確実に処理すべき箇所を組み合わせられることを挙げている。([langchain.com][1])

Graphとして設計することで、`どこでAgentを使わないか` も明示的に考えやすくなる。

### Stateと責任範囲を明示できる

Nodeごとに次のような境界を定義できる。

* 何を入力として受け取るか
* 何を変更できるか
* どの情報を共有するか
* どの情報を隔離するか
* 何を出力として残すか
* どのNodeが正式な状態を所有するか

Stateの共有方法は一つではない。

共有オブジェクト、ファイル、データベース、成果物への参照、検索可能な外部メモリなどを使える。

重要なのは、すべてを無条件に共有することではなく、`どの情報を、どのNodeへ、どの粒度で渡すか` を設計することである。

### 検証や権限制御を構造へ組み込める

Graphには、Agent以外の処理も含められる。

* 自動テスト
* Schema検証
* ルールベースのGate
* 独立Reviewer
* 人間承認
* 予算や実行回数の上限

これらを個別の注意事項としてPromptへ書くだけでなく、実行経路を制約する仕組みとして配置できる。

特に、生成するAgentとは別に検証する処理を置くことで、作成者自身だけを最終評価者にしない構成を作れる。

### Workflow構造自体を評価・改善できる

Graph Engineeringの比較的特徴的な視点は、個々のAgentやPromptだけでなく、Workflow構造自体を改善対象にすることだ。

たとえば、次のような変更を比較できる。

* Verifierを追加する
* 不要なAgent間通信を削る
* Agentの実行順序を変える
* 一部のNodeを通常プログラムへ置き換える
* タスクに応じて使用するSubgraphを変える
* 低価値なAgentを実行時に除外する

2026年のサーベイでは、Workflowを再利用可能なテンプレート、実行ごとに具体化されたGraph、実際の実行Traceへ分け、品質、コスト、堅牢性、構造変化を評価する枠組みを提示している。([アーカイブ][8])

つまり、Graphは単なる実装形式ではなく、`測定して改善できる成果物` になり得る。

---

## 過大評価もしない、過小評価もしない

Graph Engineeringを評価するうえでは、両方向の誤解を避ける必要がある。

### Graphにすれば手離れが良くなるわけではない

Graphは実行構造であり、個々のAgentの能力を自動的に高めるものではない。

不適切なAgent、曖昧な責務、弱い検証を接続すれば、失敗が複雑化するだけかもしれない。

LangChain自身も、汎用的なDeep Researchのように、事前に処理経路を決めにくいタスクでは、定義済みGraphから、計画・委譲・Context管理をAgentへ任せる構成へ移行した事例を紹介している。([langchain.com][1])

Graphは、自由度を下げる代わりに制御を得る場合もあれば、動的なRoutingによって自由度を残す場合もある。

どちらが適切かは、タスクによって異なる。

### Multi-Agentにすれば品質が上がるわけではない

複数Agentは、専門化、並列化、独立評価などの価値を持ち得る。

一方で、Multi-Agent Systemの性能向上が小さいケースや、Agent間の情報欠落、役割逸脱、重複実行、検証不足などの失敗も報告されている。([アーカイブ][9])

AnthropicのMulti-Agent Researchシステムでは、並列調査や単一Context Windowを超える情報量を扱える利点が得られた一方、同社の計測条件では通常のチャットより大幅に多くのトークンを使用した。

また、すべてのAgentが同じContextを必要とするタスクや、Agent間の依存関係が多いタスクには向きにくいと報告している。([Anthropic][10])

ただし、これは特定のResearchシステムにおける結果であり、Graph Engineering全般のコストを示すものではない。

消費量は、主に次の設計で変わる。

* LLMを使うNodeの数
* 各Nodeへ渡すContext量
* 再試行回数
* Agent間の通信量
* 評価・統合処理の数
* 通常プログラムへ切り出した範囲

### Contextの分断や膨張は必然ではない

Node間でContextを共有できないわけではない。

共有Stateや外部成果物を使えば、必要な情報を引き継げる。

一方で、すべてのNodeへ大量の情報を渡せば入力が増え、要約しすぎれば必要な背景が失われる可能性がある。

これはGraph固有の欠陥というより、複数の実行単位を持つシステム全般におけるContext設計の問題である。

Anthropicも、大きな成果物をファイルなどへ保存し、Agent間では軽量な参照を渡すことで、情報損失とトークン転送を抑える方法を紹介している。([Anthropic][10])

### 一方で、単なるWorkflowの言い換えでもない

Graph、State、Workflow、Multi-Agentといった個々の技術は以前から存在する。

その意味で、Graph Engineeringを完全に新しい技術分野と捉えるのは難しい。

ただし、現在の議論では、次の点が一つの視点としてまとめられている。

* Agent全体をNodeとして扱う
* Agent間の関係を契約として設計する
* 固定構造と動的構造を混在させる
* 実行Traceから構造を評価する
* Graph自体を生成・選択・最適化する

特に、Workflow構造そのものを品質とコストの最適化対象として扱う研究は増えている。([アーカイブ][8])

したがって、Graph Engineeringを「既存技術の名前を変えただけ」と切り捨てるのも、やや狭い見方になる。

---

## Graph Engineeringを通じて重要性を再認識したこと

Graph Engineeringを調べる中で、Agentシステムを設計するうえで、改めて重要だと感じた考え方がいくつもあった。

いずれも完全に新しいものではなく、ソフトウェア設計、Workflow、分散システム、Agent Engineeringなどで扱われてきた考え方である。

ただ、非決定的なAgentや複数の処理を接続する構造として捉え直すことで、その重要性がより具体的に見えてきた。

### 1. 責務と権限を明確にする

各Agentについて、何を担当するかだけでなく、何を担当しないかも定義する。

```yaml
responsibility:
  - 認証・認可の問題を確認する
  - 根拠となるコード位置を示す

out_of_scope:
  - 命名の改善
  - 一般的なリファクタリング

permissions:
  - read
  - search
```

Agentを分離するなら、役割だけでなく、Context、ツール、変更権限、判断権限の境界にも意味が必要になる。

### 2. 入力範囲を明示する

Agentが参照する情報を、無制限にしない。

```yaml
inputs:
  required:
    - target-diff
    - acceptance-criteria

  optional:
    - architecture-document

  excluded:
    - unrelated-projects
```

入力範囲を定めることで、不要な探索を減らし、何を根拠に判断したのかも追いやすくなる。

### 3. 出力を契約として扱う

後続処理が利用する出力には、必要な項目を定義する。

```json
{
  "decision": "needs_revision",
  "findings": [
    {
      "severity": "high",
      "claim": "権限確認が不足している",
      "evidence": "src/auth/service.ts:84"
    }
  ],
  "unknowns": [],
  "next_actions": [
    "管理者権限の検証を追加する"
  ]
}
```

必ずしもJSONである必要はない。

人間が読む成果物なら、必須見出しを持つMarkdownテンプレートでもよい。

重要なのは、後続のAgentやプログラムが、出力の意味を毎回推測しなくてよいことである。

### 4. Stateの所有者と保存場所を決める

目的、進捗、判断、根拠、未解決事項を、会話履歴だけに依存させない。

```yaml
goal: 変更内容の安全性を確認する
status: in_progress

completed:
  - authentication-review

remaining:
  - authorization-review

decisions:
  - 管理者操作を追加検証する
```

そのうえで、どの情報が正式なStateなのか、どのNodeが更新できるのかを定める。

### 5. 完了条件と停止条件を定義する

Agentには開始条件だけでなく、終了条件も必要になる。

* 何が揃えば完了か
* 何回まで再試行するか
* 進展がない場合にどう停止するか
* どの条件で人間へ判断を戻すか
* どの失敗を許容しないか

Agentの自律性を高めることと、無制限な探索や反復を許すことは別である。

### 6. LLMを使う場所を選ぶ

意味理解、仮説生成、曖昧な評価はLLMに向いている。

一方、型検証、計算、テスト、集計、存在確認、権限判定などは通常プログラムで処理できる。

```text
意味理解・仮説生成・曖昧な評価
→ LLM

型検証・計算・テスト・条件判定
→ 通常プログラム
```

Nodeを増やす場合、すべてをLLM Nodeにしてしまうと、コストと不確実性も積み重なる。

### 7. Agentを分ける理由を明確にする

Agentを分けること自体に価値はない。

次のような理由がある場合に、分離を検討する。

* 異なる専門性が必要
* 異なるContextを持たせたい
* 異なるツールや権限を与えたい
* 独立した評価に意味がある
* 並列化による効果が期待できる
* 失敗や影響範囲を局所化したい

理由を説明できなければ、単一AgentのLoopや通常プログラムの方が単純である可能性が高い。

### 8. Agent単体ではなくシステム全体を評価する

個々のAgentの出力だけでなく、次のような指標も見る必要がある。

* どの経路を通ったか
* 何回再試行したか
* どこで失敗したか
* Agent間で何を受け渡したか
* どのNodeがコストを使ったか
* Verifierが何を却下したか
* Graph変更によって品質とコストがどう変わったか

Graph Engineeringで特に再認識したのは、Agentシステムでは、`局所的に優秀なAgentを並べること` と `全体として優秀なシステムを作ること` が同じではないという点である。

---

## Graph Engineeringに取り組む価値はあるか

すべてのAgentシステムをGraph化する必要はない。

一方、Graph Engineeringを単なる流行語として無視するのも早いと思う。

次の条件が複数当てはまる場合には、小さなGraphから検証する価値がある。

* 複数の責務や権限境界がある
* 独立した検証や反証が重要
* 並列に処理できる作業がある
* 長時間処理の中断・再開が必要
* 実行経路や判断履歴を追跡したい
* 同じ構造を繰り返し利用する
* 失敗原因がAgent単体ではなく構造にありそう
* 高価値なタスクで、追加コストを正当化できる
* Workflow構造を評価・最適化したい

最初から大規模なMulti-Agent Systemを作る必要はない。

たとえば、次の程度でもGraph的な設計を検証できる。

```mermaid
flowchart LR
    A[生成Agent] -->|構造化された成果物| B[検証処理]
    B -->|合格| C[完了]
    B -->|修正理由| A
    B -->|判断不能| D[人間へ確認]
```

この小さな構成でも、次の論点が現れる。

* Nodeの責務
* 入出力契約
* State管理
* 検証基準
* 再試行回数
* 人間へ戻す条件
* 品質とコストの測定

本番導入は具体的な課題と費用対効果から判断すべきだが、技術検証まで問題が起きるのを待つ必要はない。

---

## 現時点での結論

Graph Engineeringという呼称は新しく、定義もまだ固まっていない。

一方、その背景にあるAgent Loop、Multi-Agent協調、Stateful Workflow、Graph型Runtime、Workflow Optimizationには、すでに一定の研究と実装の蓄積がある。

そのため、Graph Engineeringを、

```text
Loop Engineeringの次に来る万能な自律化手法
```

と捉えるのは適切ではなさそうだ。

LoopとGraphは単純な成熟段階ではなく、扱う問題の範囲が異なる。

* Loopは、一つの実行主体が時間軸上でどう反復するかを扱う
* Graphは、複数の処理や実行主体がどう関係するかを扱う
* 実際のAgentシステムでは、GraphのNode内部でLoopが動く

一方で、Graph Engineeringを既存Workflowの単なる言い換えとして扱うのも不十分である。

現在のGraph Engineeringに関する議論では、Agentを含むWorkflow構造そのものを、設計・観測・評価・生成・最適化の対象として扱う視点が強まっている。

Graphを採用すれば、Agentシステムが自動的に賢く、安全に、安価になるわけではない。

それでも、Agent単体だけでなく、Agent同士の関係、State、権限、検証、コストまで含めてシステムを設計する視点には、十分に取り組む価値がある。

> Graphを作ることを目的にするのではなく、Agentシステムの構造を、どこまで明示・測定・改善する必要があるかを考える。

Graph Engineeringから得た最も重要な示唆は、この問いそのものだと感じている。

---

## 参考リンク

* [3 Years of Graph Engineering with LangGraph](https://www.langchain.com/blog/3-years-of-graph-engineering-with-langgraph)
* [Awesome Graph Engineering](https://github.com/ChaoYue0307/awesome-graph-engineering)
* [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
* [AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation](https://arxiv.org/abs/2308.08155)
* [Dynamic LLM-Agent Network](https://arxiv.org/abs/2310.02170)
* [LangGraph 公開時の記事](https://www.langchain.com/blog/langgraph)
* [GPTSwarm: Language Agents as Optimizable Graphs](https://arxiv.org/abs/2402.16823)
* [From Static Templates to Dynamic Runtime Graphs: A Survey of Workflow Optimization for LLM Agents](https://arxiv.org/abs/2603.22386)
* [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
* [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657)

[1]: https://www.langchain.com/blog/3-years-of-graph-engineering-with-langgraph "3 Years of Graph Engineering with LangGraph"
[2]: https://github.com/ChaoYue0307/awesome-graph-engineering/blob/main/DEFINITION.md?utm_source=chatgpt.com "awesome-graph-engineering/DEFINITION.md at main · ChaoYue0307/awesome-graph-engineering · GitHub"
[3]: https://arxiv.org/pdf/2210.03629v2?utm_source=chatgpt.com "arXiv:2210.03629v2 [cs.CL] 27 Nov 2022"
[4]: https://arxiv.org/abs/2308.08155?utm_source=chatgpt.com "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation"
[5]: https://arxiv.org/pdf/2310.02170v1?utm_source=chatgpt.com "arXiv:2310.02170v1 [cs.CL] 3 Oct 2023"
[6]: https://www.langchain.com/blog/langgraph "LangGraph"
[7]: https://arxiv.org/pdf/2402.16823 "GPTSwarm: Language Agents as Optimizable Graphs"
[8]: https://arxiv.org/html/2603.22386v1 "From Static Templates to Dynamic Runtime Graphs: A Survey of Workflow Optimization for LLM Agents"
[9]: https://arxiv.org/abs/2503.13657?utm_source=chatgpt.com "[2503.13657] Why Do Multi-Agent LLM Systems Fail?"
[10]: https://www.anthropic.com/engineering/multi-agent-research-system?utm_source=chatgpt.com "How we built our multi-agent research system \ Anthropic"

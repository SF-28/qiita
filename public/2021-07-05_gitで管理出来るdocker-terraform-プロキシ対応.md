---
title: Gitで管理出来るDocker+Terraform（プロキシ対応）
tags:
  - Git
  - Docker
  - proxy
  - Terraform
private: false
updated_at: '2021-07-05T14:24:19+09:00'
id: bc716cc68accd7ae91b6
organization_url_name: oec
slide: false
ignorePublish: false
---
## 背景
- インフラもコードで管理してGit管理に乗せたい(IaC)
- 簡単にTerraformを使いたい
- ローカル環境に影響を与えたくない

## 概要
- Terraformを利用できる仮想環境をDockerで作成する
- キー情報などはGit管理に含めない

## 必要なツール

- Docker

## 全ファイル
```
infrastructure
　├ docker-compose.yml
　├ .gitignore
　├ .env.sample
　├ .env
　└ terraform
　 　├ main.tf
　 　└ variables.tf
```

### docker-compose.yml
```yml
version: "3"
services:
  terraform:
    container_name: terraform
    image: hashicorp/terraform
    env_file:
      - .env
    volumes:
      - ./terraform:/terraform
    working_dir: /terraform
    entrypoint: ash
    tty: true
```

### .gitignore
- .env にはAWSのキーなどが含まれるのでGit管理から除外する

```
# env
.env

# Terraform
.terraform
*.tfstate
*.tfstate.backup
```

### .env.sample
- .env 記入用サンプル

```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

HTTP_PROXY=
HTTPS_PROXY=
```

### .env
- .env.sample をコピーして値を記入する
- Git 管理は含まれない

### main.tf

```terraform
provider "aws" {
  region = var.region
}

resource "aws_vpc" "vpc" {
  cidr_block = var.vpc_cidr

  tags = {
    Name = var.vpc_name
  }
}
```


### variables.tf
```terraform
# Define variable in this file.

variable "region" {
  default = "ap-northeast-1"
}

variable "vpc_cidr" {
  default = "172.16.0.0/16"
}

variable "vpc_name" {
    default = "vpc-name"
}
```

## 利用手順

1. .env ファイルを作成して値を入力
1. docker フォルダに入り以下コマンド実行
  `> docker-compose up -d`
  `> docker-compose exec terraform /bin/ash`

1. terraform コマンドを利用可能


## 参考にさせていただいた記事

[DockerでTerraformを使う](https://zenn.dev/nagi125/articles/8d1488ecfc2f5717756b)

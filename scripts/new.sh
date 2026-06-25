#!/bin/bash
set -euo pipefail

if [ $# -eq 0 ]; then
  echo "usage: pnpm new <basename>" >&2
  exit 1
fi

npx qiita new "$1"
sed -i '' 's/^private: false$/private: true/' "public/$1.md"
echo "  → private: true に設定しました"

#!/bin/bash
set -euo pipefail

if [ $# -eq 0 ]; then
  echo "usage: pnpm new <basename>" >&2
  exit 1
fi

DATE=$(date +%Y-%m-%d)
FILENAME="${DATE}_$1"

npx qiita new "$FILENAME"
sed -i '' 's/^private: false$/private: true/' "public/${FILENAME}.md"
echo "  → private: true に設定しました"

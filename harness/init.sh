#!/bin/bash
set -e

# harness/ 配下に置かれるため、どこから起動されてもリポジトリルートを基準に動く
cd "$(dirname "$0")/.."

echo "=== Harness Initialization ==="

echo "=== pnpm install ==="
pnpm install

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read harness/feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"

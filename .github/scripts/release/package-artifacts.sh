#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
mkdir -p .github/reports/release
cp -R docs/releases/. .github/reports/release/ 2>/dev/null || true
echo "Packaged release reports into .github/reports/release"

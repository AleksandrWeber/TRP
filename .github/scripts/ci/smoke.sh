#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
mkdir -p .github/reports/ci
pnpm --filter @trp/api exec vitest run \
  src/modules/portfolio-engine \
  src/modules/position-engine \
  src/modules/order-engine \
  src/modules/risk-engine \
  src/modules/paper-trading-engine \
  src/modules/exchange-adapter \
  src/modules/live-trading-engine \
  src/modules/auth \
  src/validation/m2/us204 \
  src/validation/m2/us205 \
  src/validation/m2/us206 \
  src/validation/m2/us208 \
  src/validation/m2/us210 \
  | tee .github/reports/ci/smoke.log

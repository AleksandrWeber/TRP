#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
mkdir -p .github/reports/nightly
{
  echo "# Nightly Report"
  echo
  echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "SHA: ${GITHUB_SHA:-local}"
  echo
  echo "See workflow logs and uploaded artifacts for details."
} > .github/reports/nightly/report.md

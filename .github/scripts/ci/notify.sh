#!/usr/bin/env bash
# Notification scaffold (Slack / Discord / Teams / Email).
# Disabled by default — set NOTIFY_WEBHOOK_URL to enable.
set -euo pipefail
MESSAGE="${1:-Trading Platform CI notification}"
if [[ -z "${NOTIFY_WEBHOOK_URL:-}" ]]; then
  echo "Notifications disabled (NOTIFY_WEBHOOK_URL unset)."
  exit 0
fi
curl -sS -X POST -H 'Content-Type: application/json' \
  -d "{\"text\":$(printf '%s' "$MESSAGE" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" \
  "$NOTIFY_WEBHOOK_URL" >/dev/null
echo "Notification sent."

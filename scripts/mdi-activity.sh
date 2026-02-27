#!/bin/bash
# scripts/mdi-activity.sh
# Usage: mdi-activity "작업 내용" or mdi-activity clear
# Falls back to REST API (works regardless of whether WS daemon is running)

ACTION=$1
SERVER="${MDI_SERVER:-http://localhost:3001}"
MEMBER_ID="${MDI_MEMBER_ID:-shawn}"

if [ -z "$ACTION" ]; then
  echo "Usage: mdi-activity \"작업 내용\" | clear"
  exit 1
fi

if [ "$ACTION" = "clear" ]; then
  PAYLOAD='{"currentActivity":""}'
else
  PAYLOAD="{\"currentActivity\":\"$ACTION\"}"
fi

curl -s -X PATCH "${SERVER}/api/team/${MEMBER_ID}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" > /dev/null

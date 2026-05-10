#!/usr/bin/env bash
# GitHub 레이블 일괄 생성
# 사용법: ./scripts/setup-labels.sh
# 사전 조건: gh auth login 완료

set -e

REPO="zzzRYT/work-time"

create_label() {
  local name="$1"
  local color="$2"
  local desc="$3"

  if gh label list --repo "$REPO" --json name | grep -q "\"$name\""; then
    gh label edit "$name" --repo "$REPO" --color "$color" --description "$desc"
    echo "updated: $name"
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc"
    echo "created: $name"
  fi
}

# type
create_label "type: bug"      "d73a4a" "잘못된 동작"
create_label "type: feature"  "0075ca" "새 기능 또는 개선"
create_label "type: docs"     "cfd3d7" "문서·컨벤션"
create_label "type: refactor" "e4e669" "동작 변경 없는 코드 개선"

# area
create_label "area: app"    "e99695" "Expo React Native 앱"
create_label "area: server" "74d7d7" "NestJS 서버"

# priority
create_label "priority: high" "b60205" "빠른 처리 필요"
create_label "priority: low"  "eeeeee" "여유 있을 때 처리"

echo "완료"

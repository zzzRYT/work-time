---
name: ears-spec-lookup
description: Use when implementing features, writing tests, or reviewing code to find relevant EARS requirements. Triggers on "스펙 확인", "REQ 찾기", "요구사항 확인", or when starting implementation of any feature described in the specs.
---

# EARS Spec Lookup

## Overview

구현 전에 관련 EARS 요구사항을 찾아 제시한다. app과 server 양쪽 모두에서 동일한 스펙을 참조한다.

## When to Use

- 새 기능 구현을 시작할 때
- 기존 기능을 수정할 때
- 테스트 케이스를 작성할 때
- 코드 리뷰 시 요구사항 준수 여부를 확인할 때

## Spec Location

모든 EARS 스펙은 monorepo 루트의 `docs/specs/`에 위치한다:

| 도메인 | 파일 |
|--------|------|
| 개요 | `docs/specs/overview.md` |
| 대시보드 | `docs/specs/dashboard/` |
| 기록 | `docs/specs/history/` |
| 멤버 | `docs/specs/members/` |

## Workflow

### 1. 도메인 파악

구현하려는 기능이 어느 도메인에 속하는지 판단한다:
- 체크인/체크아웃, 타이머, 휴가, 지각 → `dashboard`
- 캘린더, 일별 상세, 월간 요약 → `history`
- 멤버 목록, 회비, 랭킹 → `members`

### 2. REQ 조회

해당 도메인의 스펙 파일을 읽고, 구현할 기능과 관련된 REQ를 추출한다.

### 3. REQ 제시

구현 전에 관련 REQ 목록을 제시한다:

```
## 관련 요구사항

| REQ ID | 요구사항 |
|--------|---------|
| REQ-1.3.2 | WHEN 사용자가 체크인 버튼을 탭하면, SHALL 체크인 시간을 기록한다 |
| REQ-1.3.3 | WHEN 사용자가 체크인 버튼을 탭하면, SHALL 상태를 "공부 중"으로 전환한다 |
```

### 4. 구현 가이드

- **app (React Native)**: REQ의 UI 표시 관련 요구사항(SHALL ~를 표시한다)에 집중
- **server (GraphQL)**: REQ의 데이터/로직 관련 요구사항(SHALL ~를 기록한다, ~를 판정한다)에 집중
- **양쪽 모두**: State-Driven(WHILE) 패턴은 서버 상태와 클라이언트 표시 양쪽에 영향

## EARS 패턴 빠른 참조

| 패턴 | 키워드 | 의미 |
|------|--------|------|
| Ubiquitous | (없음) | 항상 적용 |
| State-Driven | WHILE | 특정 상태 동안 |
| Event-Driven | WHEN | 이벤트 발생 시 |
| Unwanted | IF…THEN | 비정상/예외 처리 |
| Optional | WHERE | 설정/기능 플래그 의존 |

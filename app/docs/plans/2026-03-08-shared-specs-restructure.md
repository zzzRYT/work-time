# Shared EARS Specs Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** EARS 스펙 문서를 work-time-app 루트로 이동하고, app/server 양쪽에서 활용할 수 있는 공유 skill을 루트 레벨에 배치한다.

**Architecture:** 현재 `app/docs/specs/`에 있는 EARS 스펙은 app 전용이 아니라 도메인 전체의 요구사항 정의서다. server의 resolver/service 구현에서도 동일한 REQ를 참조해야 하므로, monorepo 루트(`work-time-app/`)로 올린다. 루트 `.claude/skills/`에 EARS 스펙 조회 skill을 배치하여 양쪽 프로젝트에서 구현 시 스펙을 참조할 수 있게 한다.

**Tech Stack:** Claude Code Skills (SKILL.md), EARS requirements

---

### Task 1: 루트에 docs/specs 디렉토리 생성 및 스펙 파일 이동

**Files:**
- Create: `docs/specs/` (work-time-app 루트)
- Move: `app/docs/specs/overview.md` → `docs/specs/overview.md`
- Move: `app/docs/specs/dashboard/2026-03-04-Dashboard-spec.md` → `docs/specs/dashboard/2026-03-04-Dashboard-spec.md`
- Move: `app/docs/specs/history/2026-03-04-History-spec.md` → `docs/specs/history/2026-03-04-History-spec.md`
- Move: `app/docs/specs/members/2026-03-04-Members-spec.md` → `docs/specs/members/2026-03-04-Members-spec.md`
- Delete: `app/docs/specs/` (이동 후 빈 디렉토리 제거)

**Step 1: 루트에 디렉토리 구조 생성**

```bash
cd /Users/leejaejin/coding/toy-project/work-time-app
mkdir -p docs/specs/dashboard docs/specs/history docs/specs/members
```

**Step 2: 스펙 파일 이동**

```bash
cd /Users/leejaejin/coding/toy-project/work-time-app
git mv app/docs/specs/overview.md docs/specs/overview.md
git mv app/docs/specs/dashboard/2026-03-04-Dashboard-spec.md docs/specs/dashboard/2026-03-04-Dashboard-spec.md
git mv app/docs/specs/history/2026-03-04-History-spec.md docs/specs/history/2026-03-04-History-spec.md
git mv app/docs/specs/members/2026-03-04-Members-spec.md docs/specs/members/2026-03-04-Members-spec.md
```

**Step 3: 빈 디렉토리 정리**

```bash
rm -rf app/docs/specs
```

**Step 4: overview.md 내 경로 확인**

`docs/specs/overview.md`의 스펙 문서 목록 테이블에서 상대 경로가 이미 `dashboard/2026-03-04-Dashboard-spec.md` 형태이므로 수정 불필요.

**Step 5: Commit**

```bash
git add -A docs/specs/ app/docs/specs/
git commit -m "refactor: move EARS specs to monorepo root for shared access"
```

---

### Task 2: 루트 레벨 ears-spec-lookup skill 생성

app이나 server에서 기능을 구현할 때 관련 EARS REQ를 찾아 참조할 수 있는 skill.

**Files:**
- Create: `.claude/skills/ears-spec-lookup/SKILL.md` (work-time-app 루트)

**Step 1: skill 파일 작성**

```markdown
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
```

**Step 2: Commit**

```bash
git add .claude/skills/ears-spec-lookup/SKILL.md
git commit -m "feat: add ears-spec-lookup skill at monorepo root"
```

---

### Task 3: 루트 레벨 ears-spec-writer skill 생성

새로운 화면이나 기능에 대한 EARS 스펙을 작성할 때 사용하는 skill. goondori-sdd의 spec-from-source/ears-authoring을 프로젝트 컨벤션에 맞게 래핑한다.

**Files:**
- Create: `.claude/skills/ears-spec-writer/SKILL.md` (work-time-app 루트)

**Step 1: skill 파일 작성**

```markdown
---
name: ears-spec-writer
description: Use when creating new EARS spec documents for new screens or features. Triggers on "스펙 작성", "EARS 작성", "새 스펙", "요구사항 정의", or when adding a new screen/feature that needs requirements documentation.
---

# EARS Spec Writer

## Overview

새로운 화면이나 기능에 대한 EARS 요구사항 문서를 프로젝트 컨벤션에 맞게 작성한다.

## When to Use

- 새 화면을 추가할 때
- 기존 화면에 새 섹션/기능을 추가할 때
- 기획 소스(Figma, 텍스트 등)를 EARS 스펙으로 변환할 때

## Prerequisites

**REQUIRED SUB-SKILL:** goondori-sdd:ears-authoring — EARS 패턴 선택, SHALL 위치, REQ ID 형식 등의 작성 규칙 참조

**OPTIONAL SUB-SKILL:** goondori-sdd:spec-from-source — Figma/Linear 등 기획 소스에서 자동 추출 시

## 프로젝트 컨벤션

### 파일 위치

```
docs/specs/
  overview.md              ← 전체 개요 + 스펙 문서 목록
  <domain>/
    YYYY-MM-DD-<Name>-spec.md
```

### 문서 템플릿

```markdown
# [한국어 화면명] ([ScreenName])

> **소스**: [소스 목록]
> **변환 기준**: EARS (Easy Approach to Requirements Syntax)
> **키워드 규칙**: SHALL (의무), WHILE (상태), WHEN (이벤트), IF…THEN (비정상), WHERE (선택)

---

## 1. [섹션명]

### 1.1 [하위섹션명]

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.1.1 | [패턴] | [EARS 문장] |
```

### REQ ID 규칙

- 형식: `REQ-{섹션}.{하위섹션}.{번호}`
- 숫자만 사용 (한국어 텍스트 금지)
- 변형: `REQ-1.1.4-a`, `REQ-1.1.4-b` (동일 항목의 변형)

### 필수 포함 섹션

스펙 작성 시 반드시 에러 처리 섹션을 포함한다:

```markdown
### N.N 에러 처리

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-N.N.1 | Unwanted | IF [요청]이 실패하면, THEN SHALL "[에러 메시지]" 토스트를 표시한다 |
```

## Workflow

1. 기획 소스 수집 (Figma, 텍스트, 구두 설명)
2. UI 요소 + 동작 인벤토리 작성 → 사용자 확인
3. 섹션별 EARS 변환 → 섹션마다 사용자 확인
4. 문서 조립 → `docs/specs/<domain>/YYYY-MM-DD-<Name>-spec.md` 저장
5. `docs/specs/overview.md` 스펙 문서 목록 테이블에 추가

## 기존 스펙 현황

| 도메인 | 파일 | REQ 범위 |
|--------|------|----------|
| dashboard | `2026-03-04-Dashboard-spec.md` | REQ-1.1.1 ~ REQ-1.7.2 |
| history | `2026-03-04-History-spec.md` | REQ-1.1.1 ~ REQ-1.3.7 |
| members | `2026-03-04-Members-spec.md` | REQ-1.1.1 ~ REQ-1.4.8 |
```

**Step 2: Commit**

```bash
git add .claude/skills/ears-spec-writer/SKILL.md
git commit -m "feat: add ears-spec-writer skill at monorepo root"
```

---

### Task 4: overview.md 업데이트

스펙 문서 목록 테이블이 루트 기준으로 맞는지 확인하고, 필요시 경로 업데이트.

**Files:**
- Modify: `docs/specs/overview.md`

**Step 1: overview.md 확인 및 수정**

overview.md 하단의 스펙 문서 목록 테이블의 상대 경로는 이미 `dashboard/2026-03-04-Dashboard-spec.md` 형태라 변경 불필요. 내용을 읽고 확인만 한다.

**Step 2: Commit (변경 있을 경우만)**

```bash
git add docs/specs/overview.md
git commit -m "docs: update spec file paths for monorepo root"
```

---

### Task 5: app과 server의 CLAUDE.md 또는 settings에서 루트 스펙 참조 안내

**Files:**
- 확인: `app/.claude/settings.local.json` — 변경 불필요 (스펙 관련 설정 없음)
- 확인: `server/.claude/` — 현재 entity-first-development skill만 존재

루트 레벨에 `.claude/skills/`를 배치하면 work-time-app 디렉토리에서 Claude Code를 실행할 때 자동으로 인식된다. app이나 server 하위에서 실행할 때도 상위 디렉토리의 `.claude/`를 탐색하므로 추가 설정은 불필요하다.

**Step 1: 동작 확인**

work-time-app 루트에서 Claude Code를 열고 "스펙 확인" 트리거가 ears-spec-lookup skill을 활성화하는지 확인한다.

---

## 최종 디렉토리 구조

```
work-time-app/
  .claude/
    skills/
      ears-spec-lookup/SKILL.md    ← 구현 시 REQ 조회
      ears-spec-writer/SKILL.md    ← 새 스펙 작성
  docs/
    specs/
      overview.md
      dashboard/
        2026-03-04-Dashboard-spec.md
      history/
        2026-03-04-History-spec.md
      members/
        2026-03-04-Members-spec.md
  app/
    docs/
      onboarding.md                ← app 전용 문서 (유지)
      fsd-maps/                    ← app 전용 문서 (유지)
    .claude/skills/                ← app 전용 skills (유지)
  server/
    .claude/skills/                ← server 전용 skills (유지)
```

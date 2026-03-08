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

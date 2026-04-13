---
name: plan-to-docs
description: Use when starting a new feature from a keyword or idea. Triggers on "기획 시작", "새 기능 기획", "plan-to-docs", or when the user provides a keyword and wants to go from idea → validated plan → docs. Orchestrates /office-hours → /autoplan → docs/ 저장.
---

# plan-to-docs

## Overview

키워드 또는 아이디어를 받아 `docs/`에 저장된 검증 완료 기획 문서까지 이어지는 워크플로우를 강제한다.
개별 단계를 건너뛰지 말 것 — 각 단계는 이전 단계의 산출물에 의존한다.

## When to Use

- 사용자가 키워드/아이디어로 새 기능 기획을 시작할 때
- 기존 기획을 다시 검증하고 문서화할 때

## Workflow

반드시 순서대로 진행한다.

### 1. 발산 — `/office-hours`
- 키워드를 입력으로 `/office-hours` 호출
- forcing question에 사용자와 함께 답하며 아이디어 구체화

### 2. Plan 작성
- 발산 결과를 바탕으로 plan 초안 작성 (대화 내부)
- 아직 `docs/`에 쓰지 말 것

### 3. 검증 — `/autoplan`
- plan 초안에 대해 `/autoplan` 실행
- CEO / design / eng / DX 4개 페르소나 자동 검증
- 특정 관점만 재검토가 필요하면 `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review` 개별 호출

### 4. 반영
- 검증에서 나온 이슈를 plan에 반영
- 해결 불가한 오픈 이슈는 문서의 "오픈 이슈" 섹션에 기록

### 5. 저장 — `docs/` 기록
- 아래 "Storage Rules"에 따라 파일 생성
- 저장 후 경로를 사용자에게 알릴 것

## Storage Rules

### 경로 구조 — 카테고리
```
docs/
  features/     새 기능
  flows/        사용자 플로우 / 인터랙션
  infra/        인프라 · 배포 · 마이그레이션
  decisions/    아키텍처 · 기술 선택 결정 (ADR 성격)
```
카테고리가 애매하면 사용자에게 물어볼 것.

### 파일명
- `kebab-case.md`
- 영문 권장, 한국어 파일명도 허용
- 예: `docs/features/work-time-tracking.md`, `docs/flows/login-invite.md`

### 프론트매터
```yaml
---
title: 작업 시간 트래킹
status: draft | validated | in-progress | done | archived
created: 2026-04-08
related: [docs/flows/xxx.md]   # 선택
---
```

### 템플릿 섹션

```markdown
## 문제
무엇을 해결하는가. 배경과 페인 포인트.

## 목표
이 기획이 달성하려는 것. 측정 가능하면 더 좋음.

## 범위
포함 / 제외. Non-goals 명시.

## 설계
핵심 접근. 주요 화면/엔드포인트/데이터 모델.

## 완료 기준
이 기획이 "끝났다"고 판단할 조건. 체크리스트 형태 권장.
- [ ] ...

## 검증 결과
/autoplan 또는 개별 리뷰에서 나온 핵심 피드백 요약.

## 오픈 이슈
미해결 질문, 후속 결정 필요 항목.
```

## Rules

- **순서 건너뛰기 금지.** 특히 3번(검증) 없이 바로 저장하지 말 것.
- **커밋은 사용자 확인 후.** 문서 저장 자체는 커밋 아님 — 커밋은 별도 확인.
- **범위 이탈 금지.** plan-to-docs는 기획 문서화까지만. 구현은 다른 세션/워크플로우.
- `status` 필드는 최초 저장 시 `validated` (검증 완료 후니까). 구현 시작하면 `in-progress`로 업데이트.

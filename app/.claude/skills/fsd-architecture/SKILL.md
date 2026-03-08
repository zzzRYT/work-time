---
name: fsd-architecture
description: Use when creating new files, deciding where code belongs, or structuring components. Triggers on new page/feature creation, "어디에 만들지", "폴더 구조", "컴포넌트 분리", or when encountering duplicate code across pages.
---

# FSD Architecture — Pages-First

## Overview

Feature-Sliced Design을 Pages-First 방식으로 적용한다. 모든 코드는 pages에서 시작하고, 중복이 **실제로 발생**했을 때만 하위 레이어로 추출한다.

## Layer 구조

```
shared/    ← 프로젝트 전역 유틸, UI 프리미티브, 상수, 타입
entities/  ← 도메인 엔티티 (여러 화면에서 쓸 것이 확실한 것만)
features/  ← 사용자 기능 단위
widgets/   ← 조합된 UI 블록 (pages에서 추출된 것)
pages/     ← 화면 단위 ★ 여기서 시작
app/       ← Expo Router (라우팅만, 로직 없음)
```

**Import 규칙:** 상위 레이어만 하위를 import 가능. 역방향 금지.

## Pages-First 원칙

```
새 화면 필요
  → pages/에 만든다
  → 해당 페이지 안에서 완결시킨다
  → 끝
```

**추출 트리거 — 중복이 발생했을 때만:**

| 신호 | 추출 대상 |
|------|----------|
| 2개 이상 페이지에서 동일 UI 블록 반복 | → widgets/ |
| 2개 이상 페이지에서 동일 기능 로직 반복 | → features/ |
| 도메인 모델이 여러 곳에서 공유됨 | → entities/ |
| 순수 유틸/상수/타입 | → shared/ |

**하지 않는 것:**
- "나중에 쓸 것 같아서" 미리 추출하지 않는다
- 한 페이지에서만 쓰이는 컴포넌트를 widgets/로 올리지 않는다
- pages/ 안에서 파일이 많아지는 것은 괜찮다 — 그게 정상

## Composition Pattern (조건부 적용)

Composition Pattern은 **기본이 아니다**. 아래 조건이 충족될 때만 적용:

**적용 조건 — 반복 UI가 포착되었을 때:**
- 동일한 UI 구조가 2개 이상 화면에서 **변형**을 가지며 반복
- boolean flag(`showX`, `hideY`)가 쌓이기 시작
- 관련 없는 데이터를 props로 넘겨야 하는 상황

**적용하지 않는 경우:**
- 한 화면에서만 사용되는 컴포넌트
- 변형 없이 동일하게 재사용되는 컴포넌트 (일반 컴포넌트로 충분)
- props가 많더라도 모든 곳에서 동일하게 사용된다면 뭉탱이 유지

**적용 시 구조:**
```tsx
// Parts (낮은 레벨) — 유연한 조립
<Card.Root>
  <Card.Header title="제목" />
  <Card.Body>{children}</Card.Body>
  <Card.Footer />  {/* 필요한 화면에서만 */}
</Card.Root>

// Preset (높은 레벨) — 흔한 조합의 편의 컴포넌트
<DefaultCard title="제목" showFooter>{children}</DefaultCard>
```

## 파일 구조 컨벤션

```
pages/
  some-page/
    ui/                 # 이 페이지 전용 컴포넌트
    model/              # 이 페이지 전용 상태/로직
    api/                # 이 페이지 전용 API 호출
    index.ts            # barrel export
    SomePage.tsx        # 메인 페이지 컴포넌트
```

- `app/` 파일은 pages/의 re-export만 담당
- 각 레이어는 barrel `index.ts`로 public API 노출
- Cross-feature import는 반드시 barrel을 통해서

## 판단 플로우차트

```
새 코드를 작성해야 한다
  ├─ 특정 화면에서만 쓰인다 → pages/ 안에 작성
  ├─ 여러 화면에서 쓰이는 UI 블록이다 → widgets/
  ├─ 여러 화면에서 쓰이는 기능 로직이다 → features/
  ├─ 도메인 모델/타입이다 → entities/
  └─ 순수 유틸/상수다 → shared/
```

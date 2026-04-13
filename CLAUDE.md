# CLAUDE.md

> 이 파일은 항상 로드되는 공용 지도입니다.
> "어떻게"가 아니라 "어디로 가야 하는지"만 적습니다.
> 50줄 이하 유지. 초과 시 하위 CLAUDE.md / skill / agent로 분할하세요.

## Project Snapshot

- 근무시간 관리 앱 (모바일 + 서버)
- 모노레포: `app/` (Expo RN + NativeWind), `server/` (NestJS + TypeORM + Supabase)

## Golden Rules

1. 커밋/푸시 전 반드시 사용자 확인 (질문을 동의로 해석하지 말 것)
2. 요청 범위 밖 리팩토링·"개선" 금지
3. 새 파일 만들기 전에 기존 파일 수정 우선
4. UI 작업은 `DESIGN.md` 기준
5. 기획 문서(`docs/`)가 있는 기능은 먼저 확인

## Workspace Routing

- `app/` 작업 → `app/CLAUDE.md`
- `server/` 작업 → `server/CLAUDE.md`
- 새 기능 기획 시작 → `plan-to-docs` skill (/office-hours → /autoplan → `docs/`)
- 기획/스펙 문서 조회 → `docs/` (카테고리: features/flows/infra/decisions)
- 디자인 시스템 → `DESIGN.md`
- 할 일 / 휘발성 상태 → `TODOS.md`

## Tooling Policy

- `app/`: Bun / `server/`: npm — 섞지 말 것
- 커밋 전 린트·타입체크 통과 필수
- 테스트 전략 상세는 각 하위 `CLAUDE.md`

## What NOT to put here

루트는 지도, 지식은 위임합니다. 아래는 루트에 두지 마세요:

- 상세 아키텍처 / 코드 컨벤션 → 하위 `CLAUDE.md`
- 절차적 작업(커밋·PR·리뷰 방법) → skill
- 독립 컨텍스트가 필요한 작업(리뷰·탐색) → agent
- 진행 중인 작업 / 이번 주 할 일 → `TODOS.md` 또는 memory
- 라이브러리 API·디버깅 팁·긴 예시 코드 → 저장하지 않음 (context7·코드·커밋 히스토리가 진실)

### 새 항목 추가 전 셀프 체크

1. 이게 **모든 작업**에 필요한가? (No면 루트 X)
2. 이게 **변하지 않는 사실**인가? (No면 memory/TODOS)
3. 이게 **"어떻게"인가 "어디로"인가**? ("어떻게"면 skill/agent)

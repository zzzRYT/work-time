# 대시보드 (Dashboard) FSD 구조 매핑

> **EARS 소스**: `docs/specs/dashboard/2026-03-04-Dashboard-spec.md`
> **Figma 와이어프레임**: https://www.figma.com/design/G0NGLvgX6JNsa0eZeGR6wj?node-id=1-2
> **생성일**: 2026-03-04

## 컴포넌트 인벤토리

| Figma 레이어 | nodeId | FSD 경로 | Action | 비고 |
|---|---|---|---|---|
| StatusBadge | 2:8 | shared/ui/status-badge | Create | 3 화면 공통 (Dashboard, Members, History) |
| MemberRow | 2:37 | shared/ui/member-row | Create | 2 화면 공통 (Dashboard, Members) |
| AttendanceCard | 1:9 | pages/dashboard/ui/attendance-card | Create | 날짜 + 상태배지 + 타이머 + 버튼 |
| Timer | 1:18 | pages/dashboard/ui/timer | Create | 실시간 카운터 |
| CheckButton | 1:25 | pages/dashboard/ui/check-button | Create | 체크인/체크아웃 토글 |
| LateAlert | 1:28 | pages/dashboard/ui/late-alert | Create | 조건부 표시 |
| VacationButton | 1:35 | pages/dashboard/ui/vacation-button | Create | 2h 단위 선택 |
| StudyingMembers | 1:38 | pages/dashboard/ui/studying-members | Create | member-row 인스턴스 사용 |

## 공통 컴포넌트 (2+ 화면 중복)

| 컴포넌트 | 사용 화면 | 횟수 |
|---|---|---|
| shared/ui/status-badge | Dashboard, Members, History | 3 |
| shared/ui/member-row | Dashboard, Members | 2 |

## Code Connect 매핑

> Code Connect는 Organization/Enterprise 플랜이 필요하여 문서에만 기록합니다.

| Figma nodeId | componentName | source |
|---|---|---|
| 2:8 | shared/ui/StatusBadge | src/shared/ui/status-badge.tsx |
| 2:37 | shared/ui/MemberRow | src/shared/ui/member-row.tsx |
| 1:9 | pages/dashboard/ui/AttendanceCard | src/pages/dashboard/ui/attendance-card.tsx |
| 1:18 | pages/dashboard/ui/Timer | src/pages/dashboard/ui/timer.tsx |
| 1:25 | pages/dashboard/ui/CheckButton | src/pages/dashboard/ui/check-button.tsx |
| 1:28 | pages/dashboard/ui/LateAlert | src/pages/dashboard/ui/late-alert.tsx |
| 1:35 | pages/dashboard/ui/VacationButton | src/pages/dashboard/ui/vacation-button.tsx |
| 1:38 | pages/dashboard/ui/StudyingMembers | src/pages/dashboard/ui/studying-members.tsx |

## 구현 순서

1. shared/ui/status-badge (Create - 3 화면 공통)
2. shared/ui/member-row (Create - 2 화면 공통)
3. pages/dashboard/ui/attendance-card (Create)
4. pages/dashboard/ui/timer (Create)
5. pages/dashboard/ui/check-button (Create)
6. pages/dashboard/ui/late-alert (Create)
7. pages/dashboard/ui/vacation-button (Create)
8. pages/dashboard/ui/studying-members (Create)

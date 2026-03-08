# 스터디원 (Members) FSD 구조 매핑

> **EARS 소스**: `docs/specs/members/2026-03-04-Members-spec.md`
> **Figma 와이어프레임**: https://www.figma.com/design/G0NGLvgX6JNsa0eZeGR6wj?node-id=3-2
> **생성일**: 2026-03-04

## 컴포넌트 인벤토리

| Figma 레이어 | nodeId | FSD 경로 | Action | 비고 |
|---|---|---|---|---|
| StatusBadge | 2:8 | shared/ui/status-badge | Create | 3 화면 공통 |
| MemberRow | 2:37 | shared/ui/member-row | Create | 2 화면 공통 |
| AttendanceSummary | 3:9 | pages/members/ui/attendance-summary | Create | 출석/공부중/지각 카운트 |
| MemberList | 3:33 | pages/members/ui/member-list | Create | member-row 인스턴스 사용 |
| FeeSection | 3:140 | pages/members/ui/fee-section | Create | 회비·지각비 납부/미납 현황 |
| Ranking | 3:189 | pages/members/ui/ranking | Create | 주간/월간 탭 전환 |

## 공통 컴포넌트 (2+ 화면 중복)

| 컴포넌트 | 사용 화면 | 횟수 |
|---|---|---|
| shared/ui/status-badge | Dashboard, Members, History | 3 |
| shared/ui/member-row | Dashboard, Members | 2 |

## Code Connect 매핑

> Code Connect는 Organization/Enterprise 플랜이 필요하여 문서에만 기록합니다.

| Figma nodeId | componentName | source |
|---|---|---|
| 3:9 | pages/members/ui/AttendanceSummary | src/pages/members/ui/attendance-summary.tsx |
| 3:33 | pages/members/ui/MemberList | src/pages/members/ui/member-list.tsx |
| 3:140 | pages/members/ui/FeeSection | src/pages/members/ui/fee-section.tsx |
| 3:189 | pages/members/ui/Ranking | src/pages/members/ui/ranking.tsx |

## 구현 순서

1. shared/ui/status-badge (Create - Dashboard에서 먼저 생성)
2. shared/ui/member-row (Create - Dashboard에서 먼저 생성)
3. pages/members/ui/attendance-summary (Create)
4. pages/members/ui/member-list (Create)
5. pages/members/ui/fee-section (Create)
6. pages/members/ui/ranking (Create)

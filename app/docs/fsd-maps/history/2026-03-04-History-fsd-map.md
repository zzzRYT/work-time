# 내 기록 (History) FSD 구조 매핑

> **EARS 소스**: `docs/specs/history/2026-03-04-History-spec.md`
> **Figma 와이어프레임**: https://www.figma.com/design/G0NGLvgX6JNsa0eZeGR6wj?node-id=4-2
> **생성일**: 2026-03-04

## 컴포넌트 인벤토리

| Figma 레이어 | nodeId | FSD 경로 | Action | 비고 |
|---|---|---|---|---|
| StatusBadge | 2:8 | shared/ui/status-badge | Create | 3 화면 공통 |
| Calendar | 4:9 | pages/history/ui/calendar | Create | 월별 캘린더 + 출석/지각/휴가 dot |
| MonthlySummary | 4:130 | pages/history/ui/monthly-summary | Create | 출석, 총공부, 일평균, 지각, 휴가, 지각비 |
| DayDetail | 4:178 | pages/history/ui/day-detail | Create | 세션 목록 + 지각 배지 + 합계 |

## 공통 컴포넌트 (2+ 화면 중복)

| 컴포넌트 | 사용 화면 | 횟수 |
|---|---|---|
| shared/ui/status-badge | Dashboard, Members, History | 3 |

## Code Connect 매핑

> Code Connect는 Organization/Enterprise 플랜이 필요하여 문서에만 기록합니다.

| Figma nodeId | componentName | source |
|---|---|---|
| 4:9 | pages/history/ui/Calendar | src/pages/history/ui/calendar.tsx |
| 4:130 | pages/history/ui/MonthlySummary | src/pages/history/ui/monthly-summary.tsx |
| 4:178 | pages/history/ui/DayDetail | src/pages/history/ui/day-detail.tsx |

## 구현 순서

1. shared/ui/status-badge (Create - Dashboard에서 먼저 생성)
2. pages/history/ui/calendar (Create)
3. pages/history/ui/monthly-summary (Create)
4. pages/history/ui/day-detail (Create)

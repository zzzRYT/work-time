# User Stories

> 유저 플로우 기반 스토리 이슈 목록
> 각 스토리는 진입점, 상호작용, UI 위치, 기대 동작을 정의한다.

## 스토리 목록

| # | 스토리 | 파일 | 관련 탭 | 상태 |
|---|--------|------|---------|------|
| S-01 | 체크인/체크아웃으로 공부 시간 기록하기 | [S-01-checkin-checkout.md](./S-01-checkin-checkout.md) | Dashboard | 🟡 부분 구현 |
| S-02 | 지각 판정과 지각비 확인하기 | [S-02-late-detection.md](./S-02-late-detection.md) | Dashboard | 🟡 부분 구현 |
| S-03 | 휴가 신청하기 | [S-03-vacation.md](./S-03-vacation.md) | Dashboard | 🔴 미구현 |
| S-04 | 지금 공부 중인 멤버 확인하기 | [S-04-studying-members.md](./S-04-studying-members.md) | Dashboard | 🟡 부분 구현 |
| S-05 | 캘린더로 내 출석 기록 조회하기 | [S-05-calendar-history.md](./S-05-calendar-history.md) | History | 🟡 부분 구현 |
| S-06 | 일별 출석 상세 확인하기 | [S-06-day-detail.md](./S-06-day-detail.md) | History | 🟡 부분 구현 |
| S-07 | 월간 통계 확인하기 | [S-07-monthly-summary.md](./S-07-monthly-summary.md) | History | 🟡 부분 구현 |
| S-08 | 멤버 목록에서 오늘의 출석 현황 보기 | [S-08-member-attendance.md](./S-08-member-attendance.md) | Members | 🟡 부분 구현 |
| S-09 | 회비/지각비 납부 상태 관리하기 | [S-09-fee-management.md](./S-09-fee-management.md) | Members | 🔴 미구현 |
| S-10 | 주간/월간 랭킹 확인하기 | [S-10-ranking.md](./S-10-ranking.md) | Members | 🟡 부분 구현 |
| S-11 | 관리자 역할 지정/해제하기 | [S-11-admin-role.md](./S-11-admin-role.md) | Admin | 🔴 미구현 |
| S-12 | 출근 시간/지각비 설정 변경하기 | [S-12-admin-settings.md](./S-12-admin-settings.md) | Admin | 🔴 미구현 |
| S-13 | 멤버 선택하기 (앱 진입) | [S-13-member-select.md](./S-13-member-select.md) | 공통 | 🟡 부분 구현 |

## 서브 이슈 요약

| 스토리 | 서브 이슈 수 | 주요 내용 |
|--------|-----------|---------|
| S-01 | 7 | 로딩 상태, 토스트, 네트워크, 타이머 보정, 누적 시간, 버튼 구분, Optimistic UI |
| S-02 | 5 | 지각 색상, DB 설정 연동, 기준 표시, 캘린더 도트, 일별 뱃지 |
| S-03 | 12 | 버튼, 바텀시트, 8h 경고, 다중 날짜, 상태 반영, 중복 방지, 히스토리 연동, 피드백 |
| S-04 | 3 | 빈 상태, 카운트 배지, 멤버 탭 상세 |
| S-05 | 8 | 잔디 캘린더, 오늘 강조, 블록 색상(초록/노랑/파랑/빨강), 스와이프, 날짜 선택, 프리페치, 빈 월 |
| S-06 | 6 | 세션 목록, 진행 중, 지각 뱃지, 총 시간, 휴가 표시, 빈 상태 |
| S-07 | 4 | 요약 바(캘린더 상단 한 줄), 포맷팅, 월 연동, 빈 월 |
| S-08 | 3 | 상태별 뱃지(미출석 포함), 멤버 탭 상세, Pull-to-refresh |
| S-09 | 2 | 테이블 렌더링, 납부 신청→어드민 승인 3단계 플로우 |
| S-10 | 5 | 리스트, 탭 전환, 메달 아이콘, 내 순위 강조, 빈 랭킹 |
| S-11 | 4 | 조건부 탭, 역할 목록, 마지막 관리자 방지, 토스트 |
| S-12 | 6 | 출근 시간 UI, 지각비 UI, 폼 검증, Prisma 마이그레이션, DB 전환, 피드백 |
| S-13 | 5 | 선택 화면, 라우팅 분기, AsyncStorage, 멤버 변경, 데이터 갱신 |
| **합계** | **70** | |

## 상태 범례

- 🟢 구현 완료 — 스토리의 모든 플로우가 동작
- 🟡 부분 구현 — 백엔드 또는 프론트 일부만 구현
- 🔴 미구현 — 아직 착수하지 않음

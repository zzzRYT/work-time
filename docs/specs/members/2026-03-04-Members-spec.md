# 멤버 (Members)

> **소스**: 기획 아이디어 — 코딩 스터디 전용 출석 앱
> **변환 기준**: EARS (Easy Approach to Requirements Syntax)
> **키워드 규칙**: SHALL (의무), WHILE (상태), WHEN (이벤트), IF…THEN (비정상), WHERE (선택)

---

## 1. 스터디원 현황

### 1.1 오늘의 출석 요약

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.1.1 | Ubiquitous | SHALL 오늘 출석한 멤버 수 / 전체 멤버 수를 표시한다 |
| REQ-1.1.2 | Ubiquitous | SHALL 현재 공부 중인 멤버 수를 표시한다 |

### 1.2 멤버 목록

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.2.1 | Ubiquitous | SHALL 전체 스터디원 목록을 표시한다 |
| REQ-1.2.2 | Ubiquitous | SHALL 각 멤버의 프로필 이미지를 표시한다 |
| REQ-1.2.3 | Ubiquitous | SHALL 각 멤버의 이름을 표시한다 |
| REQ-1.2.4 | State-Driven | WHILE 멤버가 현재 공부 중인 경우, SHALL 초록색 상태 인디케이터를 표시한다 |
| REQ-1.2.5 | Ubiquitous | SHALL 현재 공부 중인 멤버를 목록 상단에 정렬한다 |
| REQ-1.2.6 | Ubiquitous | SHALL 각 멤버의 오늘 총 공부 시간을 표시한다 |
| REQ-1.2.7 | State-Driven | WHILE 멤버가 오늘 지각한 경우, SHALL 이름 옆에 "지각" 뱃지를 표시한다 |
| REQ-1.2.8 | State-Driven | WHILE 멤버가 오늘 휴가인 경우, SHALL "휴가" 상태를 표시한다 |

### 1.3 회비 · 지각비 현황

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.3.1 | Ubiquitous | SHALL "회비 · 지각비" 섹션 타이틀을 표시한다 |
| REQ-1.3.2 | Ubiquitous | SHALL 이번 달 각 멤버의 회비 납부 상태(납부/미납)를 표시한다 |
| REQ-1.3.3 | Ubiquitous | SHALL 이번 달 각 멤버의 누적 지각비를 표시한다 |
| REQ-1.3.4 | Ubiquitous | SHALL 이번 달 각 멤버의 지각 횟수를 표시한다 |
| REQ-1.3.5 | State-Driven | WHILE 멤버가 회비를 미납한 경우, SHALL 미납 강조 표시를 한다 |
| REQ-1.3.6 | Event-Driven | WHEN 관리자가 멤버의 회비 납부 상태를 탭하면, SHALL 납부/미납 토글한다 |

### 1.4 주간/월간 통계

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.4.1 | Ubiquitous | SHALL 기간 전환 탭(이번 주 / 이번 달)을 표시한다 |
| REQ-1.4.2 | Event-Driven | WHEN 사용자가 "이번 주" 탭을 선택하면, SHALL 이번 주 통계를 표시한다 |
| REQ-1.4.3 | Event-Driven | WHEN 사용자가 "이번 달" 탭을 선택하면, SHALL 이번 달 통계를 표시한다 |
| REQ-1.4.4 | Ubiquitous | SHALL 선택된 기간의 멤버별 총 공부 시간 랭킹을 표시한다 |
| REQ-1.4.5 | Ubiquitous | SHALL 랭킹에서 각 멤버의 출석 일수를 표시한다 |
| REQ-1.4.6 | Ubiquitous | SHALL 랭킹에서 각 멤버의 총 공부 시간을 표시한다 |
| REQ-1.4.7 | Ubiquitous | SHALL 랭킹에서 각 멤버의 지각 횟수를 표시한다 |
| REQ-1.4.8 | Ubiquitous | SHALL 랭킹을 총 공부 시간 기준 내림차순으로 정렬한다 |

# 기록 (History)

> **소스**: 기획 아이디어 — 코딩 스터디 전용 출석 앱
> **변환 기준**: EARS (Easy Approach to Requirements Syntax)
> **키워드 규칙**: SHALL (의무), WHILE (상태), WHEN (이벤트), IF…THEN (비정상), WHERE (선택)

---

## 1. 내 출석 기록

### 1.1 캘린더 뷰

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.1.1 | Ubiquitous | SHALL 현재 월의 캘린더를 표시한다 |
| REQ-1.1.2 | Ubiquitous | SHALL 현재 년/월을 캘린더 상단에 표시한다 |
| REQ-1.1.3 | Ubiquitous | SHALL 출석한 날짜에 출석 인디케이터 도트를 표시한다 |
| REQ-1.1.4-a | Ubiquitous | SHALL 지각한 날짜에 지각 인디케이터 도트를 표시한다 |
| REQ-1.1.4-b | Ubiquitous | SHALL 휴가를 사용한 날짜에 휴가 인디케이터 도트를 표시한다 |
| REQ-1.1.4 | Ubiquitous | SHALL 오늘 날짜를 강조 표시한다 |
| REQ-1.1.5 | Event-Driven | WHEN 사용자가 좌로 스와이프하면, SHALL 다음 달 캘린더를 표시한다 |
| REQ-1.1.6 | Event-Driven | WHEN 사용자가 우로 스와이프하면, SHALL 이전 달 캘린더를 표시한다 |
| REQ-1.1.7 | Event-Driven | WHEN 사용자가 특정 날짜를 탭하면, SHALL 해당 날짜를 선택 상태로 표시한다 |
| REQ-1.1.8 | Event-Driven | WHEN 사용자가 특정 날짜를 탭하면, SHALL 해당 날짜의 출석 상세를 하단에 표시한다 |
| REQ-1.1.9 | Ubiquitous | SHALL 화면 진입 시 오늘 날짜를 기본 선택한다 |

### 1.2 일별 출석 상세

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.2.1 | Ubiquitous | SHALL 선택된 날짜의 출석 세션 목록을 표시한다 |
| REQ-1.2.2 | Ubiquitous | SHALL 각 세션의 체크인 시간을 표시한다 |
| REQ-1.2.3 | Ubiquitous | SHALL 각 세션의 체크아웃 시간을 표시한다 |
| REQ-1.2.4 | State-Driven | WHILE 세션이 아직 체크아웃되지 않은 경우, SHALL 체크아웃 시간을 "진행 중"으로 표시한다 |
| REQ-1.2.5 | Ubiquitous | SHALL 각 세션의 공부 시간을 표시한다 |
| REQ-1.2.6 | Ubiquitous | SHALL 해당 날짜의 총 공부 시간을 표시한다 |
| REQ-1.2.7 | State-Driven | WHILE 해당 세션이 지각인 경우, SHALL 체크인 시간 옆에 "지각" 뱃지를 표시한다 |
| REQ-1.2.8 | State-Driven | WHILE 해당 날짜에 휴가를 사용한 경우, SHALL "휴가" 상태와 사용 시간을 표시한다 |
| REQ-1.2.9 | State-Driven | WHILE 해당 날짜에 출석 기록이 없는 경우, SHALL "기록이 없습니다" 안내를 표시한다 |

### 1.3 월간 요약

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.3.1 | Ubiquitous | SHALL 현재 월의 총 출석 일수를 표시한다 |
| REQ-1.3.2 | Ubiquitous | SHALL 현재 월의 총 공부 시간을 표시한다 |
| REQ-1.3.3 | Ubiquitous | SHALL 현재 월의 일 평균 공부 시간을 표시한다 |
| REQ-1.3.4 | Ubiquitous | SHALL 현재 월의 지각 횟수를 표시한다 |
| REQ-1.3.5 | Ubiquitous | SHALL 현재 월의 휴가 사용 일수를 표시한다 |
| REQ-1.3.6 | Ubiquitous | SHALL 현재 월의 누적 지각비를 표시한다 |
| REQ-1.3.7 | Event-Driven | WHEN 캘린더에서 월이 변경되면, SHALL 해당 월의 요약 통계를 갱신한다 |

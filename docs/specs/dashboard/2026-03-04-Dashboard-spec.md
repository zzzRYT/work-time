# 대시보드 (Dashboard)

> **소스**: 기획 아이디어 — 코딩 스터디 전용 출석 앱
> **변환 기준**: EARS (Easy Approach to Requirements Syntax)
> **키워드 규칙**: SHALL (의무), WHILE (상태), WHEN (이벤트), IF…THEN (비정상), WHERE (선택)

---

## 1. 대시보드

### 1.1 오늘의 출석 카드

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.1.1 | Ubiquitous | SHALL 오늘 날짜와 요일을 표시한다 |
| REQ-1.1.2 | State-Driven | WHILE 오늘 체크인하지 않은 상태인 경우, SHALL "미출석" 상태를 표시한다 |
| REQ-1.1.3 | State-Driven | WHILE 체크인 중인 상태인 경우, SHALL "공부 중" 상태를 표시한다 |
| REQ-1.1.4 | State-Driven | WHILE 체크아웃 완료한 상태인 경우, SHALL "완료" 상태를 표시한다 |
| REQ-1.1.5 | State-Driven | WHILE 오늘 휴가를 사용한 경우, SHALL "휴가" 상태를 표시한다 |
| REQ-1.1.6 | Ubiquitous | SHALL 오늘의 총 공부 시간을 표시한다 |

### 1.2 타이머

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.2.1 | State-Driven | WHILE 체크인 중인 상태인 경우, SHALL 현재 세션의 경과 시간을 실시간으로 표시한다 |
| REQ-1.2.2 | State-Driven | WHILE 체크인 중인 상태인 경우, SHALL 타이머를 HH:MM:SS 형식으로 표시한다 |

### 1.3 체크인/체크아웃

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.3.1 | State-Driven | WHILE 오늘 체크인하지 않은 상태인 경우, SHALL "체크인" 버튼을 표시한다 |
| REQ-1.3.2 | Event-Driven | WHEN 사용자가 체크인 버튼을 탭하면, SHALL 체크인 시간을 기록한다 |
| REQ-1.3.3 | Event-Driven | WHEN 사용자가 체크인 버튼을 탭하면, SHALL 상태를 "공부 중"으로 전환한다 |
| REQ-1.3.4 | Event-Driven | WHEN 사용자가 체크인 버튼을 탭하면, SHALL 타이머를 시작한다 |
| REQ-1.3.5 | State-Driven | WHILE 체크인 중인 상태인 경우, SHALL "체크아웃" 버튼을 표시한다 |
| REQ-1.3.6 | Event-Driven | WHEN 사용자가 체크아웃 버튼을 탭하면, SHALL 체크아웃 시간을 기록한다 |
| REQ-1.3.7 | Event-Driven | WHEN 사용자가 체크아웃 버튼을 탭하면, SHALL 상태를 "완료"로 전환한다 |
| REQ-1.3.8 | Event-Driven | WHEN 사용자가 체크아웃 버튼을 탭하면, SHALL 타이머를 정지한다 |
| REQ-1.3.9 | State-Driven | WHILE 체크아웃 완료한 상태인 경우, SHALL "다시 체크인" 버튼을 표시한다 |
| REQ-1.3.10 | Event-Driven | WHEN 사용자가 "다시 체크인" 버튼을 탭하면, SHALL 새로운 세션을 시작한다 |

### 1.4 휴가

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.4.1 | Ubiquitous | SHALL "휴가 사용" 버튼을 표시한다 |
| REQ-1.4.2 | Event-Driven | WHEN 사용자가 "휴가 사용" 버튼을 탭하면, SHALL 휴가 시간 선택 바텀시트를 표시한다 |
| REQ-1.4.3 | Ubiquitous | SHALL 휴가 시간을 2시간 단위로 선택할 수 있는 옵션(2h, 4h, 6h, 8h)을 표시한다 |
| REQ-1.4.4 | Event-Driven | WHEN 사용자가 휴가 시간을 선택하고 확인하면, SHALL 오늘 날짜에 해당 시간만큼 휴가를 등록한다 |
| REQ-1.4.5 | State-Driven | WHILE 오늘 휴가를 사용한 경우, SHALL 출석 카드에 사용한 휴가 시간을 표시한다 |
| REQ-1.4.6 | State-Driven | WHILE 오늘 전일 휴가(8h)를 사용한 경우, SHALL 상태를 "휴가"로 전환한다 |
| REQ-1.4.7 | State-Driven | WHILE 오늘 반차 휴가(2h~6h)를 사용한 경우, SHALL 체크인/체크아웃을 계속 사용할 수 있다 |

### 1.5 지각 판정

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.5.1 | Event-Driven | WHEN 사용자가 스터디 시작 시간(코드 상수) 이후에 체크인하면, SHALL 해당 출석을 "지각"으로 표시한다 |
| REQ-1.5.2 | State-Driven | WHILE 오늘 출석이 지각인 경우, SHALL 출석 카드에 "지각" 뱃지를 표시한다 |
| REQ-1.5.3 | State-Driven | WHILE 오늘 출석이 지각인 경우, SHALL 지각비 금액을 표시한다 |

### 1.6 지금 공부 중인 멤버

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.6.1 | Ubiquitous | SHALL "지금 공부 중" 섹션 타이틀을 표시한다 |
| REQ-1.6.2 | Ubiquitous | SHALL 현재 체크인 중인 멤버 수를 표시한다 |
| REQ-1.6.3 | State-Driven | WHILE 체크인 중인 멤버가 있는 경우, SHALL 체크인 중인 멤버의 프로필 이미지와 이름 목록을 표시한다 |
| REQ-1.6.4 | State-Driven | WHILE 체크인 중인 멤버가 있는 경우, SHALL 각 멤버의 현재 세션 경과 시간을 표시한다 |
| REQ-1.6.5 | State-Driven | WHILE 체크인 중인 멤버가 없는 경우, SHALL "아직 아무도 시작 안 했어요" 안내를 표시한다 |

### 1.7 에러 처리

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.7.1 | Unwanted | IF 체크인 요청이 실패하면, THEN SHALL "체크인에 실패했습니다" 토스트를 표시한다 |
| REQ-1.7.2 | Unwanted | IF 체크아웃 요청이 실패하면, THEN SHALL "체크아웃에 실패했습니다" 토스트를 표시한다 |

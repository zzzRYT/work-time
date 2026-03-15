# 관리자 (Admin)

> **소스**: `docs/plans/2026-03-08-admin-feature.md` (관리자 기능 구현 플랜)
> **변환 기준**: EARS (Easy Approach to Requirements Syntax)
> **키워드 규칙**: SHALL (의무), WHILE (상태), WHEN (이벤트), IF…THEN (비정상), WHERE (선택)

---

## 1. 탭 접근 제어

### 1.1 관리자 탭 표시

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-1.1.1 | State-Driven | WHILE 선택된 멤버의 role이 ADMIN인 경우, SHALL 하단 탭 바에 "관리" 탭을 표시한다 |
| REQ-1.1.2 | State-Driven | WHILE 선택된 멤버의 role이 MEMBER인 경우, SHALL 하단 탭 바에서 "관리" 탭을 숨긴다 |
| REQ-1.1.3 | State-Driven | WHILE 멤버가 선택되지 않은 경우, SHALL 하단 탭 바에서 "관리" 탭을 숨긴다 |

---

## 2. 관리자 지정

### 2.1 멤버 목록

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-2.1.1 | Ubiquitous | SHALL 관리자 지정 섹션에 전체 멤버 목록을 표시한다 |
| REQ-2.1.2 | Ubiquitous | SHALL 각 멤버의 이름과 현재 role(ADMIN 또는 MEMBER)을 표시한다 |

### 2.2 역할 변경

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-2.2.1 | State-Driven | WHILE 멤버의 role이 MEMBER인 경우, SHALL 해당 멤버 옆에 "지정" 버튼을 표시한다 |
| REQ-2.2.2 | State-Driven | WHILE 멤버의 role이 ADMIN인 경우, SHALL 해당 멤버 옆에 "해제" 버튼을 표시한다 |
| REQ-2.2.3 | Event-Driven | WHEN 관리자가 "지정" 버튼을 탭하면, SHALL 해당 멤버의 role을 ADMIN으로 변경한다 |
| REQ-2.2.4 | Event-Driven | WHEN 관리자가 "해제" 버튼을 탭하면, SHALL 해당 멤버의 role을 MEMBER로 변경한다 |
| REQ-2.2.5 | Event-Driven | WHEN 역할 변경이 완료되면, SHALL 멤버 목록의 role 표시를 즉시 갱신한다 |

### 2.3 역할 검증

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-2.3.1 | IF…THEN | IF role 값이 ADMIN 또는 MEMBER가 아닌 경우, THEN SHALL 역할 변경 요청을 거부한다 |

---

## 3. 출근 시간 설정

### 3.1 현재 설정 표시

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-3.1.1 | Ubiquitous | SHALL 현재 설정된 출근 시간을 "HH:MM" 형식으로 표시한다 |

### 3.2 출근 시간 변경

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-3.2.1 | Ubiquitous | SHALL 시간(hour) 입력 필드를 표시한다 |
| REQ-3.2.2 | Ubiquitous | SHALL 분(minute) 입력 필드를 표시한다 |
| REQ-3.2.3 | Ubiquitous | SHALL "저장" 버튼을 표시한다 |
| REQ-3.2.4 | Event-Driven | WHEN 관리자가 시간/분을 입력하고 "저장" 버튼을 탭하면, SHALL 출근 시간 설정을 서버에 저장한다 |
| REQ-3.2.5 | Event-Driven | WHEN 출근 시간 저장이 완료되면, SHALL 현재 설정 표시를 갱신한다 |

### 3.3 출근 시간 검증

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-3.3.1 | IF…THEN | IF 시간 값이 0~23 범위를 벗어난 경우, THEN SHALL 저장 요청을 거부한다 |
| REQ-3.3.2 | IF…THEN | IF 분 값이 0~59 범위를 벗어난 경우, THEN SHALL 저장 요청을 거부한다 |

### 3.4 지각 판정 연동

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-3.4.1 | Ubiquitous | SHALL 변경된 출근 시간을 지각 판정 기준으로 사용한다 |

---

## 4. 지각비 설정

### 4.1 현재 설정 표시

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-4.1.1 | Ubiquitous | SHALL 현재 설정된 지각비 금액을 표시한다 |

### 4.2 지각비 변경

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-4.2.1 | Ubiquitous | SHALL 금액 입력 필드를 표시한다 |
| REQ-4.2.2 | Ubiquitous | SHALL "저장" 버튼을 표시한다 |
| REQ-4.2.3 | Event-Driven | WHEN 관리자가 금액을 입력하고 "저장" 버튼을 탭하면, SHALL 지각비 설정을 서버에 저장한다 |
| REQ-4.2.4 | Event-Driven | WHEN 지각비 저장이 완료되면, SHALL 현재 설정 표시를 갱신한다 |

### 4.3 지각비 검증

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-4.3.1 | IF…THEN | IF 금액 값이 0 미만인 경우, THEN SHALL 저장 요청을 거부한다 |

### 4.4 지각비 계산 연동

| ID | EARS 패턴 | 요구사항 |
| --- | --- | --- |
| REQ-4.4.1 | Ubiquitous | SHALL 변경된 지각비 금액을 지각비 계산에 사용한다 |

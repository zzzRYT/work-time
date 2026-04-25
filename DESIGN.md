# Design System — WorkTime

## Product Context
- **What this is:** 실시간 프레즌스 + 자동 회비 관리 앱. "누가 지금 공부하고 있는지" 보여주는 연결감 도구.
- **Who it's for:** 대학 동아리, 스터디 그룹, 팀 등 어떤 그룹이든
- **Space/industry:** Co-study / Attendance / Group management
- **Project type:** Mobile app (Expo React Native, 4-tab: Home/Calendar/Ranking/Settings)

## Aesthetic Direction
- **Direction:** Warm Community — 동네 친구랑 같이 앉아 공부하는 느낌
- **Decoration level:** Soft & Intentional — 부드러운 그림자, 살짝 올라온 카드. 따뜻한 텍스처.
- **Mood:** 포근하고 친근하고 편안함. 스터디 카페보다 친구 집 거실. 동아리방 게시판.
- **Reference:** Bear 앱 (따뜻한 노트 감성), Day One (일기 같은 친밀감), 당근마켓 (동네 커뮤니티 친근함)

## Typography
- **Display/Hero:** Nunito ExtraBold — 둥글고 귀엽고 친근한. 공식적이지 않은 커뮤니티 에너지.
- **Body:** Pretendard Regular — 한국어 가독성 최우선. 딱딱하지 않고 자연스러운 느낌.
- **UI/Labels:** Pretendard Medium — 일반 자간. uppercase/wide-tracking 없음.
- **Data/Timers:** Geist Mono — tabular-nums, 타이머와 숫자 데이터 전용
- **Loading:** Google Fonts (Nunito), jsDelivr CDN (Pretendard)
- **Scale:** 11px(caption) / 13px(body-sm) / 15px(body) / 17px(title) / 22px(h2) / 28px(h1) / 44px(timer)
- **Letter spacing:** 기본값 유지. 레이블에 uppercase 사용하지 않음.

## Color
- **Approach:** 따뜻하고 포근한 뉴트럴 + 친근한 액센트 1개. 눈이 편안한 크림-웜 베이스.
- **Background:** #FFFBF5 — 따뜻한 크림. 차갑지 않고 포근한 공간감.
- **Surface:** #FFF7EE — 카드, 시트 배경 (살짝 더 따뜻)
- **Surface Raised:** #FFF0DC — 호버, 선택 상태, 강조 카드
- **Text:** #2C1F14 — 검정 대신 웜 다크브라운. 부드럽게 읽힘.
- **Text Muted:** #8A7060 — 보조 텍스트, 따뜻한 갈색 계열
- **Text Subtle:** #B8A898 — 플레이스홀더, 비활성
- **Border:** #EDE4D8 — 구분선. 차갑지 않은 따뜻한 베이지.
- **Accent:** #F07A5A — 따뜻한 코랄-오렌지. 친근하고 활기차지만 과하지 않음.
- **Accent Light:** #FEF0EB — 액센트 배경 (뱃지, 하이라이트)
- **Semantic:**
  - Studying: #3DAD9E (따뜻한 teal) / bg: #E6F7F5
  - Late: #E8824A (warm orange) / bg: #FEF0E6
  - Vacation: #6096DB (soft blue) / bg: #EEF3FD
  - Done: #A0917F (muted warm) / bg: #F5F0EA
- **Dark mode:**
  - Background: #1E1510
  - Surface: #2A1E16
  - Surface Raised: #3A2C22
  - Text: #F5EDE3
  - Accent: #F08C6A (살짝 밝게)
  - Border: #3A2C22

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** 카드 기반 — 부드러운 그림자와 따뜻한 배경으로 자연스럽게 계층 표현
- **Max content width:** 420px (mobile-first)
- **Padding:** 20px horizontal
- **Border radius:** sm:10px, md:16px, lg:20px, full:9999px — 둥글고 부드럽게. 각진 것보다 따뜻함.
- **Card shadow:** 0 2px 8px rgba(44,31,20,0.07), 0 1px 3px rgba(44,31,20,0.05) — 은은하게 떠있는 느낌
- **Divider:** 1px solid #EDE4D8

## Motion
- **Approach:** 부드럽고 자연스럽게 — 기계적이지 않고 살아있는 느낌. 과하지 않되 딱딱하지도 않게.
- **Easing:** enter(ease-out) exit(ease-in) spring(spring-like for cards/buttons)
- **Duration:** micro(120ms) short(200ms) medium(300ms)
- **Pulse animation:** 공부 중 상태 인디케이터. 2.5s ease-in-out infinite. 숨쉬는 것처럼 천천히.

## Component Patterns

### Avatar
- 40px 원형, Accent Light 또는 상태 색상 bg에 이니셜 1자
- Text 색상 (#2C1F14), SemiBold
- 테두리 없음. 둥글고 귀여운 느낌.

### Status Badge
- pill 형태 (radius-full), 12px Pretendard Medium
- 한국어 레이블 그대로 사용 ("공부 중", "지각", "휴가" 등). uppercase 없음.
- 상태별 semantic 색상 배경 + 텍스트 조합

### Session Card (공부 중 상태)
- Background: Accent Light (#FEF0EB)
- Border: 1px solid Accent (#F07A5A, opacity 30%)
- 타이머: Geist Mono 44px, Text (#2C1F14)
- 라이브 펄스 인디케이터: Accent (#F07A5A), 숨쉬듯 천천히

### Member Item
- Background: Surface (#FFF7EE)
- 카드 그림자: 은은하게
- Avatar + 이름(Pretendard Medium) + 상태 배지
- 보조 정보: Pretendard Regular, Text Muted (#8A7060)

### Tab Bar
- Background: Surface (#FFF7EE)
- Border-top: 1px solid #EDE4D8
- Active: Accent (#F07A5A) / Inactive: Text Subtle (#B8A898)
- 레이블: 11px Pretendard Medium, 한국어 레이블

### Section Header
- 14px Pretendard SemiBold, Text Muted (#8A7060)
- uppercase 없음. 자연스럽게 한국어로.

### Primary Button
- Background: Accent (#F07A5A), Text: #FFFFFF
- radius: 16px (둥글게), 15px Pretendard SemiBold
- 누르면 살짝 scale down (0.97) — 물리적인 피드백

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Teal primary 대신 Indigo | "공부 중" 상태와 색상이 자연스럽게 연결. 카테고리 차별화. |
| 2026-03-28 | Warm cream 배경 | 차가운 회색 대신 따뜻한 느낌. 스터디 카페 무드. |
| 2026-03-28 | Geist Mono for timers | 개발자 툴 느낌으로 스터디 앱에서 독특한 포인트. |
| 2026-03-28 | Plus Jakarta Sans | 따뜻하고 현대적. Inter/Roboto 같은 기본값 회피. |
| 2026-04-25 | Dark Luxury Minimal 시도 | Modern Agile 로고에서 영감. 하지만 동아리/소모임 앱에 거리감이 있었음 → 철회. |
| 2026-04-25 | Warm Community로 재방향 | "세련됨보다 포근함". 동네 친구, 소모임, 동아리 — 가까이 다가오는 느낌이 핵심. |
| 2026-04-25 | Accent를 Coral-Orange (#F07A5A)로 | 따뜻하고 친근한 에너지. 코랄/오렌지는 심리적으로 가깝고 사교적인 색상. |
| 2026-04-25 | Nunito + Pretendard 조합 | Nunito의 둥근 글자꼴이 친근함을 물리적으로 전달. Pretendard는 한국어 가독성 최우선. |
| 2026-04-25 | uppercase/wide-tracking 제거 | 포멀한 느낌의 원인. 한국어 레이블 그대로 사용하면 훨씬 자연스럽고 친근함. |
| 2026-04-25 | border-radius 늘림 | 각진 모서리는 딱딱하고 거리감을 줌. 둥근 모서리(16-20px)가 포근함을 전달. |
| 2026-04-25 | 그림자 복원 | 다크모드 스타일 border-only 카드는 차가운 느낌. 은은한 웜 그림자가 "떠있는 카드" 느낌으로 친근함. |

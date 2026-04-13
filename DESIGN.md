# Design System — WorkTime

## Product Context
- **What this is:** 실시간 프레즌스 + 자동 회비 관리 앱. "누가 지금 공부하고 있는지" 보여주는 연결감 도구.
- **Who it's for:** 대학 동아리, 스터디 그룹, 팀 등 어떤 그룹이든
- **Space/industry:** Co-study / Attendance / Group management
- **Project type:** Mobile app (Expo React Native, 4-tab: Home/Calendar/Ranking/Settings)

## Aesthetic Direction
- **Direction:** Warm Minimal — 아늑한 스터디 카페 같은 느낌
- **Decoration level:** Intentional — 미묘한 그림자, 카드 위 부드러운 엘리베이션
- **Mood:** 따뜻하고 차분하고 집중된. 기업 도구가 아니라 함께하는 공간.
- **Reference sites:** Focusmate (warm, professional), StudyStream (social, live)

## Typography
- **Display/Hero:** Plus Jakarta Sans Bold/ExtraBold — 따뜻하고 현대적, 한국어와 잘 어울림
- **Body:** Plus Jakarta Sans Regular — 가독성 좋고 친근한 느낌
- **UI/Labels:** Plus Jakarta Sans Medium
- **Data/Tables:** Geist Mono — tabular-nums 지원, 타이머와 숫자 데이터에 사용
- **Code:** Geist Mono
- **Loading:** Google Fonts (Plus Jakarta Sans), Bunny Fonts 대안
- **Scale:** 11px(caption) / 13px(body-sm) / 15px(body) / 17px(title) / 24px(h2) / 32px(h1) / 48px(timer)

## Color
- **Approach:** Restrained + warm — 1개 액센트 + 따뜻한 뉴트럴
- **Primary:** #0D9488 (teal) — "활동 중/공부 중" 상태와 자연스럽게 연결
- **Primary Light:** #CCFBF1 — 배지, 하이라이트 배경
- **Background:** #FFFBF5 (warm cream) — 차가운 회색 대신 따뜻한 크림
- **Surface:** #FFF7ED (warm white) — 카드, 입력 필드 배경
- **Text:** #1C1917 (stone-900) — 따뜻한 검정
- **Text Muted:** #78716C (stone-500) — 보조 텍스트
- **Text Subtle:** #A8A29E (stone-400) — 플레이스홀더
- **Border:** #E7E5E4 (stone-200)
- **Semantic:**
  - Studying: #0D9488 (teal) / bg: #CCFBF1
  - Late: #EA580C (orange-600) / bg: #FFF7ED
  - Vacation: #2563EB (blue-600) / bg: #EFF6FF
  - Done: #78716C (stone-500) / bg: #F5F5F4
- **Dark mode:**
  - Background: #1C1917
  - Surface: #292524
  - Text: #FAFAF9
  - Primary: #2DD4BF (teal-400, 밝게 조정)
  - Studying bg: #0F3D38

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined — 모바일 4탭 구조, 카드 기반
- **Max content width:** 420px (mobile-first)
- **Padding:** 20px horizontal
- **Border radius:** sm:8px, md:12px, lg:16px, full:9999px
- **Card shadow:** 0 1px 3px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)

## Motion
- **Approach:** Minimal-functional — 상태 변경 트랜지션만
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(100ms) short(200ms) medium(300ms)
- **Pulse animation:** 공부 중 상태 인디케이터에 2s ease-in-out infinite

## Component Patterns
- **Avatar:** 40px 원형, 배경색에 이니셜 1자 (흰색 텍스트, Bold)
- **Status Badge:** pill 형태 (radius-full), 11px 텍스트, 상태별 bg+text 색상
- **Session Card:** Primary 배경, 흰색 텍스트, Geist Mono 타이머
- **Member Item:** Surface 배경, avatar + info + status badge
- **Tab Bar:** Surface 배경, border-top, active=primary color

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Teal primary 대신 Indigo | "공부 중" 상태와 색상이 자연스럽게 연결. 카테고리 차별화. |
| 2026-03-28 | Warm cream 배경 | 차가운 회색 대신 따뜻한 느낌. 스터디 카페 무드. |
| 2026-03-28 | Geist Mono for timers | 개발자 툴 느낌으로 스터디 앱에서 독특한 포인트. |
| 2026-03-28 | Plus Jakarta Sans | 따뜻하고 현대적. Inter/Roboto 같은 기본값 회피. |

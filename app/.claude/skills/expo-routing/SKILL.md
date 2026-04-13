---
name: expo-routing
description: Use when adding routes, navigation, deep links, or layout files. Triggers on "라우트 추가", "화면 추가", "네비게이션", "딥링크", or when creating/modifying files in app/ directory.
---

# Expo Router Conventions

## Overview

Expo Router의 파일 시스템 기반 라우팅을 사용한다. `app/` 디렉토리는 **라우팅만** 담당하고, 로직은 pages/에 둔다.

## app/ 파일 규칙

`app/` 파일은 pages/의 **re-export만**:
```tsx
// app/(authenticated)/(tabs)/home.tsx
export { default } from '@pages/home';
```

로직, 스타일, 상태 관리 코드를 `app/`에 직접 작성하지 않는다.

## 라우트 패턴

| 패턴 | 용도 | 예시 |
|------|------|------|
| `_layout.tsx` | 공유 레이아웃, Provider, 가드 | Stack, Tabs 설정 |
| `(group)/` | URL 미영향 논리 그룹 | `(authenticated)/`, `(tabs)/` |
| `[param].tsx` | 동적 라우트 | `soldiers/[id].tsx` |
| `[...param].tsx` | Catch-all | 다중 세그먼트 |
| `+not-found.tsx` | 404 처리 | 매칭 안 되는 경로 |

## 네비게이션

**Screen Options 자주 쓰는 설정:**
- `animation: 'slide_from_bottom'` — 모달, 생성 화면
- `gestureEnabled: false` — 이탈 방지 (결제, 편지 등)
- `headerShown: false` — 커스텀 헤더 사용 시
- `presentation: 'modal'` — 모달 표시

**프로그래밍적 네비게이션:**
```tsx
const router = useRouter();
router.push('/soldiers/123');     // 스택에 추가
router.replace('/home');          // 현재 화면 교체
router.back();                    // 뒤로가기
```

**훅 사용:**
- `useLocalSearchParams<{ id: string }>()` — 타입 안전한 파라미터
- `usePathname()` — 현재 경로 (가드에서 활용)
- `useFocusEffect()` — 탭 전환/뒤로가기 시에도 실행 (데이터 리프레시)

## Deep Linking

- `app.config.js`에서 `scheme` 설정
- `unstable_settings`의 `anchor`로 딥링크 진입 시 뒤로가기 목적지 지정
- 레이아웃에서 `<Redirect>`로 인증/온보딩 가드

## 경로 설계 원칙

새 라우트 경로를 설계할 때는 반드시 `docs/conventions/route-design.md`를 참조한다.
핵심: 도메인 기반 최상위 경로, 리소스=명사 / 플로우=동사, 네이밍 일관성, 의미적 소속.

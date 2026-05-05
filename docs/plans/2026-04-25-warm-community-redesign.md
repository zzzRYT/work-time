# Warm Community Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** DESIGN.md의 "Warm Community" 방향 (포근한 크림 + 코랄 오렌지 + 둥근 카드) 을 전 페이지에 순차 적용한다.

**Architecture:** 디자인 토큰을 `tailwind.config.js` 한 곳에서 교체해 NativeWind className이 대부분 자동 반영된다. 나머지 하드코딩된 hex값(ActivityIndicator color, yellow-* 계열 Tailwind 클래스)을 파일별로 수동 수정한다.

**Tech Stack:** Expo 52 · React Native 0.76 · NativeWind 4 · CVA · Bun

---

## 변경 범위 요약

### 자동 반영 (토큰 교체 → className 변경 불필요)
`bg-primary`, `bg-surface`, `bg-bg`, `border-border`, `text-text-primary`, `text-text-muted`, `text-text-subtle`, `bg-studying`, `bg-studying-bg`, `bg-late`, `bg-late-bg`, `bg-vacation`, `bg-vacation-bg`, `rounded-sm/md/lg`

### 수동 수정 필요 (하드코딩)
| 파일 | 문제 |
|------|------|
| `app/src/app/(tabs)/_layout.tsx` | inline style hex값 4개 |
| `app/src/shared/ui/screen-loader.tsx` | `color="#0D9488"` |
| `app/src/pages/history/HistoryPage.tsx` | `color="#0D9488"` |
| `app/src/pages/settings/SettingsPage.tsx` | `color="#0D9488"` |
| `app/src/pages/home/ui/check-button.tsx` | `color="#0D9488"` |
| `app/src/pages/home/ui/fee-shortcut.tsx` | `bg-yellow-100 text-yellow-600 text-gray-*` |
| `app/src/pages/home/ui/vacation-button.tsx` | `bg-yellow-50 border-yellow-200 text-yellow-700 text-gray-500` |
| `app/src/pages/ranking/ui/fee-section.tsx` | `bg-yellow-100 text-yellow-600` |

---

## Task 1: 디자인 토큰 교체 (tailwind.config.js)

**Files:**
- Modify: `app/tailwind.config.js`

**Step 1: 전체 colors + borderRadius 교체**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#FFFBF5",
        surface: "#FFF7EE",
        "surface-hover": "#FFF0DC",
        primary: {
          DEFAULT: "#F07A5A",
          light: "#FEF0EB",
          dark: "#D4603D",
        },
        "text-primary": "#2C1F14",
        "text-muted": "#8A7060",
        "text-subtle": "#B8A898",
        border: "#EDE4D8",
        studying: {
          DEFAULT: "#3DAD9E",
          bg: "#E6F7F5",
        },
        late: {
          DEFAULT: "#E8824A",
          bg: "#FEF0E6",
        },
        vacation: {
          DEFAULT: "#6096DB",
          bg: "#EEF3FD",
        },
        done: {
          DEFAULT: "#A0917F",
          bg: "#F5F0EA",
        },
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "20px",
      },
    },
  },
  plugins: [],
};
```

**Step 2: 타입체크로 충돌 없는지 확인**
```bash
cd app && npx tsc --noEmit 2>&1 | head -40
```
Expected: 에러 없거나 NativeWind 무관한 기존 에러만

**Step 3: 커밋**
```bash
git add app/tailwind.config.js
git commit -m "design: update warm community color tokens and border radius"
```

---

## Task 2: 탭바 + 전역 로더 하드코딩 수정

**Files:**
- Modify: `app/src/app/(tabs)/_layout.tsx`
- Modify: `app/src/shared/ui/screen-loader.tsx`

**Step 1: _layout.tsx 탭바 inline style 수정**

`screenOptions` 안의 값 교체:
```ts
tabBarActiveTintColor: "#F07A5A",
tabBarInactiveTintColor: "#B8A898",
tabBarStyle: {
  backgroundColor: "#FFF7EE",
  borderTopColor: "#EDE4D8",
},
```

**Step 2: screen-loader.tsx ActivityIndicator color 수정**
```tsx
<ActivityIndicator size="large" color="#F07A5A" />
```

**Step 3: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add "app/src/app/(tabs)/_layout.tsx" app/src/shared/ui/screen-loader.tsx
git commit -m "design: update tab bar and screen loader to warm community tokens"
```

---

## Task 3: 로그인 페이지 (login.tsx)

**Files:**
- Modify: `app/src/app/login.tsx`

토큰 기반 클래스는 Task 1로 자동 반영. 브랜드 아이콘 추가 + 버튼 radius 개선.

**Step 1: `flex-1 justify-center px-5` View 내부 교체**

```tsx
<View className="flex-1 justify-center px-5">
  <View className="items-center mb-14">
    <View className="bg-primary-light rounded-full w-16 h-16 items-center justify-center mb-4">
      <Text className="text-[28px]">⏱</Text>
    </View>
    <Text className="text-[32px] font-extrabold text-text-primary mb-2">
      WorkTime
    </Text>
    <Text className="text-[15px] text-text-muted text-center">
      함께 공부하고 있다는 연결감
    </Text>
  </View>

  <Pressable
    className="bg-surface border border-border rounded-lg py-4 px-6 flex-row items-center justify-center active:bg-surface-hover mb-3"
    onPress={() => handleOAuthLogin("google")}
  >
    <Text className="text-[15px] font-semibold text-text-primary">
      Google로 시작하기
    </Text>
  </Pressable>

  {Platform.OS === "ios" && (
    <Pressable
      className="bg-text-primary rounded-lg py-4 px-6 flex-row items-center justify-center active:opacity-80"
      onPress={handleAppleLogin}
    >
      <Text className="text-[15px] font-semibold text-bg">
        Apple로 시작하기
      </Text>
    </Pressable>
  )}

  {!isSupabaseConfigured && (
    <Text className="text-[11px] text-text-subtle text-center mt-4">
      Supabase 환경 변수가 설정되지 않았습니다
    </Text>
  )}
</View>
```

**Step 2: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/app/login.tsx
git commit -m "design: update login page to warm community style"
```

---

## Task 4: 워크스페이스 선택 페이지 (workspaces.tsx)

**Files:**
- Modify: `app/src/app/workspaces.tsx`

토큰 기반 클래스 대부분 자동 반영. `rounded-sm` → `rounded-lg` 로 더 둥글게.

**Step 1: 만들기 버튼 radius 수정**

`bg-primary rounded-sm py-3` → `bg-primary rounded-lg py-3`

**Step 2: 점선 버튼에 active 상태 추가**

```tsx
<Pressable
  className="mt-6 border-2 border-dashed border-border rounded-lg py-5 items-center active:bg-surface"
  onPress={() => setShowCreate(true)}
>
  <Text className="text-text-muted font-medium text-[15px]">
    + 새 워크스페이스 만들기
  </Text>
</Pressable>
```

**Step 3: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/app/workspaces.tsx
git commit -m "design: update workspaces page to warm community style"
```

---

## Task 5: 홈 — SessionCard + 그림자

**Files:**
- Modify: `app/src/pages/home/ui/session-card.tsx`

**Step 1: studying 중 아닐 때 카드에 그림자 추가**

`isStudying`이 false인 `<View>` 에 style prop 추가:
```tsx
<View
  className={cn(
    "rounded-lg p-6",
    isStudying ? "bg-primary" : "bg-surface border border-border",
    className
  )}
  style={
    !isStudying
      ? {
          shadowColor: "#2C1F14",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07,
          shadowRadius: 8,
          elevation: 2,
        }
      : undefined
  }
>
```

**Step 2: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/pages/home/ui/session-card.tsx
git commit -m "design: add warm shadow to session card"
```

---

## Task 6: 홈 — CheckButton + Timer

**Files:**
- Modify: `app/src/pages/home/ui/check-button.tsx`

**Step 1: ActivityIndicator color 수정**
```tsx
// 현재
<ActivityIndicator color="#0D9488" size={20} />
// 변경 후
<ActivityIndicator color="#F07A5A" size={20} />
```

timer.tsx는 토큰 기반이므로 변경 불필요.

**Step 2: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/pages/home/ui/check-button.tsx
git commit -m "design: fix activity indicator color in check button"
```

---

## Task 7: 홈 — FeeShortcut (yellow 계열 제거)

**Files:**
- Modify: `app/src/pages/home/ui/fee-shortcut.tsx`

**Step 1: `text-gray-900`, `text-gray-500` → 토큰으로 교체**
```tsx
<Text className="text-sm font-semibold text-text-primary mb-1">{title}</Text>
<Text className="text-xs text-text-muted mb-3">{description}</Text>
```

**Step 2: "확인 대기 중" 배지 — yellow → done 토큰**
```tsx
// 현재
<View className="rounded-lg py-2.5 items-center bg-yellow-100">
  <Text className="text-sm font-semibold text-yellow-600">확인 대기 중</Text>
</View>
// 변경 후
<View className="rounded-lg py-2.5 items-center bg-done-bg">
  <Text className="text-sm font-semibold text-done">확인 대기 중</Text>
</View>
```

**Step 3: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/pages/home/ui/fee-shortcut.tsx
git commit -m "design: remove hardcoded yellow colors from fee shortcut"
```

---

## Task 8: 홈 — VacationButton (yellow 계열 제거)

**Files:**
- Modify: `app/src/pages/home/ui/vacation-button.tsx`

**Step 1: 전일 휴가 경고 배너 교체**
```tsx
// 현재
<View className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-3">
  <Text className="text-yellow-700 text-xs">
    전일 휴가로 처리되며, 오늘 체크인이 불가합니다
  </Text>
</View>
// 변경 후
<View className="bg-vacation-bg border border-vacation/30 rounded-lg px-3 py-2 mb-3">
  <Text className="text-vacation text-xs">
    전일 휴가로 처리되며, 오늘 체크인이 불가합니다
  </Text>
</View>
```

**Step 2: 취소 버튼 `text-gray-500` → 토큰**
```tsx
<Text className="text-text-muted text-sm">취소</Text>
```

**Step 3: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/pages/home/ui/vacation-button.tsx
git commit -m "design: remove hardcoded yellow/gray colors from vacation button"
```

---

## Task 9: 홈 — PresenceList + HomePage 카드 그림자

**Files:**
- Modify: `app/src/pages/home/ui/presence-list.tsx`
- Modify: `app/src/pages/home/HomePage.tsx`

공통 shadow style (두 파일 모두에 적용):
```ts
const cardShadow = {
  shadowColor: "#2C1F14",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};
```

**Step 1: presence-list.tsx 루트 View에 style 추가**
```tsx
<View
  className={cn("bg-surface rounded-lg p-4 border border-border", className)}
  style={cardShadow}
>
```

**Step 2: HomePage.tsx summary View에 style 추가**
```tsx
<View className="flex-row bg-surface rounded-lg p-3 mb-4 border border-border" style={cardShadow}>
```

**Step 3: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/pages/home/ui/presence-list.tsx app/src/pages/home/HomePage.tsx
git commit -m "design: add warm shadow to home list and summary cards"
```

---

## Task 10: Shared — StatusBadge 텍스트 크기 미세 조정

**Files:**
- Modify: `app/src/shared/ui/status-badge.tsx`

**Step 1: textVariants `text-xs` → `text-[12px]`**
```tsx
const textVariants = cva("text-[12px] font-semibold", {
```

MemberRow는 토큰 기반이므로 변경 불필요.

**Step 2: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/shared/ui/status-badge.tsx
git commit -m "design: slightly increase status badge font size"
```

---

## Task 11: 랭킹 페이지

**Files:**
- Modify: `app/src/pages/ranking/ui/fee-section.tsx`

**Step 1: PENDING 상태 yellow → done 토큰**
```ts
const statusBg: Record<PaymentStatus, string> = {
  UNPAID: "bg-late-bg",
  PENDING: "bg-done-bg",   // was: bg-yellow-100
  PAID: "bg-studying-bg",
};
const statusText: Record<PaymentStatus, string> = {
  UNPAID: "text-late",
  PENDING: "text-done",    // was: text-yellow-600
  PAID: "text-studying",
};
```

ranking-list.tsx는 `bg-primary-light`, `border-l-primary`, `text-primary` 모두 토큰 기반 → 자동 반영.

**Step 2: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/pages/ranking/ui/fee-section.tsx
git commit -m "design: fix pending status color in ranking fee section"
```

---

## Task 12: 설정 페이지

**Files:**
- Modify: `app/src/pages/settings/SettingsPage.tsx`
- Modify: `app/src/pages/settings/ui/profile-section.tsx`
- Modify: `app/src/pages/settings/ui/invite-section.tsx`
- Modify: `app/src/pages/settings/ui/fee-confirm-section.tsx`

**Step 1: SettingsPage.tsx ActivityIndicator color 수정**
```tsx
<ActivityIndicator size="large" color="#F07A5A" />
```

**Step 2: 3개 섹션 카드에 그림자 추가**

각 파일의 `<View className="bg-surface rounded-lg p-4 border border-border">` 에 동일한 shadow style 추가:
```tsx
style={{
  shadowColor: "#2C1F14",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
}}
```

role-section.tsx, study-time-section.tsx, late-fee-section.tsx는 토큰 기반이므로 그림자만 필요하면 동일하게 추가.

**Step 3: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/pages/settings/SettingsPage.tsx \
        app/src/pages/settings/ui/profile-section.tsx \
        app/src/pages/settings/ui/invite-section.tsx \
        app/src/pages/settings/ui/fee-confirm-section.tsx
git commit -m "design: update settings page indicator and card shadows"
```

---

## Task 13: 캘린더/히스토리 페이지

**Files:**
- Modify: `app/src/pages/history/HistoryPage.tsx`
- Modify: `app/src/pages/history/ui/*.tsx` (하드코딩 발견 시)

**Step 1: HistoryPage.tsx ActivityIndicator color 수정 (2곳)**
```tsx
<ActivityIndicator size="large" color="#F07A5A" />
```

**Step 2: history sub-components 하드코딩 검사**
```bash
grep -n "#0D9488\|yellow-\|gray-[0-9]" app/src/pages/history/ui/*.tsx
```
발견된 줄에 대해 아래 매핑으로 교체:
- `yellow-*` → `done-*` 또는 `late-*`
- `text-gray-500` → `text-text-muted`
- `#0D9488` → `#F07A5A`

**Step 3: 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1 | head -20
git add app/src/pages/history/
git commit -m "design: update history page to warm community tokens"
```

---

## Task 14: 전체 잔여 하드코딩 최종 스캔

**Step 1: 전수 검사**
```bash
grep -rn "#0D9488\|#CCFBF1\|#1C1917\|#78716C\|#A8A29E\|#E7E5E4\|#FFF7ED\|yellow-\|gray-[0-9]" \
  app/src/ --include="*.tsx"
```

**Step 2: 발견 항목 교체 매핑**

| 찾는 값 | 교체 값 |
|---------|---------|
| `color="#0D9488"` | `color="#F07A5A"` |
| `#CCFBF1` | `#FEF0EB` |
| `bg-yellow-100` | `bg-done-bg` |
| `text-yellow-600` | `text-done` |
| `bg-yellow-50` | `bg-vacation-bg` |
| `text-yellow-700` | `text-vacation` |
| `border-yellow-200` | `border-vacation/30` |
| `text-gray-500` | `text-text-muted` |
| `text-gray-900` | `text-text-primary` |

**Step 3: 최종 타입체크 + 커밋**
```bash
cd app && npx tsc --noEmit 2>&1
git add -p
git commit -m "design: clean up all remaining hardcoded colors"
```

---

## Task 15 (선택, 별도 PR): 폰트 — Nunito 적용

> **주의:** asset 파일 추가가 필요해 별도 PR 권장.

**Step 1: 패키지 설치**
```bash
cd app && bun add @expo-google-fonts/nunito expo-font
```

**Step 2: `app/src/app/_layout.tsx` 에 폰트 로딩 추가**
```tsx
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
// ... 기존 RootLayout에서 useFonts hook 추가
const [loaded] = useFonts({ Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold });
useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
if (!loaded) return null;
```

**Step 3: tailwind.config.js에 fontFamily 추가**
```js
fontFamily: {
  display: ['Nunito_800ExtraBold'],
  body: ['Nunito_400Regular'],
  medium: ['Nunito_700Bold'],
},
```

**Step 4: 주요 타이틀에 `font-display` 적용**

HomePage, RankingPage, SettingsPage의 페이지 타이틀 `text-[24px] font-bold` → `text-[24px] font-display`

**Step 5: 커밋**
```bash
git add app/
git commit -m "feat: add Nunito display font for warm community feel"
```

---

## 실행 순서

```
Task 1  ← 반드시 먼저 (토큰 기반)
Task 2  ← Task 1 완료 후
Task 3~9  ← 독립적, 순서 무관
Task 10~13  ← 독립적, 순서 무관
Task 14  ← 마지막 (전수 검사)
Task 15  ← 선택, 별도 PR
```

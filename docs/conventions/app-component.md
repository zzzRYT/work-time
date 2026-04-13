# App Component Convention

## 컴포넌트 작성 기본

- **함수 컴포넌트만** — class 컴포넌트 금지
- **`export default function`** (페이지) 또는 **`export const`** (하위 컴포넌트)
- 스타일은 `className` (NativeWind) — `StyleSheet.create` 지양

```tsx
// pages/home/ui/check-button.tsx
import { Pressable, Text } from 'react-native';
import { cn } from '@shared/lib/cn';

interface CheckButtonProps {
  isActive: boolean;
  onPress: () => void;
  className?: string;
}

export const CheckButton = ({ isActive, onPress, className }: CheckButtonProps) => (
  <Pressable
    className={cn(
      'items-center justify-center rounded-md py-4',
      isActive ? 'bg-primary' : 'bg-surface border border-border',
      className,
    )}
    onPress={onPress}
  >
    <Text className={cn('text-[15px] font-semibold', isActive ? 'text-white' : 'text-text-primary')}>
      {isActive ? '체크아웃' : '체크인'}
    </Text>
  </Pressable>
);
```

## Props 규칙

- Props 타입은 `interface` (확장 가능성) 또는 inline (간단할 때)
- `className?: string` — 외부에서 스타일 override 가능하게 열어두기
- 이벤트 핸들러: `onPress`, `onSubmit` 등 `on` 접두사
- 데이터: 도메인 타입 직접 전달 (DTO wrapper 만들지 말 것)

## cn() 사용

```tsx
import { cn } from '@shared/lib/cn';

// 조건부 스타일
className={cn('base-classes', condition && 'conditional-classes', className)}

// 삼항 연산자보다 cn() 선호
// ❌ className={`text-base ${isActive ? 'text-white' : 'text-text-primary'}`}
// ✅ className={cn('text-base', isActive ? 'text-white' : 'text-text-primary')}
```

## DESIGN.md 토큰 매핑

`DESIGN.md`의 디자인 토큰은 `tailwind.config.js`에 매핑됨.
코드에서는 항상 **Tailwind class 이름**을 사용:

| DESIGN.md 토큰 | Tailwind class |
|----------------|---------------|
| Background `#FFFBF5` | `bg-bg` |
| Surface `#FFF7ED` | `bg-surface` |
| Primary `#0D9488` | `bg-primary`, `text-primary` |
| Primary Light `#CCFBF1` | `bg-primary-light` |
| Text `#1C1917` | `text-text-primary` |
| Text Muted `#78716C` | `text-text-muted` |
| Text Subtle `#A8A29E` | `text-text-subtle` |
| Border `#E7E5E4` | `border-border` |
| Studying | `bg-studying-bg`, `text-studying` |
| Late | `bg-late-bg`, `text-late` |
| Vacation | `bg-vacation-bg`, `text-vacation` |
| Done | `bg-done-bg`, `text-done` |

- **hex 값 직접 사용 금지** — 반드시 Tailwind class 경유
- 토큰 추가 필요 시 `DESIGN.md` → `tailwind.config.js` → 코드 순서

## Typography

| 용도 | 크기 class | 폰트 weight |
|------|-----------|------------|
| Caption | `text-[11px]` | — |
| Body SM | `text-[13px]` | — |
| Body | `text-[15px]` | — |
| Title | `text-[17px]` | `font-semibold` |
| H2 | `text-[24px]` | `font-bold` |
| H1 | `text-[32px]` | `font-extrabold` |
| Timer | `text-[48px]` | `font-bold` + Geist Mono |

## 상태별 표현

| 상태 | 배경 | 텍스트 | 예시 |
|------|------|--------|------|
| 공부 중 | `bg-studying-bg` | `text-studying` | 활성 세션 |
| 지각 | `bg-late-bg` | `text-late` | 지각 알림 |
| 휴가 | `bg-vacation-bg` | `text-vacation` | 휴가 배지 |
| 완료 | `bg-done-bg` | `text-done` | 체크아웃 완료 |

## 금지 사항

- `StyleSheet.create()` — NativeWind className 사용
- hex 직접 하드코딩 — Tailwind token 사용
- `React.FC` 타입 — 일반 함수 + Props interface
- 페이지 전용 컴포넌트를 `shared/ui/`에 올리기 — 2+ 페이지 사용 시에만

---
name: nativewind-styling
description: Use when styling components, creating design variants, or working with Tailwind classes in React Native. Triggers on "스타일", "styling", "variant", "CVA", "NativeWind", "cn()", or when writing className props.
---

# NativeWind + CVA Styling

## Overview

NativeWind로 Tailwind 유틸리티 클래스 기반 스타일링, CVA로 컴포넌트 variant를 선언적으로 관리한다.

## cn() 유틸리티

`clsx` + `tailwind-merge` 조합:
```tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

사용:
```tsx
<View className={cn('flex-1 p-4', isActive && 'bg-blue-500', className)} />
```

## CVA 패턴 — Variant 컴포넌트

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('items-center justify-center rounded-lg', {
  variants: {
    size: {
      sm: 'h-8 px-3',
      md: 'h-10 px-4',
      lg: 'h-12 px-6',
    },
    intent: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-200',
      danger: 'bg-red-500',
    },
  },
  defaultVariants: {
    size: 'md',
    intent: 'primary',
  },
});

type ButtonProps = VariantProps<typeof buttonVariants> & {
  className?: string;
};

export const Button = ({ size, intent, className, ...props }: ButtonProps) => (
  <Pressable className={cn(buttonVariants({ size, intent }), className)} {...props} />
);
```

## 스타일링 규칙

- `StyleSheet.create()` 대신 `className` 사용
- 디자인 토큰은 `tailwind.config`에서 관리
- 플랫폼 분기: `platform:ios:` / `platform:android:` 접두사
- 다크모드: `dark:` 접두사
- 조건부 스타일은 `cn()`으로 — 삼항 연산자 직접 사용 지양

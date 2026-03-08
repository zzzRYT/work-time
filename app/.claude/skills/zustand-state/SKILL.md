---
name: zustand-state
description: Use when creating stores, managing state, or deciding between state management approaches. Triggers on "상태 관리", "스토어", "store", "전역 상태", "Context", or when choosing where to put state.
---

# Zustand State Management

## Overview

상태 관리 방식을 데이터 특성에 따라 선택한다. Zustand는 전역/스코프드 상태에, Context는 고정값에, AsyncStorage는 렌더 무관 데이터에 사용한다.

## 상태 방식 결정 트리

```
이 데이터가 렌더에 참여하는가?
  ├─ No → AsyncStorage 단독
  └─ Yes → 범위는?
       ├─ 특정 컴포넌트 트리 → 값이 런타임에 변하고 consumer 여럿?
       │    ├─ Yes → Context + createStore()
       │    └─ No  → plain Context
       └─ 앱 전역 → 재시작 후에도 유지?
            ├─ No  → Global Memory Store (create())
            └─ Yes → Global Persist Store (create() + persist())
```

## 패턴별 코드

**Global Persist Store** — 재시작 후 유지:
```tsx
export const useAuthTokenStore = create<State & Action>()(
  persist(
    (set) => ({
      accessToken: null,
      actions: {
        setToken: (token) => set({ accessToken: token }),
      },
    }),
    {
      name: 'auth-token-store',
      storage: createJSONStorage(() => SecureStorage),
      partialize: (state) => ({ accessToken: state.accessToken }),
    },
  ),
);
```

**Global Memory Store** — 세션 동안만:
```tsx
export const useUIStore = create<State & Action>()((set) => ({
  isOpen: false,
  actions: { toggle: () => set((s) => ({ isOpen: !s.isOpen })) },
}));
```

**Context + Store** — 스코프드 상태:
```tsx
// 1. createStore (create가 아님)
const [store] = useState(() =>
  createStore<State & Action>((set) => ({
    value: '',
    actions: { setValue: (v) => set({ value: v }) },
  })),
);

// 2. Context로 주입
<StoreContext value={store}>{children}</StoreContext>

// 3. selector로 구독
export const useValue = () => useStoreContext((s) => s.value);
```

## 컨벤션

- `actions` 객체로 액션을 그룹화
- persist 시 `partialize`로 저장 필드 명시
- store 파일 위치는 FSD 레이어 규칙을 따름 (pages/ → features/ → shared/)

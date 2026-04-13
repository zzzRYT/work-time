---
name: zustand-state
description: Use when creating stores, managing state, or deciding between state management approaches. Triggers on "상태 관리", "스토어", "store", "전역 상태", "Context", or when choosing where to put state.
---

# Zustand State Management

## 핵심 원칙

**Zustand `create()`는 전역 상태 전용이다.** 특정 컴포넌트 트리에 스코프된 상태는 Context Provider + `createStore()` 패턴을 사용한다.

## 상태 방식 결정 트리

```
이 상태를 누가 사용하는가?
  │
  ├─ 앱 어디서든 접근 → Zustand 전역 스토어
  │    └─ shared/store/{name}.ts
  │    └─ create() 사용
  │
  ├─ 특정 화면/컴포넌트 트리 안에서만 → Context Provider 패턴
  │    └─ pages/{page}/model/{name}-store.ts (또는 해당 위치)
  │    └─ createStore() + Context 사용
  │
  ├─ 한 컴포넌트 안에서만 → useState / useReducer
  │
  └─ 서버에서 온 데이터 → Apollo 캐시 (Zustand에 넣지 말 것)
```

## 1. 전역 스토어 — `create()`

앱 전역에서 접근하는 상태. `shared/store/`에 위치.

```typescript
// shared/store/member.ts
import { create } from "zustand";

interface MemberState {
  selectedMemberId: string | null;
  isLoaded: boolean;
}

interface MemberActions {
  actions: {
    setSelectedMemberId: (id: string) => void;
    clearSelectedMemberId: () => void;
    hydrate: () => Promise<void>;
  };
}

export const useMemberStore = create<MemberState & MemberActions>((set) => ({
  selectedMemberId: null,
  isLoaded: false,
  actions: {
    setSelectedMemberId: (id) => {
      set({ selectedMemberId: id });
      AsyncStorage.setItem(STORAGE_KEY, id);
    },
    clearSelectedMemberId: () => {
      set({ selectedMemberId: null });
      AsyncStorage.removeItem(STORAGE_KEY);
    },
    hydrate: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      set({ selectedMemberId: stored, isLoaded: true });
    },
  },
}));
```

**사용:**
```typescript
// 상태값 — 셀렉터로 개별 구독 (리렌더 최소화)
const selectedMemberId = useMemberStore((s) => s.selectedMemberId);

// 액션 — actions 객체는 참조 불변이라 리렌더 유발 안 함
const { setSelectedMemberId } = useMemberStore((s) => s.actions);

// React 밖에서 접근 (Apollo link 등)
const { selectedMemberId } = useMemberStore.getState();
```

### 전역 스토어 + persist 미들웨어

재시작 후에도 유지해야 하는 단순 값에 사용:

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useMemberStore = create<State & Actions>()(
  persist(
    (set) => ({
      selectedMemberId: null,
      actions: {
        setSelectedMemberId: (id) => set({ selectedMemberId: id }),
      },
    }),
    {
      name: "member-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ selectedMemberId: s.selectedMemberId }),
    },
  ),
);
```

**⚠️ persist를 쓰지 않는 경우:**
- Supabase Auth 세션 — Supabase가 자체 관리. 수동 AsyncStorage 사용.
- 서버 데이터 캐시 — Apollo가 관리.

## 2. Context Provider 패턴 — `createStore()`

특정 화면이나 컴포넌트 트리 안에서만 유효한 상태.

```typescript
// pages/some-page/model/sorting-option-store.ts
import { createStore, useStore } from "zustand";
import { createContext, useContext, useRef, type ReactNode } from "react";

// ── Store 정의 ──
interface SortingOptionState {
  sortingOption: "LATEST" | "POPULAR";
  isChanging: boolean;
}

interface SortingOptionActions {
  actions: {
    setSortingOption: (option: SortingOptionState["sortingOption"]) => void;
    completeChange: () => void;
  };
}

type SortingOptionStore = SortingOptionState & SortingOptionActions;

const createSortingOptionStore = () =>
  createStore<SortingOptionStore>((set) => ({
    sortingOption: "LATEST",
    isChanging: false,
    actions: {
      setSortingOption: (option) => set({ sortingOption: option, isChanging: true }),
      completeChange: () => set({ isChanging: false }),
    },
  }));

// ── Context ──
type StoreApi = ReturnType<typeof createSortingOptionStore>;
const SortingOptionContext = createContext<StoreApi | null>(null);

// ── Provider ──
export function SortingOptionProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreApi>(null);
  if (storeRef.current === null) {
    storeRef.current = createSortingOptionStore();
  }
  return (
    <SortingOptionContext value={storeRef.current}>
      {children}
    </SortingOptionContext>
  );
}

// ── Hook ──
function useSortingOptionStore<T>(selector: (s: SortingOptionStore) => T): T {
  const store = useContext(SortingOptionContext);
  if (!store) throw new Error("SortingOptionProvider 없이 사용됨");
  return useStore(store, selector);
}

// ── 소비자용 export ──
export const useSortingOption = () => useSortingOptionStore((s) => s.sortingOption);
export const useIsChanging = () => useSortingOptionStore((s) => s.isChanging);
export const useSortingOptionActions = () => useSortingOptionStore((s) => s.actions);
```

**사용:**
```tsx
// 페이지 진입점에서 Provider 감싸기
export default function SomePage() {
  return (
    <SortingOptionProvider>
      <FetchContentList />
    </SortingOptionProvider>
  );
}

// 하위 컴포넌트에서 hook으로 접근
function SortingHeader() {
  const sortingOption = useSortingOption();
  const { setSortingOption } = useSortingOptionActions();
  // ...
}
```

## create() vs createStore() 결정 기준

| 기준 | `create()` 전역 | `createStore()` + Context |
|------|-----------------|--------------------------|
| **위치** | `shared/store/` | `pages/*/model/` 또는 해당 위치 |
| **생명주기** | 앱 전체 | Provider 마운트~언마운트 |
| **접근 범위** | 어디서든 import | Provider 하위만 |
| **인스턴스** | 싱글턴 1개 | Provider 당 1개 (다중 가능) |
| **예시** | auth, selectedMember | 정렬 옵션, 폼 멀티스텝, 모달 상태 |

**금지:** `create()`로 만든 전역 스토어를 `pages/*/model/`에 두지 않는다. 전역이면 `shared/store/`에.

## 컨벤션 요약

1. **`actions` 객체로 액션 그룹화** — 참조 불변이라 셀렉터에서 안전
2. **셀렉터는 항상 개별** — `useMemberStore((s) => s.selectedMemberId)` (구조분해 금지)
3. **persist 시 `partialize`** — 저장할 필드 명시
4. **서버 데이터는 Apollo 캐시** — Zustand에 서버 응답 저장 금지
5. **React 밖 접근** — `useXxxStore.getState()` (Apollo link, 유틸 등)
6. **전역 = `shared/store/`** — 페이지 모델에 `create()` 금지
7. **스코프 = Context Provider** — `createStore()` + Context + 소비자 hook export

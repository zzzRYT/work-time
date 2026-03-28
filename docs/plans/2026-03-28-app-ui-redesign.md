# App UI Redesign — DESIGN.md 기반 Phase 2 구현

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** DESIGN.md 기반으로 앱 UI를 Warm Minimal 디자인으로 전면 재구현하고, Auth + Workspace 진입 플로우를 추가한다.

**Architecture:** Supabase Auth → JWT 토큰 → Apollo Client auth link → NestJS AuthGuard/WorkspaceGuard. 기존 멤버 선택 방식을 로그인 → 워크스페이스 선택으로 교체. 탭 구조를 Home/Calendar/Ranking/Settings 4탭으로 재구성. 모든 UI 컴포넌트에 DESIGN.md 색상/타이포/스페이싱 적용.

**Tech Stack:** Expo Router, NativeWind (Tailwind), CVA, Apollo Client, Zustand, @supabase/supabase-js, gql.tada

---

## Task 1: Auth 인프라 — Supabase 클라이언트 + 스토어 + Apollo 연동

**Files:**
- Create: `app/src/shared/lib/supabase.ts`
- Create: `app/src/shared/store/auth.ts`
- Modify: `app/src/shared/lib/apollo.ts`
- Modify: `app/src/app/providers.tsx`
- Modify: `app/package.json` (install deps)

**Step 1: Install Supabase + auth deps**

```bash
cd app && npm install @supabase/supabase-js expo-auth-session expo-web-browser expo-crypto
```

**Step 2: Create Supabase client**

```typescript
// app/src/shared/lib/supabase.ts
import "react-native-url-polyfill/dist/polyfill";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || "";
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Step 3: Create auth store (Zustand)**

```typescript
// app/src/shared/store/auth.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@shared/lib/supabase";
import type { Session } from "@supabase/supabase-js";

const WORKSPACE_KEY = "@work-time/workspace-id";

interface AuthStore {
  session: Session | null;
  workspaceId: string | null;
  isLoaded: boolean;
  setSession: (session: Session | null) => void;
  setWorkspaceId: (id: string) => void;
  clearWorkspaceId: () => void;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  workspaceId: null,
  isLoaded: false,

  setSession: (session) => set({ session }),

  setWorkspaceId: (id) => {
    set({ workspaceId: id });
    AsyncStorage.setItem(WORKSPACE_KEY, id);
  },

  clearWorkspaceId: () => {
    set({ workspaceId: null });
    AsyncStorage.removeItem(WORKSPACE_KEY);
  },

  hydrate: async () => {
    const { data } = await supabase.auth.getSession();
    const workspaceId = await AsyncStorage.getItem(WORKSPACE_KEY);
    set({ session: data.session, workspaceId, isLoaded: true });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(WORKSPACE_KEY);
    set({ session: null, workspaceId: null });
  },
}));
```

**Step 4: Update Apollo client with auth headers**

```typescript
// app/src/shared/lib/apollo.ts
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import Constants from "expo-constants";
import { useAuthStore } from "@shared/store/auth";

const apiUrl = Constants.expoConfig?.extra?.apiUrl || "http://localhost:4000/graphql";

const httpLink = new HttpLink({ uri: apiUrl });

const authLink = setContext(async (_, { headers }) => {
  const { session, workspaceId } = useAuthStore.getState();
  return {
    headers: {
      ...headers,
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
      ...(workspaceId && { "x-workspace-id": workspaceId }),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

> Note: `@apollo/client/link/context` 는 `@apollo/client`에 포함되어 있으므로 별도 설치 불필요.

**Step 5: Update app.config.ts with Supabase env vars**

`app.config.ts`의 `extra`에 추가:
```typescript
extra: {
  apiUrl: process.env.API_URL || "http://localhost:4000/graphql",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
},
```

**Step 6: Update providers to hydrate auth**

```typescript
// app/src/app/providers.tsx
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@shared/lib/apollo";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
```

**Step 7: Install URL polyfill**

```bash
cd app && npm install react-native-url-polyfill
```

**Step 8: Commit**

```bash
git add app/src/shared/lib/supabase.ts app/src/shared/store/auth.ts app/src/shared/lib/apollo.ts app/src/app/providers.tsx app/app.config.ts app/package.json app/package-lock.json
git commit -m "feat(app): add Supabase auth infrastructure and Apollo auth link"
```

---

## Task 2: GraphQL 스키마 재생성 + Auth 쿼리 추가

**Files:**
- Modify: `app/src/graphql/graphql-env.d.ts` (regenerated)
- Modify: `app/src/graphql/index.ts` (no change, just verify)

**Step 1: Regenerate GraphQL schema**

서버를 실행한 상태에서:
```bash
cd app && npm run graphql:sync
```

> 서버에 Auth/Workspace/Invite 타입이 추가되었으므로 introspection이 새 타입을 포함해야 함.
> 만약 서버가 AuthGuard 때문에 introspection이 안 되면, 서버에서 일시적으로 introspection을 public으로 열거나, schema.graphql을 수동으로 업데이트.

**Step 2: Verify new types are in schema**

`graphql-env.d.ts`에 다음 타입들이 포함되어야 함:
- `User`: id, email, name, avatarUrl, provider
- `Workspace`: id, name, slug, ownerId
- `WorkspaceMemberObject`: id, workspaceId, userId, role, joinedAt
- `Invite`: id, token, expiresAt

**Step 3: Commit**

```bash
git add app/src/graphql/
git commit -m "feat(app): regenerate GraphQL schema with auth types"
```

---

## Task 3: Auth 화면 — 로그인 + 워크스페이스 선택

**Files:**
- Create: `app/src/app/login.tsx`
- Create: `app/src/app/workspaces.tsx`
- Modify: `app/src/app/_layout.tsx`
- Delete: `app/src/app/select-member.tsx` (replaced by auth flow)
- Delete: `app/src/shared/store/member.ts` (replaced by auth store)

**Step 1: Create login screen**

```typescript
// app/src/app/login.tsx
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@shared/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const handleGoogleLogin = async () => {
    const redirectTo = makeRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (data?.url) {
      await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 justify-center px-5">
        <View className="items-center mb-12">
          <Text className="text-[32px] font-extrabold text-text-primary mb-2">
            WorkTime
          </Text>
          <Text className="text-[15px] text-text-muted text-center">
            함께 공부하고 있다는 연결감
          </Text>
        </View>

        <Pressable
          className="bg-white border border-border rounded-md py-4 px-6 flex-row items-center justify-center active:bg-surface"
          onPress={handleGoogleLogin}
        >
          <Text className="text-[15px] font-medium text-text-primary">
            Google로 시작하기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

**Step 2: Create workspace selection screen**

```typescript
// app/src/app/workspaces.tsx
import { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@apollo/client";
import { graphql } from "@graphql";
import { useAuthStore } from "@shared/store/auth";
import { apolloClient } from "@shared/lib/apollo";
import { router } from "expo-router";

const MY_WORKSPACES = graphql(`
  query MyWorkspaces {
    myWorkspaces {
      id
      workspaceId
      role
      workspace {
        id
        name
        slug
      }
    }
  }
`);

const CREATE_WORKSPACE = graphql(`
  mutation CreateWorkspace($name: String!) {
    createWorkspace(name: $name) {
      id
      name
      slug
    }
  }
`);

export default function WorkspacesScreen() {
  const { data, loading } = useQuery(MY_WORKSPACES);
  const [createWorkspace] = useMutation(CREATE_WORKSPACE);
  const setWorkspaceId = useAuthStore((s) => s.setWorkspaceId);
  const signOut = useAuthStore((s) => s.signOut);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSelect = async (workspaceId: string) => {
    setWorkspaceId(workspaceId);
    await apolloClient.resetStore();
    router.replace("/(tabs)");
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data: result } = await createWorkspace({
        variables: { name: newName.trim() },
      });
      if (result?.createWorkspace.id) {
        await handleSelect(result.createWorkspace.id);
      }
    } catch (e) {
      Alert.alert("오류", e instanceof Error ? e.message : "워크스페이스 생성 실패");
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    await apolloClient.clearStore();
  };

  const workspaces = data?.myWorkspaces ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-5 pt-12">
        <Text className="text-[24px] font-bold text-text-primary mb-2">
          워크스페이스
        </Text>
        <Text className="text-[13px] text-text-muted mb-8">
          참여할 스터디 그룹을 선택하세요
        </Text>

        {loading ? (
          <Text className="text-text-subtle text-center py-8">로딩중...</Text>
        ) : (
          <FlatList
            data={workspaces}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <Pressable
                className="bg-surface rounded-md p-4 border border-border active:bg-surface-hover"
                onPress={() => handleSelect(item.workspace.id)}
              >
                <Text className="text-[17px] font-medium text-text-primary">
                  {item.workspace.name}
                </Text>
                <Text className="text-[13px] text-text-muted mt-1">
                  {item.role === "OWNER" ? "관리자" : "멤버"}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="items-center py-8">
                <Text className="text-text-subtle text-[15px]">
                  참여 중인 워크스페이스가 없습니다
                </Text>
              </View>
            }
          />
        )}

        {showCreate ? (
          <View className="mt-6 bg-surface rounded-md p-4 border border-border">
            <Text className="text-[15px] font-medium text-text-primary mb-3">
              새 워크스페이스 만들기
            </Text>
            <TextInput
              className="border border-border rounded-sm bg-white px-4 py-3 text-[15px] text-text-primary mb-3"
              placeholder="이름 (예: 모던애자일)"
              placeholderTextColor="#A8A29E"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <Pressable
              className="bg-primary rounded-sm py-3 items-center"
              onPress={handleCreate}
              disabled={creating || !newName.trim()}
              style={{ opacity: creating || !newName.trim() ? 0.5 : 1 }}
            >
              <Text className="text-white font-bold text-[15px]">
                {creating ? "생성 중..." : "만들기"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            className="mt-6 border-2 border-dashed border-border rounded-md py-4 items-center"
            onPress={() => setShowCreate(true)}
          >
            <Text className="text-text-muted font-medium text-[15px]">
              + 새 워크스페이스 만들기
            </Text>
          </Pressable>
        )}

        <Pressable className="mt-auto mb-4 py-3 items-center" onPress={handleSignOut}>
          <Text className="text-text-subtle text-[13px]">로그아웃</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

**Step 3: Update root layout for auth navigation**

```typescript
// app/src/app/_layout.tsx
import "../../global.css";
import { initSentry } from "@shared/lib/sentry";
initSentry();

import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { Providers } from "@app/providers";
import { useAuthStore } from "@shared/store/auth";
import { Text, View } from "react-native";

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { session, workspaceId, isLoaded } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const onLogin = segments[0] === "login";
    const onWorkspaces = segments[0] === "workspaces";

    if (!session && !onLogin) {
      router.replace("/login");
    } else if (session && !workspaceId && !onWorkspaces) {
      router.replace("/workspaces");
    } else if (session && workspaceId && !inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, workspaceId, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-text-subtle">로딩중...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <Providers>
      <RootNavigator />
    </Providers>
  );
}
```

**Step 4: Delete old select-member screen**

```bash
rm app/src/app/select-member.tsx
```

> Note: `member.ts` 스토어는 아직 삭제하지 않음. 기존 페이지에서 `selectedMemberId`를 사용하고 있으므로, Task 4-7에서 페이지를 재작성하면서 제거.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(app): add login and workspace selection screens, update auth navigation"
```

---

## Task 4: Presence Home 탭 — 리디자인

**Files:**
- Rewrite: `app/src/pages/dashboard/DashboardPage.tsx` → `app/src/pages/home/HomePage.tsx`
- Rewrite: `app/src/pages/dashboard/ui/attendance-card.tsx` → `app/src/pages/home/ui/session-card.tsx`
- Rewrite: `app/src/pages/dashboard/ui/timer.tsx` → `app/src/pages/home/ui/timer.tsx`
- Rewrite: `app/src/pages/dashboard/ui/check-button.tsx` → `app/src/pages/home/ui/check-button.tsx`
- Rewrite: `app/src/pages/dashboard/ui/studying-members.tsx` → `app/src/pages/home/ui/presence-list.tsx`
- Move: `app/src/pages/dashboard/ui/vacation-button.tsx` → `app/src/pages/home/ui/vacation-button.tsx`
- Move: `app/src/pages/dashboard/ui/fee-shortcut.tsx` → `app/src/pages/home/ui/fee-shortcut.tsx`
- Move: `app/src/pages/dashboard/ui/late-alert.tsx` → `app/src/pages/home/ui/late-alert.tsx`
- Create: `app/src/pages/home/index.ts`
- Modify: `app/src/app/(tabs)/index.tsx`
- Delete: `app/src/pages/dashboard/` (old directory)

**DESIGN.md 적용 핵심:**
- 배경: `bg-bg` (#FFFBF5 warm cream)
- 카드: `bg-surface` (#FFF7ED) + shadow + `rounded-md` (12px)
- 세션 카드: Primary 배경 (#0D9488), 흰색 텍스트, Geist Mono 타이머
- 타이머 폰트: `font-mono` (Geist Mono), 48px
- 상태 배지: pill, 11px, rounded-full
- 아바타: 40px 원형, 이니셜 1자 (흰색 Bold)
- 폴링 간격: 30초 → 15초

**Step 1: Create `app/src/pages/home/ui/timer.tsx`**

DESIGN.md: Geist Mono 48px 타이머, primary 색상

```typescript
// app/src/pages/home/ui/timer.tsx
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type TimerProps = {
  checkInTime: string | null;
  className?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function Timer({ checkInTime, className }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!checkInTime) {
      setElapsed(0);
      return;
    }
    const start = new Date(checkInTime).getTime();
    function tick() {
      setElapsed(Math.floor((Date.now() - start) / 1_000));
    }
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [checkInTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  return (
    <View className={cn("items-center", className)}>
      <Text
        className={cn(
          "font-mono text-[48px] font-bold tracking-tight",
          checkInTime ? "text-white" : "text-text-subtle"
        )}
      >
        {pad(h)}:{pad(m)}:{pad(s)}
      </Text>
    </View>
  );
}
```

**Step 2: Create `app/src/pages/home/ui/check-button.tsx`**

```typescript
// app/src/pages/home/ui/check-button.tsx
import { ActivityIndicator, Pressable, Text } from "react-native";
import { cn } from "@shared/lib/cn";

type CheckButtonProps = {
  state: "idle" | "studying" | "completed";
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

export function CheckButton({ state, onPress, loading, disabled, className }: CheckButtonProps) {
  const isStudying = state === "studying";
  const label = state === "idle" ? "체크인" : state === "studying" ? "체크아웃" : "다시 체크인";

  return (
    <Pressable
      className={cn(
        "rounded-md py-4 items-center",
        isStudying ? "bg-white" : state === "idle" ? "bg-white" : "bg-white/20 border border-white/40",
        (loading || disabled) && "opacity-50",
        className
      )}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color={isStudying ? "#0D9488" : "#0D9488"} />
      ) : (
        <Text
          className={cn(
            "text-[17px] font-bold",
            state === "completed" ? "text-white" : "text-primary"
          )}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
```

**Step 3: Create `app/src/pages/home/ui/session-card.tsx`**

DESIGN.md: Session Card — Primary 배경, 흰색 텍스트, Geist Mono 타이머

```typescript
// app/src/pages/home/ui/session-card.tsx
import { View, Text } from "react-native";
import { cn } from "@shared/lib/cn";
import { Timer } from "./timer";
import { CheckButton } from "./check-button";

type SessionCardProps = {
  status: "NOT_ATTENDED" | "STUDYING" | "COMPLETED" | "LATE" | "VACATION";
  checkInTime: string | null;
  isLate: boolean;
  todayStudyMinutes: number;
  vacationHours: number | null;
  onCheckIn: () => void;
  onCheckOut: () => void;
  loading: boolean;
  networkOffline: boolean;
  className?: string;
};

function formatTotalStudy(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

function getButtonState(status: string): "idle" | "studying" | "completed" {
  if (status === "STUDYING") return "studying";
  if (status === "COMPLETED" || status === "LATE") return "completed";
  return "idle";
}

export function SessionCard({
  status,
  checkInTime,
  isLate,
  todayStudyMinutes,
  vacationHours,
  onCheckIn,
  onCheckOut,
  loading,
  networkOffline,
  className,
}: SessionCardProps) {
  const isStudying = status === "STUDYING";
  const isVacation = status === "VACATION" || (vacationHours != null && vacationHours >= 8);
  const buttonState = getButtonState(status);

  if (isVacation) {
    return (
      <View className={cn("bg-vacation rounded-lg p-6 items-center", className)}>
        <Text className="text-white text-[24px] font-bold mb-2">오늘은 휴가입니다</Text>
        {vacationHours != null && (
          <Text className="text-white/70 text-[13px]">{vacationHours}시간</Text>
        )}
      </View>
    );
  }

  return (
    <View
      className={cn(
        "rounded-lg p-6",
        isStudying ? "bg-primary" : "bg-surface border border-border",
        className
      )}
    >
      {isLate && (
        <View className="bg-late/20 rounded-sm px-3 py-1.5 mb-4 self-start">
          <Text className="text-late text-[11px] font-semibold">지각</Text>
        </View>
      )}

      <Timer checkInTime={isStudying ? checkInTime : null} className="mb-2" />

      <Text
        className={cn(
          "text-[13px] text-center mb-6",
          isStudying ? "text-white/70" : "text-text-muted"
        )}
      >
        오늘 총 공부: {formatTotalStudy(todayStudyMinutes)}
      </Text>

      {networkOffline && (
        <View className="bg-late/10 rounded-sm px-3 py-2 mb-4">
          <Text className="text-late text-[11px] text-center">네트워크 연결을 확인하세요</Text>
        </View>
      )}

      <CheckButton
        state={buttonState}
        onPress={buttonState === "studying" ? onCheckOut : onCheckIn}
        loading={loading}
        disabled={networkOffline}
      />
    </View>
  );
}
```

**Step 4: Create `app/src/pages/home/ui/presence-list.tsx`**

DESIGN.md: Avatar 40px, Status Badge pill, pulse animation for studying

```typescript
// app/src/pages/home/ui/presence-list.tsx
import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { MemberRow } from "@shared/ui/member-row";

type Member = {
  id: string;
  name: string;
  displayName: string;
  color: string;
  currentStatus: "NOT_ATTENDED" | "STUDYING" | "COMPLETED" | "LATE" | "VACATION";
  todayStudyMinutes: number;
};

type PresenceListProps = {
  members: Member[];
  className?: string;
};

export function PresenceList({ members, className }: PresenceListProps) {
  const studying = members.filter((m) => m.currentStatus === "STUDYING");
  const others = members.filter((m) => m.currentStatus !== "STUDYING");

  return (
    <View className={cn("bg-surface rounded-lg p-4", className)}>
      <View className="flex-row items-center gap-2 mb-3 px-1">
        <Text className="text-[15px] font-semibold text-text-primary">
          지금 공부 중
        </Text>
        <View className="bg-primary-light rounded-full px-2.5 py-0.5">
          <Text className="text-primary text-[13px] font-bold">
            {studying.length}
          </Text>
        </View>
      </View>

      {studying.length === 0 ? (
        <View className="items-center py-6">
          <Text className="text-text-subtle text-[13px]">
            아직 아무도 시작 안 했어요
          </Text>
        </View>
      ) : (
        studying.map((m) => (
          <MemberRow
            key={m.id}
            name={m.name}
            displayName={m.displayName}
            color={m.color}
            status={m.currentStatus}
            studyMinutes={m.todayStudyMinutes}
          />
        ))
      )}

      {others.length > 0 && (
        <>
          <View className="h-px bg-border my-3" />
          <Text className="text-[13px] text-text-muted mb-2 px-1">오프라인</Text>
          {others.map((m) => (
            <MemberRow
              key={m.id}
              name={m.name}
              displayName={m.displayName}
              color={m.color}
              status={m.currentStatus}
              studyMinutes={m.todayStudyMinutes}
            />
          ))}
        </>
      )}
    </View>
  );
}
```

**Step 5: Move/adapt vacation-button, fee-shortcut, late-alert**

기존 파일들을 `pages/home/ui/`로 이동하고 DESIGN.md 색상만 적용:
- `bg-white` → `bg-surface`
- `rounded-2xl` → `rounded-lg` (16px)
- `text-gray-900` → `text-text-primary`
- `text-gray-500` → `text-text-muted`
- 기존 로직은 그대로 유지

```bash
mkdir -p app/src/pages/home/ui
cp app/src/pages/dashboard/ui/vacation-button.tsx app/src/pages/home/ui/
cp app/src/pages/dashboard/ui/fee-shortcut.tsx app/src/pages/home/ui/
cp app/src/pages/dashboard/ui/late-alert.tsx app/src/pages/home/ui/
```

각 파일에서 Tailwind 클래스만 DESIGN.md에 맞게 수정 (색상 교체).

**Step 6: Create HomePage**

```typescript
// app/src/pages/home/HomePage.tsx
import { useEffect, useState } from "react";
import { AppState, ScrollView, Text, View } from "react-native";
import { useQuery, useMutation } from "@apollo/client";
import { useNetInfo } from "@react-native-community/netinfo";
import { graphql } from "@graphql";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@shared/store/auth";
import { getTodayString, getCurrentMonth } from "@shared/lib/date";
import { Toast } from "@shared/ui/toast";
import { SessionCard } from "./ui/session-card";
import { VacationButton } from "./ui/vacation-button";
import { PresenceList } from "./ui/presence-list";
import { FeeShortcut } from "./ui/fee-shortcut";

const HOME_QUERY = graphql(`
  query HomePage($month: String!) {
    members {
      id
      name
      displayName
      color
      currentStatus
      todayStudyMinutes
      todayVacationHours
    }
    todayAttendanceSummary {
      total
      attended
      studying
      late
    }
    feeStatus(month: $month) {
      member { id }
      lateFee
      monthlyFee
      monthlyFeeStatus
      lateFeeStatus
      lateCount
    }
    me {
      id
    }
  }
`);

const ACTIVE_SESSION = graphql(`
  query HomeActiveSession($memberId: ID!) {
    activeSession(memberId: $memberId) {
      id
      checkInTime
      isLate
    }
  }
`);

const CHECK_IN = graphql(`
  mutation HomeCheckIn($memberId: ID!) {
    checkIn(memberId: $memberId) { id checkInTime isLate }
  }
`);

const CHECK_OUT = graphql(`
  mutation HomeCheckOut($memberId: ID!) {
    checkOut(memberId: $memberId) { id checkOutTime }
  }
`);

const USE_VACATION = graphql(`
  mutation HomeUseVacation($memberId: ID!, $date: String!, $hours: Int!) {
    useVacation(memberId: $memberId, date: $date, hours: $hours) { id hours }
  }
`);

const REQUEST_FEE_PAYMENT = graphql(`
  mutation HomeRequestFeePayment($memberId: ID!, $month: String!, $type: FeeType!) {
    requestFeePayment(memberId: $memberId, month: $month, type: $type) {
      id monthlyFeeStatus lateFeeStatus
    }
  }
`);

export function HomePage() {
  // NOTE: 현재 워크스페이스에서 "나"에 해당하는 memberId를 가져오는 방법:
  // 서버의 WorkspaceGuard가 x-workspace-id 헤더로 워크스페이스를 식별하고,
  // me 쿼리로 userId를 얻은 뒤, members 중 userId와 매핑된 멤버를 찾아야 함.
  // 현재 서버 구조에서는 workspace_members 테이블이 userId-memberId 매핑을 보유.
  // 앱에서는 workspace 진입 시 memberId를 저장해두는 것이 가장 실용적.
  //
  // 임시로: workspaceMembers 쿼리로 나의 memberId를 가져오는 방식 사용.
  // TODO: 이 부분은 Task 3에서 워크스페이스 선택 시 memberId를 authStore에 저장하는 것으로 개선.

  const currentMonth = getCurrentMonth();
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;
  const [toast, setToast] = useState<{ message: string; variant: "error" | "success" } | null>(null);

  // NOTE: memberId를 가져오는 로직은 Task 3 구현 상태에 따라 조정 필요.
  // authStore에 currentMemberId를 추가하거나, 서버에 myMember 쿼리를 추가.
  // 현재는 기존 패턴(members 쿼리에서 me와 매칭)을 유지하되,
  // 실제 구현 시 적절한 방식으로 교체.
  const [myMemberId, setMyMemberId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(HOME_QUERY, {
    variables: { month: currentMonth },
    pollInterval: 15_000, // DESIGN.md: 15초 폴링
  });

  const { data: sessionData, refetch: refetchSession } = useQuery(ACTIVE_SESSION, {
    variables: { memberId: myMemberId! },
    skip: !myMemberId,
    pollInterval: 15_000,
  });

  const [checkIn, { loading: checkInLoading }] = useMutation(CHECK_IN);
  const [checkOut, { loading: checkOutLoading }] = useMutation(CHECK_OUT);
  const [useVacation] = useMutation(USE_VACATION);
  const [requestFeePayment] = useMutation(REQUEST_FEE_PAYMENT);

  // AppState 복귀 시 refetch
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refetch();
        if (myMemberId) refetchSession();
      }
    });
    return () => sub.remove();
  }, [myMemberId]);

  // me → memberId 매핑 (임시, workspace 진입 시 저장하는 것으로 개선 예정)
  // 이 로직은 서버에 myWorkspaceMember 같은 쿼리가 있으면 간단해짐
  // 현재는 members 목록에서 userId와 매칭되는 멤버를 찾는 방식이 없으므로
  // 첫 번째 멤버를 사용하는 임시 로직 (실제로는 워크스페이스 진입 시 memberId 저장)

  if (loading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Text className="text-text-subtle">로딩중...</Text>
      </SafeAreaView>
    );
  }

  const members = data?.members ?? [];
  const summary = data?.todayAttendanceSummary;
  const me = myMemberId ? members.find((m) => m.id === myMemberId) : null;
  const myFee = data?.feeStatus?.find((f) => f.member.id === myMemberId);

  const refetchAll = [
    { query: HOME_QUERY, variables: { month: currentMonth } },
    ...(myMemberId
      ? [{ query: ACTIVE_SESSION, variables: { memberId: myMemberId } }]
      : []),
  ];

  const handleCheckIn = async () => {
    if (!myMemberId) return;
    try {
      await checkIn({ variables: { memberId: myMemberId }, refetchQueries: refetchAll });
    } catch {
      setToast({ message: "체크인에 실패했습니다", variant: "error" });
    }
  };

  const handleCheckOut = async () => {
    if (!myMemberId) return;
    try {
      await checkOut({ variables: { memberId: myMemberId }, refetchQueries: refetchAll });
    } catch {
      setToast({ message: "체크아웃에 실패했습니다", variant: "error" });
    }
  };

  const handleVacation = async (hours: number) => {
    if (!myMemberId) return;
    try {
      await useVacation({
        variables: { memberId: myMemberId, date: getTodayString(), hours },
        refetchQueries: refetchAll,
      });
      setToast({ message: "휴가가 등록되었습니다", variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "휴가 등록 실패", variant: "error" });
    }
  };

  const handleRequestMonthlyFee = async () => {
    if (!myMemberId) return;
    try {
      await requestFeePayment({
        variables: { memberId: myMemberId, month: currentMonth, type: "MONTHLY" as const },
        refetchQueries: refetchAll,
      });
      setToast({ message: "월 회비 납부 요청 완료", variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "요청 실패", variant: "error" });
    }
  };

  const handleRequestLateFee = async () => {
    if (!myMemberId) return;
    try {
      await requestFeePayment({
        variables: { memberId: myMemberId, month: currentMonth, type: "LATE" as const },
        refetchQueries: refetchAll,
      });
      setToast({ message: "지각비 납부 요청 완료", variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "요청 실패", variant: "error" });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-5 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-[13px] text-text-muted mb-1">
            안녕하세요 👋
          </Text>
          <Text className="text-[24px] font-bold text-text-primary">
            {me?.displayName ?? ""}
          </Text>
        </View>

        {/* Daily summary */}
        {summary && (
          <View className="flex-row bg-surface rounded-lg p-3 mb-4 border border-border">
            {[
              { label: "전체", value: summary.total, color: "text-text-primary" },
              { label: "출석", value: summary.attended, color: "text-studying" },
              { label: "공부중", value: summary.studying, color: "text-primary" },
              { label: "지각", value: summary.late, color: "text-late" },
            ].map((item) => (
              <View key={item.label} className="flex-1 items-center">
                <Text className="text-[11px] text-text-muted">{item.label}</Text>
                <Text className={cn("text-[17px] font-bold", item.color)}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Session card */}
        <SessionCard
          status={me?.currentStatus ?? "NOT_ATTENDED"}
          checkInTime={sessionData?.activeSession?.checkInTime ?? null}
          isLate={me?.currentStatus === "LATE" || sessionData?.activeSession?.isLate === true}
          todayStudyMinutes={me?.todayStudyMinutes ?? 0}
          vacationHours={(me?.todayVacationHours as number | null) ?? null}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          loading={checkInLoading || checkOutLoading}
          networkOffline={isOffline}
          className="mb-4"
        />

        {/* Fee shortcut */}
        {myFee && (
          <FeeShortcut
            monthlyFee={myFee.monthlyFee}
            monthlyFeeStatus={myFee.monthlyFeeStatus}
            lateFee={myFee.lateFee}
            lateFeeStatus={myFee.lateFeeStatus}
            lateCount={myFee.lateCount}
            onRequestMonthlyFee={handleRequestMonthlyFee}
            onRequestLateFee={handleRequestLateFee}
            className="mb-4"
          />
        )}

        {/* Vacation */}
        {me?.currentStatus !== "VACATION" && (
          <VacationButton
            onUseVacation={handleVacation}
            disabled={
              me?.currentStatus === "STUDYING" ||
              (me?.todayVacationHours != null && (me.todayVacationHours as number) > 0)
            }
            className="mb-4"
          />
        )}

        {/* Presence list */}
        <PresenceList members={members} className="mb-8" />
      </ScrollView>

      <Toast message={toast?.message ?? null} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </SafeAreaView>
  );
}

// cn helper import
import { cn } from "@shared/lib/cn";
```

**Step 7: Create index export and update tab route**

```typescript
// app/src/pages/home/index.ts
export { HomePage } from "./HomePage";

// app/src/app/(tabs)/index.tsx
export { HomePage as default } from "@pages/home";
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat(app): redesign Presence Home tab with DESIGN.md warm minimal style"
```

---

## Task 5: Calendar 탭 — 리디자인

**Files:**
- Modify: `app/src/pages/history/HistoryPage.tsx` — 색상 업데이트
- Modify: `app/src/pages/history/ui/history-content.tsx` — DESIGN.md 색상
- Modify: `app/src/pages/history/ui/calendar.tsx` — DESIGN.md 색상
- Modify: `app/src/pages/history/ui/monthly-summary.tsx` — DESIGN.md 색상
- Modify: `app/src/pages/history/ui/day-detail.tsx` — DESIGN.md 색상
- Modify: `app/src/app/(tabs)/history.tsx` → rename to `calendar.tsx`

**DESIGN.md 적용:**
- `bg-surface` → `bg-bg` 배경
- 카드 `bg-white` → `bg-surface` + `border border-border`
- `rounded-2xl` → `rounded-lg`
- `text-gray-900` → `text-text-primary`
- `text-gray-500/400` → `text-text-muted/text-text-subtle`
- `text-primary` color → `text-primary` (teal)
- ActivityIndicator color → `#0D9488`
- `selectedMemberId` → auth store에서 memberId 가져오기

**Step 1: 각 파일에서 Tailwind 클래스 교체**

모든 history UI 파일에서 다음 패턴으로 교체:
```
bg-surface → bg-bg (페이지 배경)
bg-white → bg-surface (카드 배경)
rounded-2xl → rounded-lg
text-gray-900 → text-text-primary
text-gray-500 → text-text-muted
text-gray-400 → text-text-subtle
text-gray-300 → text-text-subtle
text-gray-100 → border (경계선)
border-gray-100 → border-border
border-gray-200 → border-border
#6366F1 → #0D9488
```

**Step 2: HistoryPage에서 selectedMemberId를 auth 방식으로 교체**

기존: `useMemberStore((s) => s.selectedMemberId)`
변경: `useAuthStore`에서 memberId를 가져오거나, 워크스페이스 진입 시 저장한 memberId 사용.

**Step 3: Tab 파일 rename**

```bash
mv app/src/app/\(tabs\)/history.tsx app/src/app/\(tabs\)/calendar.tsx
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(app): redesign Calendar tab with DESIGN.md styling"
```

---

## Task 6: Ranking 탭 — 리디자인

**Files:**
- Create: `app/src/pages/ranking/RankingPage.tsx` (MembersPage에서 ranking + fee 부분 추출)
- Create: `app/src/pages/ranking/index.ts`
- Move: `app/src/pages/members/ui/ranking.tsx` → `app/src/pages/ranking/ui/ranking.tsx`
- Move: `app/src/pages/members/ui/fee-section.tsx` → `app/src/pages/ranking/ui/fee-section.tsx`
- Create: `app/src/app/(tabs)/ranking.tsx`
- Delete: `app/src/app/(tabs)/members.tsx`

**DESIGN.md 적용:**
- 같은 패턴으로 색상 교체
- Members 탭의 AttendanceSummary는 Home 탭으로 이동 (이미 Task 4에서 처리)
- MemberList는 Home 탭의 PresenceList로 대체
- Ranking + Fee만 별도 탭으로 분리

**Step 1: RankingPage 작성**

MembersPage에서 ranking + fee 쿼리만 가져오고, member list/attendance summary 제거.
DESIGN.md 색상 적용.

**Step 2: UI 파일 이동 + 색상 교체**

ranking.tsx, fee-section.tsx에서 동일한 Tailwind 교체 적용.

**Step 3: Tab 등록**

```typescript
// app/src/app/(tabs)/ranking.tsx
export { RankingPage as default } from "@pages/ranking";
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(app): create Ranking tab with rankings and fee status"
```

---

## Task 7: Settings 탭 — Admin 기능 병합

**Files:**
- Create: `app/src/pages/settings/SettingsPage.tsx`
- Create: `app/src/pages/settings/index.ts`
- Move: `app/src/pages/admin/ui/role-section.tsx` → `app/src/pages/settings/ui/role-section.tsx`
- Move: `app/src/pages/admin/ui/study-time-section.tsx` → `app/src/pages/settings/ui/study-time-section.tsx`
- Move: `app/src/pages/admin/ui/late-fee-section.tsx` → `app/src/pages/settings/ui/late-fee-section.tsx`
- Move: `app/src/pages/admin/ui/fee-confirm-section.tsx` → `app/src/pages/settings/ui/fee-confirm-section.tsx`
- Create: `app/src/pages/settings/ui/profile-section.tsx`
- Create: `app/src/pages/settings/ui/invite-section.tsx`
- Create: `app/src/app/(tabs)/settings.tsx`
- Delete: `app/src/app/(tabs)/admin.tsx`

**구조:**
```
Settings 탭
├── 프로필 섹션 (이름, 로그아웃, 워크스페이스 전환)
├── 초대 링크 (관리자만)
├── 납부 확인 (관리자만, PENDING 항목)
├── 역할 관리 (관리자만)
├── 스터디 시작 시간 (관리자만)
├── 지각비 설정 (관리자만)
```

**Step 1: Create profile section**

```typescript
// app/src/pages/settings/ui/profile-section.tsx
import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "@shared/store/auth";
import { apolloClient } from "@shared/lib/apollo";
import { router } from "expo-router";

type ProfileSectionProps = {
  memberName: string;
  memberColor: string;
  workspaceName: string;
  className?: string;
};

export function ProfileSection({
  memberName,
  memberColor,
  workspaceName,
  className,
}: ProfileSectionProps) {
  const signOut = useAuthStore((s) => s.signOut);
  const clearWorkspaceId = useAuthStore((s) => s.clearWorkspaceId);

  const handleSwitchWorkspace = async () => {
    clearWorkspaceId();
    await apolloClient.clearStore();
    router.replace("/workspaces");
  };

  const handleSignOut = async () => {
    await signOut();
    await apolloClient.clearStore();
    router.replace("/login");
  };

  return (
    <View className={className}>
      <View className="bg-surface rounded-lg p-4 border border-border mb-4">
        <View className="flex-row items-center mb-4">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: memberColor }}
          >
            <Text className="text-white text-[17px] font-bold">
              {memberName.charAt(0)}
            </Text>
          </View>
          <View>
            <Text className="text-[17px] font-bold text-text-primary">
              {memberName}
            </Text>
            <Text className="text-[13px] text-text-muted">{workspaceName}</Text>
          </View>
        </View>

        <Pressable
          className="border border-border rounded-sm py-3 items-center mb-2"
          onPress={handleSwitchWorkspace}
        >
          <Text className="text-text-muted text-[13px] font-medium">
            워크스페이스 전환
          </Text>
        </Pressable>

        <Pressable className="py-3 items-center" onPress={handleSignOut}>
          <Text className="text-text-subtle text-[13px]">로그아웃</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

**Step 2: Create invite section**

```typescript
// app/src/pages/settings/ui/invite-section.tsx
import { useState } from "react";
import { Pressable, Text, View, Share } from "react-native";
import { useMutation } from "@apollo/client";
import { graphql } from "@graphql";

const CREATE_INVITE = graphql(`
  mutation CreateInvite($expiresInHours: Int) {
    createInvite(expiresInHours: $expiresInHours) {
      id
      token
    }
  }
`);

type InviteSectionProps = {
  className?: string;
};

export function InviteSection({ className }: InviteSectionProps) {
  const [createInvite, { loading }] = useMutation(CREATE_INVITE);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      const { data } = await createInvite({
        variables: { expiresInHours: 72 },
      });
      if (data?.createInvite.token) {
        const url = `work-time://invite/${data.createInvite.token}`;
        setInviteUrl(url);
      }
    } catch {
      // error handled silently
    }
  };

  const handleShare = async () => {
    if (!inviteUrl) return;
    await Share.share({
      message: `WorkTime에 참여하세요!\n${inviteUrl}`,
    });
  };

  return (
    <View className={className}>
      <View className="bg-surface rounded-lg p-4 border border-border">
        <Text className="text-[15px] font-semibold text-text-primary mb-3">
          멤버 초대
        </Text>

        {inviteUrl ? (
          <>
            <Text className="text-[13px] text-text-muted mb-3 font-mono">
              {inviteUrl}
            </Text>
            <Pressable
              className="bg-primary rounded-sm py-3 items-center"
              onPress={handleShare}
            >
              <Text className="text-white font-bold text-[15px]">공유하기</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            className="border border-primary rounded-sm py-3 items-center"
            onPress={handleCreate}
            disabled={loading}
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            <Text className="text-primary font-bold text-[15px]">
              {loading ? "생성 중..." : "초대 링크 만들기"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
```

**Step 3: Create SettingsPage (Admin 기능 병합)**

AdminPage의 모든 쿼리/뮤테이션을 SettingsPage로 이동.
프로필, 초대, 관리자 섹션을 조건부 렌더링.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(app): create Settings tab merging profile, invite, and admin functions"
```

---

## Task 8: Tab Layout + 네비게이션 업데이트

**Files:**
- Rewrite: `app/src/app/(tabs)/_layout.tsx`
- Modify: `app/src/shared/ui/status-badge.tsx` — DESIGN.md 색상 교체
- Modify: `app/src/shared/ui/member-row.tsx` — DESIGN.md 색상 교체

**Step 1: Update tabs layout**

```typescript
// app/src/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0D9488", // primary teal
        tabBarInactiveTintColor: "#A8A29E", // text-subtle
        tabBarStyle: {
          backgroundColor: "#FFF7ED", // surface
          borderTopColor: "#E7E5E4", // border
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "캘린더",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📅</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: "랭킹",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🏆</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "설정",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}
```

> Note: 이모지 아이콘은 초기 구현용. 이후 `expo-vector-icons` 또는 커스텀 SVG 아이콘으로 교체 예정.

**Step 2: Update shared UI components with DESIGN.md colors**

status-badge.tsx:
- `bg-gray-100` → `bg-done-bg`
- `text-gray-500` → `text-text-muted`
- `bg-studying/20` → `bg-studying-bg`
- `bg-late/20` → `bg-late-bg`
- `bg-vacation/20` → `bg-vacation-bg`
- `bg-done/20` → `bg-done-bg`

member-row.tsx:
- `bg-white` → `bg-surface`
- `text-gray-900` → `text-text-primary`
- `text-gray-500` → `text-text-muted`
- `border-2 border-white` → `border-2 border-surface`

**Step 3: Clean up old files**

```bash
rm -rf app/src/pages/dashboard
rm -rf app/src/pages/admin
rm -rf app/src/pages/members
rm app/src/app/\(tabs\)/admin.tsx 2>/dev/null
rm app/src/app/\(tabs\)/members.tsx 2>/dev/null
rm app/src/shared/store/member.ts
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(app): update tab layout to Home/Calendar/Ranking/Settings, apply DESIGN.md colors"
```

---

## Task 9: Global CSS + Tailwind 설정 마무리

**Files:**
- Modify: `app/global.css` — dark mode CSS variables 추가
- Modify: `app/tailwind.config.js` — font family 설정 확인
- Modify: `app/app.config.ts` — splash 배경색 업데이트

**Step 1: Update global.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Plus Jakarta Sans + Geist Mono는 Expo에서 expo-font로 로드 */
```

**Step 2: Update splash screen background**

app.config.ts에서:
```typescript
splash: {
  image: "./assets/splash-icon.png",
  resizeMode: "contain",
  backgroundColor: "#FFFBF5", // warm cream
},
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(app): update splash background and global styles for DESIGN.md"
```

---

## Task 10: 통합 확인 + 정리

**Step 1: TypeScript 빌드 확인**

```bash
cd app && npx tsc --noEmit
```

모든 타입 에러 해결.

**Step 2: 앱 실행 확인**

```bash
cd app && npx expo start
```

다음 플로우 확인:
1. 앱 시작 → 로그인 화면
2. Google 로그인 → 워크스페이스 선택
3. 워크스페이스 선택 → Home 탭 (Presence)
4. Calendar 탭 이동
5. Ranking 탭 이동
6. Settings 탭 이동

**Step 3: 미사용 코드/import 정리**

- `@shared/store/member` 참조 완전 제거 확인
- `select-member.tsx` 삭제 확인
- 기존 dashboard/admin/members 디렉토리 삭제 확인

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore(app): clean up unused code and verify integration"
```

---

## 구현 시 주의사항

### memberId 매핑 문제
서버의 Auth 시스템은 `userId` (Supabase user)와 `memberId` (워크스페이스 멤버)가 분리됨.
`WorkspaceMemberEntity`가 이 매핑을 보유. 워크스페이스 선택 시:
1. `myWorkspaces` → `workspaceMember.memberId` 를 가져와서 authStore에 저장
2. 또는 서버에 `myMember` 쿼리를 추가하여 현재 워크스페이스에서의 나의 Member를 반환

**권장:** authStore에 `currentMemberId`를 추가하고, 워크스페이스 선택 시 `workspaceMember.memberId`를 저장.

### GraphQL 스키마 불일치
현재 `graphql-env.d.ts`에 Auth 관련 타입이 없음. Task 2에서 스키마를 재생성해야 하며, 서버가 실행 중이어야 함. 서버의 AuthGuard가 introspection을 차단할 수 있으므로, 서버에서 introspection을 public으로 설정하거나 스키마 파일을 수동으로 업데이트해야 할 수 있음.

### Supabase 환경 변수
`SUPABASE_URL`과 `SUPABASE_ANON_KEY`가 설정되지 않으면 로그인이 동작하지 않음. 개발 중에는 `.env` 파일에 설정하거나 `app.config.ts`의 기본값을 사용.

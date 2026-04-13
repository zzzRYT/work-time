# App Auth Convention

## Auth 아키텍처

```
Supabase OAuth  →  AuthStore (Zustand)  →  Apollo authLink  →  서버 API
     ↓                   ↓                      ↓
 session 발급      session/workspaceId 보관    헤더 자동 주입
                         ↓
                   _layout.tsx (guard)
```

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `shared/lib/supabase.ts` | Supabase 클라이언트 싱글턴 |
| `shared/store/auth.ts` | AuthStore — session, workspaceId, memberId |
| `shared/lib/apollo.ts` | Apollo Client — authLink가 AuthStore에서 토큰·workspace 읽음 |
| `app/_layout.tsx` | Auth guard — 세션 상태에 따라 라우팅 분기 |
| `app/login.tsx` | Google OAuth 로그인 화면 |
| `app/workspaces.tsx` | 워크스페이스 선택 화면 |

## Auth Guard 플로우 (app/_layout.tsx)

```
hydrate() — Supabase getSession + AsyncStorage에서 workspaceId/memberId 복원
  ↓
isLoaded === false → 로딩 UI
isLoaded === true  →
  ├─ session 없음         → /login
  ├─ session 있고 workspace 없음 → /workspaces
  └─ session + workspace 있음    → /(tabs)
```

- `onAuthStateChange` 리스너가 세션 변경을 자동 감지 (토큰 만료·갱신 포함)
- Guard 로직은 `_layout.tsx`의 `useEffect`에서 `router.replace`로 처리

## Supabase 클라이언트 설정

```typescript
// shared/lib/supabase.ts
createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,       // RN에서는 AsyncStorage 필수
    autoRefreshToken: true,      // 토큰 자동 갱신
    persistSession: true,        // 앱 재시작 후에도 세션 유지
    detectSessionInUrl: false,   // RN에서는 URL 감지 비활성화
  },
});
```

- `isSupabaseConfigured` export: env 미설정 시 dummy 클라이언트로 fallback (개발 편의)
- URL/Key는 `Constants.expoConfig.extra`에서 읽음 → `app.config.ts`의 `extra` 필드

## Apollo 인증 헤더 주입

```typescript
// shared/lib/apollo.ts
const authLink = setContext(async (_, { headers }) => {
  const { session, workspaceId } = useAuthStore.getState();
  return {
    headers: {
      ...headers,
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
      ...(workspaceId && { 'x-workspace-id': workspaceId }),
    },
  };
});
```

- `useAuthStore.getState()` — React 밖에서 Zustand 읽기 (Apollo link는 React 컴포넌트가 아님)
- 서버의 `WorkspaceGuard`가 `Authorization` + `x-workspace-id` 두 헤더를 기대함

## AuthStore (Zustand)

```
상태:    session | workspaceId | memberId | isLoaded
액션:    setSession | setWorkspaceId | setMemberId | clearWorkspace | hydrate | signOut
영속화:  workspaceId/memberId → AsyncStorage (persist 미들웨어 아닌 수동)
         session → Supabase가 자체 관리 (autoRefreshToken + persistSession)
```

- `hydrate()`: 앱 시작 시 1회 호출 — RootLayout의 useEffect에서
- `signOut()`: Supabase signOut + AsyncStorage 정리 + 상태 초기화

## 새 인증 관련 기능 추가 시 주의

1. **토큰 직접 저장 금지** — Supabase의 `persistSession`이 처리. AuthStore에는 참조만.
2. **인증 상태 분기는 _layout.tsx guard에서만** — 개별 화면에서 직접 라우팅하지 말 것
3. **API 헤더는 apollo.ts authLink에서 자동 주입** — 개별 fetcher에서 토큰 직접 전달 금지
4. **workspace 전환** → `clearWorkspace()` → guard가 자동으로 `/workspaces`로 이동

# Workspace Invite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let workspace owners share 7-day invite links/codes and let invited users join by link or code, including after login.

**Architecture:** Keep the existing server GraphQL API shape and add regression tests around it. In the app, add small invite utilities, a reusable join-by-invite hook, a `/join` route for deep links, a code entry area on the workspace selection screen, and an owner-only invite share action in Settings.

**Tech Stack:** NestJS, TypeORM, Jest, Expo Router, React Native, Apollo Client, gql.tada, Zustand, AsyncStorage, Bun.

---

## File Structure

- Create `server/src/modules/invite/invite.service.spec.ts`: service-level invite join regression tests.
- Create `server/src/modules/invite/invite.resolver.spec.ts`: resolver-level owner permission tests.
- Create `app/src/shared/lib/invite.ts`: pure invite token/link/error helpers.
- Create `app/src/shared/lib/invite.test.js`: Bun tests for invite helpers that are ignored by TypeScript checking.
- Create `app/src/shared/lib/pending-invite.ts`: AsyncStorage wrapper for pending invite token.
- Create `app/src/shared/hooks/use-join-workspace-by-invite.ts`: Apollo mutation hook that joins and selects a workspace.
- Create `app/src/app/join.tsx`: Expo Router deep-link landing screen.
- Modify `app/src/app/_layout.tsx`: consume pending invite token after login.
- Modify `app/src/app/workspaces.tsx`: add invite code entry and reuse the join hook.
- Modify `app/src/pages/settings/SettingsPage.tsx`: render invite section for workspace `OWNER`, not just member `ADMIN`.
- Modify `app/src/pages/settings/ui/invite-section.tsx`: create 7-day invite, build link, share link and raw code.
- Modify generated GraphQL output if `bun run graphql:generate` changes it.

---

### Task 1: Server Invite Regression Tests

**Files:**
- Create: `server/src/modules/invite/invite.service.spec.ts`
- Create: `server/src/modules/invite/invite.resolver.spec.ts`

- [ ] **Step 1: Write service regression tests**

Create `server/src/modules/invite/invite.service.spec.ts`:

```ts
import { BadRequestException, ConflictException } from '@nestjs/common';
import { InviteEntity } from '../../entities/invite.entity';
import { MemberEntity } from '../../entities/member.entity';
import { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { InviteService } from './invite.service';

function makeRepo<T>() {
  return {
    create: jest.fn((input: Partial<T>) => input),
    save: jest.fn(async (entity: Partial<T>) => entity),
    findOne: jest.fn(),
  };
}

function makeManager() {
  return {
    create: jest.fn((entityClass: unknown, attrs: Record<string, unknown>) => {
      if (entityClass === MemberEntity) {
        return { id: 'member-created', ...attrs };
      }
      if (entityClass === WorkspaceMemberEntity) {
        return { id: 'membership-created', ...attrs };
      }
      return { ...attrs };
    }),
    save: jest.fn(async (entity: Record<string, unknown>) => entity),
  };
}

function makeService() {
  const inviteRepo = makeRepo<InviteEntity>();
  const workspaceMemberRepo = makeRepo<WorkspaceMemberEntity>();
  const memberRepo = makeRepo<MemberEntity>();
  const manager = makeManager();
  const dataSource = {
    transaction: jest.fn(async (callback: (manager: typeof manager) => unknown) =>
      callback(manager),
    ),
  };

  const service = new InviteService(
    inviteRepo as any,
    workspaceMemberRepo as any,
    memberRepo as any,
    dataSource as any,
  );

  return { service, inviteRepo, workspaceMemberRepo, memberRepo, dataSource, manager };
}

describe('InviteService.joinByInvite', () => {
  it('rejects missing invite tokens', async () => {
    const { service, inviteRepo } = makeService();
    inviteRepo.findOne.mockResolvedValue(null);

    await expect(
      service.joinByInvite('missing-token', 'user-1', 'Jaejin'),
    ).rejects.toThrow(BadRequestException);

    expect(inviteRepo.findOne).toHaveBeenCalledWith({
      where: { token: 'missing-token' },
    });
  });

  it('rejects expired invite tokens', async () => {
    const { service, inviteRepo } = makeService();
    inviteRepo.findOne.mockResolvedValue({
      id: 'invite-1',
      token: 'expired-token',
      workspaceId: 'workspace-1',
      createdBy: 'owner-1',
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      service.joinByInvite('expired-token', 'user-1', 'Jaejin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects users who already belong to the invited workspace', async () => {
    const { service, inviteRepo, workspaceMemberRepo } = makeService();
    inviteRepo.findOne.mockResolvedValue({
      id: 'invite-1',
      token: 'valid-token',
      workspaceId: 'workspace-1',
      createdBy: 'owner-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    workspaceMemberRepo.findOne.mockResolvedValue({
      id: 'membership-1',
      workspaceId: 'workspace-1',
      userId: 'user-1',
    });

    await expect(
      service.joinByInvite('valid-token', 'user-1', 'Jaejin'),
    ).rejects.toThrow(ConflictException);

    expect(workspaceMemberRepo.findOne).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace-1', userId: 'user-1' },
    });
  });

  it('creates a member and workspace membership in one transaction', async () => {
    const { service, inviteRepo, workspaceMemberRepo, dataSource, manager } =
      makeService();
    inviteRepo.findOne.mockResolvedValue({
      id: 'invite-1',
      token: 'valid-token',
      workspaceId: 'workspace-1',
      createdBy: 'owner-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    workspaceMemberRepo.findOne.mockResolvedValue(null);

    const result = await service.joinByInvite('valid-token', 'user-1', 'Jaejin');

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.create).toHaveBeenCalledWith(MemberEntity, {
      name: 'Jaejin',
      displayName: 'Jaejin',
      color: expect.stringMatching(/^#[0-9a-f]{6}$/),
      role: 'MEMBER',
      workspaceId: 'workspace-1',
    });
    expect(manager.create).toHaveBeenCalledWith(WorkspaceMemberEntity, {
      workspaceId: 'workspace-1',
      userId: 'user-1',
      memberId: 'member-created',
      role: 'MEMBER',
      invitedBy: 'owner-1',
    });
    expect(manager.save).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      id: 'membership-created',
      workspaceId: 'workspace-1',
      userId: 'user-1',
      memberId: 'member-created',
      role: 'MEMBER',
    });
  });
});
```

- [ ] **Step 2: Write resolver permission tests**

Create `server/src/modules/invite/invite.resolver.spec.ts`:

```ts
import { ForbiddenException } from '@nestjs/common';
import { InviteResolver } from './invite.resolver';

function makeResolver() {
  const inviteService = {
    createInvite: jest.fn(),
    joinByInvite: jest.fn(),
  };
  const resolver = new InviteResolver(inviteService as any);
  const user = { id: 'user-1', name: 'Jaejin' };

  return { resolver, inviteService, user };
}

describe('InviteResolver.createInvite', () => {
  it('rejects non-owner workspace members', async () => {
    const { resolver, inviteService, user } = makeResolver();

    await expect(
      resolver.createInvite(168, user as any, 'workspace-1', 'MEMBER'),
    ).rejects.toThrow(ForbiddenException);

    expect(inviteService.createInvite).not.toHaveBeenCalled();
  });

  it('delegates invite creation for workspace owners', async () => {
    const { resolver, inviteService, user } = makeResolver();
    inviteService.createInvite.mockResolvedValue({
      id: 'invite-1',
      workspaceId: 'workspace-1',
      token: 'token-1',
      createdBy: 'user-1',
      expiresAt: new Date(Date.now() + 168 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    const result = await resolver.createInvite(
      168,
      user as any,
      'workspace-1',
      'OWNER',
    );

    expect(inviteService.createInvite).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
      168,
    );
    expect(result).toMatchObject({ id: 'invite-1', token: 'token-1' });
  });
});
```

- [ ] **Step 3: Run server invite tests**

Run from `server/`:

```bash
bun run test -- modules/invite/invite.service.spec.ts modules/invite/invite.resolver.spec.ts
```

Expected: PASS. If a test fails, adjust only `server/src/modules/invite/invite.service.ts` or `server/src/modules/invite/invite.resolver.ts` to match the tested behavior; do not change the GraphQL schema.

- [ ] **Step 4: Commit server tests**

```bash
git add server/src/modules/invite/invite.service.spec.ts server/src/modules/invite/invite.resolver.spec.ts
git commit -m "test: cover workspace invite server behavior"
```

---

### Task 2: App Invite Utility Functions

**Files:**
- Create: `app/src/shared/lib/invite.test.js`
- Create: `app/src/shared/lib/invite.ts`

- [ ] **Step 1: Write failing utility tests**

Create `app/src/shared/lib/invite.test.js`:

```js
import { describe, expect, it } from "bun:test";
import {
  INVITE_EXPIRES_IN_HOURS,
  buildInviteLink,
  extractInviteToken,
  getJoinWorkspaceErrorMessage,
} from "./invite.ts";

const TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("invite utilities", () => {
  it("uses a seven day invite window", () => {
    expect(INVITE_EXPIRES_IN_HOURS).toBe(168);
  });

  it("builds a join link with the app scheme", () => {
    expect(buildInviteLink(TOKEN)).toBe(`work-time://join?token=${TOKEN}`);
  });

  it("extracts a raw invite token", () => {
    expect(extractInviteToken(`  ${TOKEN}  `)).toBe(TOKEN);
  });

  it("extracts a token from the join link query parameter", () => {
    expect(extractInviteToken(`work-time://join?token=${TOKEN}`)).toBe(TOKEN);
  });

  it("extracts a token from the previous invite path format", () => {
    expect(extractInviteToken(`work-time://invite/${TOKEN}`)).toBe(TOKEN);
  });

  it("rejects invalid invite input", () => {
    expect(extractInviteToken("not-a-valid-token")).toBeNull();
    expect(extractInviteToken("")).toBeNull();
  });

  it("maps expected server errors to Korean messages", () => {
    expect(getJoinWorkspaceErrorMessage(new Error("Invite has expired"))).toBe(
      "만료된 초대입니다.",
    );
    expect(
      getJoinWorkspaceErrorMessage(
        new Error("Already a member of this workspace"),
      ),
    ).toBe("이미 참여 중인 워크스페이스입니다.");
    expect(getJoinWorkspaceErrorMessage(new Error("Invalid invite token"))).toBe(
      "초대 링크가 올바르지 않습니다.",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run from `app/`:

```bash
bun test src/shared/lib/invite.test.js
```

Expected: FAIL because `src/shared/lib/invite.ts` does not exist.

- [ ] **Step 3: Implement invite utilities**

Create `app/src/shared/lib/invite.ts`:

```ts
export const INVITE_EXPIRES_IN_HOURS = 168;
export const PENDING_INVITE_TOKEN_KEY = "@work-time/pending-invite-token";

const INVITE_TOKEN_PATTERN = /^[a-fA-F0-9]{64}$/;

function normalizeToken(value: string | null | undefined) {
  const token = value?.trim() ?? "";
  return INVITE_TOKEN_PATTERN.test(token) ? token : null;
}

export function buildInviteLink(token: string, scheme = "work-time") {
  return `${scheme}://join?token=${encodeURIComponent(token)}`;
}

export function extractInviteToken(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const queryToken = normalizeToken(url.searchParams.get("token"));
    if (queryToken) return queryToken;

    const pathToken = normalizeToken(
      url.pathname.split("/").filter(Boolean).at(-1),
    );
    if (pathToken) return pathToken;
  } catch {
    return normalizeToken(trimmed);
  }

  return normalizeToken(trimmed);
}

export function getJoinWorkspaceErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Invite has expired")) {
    return "만료된 초대입니다.";
  }

  if (message.includes("Already a member")) {
    return "이미 참여 중인 워크스페이스입니다.";
  }

  if (
    message.includes("Invalid invite token") ||
    message.includes("초대 링크가 올바르지 않습니다")
  ) {
    return "초대 링크가 올바르지 않습니다.";
  }

  return "워크스페이스 참여에 실패했습니다.";
}
```

- [ ] **Step 4: Run utility tests**

Run from `app/`:

```bash
bun test src/shared/lib/invite.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit invite utilities**

```bash
git add app/src/shared/lib/invite.ts app/src/shared/lib/invite.test.js
git commit -m "feat(app): add workspace invite utilities"
```

---

### Task 3: Pending Invite Storage And Join Hook

**Files:**
- Create: `app/src/shared/lib/pending-invite.ts`
- Create: `app/src/shared/hooks/use-join-workspace-by-invite.ts`

- [ ] **Step 1: Add pending invite storage**

Create `app/src/shared/lib/pending-invite.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PENDING_INVITE_TOKEN_KEY } from "@shared/lib/invite";

export async function storePendingInviteToken(token: string) {
  await AsyncStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
}

export async function getPendingInviteToken() {
  return AsyncStorage.getItem(PENDING_INVITE_TOKEN_KEY);
}

export async function clearPendingInviteToken() {
  await AsyncStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
}
```

- [ ] **Step 2: Add the join hook**

Create `app/src/shared/hooks/use-join-workspace-by-invite.ts`:

```ts
import { useCallback } from "react";
import { useMutation } from "@apollo/client";
import { router } from "expo-router";
import { graphql } from "@graphql";
import { apolloClient } from "@shared/lib/apollo";
import {
  extractInviteToken,
  getJoinWorkspaceErrorMessage,
} from "@shared/lib/invite";
import { clearPendingInviteToken } from "@shared/lib/pending-invite";
import { useAuthStore } from "@shared/store/auth";

const JOIN_WORKSPACE = graphql(`
  mutation JoinWorkspaceByInvite($token: String!) {
    joinWorkspace(token: $token) {
      workspaceId
      memberId
      role
    }
  }
`);

export function useJoinWorkspaceByInvite() {
  const setWorkspaceId = useAuthStore((s) => s.setWorkspaceId);
  const setMemberId = useAuthStore((s) => s.setMemberId);
  const [joinWorkspace, { loading }] = useMutation(JOIN_WORKSPACE);

  const joinByInvite = useCallback(
    async (input: string) => {
      const token = extractInviteToken(input);
      if (!token) {
        throw new Error("초대 링크가 올바르지 않습니다.");
      }

      try {
        const { data } = await joinWorkspace({ variables: { token } });
        const membership = data?.joinWorkspace;
        if (!membership) {
          throw new Error("워크스페이스 참여에 실패했습니다.");
        }

        setWorkspaceId(membership.workspaceId);
        setMemberId(membership.memberId);
        await clearPendingInviteToken();
        await apolloClient.resetStore();
        router.replace("/(tabs)");

        return membership;
      } catch (error) {
        throw new Error(getJoinWorkspaceErrorMessage(error));
      }
    },
    [joinWorkspace, setMemberId, setWorkspaceId],
  );

  return { joinByInvite, loading };
}
```

- [ ] **Step 3: Run app typecheck**

Run from `app/`:

```bash
bunx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit pending storage and join hook**

```bash
git add app/src/shared/lib/pending-invite.ts app/src/shared/hooks/use-join-workspace-by-invite.ts
git commit -m "feat(app): add invite join flow primitives"
```

---

### Task 4: Deep Link Route And Login Resume

**Files:**
- Create: `app/src/app/join.tsx`
- Modify: `app/src/app/_layout.tsx`

- [ ] **Step 1: Add the invite link route**

Create `app/src/app/join.tsx`:

```tsx
import { useEffect } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenLoader } from "@shared/ui/screen-loader";
import { extractInviteToken } from "@shared/lib/invite";
import { storePendingInviteToken } from "@shared/lib/pending-invite";
import { useJoinWorkspaceByInvite } from "@shared/hooks/use-join-workspace-by-invite";
import { useAuthStore } from "@shared/store/auth";

export default function JoinInviteScreen() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const session = useAuthStore((s) => s.session);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const { joinByInvite } = useJoinWorkspaceByInvite();
  const tokenValue = Array.isArray(token) ? token[0] : token;

  useEffect(() => {
    if (!isLoaded) return;

    const inviteToken = extractInviteToken(tokenValue ?? "");
    if (!inviteToken) {
      Alert.alert("초대 참여 실패", "초대 링크가 올바르지 않습니다.");
      router.replace(session ? "/workspaces" : "/login");
      return;
    }

    if (!session) {
      storePendingInviteToken(inviteToken).finally(() => {
        router.replace("/login");
      });
      return;
    }

    joinByInvite(inviteToken).catch((error) => {
      Alert.alert(
        "초대 참여 실패",
        error instanceof Error ? error.message : "워크스페이스 참여에 실패했습니다.",
      );
      router.replace("/workspaces");
    });
  }, [isLoaded, joinByInvite, session, tokenValue]);

  return <ScreenLoader />;
}
```

- [ ] **Step 2: Consume pending invite tokens after login**

Modify `app/src/app/_layout.tsx`.

Add imports:

```ts
import { Alert, Text, View } from "react-native";
import {
  clearPendingInviteToken,
  getPendingInviteToken,
} from "@shared/lib/pending-invite";
import { useJoinWorkspaceByInvite } from "@shared/hooks/use-join-workspace-by-invite";
```

Replace the current `Text, View` import so there is only one `react-native` import.

Inside `RootNavigator`, add the hook after the auth store line:

```ts
  const { joinByInvite, loading: inviteJoinLoading } = useJoinWorkspaceByInvite();
```

Add this effect before the route-redirect effect:

```ts
  useEffect(() => {
    if (!isLoaded || !session) return;

    let cancelled = false;

    getPendingInviteToken().then(async (pendingToken) => {
      if (!pendingToken || cancelled) return;

      try {
        await joinByInvite(pendingToken);
      } catch (error) {
        await clearPendingInviteToken();
        if (!cancelled) {
          Alert.alert(
            "초대 참여 실패",
            error instanceof Error
              ? error.message
              : "워크스페이스 참여에 실패했습니다.",
          );
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, joinByInvite, session]);
```

Include `inviteJoinLoading` in the loading guard:

```ts
  if (
    inviteJoinLoading ||
    !isLoaded ||
    hasPartialWorkspaceState ||
    (shouldValidateWorkspace && !data) ||
    savedWorkspaceIsInvalid
  ) {
```

- [ ] **Step 3: Run app typecheck**

Run from `app/`:

```bash
bunx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit link route and pending resume**

```bash
git add app/src/app/join.tsx app/src/app/_layout.tsx
git commit -m "feat(app): resume workspace invites after login"
```

---

### Task 5: Workspace Screen Invite Code Entry

**Files:**
- Modify: `app/src/app/workspaces.tsx`

- [ ] **Step 1: Add invite entry state and handler**

Modify `app/src/app/workspaces.tsx`.

Add import:

```ts
import { useJoinWorkspaceByInvite } from "@shared/hooks/use-join-workspace-by-invite";
```

Inside `WorkspacesScreen`, add state and hook after the existing mutation:

```ts
  const { joinByInvite, loading: joiningByInvite } = useJoinWorkspaceByInvite();
  const [inviteInput, setInviteInput] = useState("");
```

Add handler after `handleCreate`:

```ts
  const handleJoinByInvite = async () => {
    try {
      await joinByInvite(inviteInput);
      setInviteInput("");
    } catch (e) {
      Alert.alert(
        "초대 참여 실패",
        e instanceof Error ? e.message : "워크스페이스 참여에 실패했습니다",
      );
    }
  };
```

- [ ] **Step 2: Add invite code UI**

In `app/src/app/workspaces.tsx`, inside the existing `KeyboardAvoidingView`, render this block after the create-workspace block and before logout:

```tsx
          <View className="mt-3 bg-surface rounded-lg p-4 border border-border">
            <Text className="text-[15px] font-medium text-text-primary mb-3">
              초대 코드로 참여
            </Text>
            <TextInput
              className="border border-border rounded-sm bg-white px-4 py-3 text-[15px] text-text-primary mb-3"
              placeholder="초대 링크 또는 코드"
              placeholderTextColor="#B8A898"
              value={inviteInput}
              onChangeText={setInviteInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              className="bg-primary rounded-lg py-3 items-center"
              onPress={handleJoinByInvite}
              disabled={joiningByInvite || !inviteInput.trim()}
              style={{ opacity: joiningByInvite || !inviteInput.trim() ? 0.5 : 1 }}
            >
              <Text className="text-white font-bold text-[15px]">
                {joiningByInvite ? "참여 중..." : "참여하기"}
              </Text>
            </Pressable>
          </View>
```

- [ ] **Step 3: Run app typecheck**

Run from `app/`:

```bash
bunx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit workspace invite entry**

```bash
git add app/src/app/workspaces.tsx
git commit -m "feat(app): join workspaces with invite codes"
```

---

### Task 6: Owner Invite Sharing In Settings

**Files:**
- Modify: `app/src/pages/settings/SettingsPage.tsx`
- Modify: `app/src/pages/settings/ui/invite-section.tsx`

- [ ] **Step 1: Query workspace membership role in Settings**

Modify `SETTINGS_QUERY` in `app/src/pages/settings/SettingsPage.tsx` to include `myWorkspaces`:

```graphql
    myWorkspaces {
      workspaceId
      role
    }
```

Add the workspace id selector near the existing auth store selectors:

```ts
  const workspaceId = useAuthStore((s) => s.workspaceId);
```

Add owner calculation after `currentMember`:

```ts
  const currentWorkspaceMembership = data?.myWorkspaces.find(
    (membership) => membership.workspaceId === workspaceId,
  );
  const isOwner = currentWorkspaceMembership?.role === "OWNER";
```

Change invite section rendering from:

```tsx
        {isAdmin && <InviteSection className="mb-4" />}
```

to:

```tsx
        {isOwner && (
          <InviteSection
            className="mb-4"
            onShared={() =>
              setToast({ message: "초대 링크를 공유했습니다", variant: "success" })
            }
            onError={(message) => setToast({ message, variant: "error" })}
          />
        )}
```

- [ ] **Step 2: Update InviteSection share behavior**

Replace `app/src/pages/settings/ui/invite-section.tsx` with:

```tsx
import { Pressable, Share, Text, View } from "react-native";
import { useMutation } from "@apollo/client";
import { graphql } from "@graphql";
import {
  INVITE_EXPIRES_IN_HOURS,
  buildInviteLink,
} from "@shared/lib/invite";

const CREATE_INVITE = graphql(`
  mutation SettingsCreateInvite($expiresInHours: Int) {
    createInvite(expiresInHours: $expiresInHours) {
      id
      token
      expiresAt
    }
  }
`);

type InviteSectionProps = {
  className?: string;
  onShared?: () => void;
  onError?: (message: string) => void;
};

export function InviteSection({
  className,
  onShared,
  onError,
}: InviteSectionProps) {
  const [createInvite, { loading }] = useMutation(CREATE_INVITE);

  const handleShare = async () => {
    try {
      const { data } = await createInvite({
        variables: { expiresInHours: INVITE_EXPIRES_IN_HOURS },
      });
      const token = data?.createInvite.token;
      if (!token) {
        throw new Error("초대 링크 생성에 실패했습니다");
      }

      const link = buildInviteLink(token);
      await Share.share({
        message:
          "WorkTime 워크스페이스 초대입니다.\n\n" +
          "아래 링크를 열거나 초대 코드를 앱에 입력하세요.\n\n" +
          `링크: ${link}\n` +
          `초대 코드: ${token}`,
      });
      onShared?.();
    } catch (e) {
      onError?.(
        e instanceof Error ? e.message : "초대 링크 생성에 실패했습니다",
      );
    }
  };

  return (
    <View className={className}>
      <View
        className="bg-surface rounded-lg p-4 border border-border"
        style={{
          shadowColor: "#2C1F14",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text className="text-[15px] font-semibold text-text-primary mb-1">
          워크스페이스 초대
        </Text>
        <Text className="text-[13px] text-text-muted mb-3">
          7일 동안 사용할 수 있는 초대 링크와 코드를 공유합니다
        </Text>
        <Pressable
          className="bg-primary rounded-lg py-3 items-center"
          onPress={handleShare}
          disabled={loading}
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          <Text className="text-white font-bold text-[15px]">
            {loading ? "생성 중..." : "초대 링크 공유"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Regenerate GraphQL output**

Run from `app/`:

```bash
bun run graphql:generate
```

Expected: generated output updates without errors.

- [ ] **Step 4: Run app typecheck**

Run from `app/`:

```bash
bunx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit settings invite sharing**

```bash
git add app/src/pages/settings/SettingsPage.tsx app/src/pages/settings/ui/invite-section.tsx app/src/graphql/graphql-env.d.ts
git commit -m "feat(app): let owners share workspace invites"
```

---

### Task 7: Final Verification

**Files:**
- Verify only, no planned file edits.

- [ ] **Step 1: Run app invite utility tests**

Run from `app/`:

```bash
bun test src/shared/lib/invite.test.js
```

Expected: PASS.

- [ ] **Step 2: Run app TypeScript check**

Run from `app/`:

```bash
bunx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run server invite tests**

Run from `server/`:

```bash
bun run test -- modules/invite/invite.service.spec.ts modules/invite/invite.resolver.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Build the server**

Run from `server/`:

```bash
bun run build
```

Expected: PASS.

- [ ] **Step 5: Run iOS app**

Run from `app/`:

```bash
bun run ios
```

Expected: app builds, installs, and opens without the Apollo provider error or native module linking errors.

- [ ] **Step 6: Manual iOS checks**

Verify these paths in the simulator:

- Owner account opens Settings and sees "워크스페이스 초대".
- Pressing "초대 링크 공유" opens the native share sheet with a `work-time://join?token=` link and raw invite code.
- A logged-in user can paste the raw code on `/workspaces` and lands in `/(tabs)`.
- A logged-out user opening `work-time://join?token=<token>` is routed to login, then joins automatically after login.
- Invalid input on `/workspaces` shows "초대 링크가 올바르지 않습니다."

- [ ] **Step 7: Commit any generated verification updates**

If verification changed generated files, commit only relevant files:

```bash
git status --short
git add app/src/graphql/graphql-env.d.ts app/src/graphql/schema.graphql
git commit -m "chore: update invite graphql artifacts"
```

If there are no generated changes, skip this commit.

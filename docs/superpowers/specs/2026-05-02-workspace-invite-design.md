# Workspace Invite Design

Date: 2026-05-02

## Context

The app already supports users selecting or creating workspaces. The server already has the core invitation API and data model:

- `createInvite(expiresInHours)` creates an invite for the current workspace.
- `joinWorkspace(token)` joins the authenticated user to the invite's workspace.
- `InviteEntity` stores `workspaceId`, `token`, `createdBy`, `expiresAt`, and `createdAt`.

The missing work is mainly in the app: owners need a way to create and share invites, and invited users need link and code entry flows that end by selecting the joined workspace.

## Product Decisions

- Invite sharing supports both full links and raw invite codes.
- Only workspace owners can create invites.
- Invites expire after 7 days.
- If a logged-out user opens an invite link, the app stores the token, sends them through login, and joins automatically after login.
- Owners create invites from the Settings tab.
- Users enter invite codes from the workspace selection screen.
- The first implementation uses the existing server API without invite preview, invite list management, or invite revocation.

## Scope

Included:

- Settings tab invite section for owners.
- 7-day invite creation via `createInvite(expiresInHours: 168)`.
- Native share sheet containing both the invite link and invite code.
- Workspace selection screen code entry.
- Token extraction from either a full invite link or a raw token.
- Pending invite token persistence through login.
- Automatic `joinWorkspace(token)` after login when a pending token exists.
- Successful join stores `workspaceId` and `memberId`, resets Apollo cache, and navigates to `/(tabs)`.
- User-facing errors for invalid, expired, or already-used membership cases.

Excluded:

- Invite preview before joining.
- Owner invite list.
- Invite revocation.
- Member-created invites.
- Configurable invite expiration.

## Server Design

The GraphQL schema stays stable. The app will call the existing mutations:

```graphql
mutation CreateInvite($expiresInHours: Int) {
  createInvite(expiresInHours: $expiresInHours) {
    id
    token
    expiresAt
  }
}

mutation JoinWorkspace($token: String!) {
  joinWorkspace(token: $token) {
    workspaceId
    memberId
    role
  }
}
```

Server behavior should remain:

- `createInvite` requires `WorkspaceGuard`, so the request includes `x-workspace-id`.
- `createInvite` rejects non-owner workspace members.
- `joinWorkspace` requires authentication but does not require `x-workspace-id`.
- `joinWorkspace` rejects missing, invalid, expired, or duplicate membership tokens.
- `joinWorkspace` creates the `MemberEntity` and `WorkspaceMemberEntity` in one transaction.

Server tests should cover invite creation permission and join failure/success cases. No schema change is required.

## App Design

### Settings Tab

Settings will determine the current user's role from existing workspace/member data. If the current user's workspace role is `OWNER`, it shows a workspace invite section.

The section contains one primary action: create and share an invite. Pressing it calls `createInvite(expiresInHours: 168)`, builds a link from the returned token, and passes a message to React Native `Share.share`.

The shared message includes:

- the join link
- the raw invite code
- a short Korean instruction to open the link or paste the code in the app

### Workspace Selection Screen

The workspace selection screen adds an invite code entry area below the workspace list and create-workspace action. The user can paste either a full invite URL or a raw token.

On submit:

- extract the token
- call `joinWorkspace(token)`
- store the returned `workspaceId` and `memberId`
- reset Apollo cache
- navigate to `/(tabs)`

The same join helper should be reused for manual code entry and pending invite auto-join so success and error behavior stays consistent.

### Deep Linking And Pending Invites

The app listens for initial and runtime URLs using React Native linking support. An invite URL carries the token as `token`.

When an invite URL is received:

- If the user is authenticated, attempt to join immediately.
- If the user is not authenticated, store the token in AsyncStorage under a pending invite key and route the user to login.

After auth hydration and login session updates, the app checks the pending invite key. If a pending token exists and a session exists, it attempts `joinWorkspace(token)`.

Pending token handling rules:

- Clear the pending token after a successful join.
- Clear the pending token after a failed join to avoid repeated failures on every launch.
- Preserve the token while the user is still unauthenticated.

## Error Handling

User-facing messages should be in Korean and mapped from the expected server failures:

- Invalid or missing token: "초대 링크가 올바르지 않습니다."
- Expired token: "만료된 초대입니다."
- Already a member: "이미 참여 중인 워크스페이스입니다."
- Network or unknown error: "워크스페이스 참여에 실패했습니다."

The app should keep the user on the workspace selection screen after failed manual entry. For failed automatic join after login, it should remove the pending token and show an alert when possible.

## Testing

Server:

- `InviteService` rejects missing or invalid tokens.
- `InviteService` rejects expired tokens.
- `InviteService` rejects users already in the workspace.
- `InviteService` creates member and workspace membership records in one successful join path.
- `InviteResolver` or an equivalent unit test verifies only owners can create invites.

App:

- Unit-test or isolate token extraction so raw tokens and full links both work.
- Run GraphQL generation after adding documents.
- Run TypeScript checking.
- Manually verify on iOS:
  - owner can create and share an invite from Settings
  - user can paste a code on the workspace screen and join
  - logged-out invite link flow resumes after login and joins automatically

## Completion Criteria

- Owners can share a 7-day invite containing link and code.
- Non-owners do not see or cannot use invite creation.
- Invite links and raw codes both join users to the workspace.
- Logged-out users who open an invite link join automatically after login.
- Joined users land in the selected workspace home flow.
- Invalid, expired, duplicate, and network failures show clear Korean feedback.

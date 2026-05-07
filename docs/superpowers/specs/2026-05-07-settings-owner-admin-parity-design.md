# Settings Owner/Admin Parity Design

Date: 2026-05-07

## Context

The Settings tab currently renders personal profile information for everyone and management sections only when the current user has management permission.

There are two role sources in the app:

- `members.role`: study member role, currently `ADMIN` or `MEMBER`.
- `myWorkspaces.role`: workspace membership role, including `OWNER`.

Owners can manage the workspace, but the Settings UI previously treated some owner-only and admin-only sections differently. The requested behavior is that `ADMIN` and `OWNER` users see the same Settings management screen under `/app`.

## Product Decisions

- A user can manage Settings if their current member role is `ADMIN` or their current workspace membership role is `OWNER`.
- Owners and admins see the same management sections.
- Members without either role continue to see only non-management Settings content.
- This change is app-only. The server authorization model remains the source of truth for mutations.
- Role data keeps its current meaning. The app will not rewrite `OWNER` into `ADMIN`.

## Scope

Included:

- Use one Settings management permission flag for all management sections.
- Apply that flag consistently to invite sharing, fee payment confirmation, role management, study start time, late fee, and monthly fee sections.
- Keep the existing `SETTINGS_QUERY` role fields: `members.role` and `myWorkspaces.role`.
- Remove temporary permission debug logging if it is no longer needed.
- Run TypeScript checking for the app.

Excluded:

- Server role or guard changes.
- GraphQL schema changes.
- Tab visibility changes.
- Role-management behavior changes beyond Settings section visibility.
- New UI sections or visual redesign.

## App Design

`SettingsPage.tsx` will compute a single management permission:

```ts
const canManageSettings =
  currentMember?.role === "ADMIN" ||
  currentWorkspaceMembership?.role === "OWNER";
```

`currentMember` is found from `members` using the selected `memberId` in `AuthStore`. `currentWorkspaceMembership` is found from `myWorkspaces` using the selected `workspaceId` in `AuthStore`.

Every management section in Settings uses `canManageSettings`:

- `InviteSection`
- `FeeConfirmSection`
- `RoleSection`
- `StudyTimeSection`
- `LateFeeSection`
- `MonthlyFeeSection`

The name `canManageSettings` makes the rule explicit and avoids implying that owners are study `ADMIN` members. The app still sends the same mutations. If the server rejects a mutation, existing toast error handling remains in place.

## Data Flow

On Settings load:

1. `SETTINGS_QUERY` fetches `myWorkspaces`, `members`, `settings`, and `feeStatus`.
2. The app compares the selected `workspaceId` and `memberId` from `AuthStore` against the query result.
3. `canManageSettings` becomes true for a study `ADMIN` or workspace `OWNER`.
4. All management sections render when `canManageSettings` is true.

For mutations, the current flow remains unchanged:

- settings mutations update server settings and show success or error toasts
- fee confirmation mutations refetch Settings data
- member role mutation refetches Settings data
- invite sharing calls the existing invite flow

## Error Handling

No new user-facing error paths are required.

If role data is missing during loading or due to query failure, `canManageSettings` evaluates false and the management sections stay hidden. Existing loading and error states continue to cover the screen-level query result.

Server-side permission errors still surface through existing catch blocks and toast messages.

## Testing

Verification should include:

- `npx tsc --noEmit` from `app/`.
- Manual Settings check for an `ADMIN` member: all management sections are visible.
- Manual Settings check for an `OWNER` workspace membership: the same management sections are visible.
- Manual Settings check for a plain `MEMBER`: management sections are hidden.

Automated component tests are not required for this narrow change because the app does not currently have a Settings screen test harness. If one is added later, the key cases are the three role combinations above.

## Completion Criteria

- `ADMIN` and `OWNER` users see identical Settings management sections.
- Plain members do not see Settings management sections.
- The implementation keeps `members.role` and `myWorkspaces.role` separate.
- App TypeScript checking passes.

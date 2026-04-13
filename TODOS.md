# TODOS

## checkIn race condition — wrap in transaction
**What:** `session.service.ts:checkIn()` reads active session then inserts without a transaction. Two concurrent requests can both succeed.
**Why:** Prevents duplicate active sessions for the same member on the same day, which would corrupt attendance data and display two timers.
**Pros:** Data integrity guaranteed at DB level.
**Cons:** Minor complexity increase, slight performance overhead from transaction lock.
**Context:** Currently 10-15 members using mobile app. Probability of same-person concurrent check-in is near zero. Flagged by outside voice review 2026-03-28. Best addressed alongside Phase 1.5 authentication work, since auth will already touch the mutation layer.
**Depends on:** Nothing blocking. Natural to bundle with Phase 1.5 auth.

## Oracle connection pool configuration
**What:** Add `extra: { poolMin: 2, poolMax: 10 }` to TypeORM config in `app.module.ts`.
**Why:** Oracle Always Free tier has 20 concurrent connection limit. Without explicit pool config, TypeORM/oracledb uses defaults that may not respect this limit, especially if Railway scales to multiple instances.
**Pros:** Prevents connection exhaustion in production.
**Cons:** None (2-line config change).
**Context:** Flagged by outside voice review 2026-03-28. Should be done before or alongside first production deployment.
**Depends on:** Nothing.

## N+1 queries in members resolver — add DataLoader
**What:** `member.resolver.ts` has 3 ResolveField calls (currentStatus, todayStudyMinutes, todayVacationHours) that each fire 1-2 queries per member. 15 members = ~45 queries per request.
**Why:** The Presence Home screen (design doc Phase 1) will poll this every 15 seconds. 45 queries × 4 requests/minute × 15 concurrent users = meaningful DB load.
**Pros:** Reduces queries from O(N) to O(1) per field. Better latency for presence screen.
**Cons:** DataLoader adds complexity. NestJS request-scoped DataLoader requires careful setup.
**Context:** Flagged by outside voice review 2026-03-28. At 15 members the impact is minimal (~500ms). Becomes important when building the Presence Home UI (Phase 1) with 15-second polling.
**Depends on:** Phase 1 Presence Home UI work (natural to bundle).

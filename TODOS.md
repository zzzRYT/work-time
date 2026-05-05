# TODOS

> Active 항목은 `docs/plans/2026-05-05-launch-plan.md` (Launch Plan) 참고.
> 여기엔 plan에 흡수되지 않은 항목 또는 post-launch 백로그만 둔다.

## Post-launch

### N+1 queries in members resolver — add DataLoader
**What:** `member.resolver.ts` has 3 ResolveField calls (currentStatus, todayStudyMinutes, todayVacationHours) that each fire 1-2 queries per member. 15 members = ~45 queries per request.
**Why:** The Presence Home screen (design doc Phase 1) will poll this every 15 seconds. 45 queries × 4 requests/minute × 15 concurrent users = meaningful DB load.
**Pros:** Reduces queries from O(N) to O(1) per field. Better latency for presence screen.
**Cons:** DataLoader adds complexity. NestJS request-scoped DataLoader requires careful setup.
**Context:** Flagged by outside voice review 2026-03-28. At 15 members the impact is minimal (~500ms). Becomes important when building the Presence Home UI (Phase 1) with 15-second polling.
**Depends on:** Phase 1 Presence Home UI work (post-launch, after Phase 2 redesign).

---

## Resolved / Moved

- ~~checkIn race condition — wrap in transaction~~ → Launch Plan **M-1** (Day 3–4)
- ~~Oracle connection pool configuration~~ → 폐기 (Oracle → Supabase Postgres로 전환됨)

# Launch Plan — iOS + Android 정식 출시

> **목표:** 2주 안에 Apple App Store + Google Play 정식 출시
> **모드:** Critical-only — Phase 2 UI 리디자인은 출시 후로
> **작성일:** 2026-05-05
> **대체 대상:** `2026-03-15-deployment-preparation.md` (Prisma+Express 시절 plan)

---

## 결정 요약

| 항목 | 결정 |
|------|------|
| 출시 트랙 | Apple App Store + Google Play 정식 (Closed/Open Test 아님) |
| 사용 모델 | 다중 워크스페이스 B2B (기수별 워크스페이스) |
| 결제 모델 | **단순 트래킹** — 회비/지각비는 앱 밖에서 송금. IAP 회피 |
| 인증 | Supabase Auth + Google + Apple (이미 동작). 버튼/아이콘 HIG 검증만 |
| UI 범위 | 현 UI 그대로 출시. `DESIGN.md` 기반 Phase 2는 v1.1로 |

---

## 섹션 1 — 정책 (스토어 거절 차단)

| # | 항목 | 근거 | 상태 |
|---|------|------|------|
| P-1 | 앱 내 계정 삭제 | Apple 5.1.1(v) / Google 2024 강제 | 미구현 |
| P-2 | 개인정보처리방침 URL (공개 호스팅) | 등록란 + 앱 내 링크 | 초안만 |
| P-3 | 이용약관 + 개인정보 분리 동의 (가입 시) | | 미구현 |
| P-4 | 권한 사유 명시 + 미사용 권한 제거 | Info.plist / AndroidManifest | 미점검 |
| P-5 | Sign in with Apple 버튼 HIG 준수 | | 검증만 남음 |
| P-6 | Play 데이터 안전 섹션 | Supabase Auth 저장 데이터 포함 | 미작성 |
| P-7 | Apple App Privacy 라벨 | Play와 일관성 | 미작성 |
| P-8 | 스크린샷·아이콘·Feature Graphic | 사이즈별 | 체크리스트만 |
| P-9 | **심사용 빌드 크래시 0** — 핵심 플로우(로그인→워크스페이스→체크인→체크아웃→로그아웃) + 빈 데이터/오프라인/토큰 만료/권한 거부에서 graceful | Apple 2.1, Google Pre-launch Report | 미검증 |
| P-10 | **TestFlight + Play Internal 1주일 dogfooding** | | Sentry 클라이언트 미설치 |

---

## 섹션 2 — 기능 (출시 빌드 신규 기능)

### P0

| # | 기능 | 동선 | 비고 |
|---|------|------|------|
| F-1 | 계정 삭제 | 설정 → 재인증 → 확인 모달 → 30일 유예 안내 → 즉시 로그아웃 | mutation `deleteMyAccount` + Supabase auth.users 삭제 → cascade. 워크스페이스 admin이면 오너 위임 강제 |
| F-2 | 가입 시 약관·개인정보 분리 동의 | 첫 로그인 직후, 미동의 시 진입 차단 | `user.terms_agreed_at`, `terms_version` 컬럼 |
| F-3 | 앱 내 약관/처리방침 정적 페이지 | 설정 → 약관 / 개인정보처리방침 | P-2 호스팅 URL 사용 |
| F-4 | 401/만료 자동 핸들링 | Apollo errorLink + Supabase listener → 로그인 화면 | 크래시 방지 |

### P1 (1주차 진척 보고 결정)

- 워크스페이스 떠나기 (멤버십만 탈퇴)
- 푸시 알림 (체크인/체크아웃) — 시간 모자라면 v1.1

### Post-launch

- DESIGN.md 기반 Phase 2 UI 리디자인
- 관리자 회비 처리 자동화
- 버전 강제 업데이트 (OTA만 깔고 강제는 다음 버전)
- N+1 DataLoader (Presence 폴링 본격화 시점)

---

## 섹션 3 — 수정 (안정성·기술부채)

| # | 항목 | 위치 |
|---|------|------|
| M-1 | 체크인 트랜잭션 | `server/src/modules/session/session.service.ts` |
| M-2 | React Error Boundary 글로벌 | `app/src/app/_layout.tsx` |
| M-3 | Apollo errorLink 401 처리 | `app/src/shared/lib/apollo.ts` (F-4와 짝) |
| M-4 | 빈 상태 화면 ×4 | home/members/history/workspaces |
| M-5 | invite 토큰 엣지 케이스 | `app/src/app/join.tsx`, server `invite.service.ts` |
| M-6 | 타임존 일관성 | server `TZ=Asia/Seoul`, 자정 경계 검증 |
| M-7 | production 빌드 console.log 제거 | metro/babel transform |
| M-8 | Sentry 클라이언트 SDK + 소스맵 | `app/src/shared/lib/sentry.ts` 신규 |

---

## 섹션 4 — 서버 / 인프라

| # | 항목 | 비고 |
|---|------|------|
| I-1 | **Supabase Free → Pro($25/월)** | Free는 7일 비활성 시 자동 일시중지. 출시 직후 트래픽 적은 시기에 정지 위험 |
| I-2 | DB 백업 | Pro = 일일 자동 + PITR 7일. Free는 백업 없음 |
| I-3 | production API URL 픽스 | `app/eas.json` production 프로필에 Railway 도메인 하드코딩 |
| I-4 | 시크릿 분리/회전 점검 | service role key는 서버 환경변수만, 앱은 anon key만 |
| I-5 | CORS 화이트리스트 | production origin만 |
| I-6 | Rate limit | NestJS 전환 후 재검증 |
| I-7 | 헬스체크 + 재시작 정책 | `/health`, 5xx 자동 재시작 |
| I-8 | secure storage | Supabase 세션은 `expo-secure-store` |

### Post-launch
- Sentry 알람 채널 (Slack/메일)
- 외부 다운 모니터링 (UptimeRobot)
- 쿼리 인덱스 점검 (sessions: workspace_id+date, members: workspace_id)

---

## 섹션 5 — 14일 일정

| Day | 작업 | 항목 |
|-----|------|------|
| 1 | 인프라 결제 + 정책 호스팅 시작 | I-1, I-2, P-2 (GitHub Pages) |
| 2 | 약관 초안 + 개발자 계정 점검 | 약관 작성, Apple/Google Console 상태 확인 |
| 3–4 | 서버 mutation 묶음 (한 PR) | F-1, F-2, M-1, I-4/5/6/7 |
| 5–7 | 앱 화면 묶음 | F-1, F-2, F-3, F-4/M-3, M-2, M-4×4 |
| 8 | 잔여 안정성 | M-5, M-6, M-7, M-8, I-3, I-8 |
| 9 | 스토어 자산 | P-4, P-5, P-6, P-7, P-8 |
| 10–13 | **TestFlight + Play Internal dogfooding** | P-9, P-10. 크래시 발견 시 즉시 수정 + 재배포 |
| 14 | 심사 제출 | Apple Connect / Play Console |

---

## ⚠️ 일정에 영향 줄 수 있는 운영 변수

1. **Google Play 신규 개발자 정책** (2023.11–) — 신규 개인 개발자는 production 전 20명 이상 클로즈드 테스터로 **최소 14일 운영 강제**. 조직 계정은 면제. 신규 개인 계정이면 +14일 필요 → **확인 후 plan 갱신**
2. **Apple Developer 신원 검증** — 최초 가입이면 1–7일
3. **OAuth client production bundle ID 등록** — Google/Apple OAuth client에 production bundle ID 누락 시 production 빌드에서 로그인 실패 (출시 후 즉시 거절 평점)

---

## 마무리 정리 작업

- `TODOS.md`
  - 삭제: ~~Oracle 연결 풀~~ (Supabase로 전환)
  - 이동: ~~체크인 race~~ → M-1
  - 표시: ~~N+1~~ → Post-launch
- `docs/plans/2026-03-15-deployment-preparation.md` 상단에 `> [archived: superseded by 2026-05-05-launch-plan.md]`

---

## 다음 단계

이 plan을 **superpowers:writing-plans**로 Day 단위 task 분해 → 매일 시작할 때 해당 Day의 task만 따로 꺼내 진행.

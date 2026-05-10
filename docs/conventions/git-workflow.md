# Git Workflow Convention

이 문서는 프로젝트의 브랜치 운영과 머지 방식을 정의한다.

## 목표

- 히스토리는 선형으로 유지한다.
- 기능 작업은 squash merge로 하나의 의미 있는 커밋만 남긴다.
- `main`에는 검증이 끝난 작업만 반영한다.
- 영구 브랜치는 `main`, `dev` 두 개만 둔다.

## 브랜치 역할

| 브랜치 | 역할 | 직접 커밋 |
|--------|------|-----------|
| `main` | 배포 가능하거나 완료된 안정 상태 | 금지 |
| `dev` | 기능 통합과 검증을 위한 브랜치 | 원칙적으로 금지 |
| `<area>/feature/*` | 개별 기능 작업 브랜치. 머지 후 삭제 | 허용 |
| `<area>/fix/*` | 버그 수정 작업 브랜치. 머지 후 삭제 | 허용 |

`<area>/feature/*`, `<area>/fix/*`는 임시 브랜치다. 작업이 `dev`에 반영되면 삭제한다.

## 브랜치 이름

브랜치 이름은 작업 위치와 작업 성격이 모두 드러나도록 `<area>/<type>/<work-name>` 형식을 사용한다.

```
<area>/<type>/<work-name>
```

| 구분 | 값 | 의미 |
|------|-----|------|
| `area` | `app`, `server`, `docs`, `root` | 주로 변경하는 위치 |
| `type` | `feature`, `fix` | 새 기능/개선 또는 버그 수정 |
| `work-name` | kebab-case | 작업 내용을 짧게 설명 |

예시:

```bash
app/feature/workspace-invite
app/fix/login-token-refresh
server/feature/workspace-guard
server/fix/session-scope
docs/feature/git-workflow
root/fix/github-actions
```

브랜치 타입은 `feature`, `fix`만 사용한다. 문서 추가, 리팩터링, 설정 변경도 별도 타입을 만들지 않고 작업 의도에 따라 `feature` 또는 `fix`로 분류한다.

여러 영역을 동시에 바꾸는 작업은 가능하면 작업을 나눈다. 나누기 어렵다면 변경의 주된 책임을 가진 영역을 `area`로 선택한다.

## 초기 설정

`dev` 브랜치가 없다면 `main`에서 한 번만 만든다.

```bash
git switch main
git pull origin main
git switch -c dev
git push -u origin dev
```

이후 `main`과 `dev`는 삭제하지 않는 영구 브랜치로 관리한다.

## 기본 흐름

```
main
  ↓
dev
  ↓
<area>/feature/<work-name>
  ↓ squash merge
dev
  ↓ fast-forward merge
main
```

1. 새 작업은 항상 최신 `dev`에서 분기한다.
2. 작업 브랜치에서 필요한 만큼 커밋한다.
3. 작업이 끝나면 PR을 열어 `dev`로 squash merge한다.
4. `dev`에서 통합 검증이 끝나면 `main`으로 fast-forward merge한다.

## 작업 브랜치 → Dev

작업 브랜치의 base는 `dev`다.

```bash
git switch dev
git pull origin dev
git switch -c app/feature/workspace-invite
```

PR은 `<area>/feature/*` 또는 `<area>/fix/*` → `dev`로 만든다.

머지는 반드시 **Squash and merge**를 사용한다. 작업 중 생긴 중간 커밋은 보존하지 않고, `dev`에는 작업 단위 커밋 하나만 남긴다.

Squash 커밋 메시지가 히스토리의 기준이 되므로, 커밋 하나만 봐도 작업 내용을 알 수 있어야 한다.

```bash
feat(app): add workspace invite flow
fix(server): scope sessions to workspace members
docs: add git workflow convention
refactor(app): align settings permission naming
```

## Dev → Main

`dev`에서 검증이 끝난 작업은 `main`으로 반영한다.

원칙은 **merge commit 없는 선형 반영**이다. 로컬에서는 fast-forward만 허용한다.

```bash
git switch main
git pull origin main
git merge --ff-only dev
git push origin main
```

`--ff-only`가 실패하면 `main`에 `dev`에 없는 커밋이 있다는 뜻이다. 이 경우 강제로 merge하지 말고 원인을 확인한 뒤 `dev`를 최신 `main` 위로 정리한다.

GitHub PR UI는 진짜 fast-forward merge 버튼을 제공하지 않는다. `dev` → `main` PR은 검토와 체크 확인 용도로 열고, 승인 후 로컬에서 `git merge --ff-only dev`로 반영하는 방식을 우선한다.

GitHub UI의 **Rebase and merge**는 선형 히스토리는 만들지만 커밋 SHA가 바뀌어 장기 유지되는 `dev`와 `main`의 관계가 흐려질 수 있다. `dev` → `main` 반영에는 기본값으로 쓰지 않는다.

## 금지하는 방식

- `main`에 직접 커밋
- `<area>/feature/*`, `<area>/fix/*`에서 `main`으로 직접 PR
- `<area>/feature/*`, `<area>/fix/*` → `dev` 일반 merge commit
- `dev` → `main` 일반 merge commit
- `feature`, `fix` 외 브랜치 타입 사용
- 이미 공유된 브랜치의 히스토리를 임의로 force push
- 작업이 끝난 임시 브랜치를 방치

## 예외

긴급 수정도 원칙적으로 `<area>/fix/*` 브랜치에서 시작한다.

```bash
git switch dev
git pull origin dev
git switch -c app/fix/login-token-refresh
```

수정 후 `<area>/fix/*` → `dev`는 squash merge하고, 검증이 끝나면 `dev` → `main`으로 fast-forward merge한다.

정말로 `main`에서 바로 hotfix를 시작해야 하는 경우에는 먼저 이유를 남기고, 반영 후 즉시 `dev`에도 같은 커밋이 포함되도록 정리한다. 이 예외는 배포 장애 수준의 문제에만 사용한다.

## PR 체크리스트

PR을 머지하기 전에 아래를 확인한다.

- base 브랜치가 맞는가? (`<area>/feature/*`, `<area>/fix/*` → `dev`, `dev` → `main`)
- 브랜치 이름이 `<area>/<type>/<work-name>` 형식인가?
- 브랜치 타입이 `feature` 또는 `fix`인가?
- squash 커밋 메시지만 봐도 작업 내용을 알 수 있는가?
- 관련 lint, typecheck, test를 통과했는가?
- 불필요한 파일 변경이 섞이지 않았는가?
- 머지 후 임시 브랜치를 삭제할 준비가 되었는가?

## GitHub 설정 권장

저장소 설정에서 가능하면 아래 정책을 켠다.

- `main`, `dev` branch protection 적용
- `*/feature/*`, `*/fix/*` → `dev`: squash merge만 허용
- `dev` → `main`: 로컬 fast-forward 반영 또는 fast-forward 전용 자동화 사용
- merge commit 비활성화
- PR 머지 후 head branch 자동 삭제
- status check 통과 전 머지 금지

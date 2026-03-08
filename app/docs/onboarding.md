## Overview

### 기술 스택 한눈에 보기

| 영역            | 기술                                                                              |
| --------------- | --------------------------------------------------------------------------------- |
| 아키텍처        | Feature-Sliced Design, Composition Pattern                                        |
| 데이터          | GraphQL, Apollo Client, gql.tada                                                  |
| 라우팅          | Expo Router                                                                       |
| 상태 관리       | Zustand                                                                           |
| 폼              | React Hook Form + Zod                                                             |
| 스타일링        | NativeWind, CVA                                                                   |
| 애니메이션 · UX | Reanimated, Bottom Sheet, gesture-handler, safe-area-context, keyboard-controller |
| 배포            | Hot Updater, EAS                                                                  |
| 개발 도구       | Storybook, i18next                                                                |
| 언어            | TypeScript (Strict Mode)                                                          |

### 문서 읽는 법

키워드는 네 가지 카테고리로 나뉘어 있으며, 각 카테고리 안에서는 위에서부터 중요한 순서로 나열되어 있습니다.

| 카테고리                         | 의미                                                                |
| -------------------------------- | ------------------------------------------------------------------- |
| **필수**                         | 코드베이스 전반에 쓰이는 핵심 기술. 작업 전 반드시 숙지.            |
| **권장**                         | 자주 마주치지만, 필요할 때 돌아와서 참고해도 무방.                  |
| **필수이나 나중에 봐도 되는 것** | 알아야 하지만 당장의 코딩 작업에는 영향이 적음. 여유가 생기면 학습. |
| **권장이나 나중에 봐도 되는 것** | 있으면 좋지만 우선순위가 낮음.                                      |

## 목차

- [필수](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [Feature-Sliced Design (FSD)](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [Composition Pattern (합성 패턴)](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [GraphQL](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [Apollo Client](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [gql.tada](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [Expo Router](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [Zustand](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [React Hook Form + Zod](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [NativeWind (TailwindCSS for RN)](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [TypeScript (Strict Mode)](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
- [권장](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [React Native Reanimated](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [Bottom Sheet (@gorhom/bottom-sheet)](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [react-native-gesture-handler](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [react-native-safe-area-context](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [react-native-keyboard-controller](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [CVA (Class Variance Authority)](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
- [필수이나 나중에 봐도 되는 것](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [Hot Updater (OTA 업데이트)](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [EAS (Expo Application Services)](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
- [권장이나 나중에 봐도 되는 것](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [Storybook](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)
  - [i18next](https://www.notion.so/31129d6fc06d807a99bfe23d70cd55dd?pvs=21)

---

## 필수

### Feature-Sliced Design (FSD)

- **핵심**: 프론트엔드 코드를 shared → entities → features → widgets → pages 레이어로 나누는 아키텍처. 상위 레이어만 하위를 import 가능.
- **우리 프로젝트**: `fsd/` 디렉토리가 이 구조. 새 코드는 모두 여기에. `features/`(레거시)에서 점진적 마이그레이션 중.
- **참고**:
  - FSD를 도입한 지 얼마 되지 않아 컨벤션이 아직 확실하게 확립되지 않은 상황입니다.
    여러 가지를 시도해보고 있고, 곳곳에 어긋나는 부분이 있을 수 있습니다.
    구조나 컨벤션에 대해서는 100% 열려 있으니, 더 좋은 방식이 있다면 언제든지 제안해 주세요.
    같이 고민하면서 작업해 나가면 좋겠습니다.
  - **Pages-First 접근법**을 선호하고 있습니다.
    Pages에서 화면 단위로 만들어 나가다가, 다른 화면에서 동일한 UI 블록이 포착되면
    그때 Widget으로 추출합니다. 미리 예측하기보다 필요할 때 분리하는 방식입니다.
  - 다만, 도메인 엔티티처럼 여러 화면에서 쓸 것이 확실한 것들은
    작업 전에 미리 Entities 레이어에 구성하기도 합니다.

### Composition Pattern (합성 패턴)

- **핵심**: 하나의 큰 컴포넌트 대신 작은 서브 컴포넌트(파트)를 조합하여 UI 구성. `<Select.Trigger>`, `<Select.Content>` 식의 Compound Component 패턴.
- **레퍼런스**: [shadcn/ui](https://ui.shadcn.com/), [Base UI](https://base-ui.com/), [Radix UI](https://www.radix-ui.com/) 등 모던 컴포넌트 라이브러리들이 공통적으로 채택하는 설계 방식.

### 뭉탱이를 유지할 때 vs. 쪼갤 때

컴포넌트 묶음(뭉탱이)이 여러 곳에서 항상 같은 조합으로 쓰인다면, 그 묶음이 최소 단위가 됩니다. props가 많아도 괜찮습니다.

**쪼개야 하는 신호:**

- **boolean flag로 UI를 가려야 할 때** — `showBadge={false}`, `hideFooter` 같은 props가 등장하면, 그 컴포넌트가 너무 많은 것을 품고 있다는 뜻입니다.
- **관련 없는 데이터를 주입해야 할 때** — 어떤 화면에서 특정 요소가 아예 무관한데도, 그 요소를 그리기 위한 데이터를 넘겨야 하는 상황. `badgeData={null}`처럼 "나는 이거 안 쓰는데 넘겨야 해"가 되면 결합이 잘못된 것입니다.
- **boolean 하나가 추가될 때마다 경우의 수가 배로 증가** — `isThread × isEditing × isDM` = 8가지 조합. 조건부 렌더링이 폭발적으로 복잡해집니다.

**원칙: 사용하는 곳에서 자기와 관련 없는 것을 다뤄야 한다면, 쪼갤 때입니다.**

### 예시: 뭉탱이 → boolean flag 문제 → 파트 분리

**Phase 1 — 뭉탱이가 최소 단위일 때 (문제 없음)**

여러 화면에서 동일하게 쓰이니 이대로 충분합니다:

```tsx
<UserCard
  name="홍길동"
  rank="상병"
  badgeLabel="우수 용사"
  onPress={handlePress}
/>
```

**Phase 2 — 균열 발생: 어떤 화면에서는 배지가 필요 없음**

배지가 관련 없는 화면에서도 `UserCard`가 배지를 품고 있으므로 가려야 합니다:

```tsx
// 이 화면에서 배지는 아예 무관한데, boolean flag로 숨겨야 함
<UserCard
  name="홍길동"
  rank="상병"
  showBadge={false} // 관련 없는 UI를 끄기 위한 flag
  badgeLabel="" // 관련 없는데 넘겨야 하는 데이터
  onPress={handlePress}
/>
```

boolean flag가 하나일 때는 참을 만하지만, `showSubtext`, `showAction`, `isCompact` 같은 flag가 쌓이면 경우의 수가 폭발합니다.

**Phase 3 — 파트로 분리: 필요한 것만 조립**

```tsx
// 배지가 필요한 화면
<UserCard.Root onPress={handlePress}>
  <UserCard.Info name="홍길동" rank="상병" />
  <UserCard.Badge label="우수 용사" />
</UserCard.Root>

// 배지가 필요 없는 화면 — 그냥 안 넣으면 됨
<UserCard.Root onPress={handlePress}>
  <UserCard.Info name="홍길동" rank="상병" />
</UserCard.Root>

// 다른 화면에서는 액션 버튼 추가 — 유연하게 조립
<UserCard.Root onPress={handlePress}>
  <UserCard.Info name="홍길동" rank="상병" />
  <UserCard.Badge label="우수 용사" />
  <UserCard.Action icon="chevron-right" />
</UserCard.Root>
```

관련 없는 화면에서 관련 없는 것을 다루지 않아도 됩니다. 필요한 파트만 조립합니다.

### Preset 패턴: 자주 쓰이는 조합을 다시 묶기

파트로 쪼갠 뒤, 매번 모든 파트를 일일이 조립하는 건 번거롭습니다. 자주 쓰이는 조합은 **Preset(프리셋)**으로 다시 묶어서 편의 컴포넌트로 제공할 수 있습니다:

```tsx
// Preset — 가장 흔한 조합을 묶은 편의 컴포넌트
function DefaultUserCard({ name, rank, badgeLabel, onPress }) {
  return (
    <UserCard.Root onPress={onPress}>
      <UserCard.Info name={name} rank={rank} />
      {badgeLabel != null && <UserCard.Badge label={badgeLabel} />}
    </UserCard.Root>
  );
}
```

사용하는 쪽의 관점:

```tsx
// 대부분의 화면 — Preset으로 간단하게
<DefaultUserCard name="홍길동" rank="상병" badgeLabel="우수 용사" onPress={handle} />

// 특수한 화면 — 파트 레벨로 내려가서 자유롭게 조립
<UserCard.Root onPress={handle}>
  <UserCard.Info name="홍길동" rank="상병" />
  <UserCard.Action icon="edit" onPress={handleEdit} />
</UserCard.Root>
```

**두 가지 레벨의 API를 제공하는 셈입니다:**

- **Preset** (높은 레벨): 빠르고 간편. 대부분의 케이스를 커버.
- **Parts** (낮은 레벨): 유연하고 자유로움. 특수 케이스에서 사용.

shadcn/ui가 이 방식을 그대로 따릅니다 — 각 컴포넌트는 파트로 쪼개져 있지만, 문서에는 가장 흔한 조합을 복사해서 쓸 수 있도록 제공합니다.

### GraphQL

- **핵심**: REST 대신 쿼리 언어로 API 호출. 필요한 필드만 요청, 타입 시스템 내장.
- **Query / Mutation**: Query는 데이터 조회, Mutation은 데이터 변경(생성/수정/삭제). 각각 REST의 GET과 POST/PUT/DELETE에 대응.
- **Variables**: 쿼리에 동적 값을 전달하는 매개변수. `$id: ID!`처럼 타입 + null 허용 여부와 함께 선언.
- **Fragment**: 재사용 가능한 필드 집합 정의. 여러 쿼리에서 동일한 필드 그룹을 공유할 때 `...FragmentName`으로 전개.
- **Field Selection**: 클라이언트가 필요한 필드만 선택적으로 요청. Over-fetching 방지. REST와의 핵심 차이.
- **Schema**: 서버가 제공하는 타입 정의(Type, Input, Enum 등). 어떤 쿼리를 보낼 수 있고 각 필드의 타입이 무엇인지 명세.
- **Operation Name**: 쿼리/뮤테이션의 이름(`query GetUser`의 `GetUser`). 디버깅, 로깅, 캐시 식별에 사용.

### Apollo Client

- **핵심**: GraphQL 클라이언트. 서버 데이터 fetch + 정규화된 캐시(Normalized Cache) + 상태 관리 역할. Link Chain으로 요청 파이프라인 구성.

**쿼리 / 뮤테이션**:

- **`useQuery`**: 컴포넌트에서 쿼리 실행. `{ loading, error, data, refetch }` 반환. 컴포넌트 마운트 시 자동 실행.
- **`useMutation`**: 뮤테이션 실행. `[mutationFn, { loading, error, data }]` 반환. 명시적 호출 시 실행.
- **`fetchPolicy`**: 캐시와 네트워크 사용 전략.
  - `cache-and-network` (기본): 캐시 먼저 표시, 백그라운드에서 네트워크 동기화.
  - `cache-first`: 캐시에 있으면 네트워크 요청 안 함. 자주 안 바뀌는 데이터에 사용.
  - `network-only`: 항상 네트워크 요청. 반드시 최신이어야 하는 데이터에 사용.
  - `no-cache`: 캐시 저장/읽기 없이 네트워크만. 부수효과 있는 요청(presigned URL 등)에 사용.
- **Link Chain**: 요청 파이프라인. 인증 헤더 주입, 에러 로깅, 토큰 갱신 등을 미들웨어 체인으로 구성.
- **`NetworkStatus`**: 쿼리의 네트워크 상태. `fetchMore`, `refetch` 등을 구분하여 UI 분기에 사용.

**정규화 캐시 (Normalized Cache)**:

- **정규화(Normalization)**: `__typename` + `id`로 엔티티를 고유 식별하여 평탄화 저장. 같은 엔티티를 참조하는 모든 쿼리가 자동 동기화.
- **`keyFields`**: 엔티티 식별 기준 커스터마이징. 기본은 `id`이나, 복합 키(`["id", "type"]`)나 식별자 없는 임베디드 타입(`keyFields: false`)도 설정 가능.
- **`typePolicies`**: 타입별 캐시 동작 설정. `keyFields`, 필드 병합 전략 등 정의.

**캐시 업데이트**:

- **`cache.evict`**: 캐시에서 특정 필드/엔티티 삭제. 스키마 필드 단위로 동작하여 해당 필드를 쓰는 모든 쿼리 무효화.
- **`cache.modify`**: 캐시의 특정 필드를 직접 수정. `readField`로 참조의 필드값을 읽어 필터링 등에 사용.
- **`cache.gc`**: 어디서도 참조되지 않는 고아 엔티티 정리. `cache.evict` 후 호출.
- **`optimisticResponse`**: 서버 응답 전에 정규화 캐시를 먼저 업데이트하여 즉시 UI 반영. 실패 시 자동 롤백. 좋아요, 북마크 등 toggle에 사용.
- **`refetchQueries`**: 뮤테이션 후 지정한 쿼리를 재실행. 캐시 수동 업데이트가 복잡할 때 사용.

**Mutation 캐시 전략**:

| Mutation   | 반환 필드       | 캐시 처리                                                    |
| ---------- | --------------- | ------------------------------------------------------------ |
| **CREATE** | `{ id }`        | `cache.evict` → 관련 쿼리 무효화, refetch                    |
| **DELETE** | `{ id }`        | `cache.modify` → 리스트에서 즉시 제거                        |
| **UPDATE** | Input 필드 전체 | 자동 — 정규화 캐시가 `__typename` + `id`로 매칭하여 업데이트 |

CREATE — `cache.evict`로 관련 쿼리 무효화:

```tsx
const [createSoldier] = useMutation(createSoldierMutation, {
  update(cache) {
    // 스키마 필드 단위로 무효화 — 이 필드를 쓰는 모든 쿼리에 적용
    // cache.updateQuery는 쿼리마다 개별 업데이트 필요 → 새 쿼리 추가 시 누락 위험
    cache.evict({ fieldName: 'getSoldierList' });
    cache.gc();
  },
});
```

DELETE — `cache.modify`로 리스트에서 즉시 제거:

```tsx
const [deleteSoldiers] = useMutation(deleteSoldierListMutation, {
  update(cache, { data }) {
    const deletedIds = data.deleteSoldierList.map((s) => s.id);
    cache.modify({
      fields: {
        getSoldierList(existing = [], { readField }) {
          return existing.filter(
            (ref) => !deletedIds.includes(Number(readField('id', ref))),
          );
        },
      },
    });
  },
});
```

UPDATE — 정규화 캐시 자동 반영:

```tsx
const [updateSoldier] = useMutation(updateSoldierMutation);
// update 함수 불필요 — __typename + id 매칭으로 캐시 자동 업데이트
// 단, 뮤테이션 응답에 Input의 모든 필드를 반환해야 함
```

optimisticResponse — 네트워크 응답 전 즉시 UI 반영 (토글/카운터):

```tsx
const [mutation] = useMutation(likeContentReplyMutation);
const likeContentReply = useCallback(() => {
  return mutation({
    variables: { contentReplyId: id },
    optimisticResponse: {
      likeContentReply: {
        __typename: 'ContentReply', // 정규화 매칭에 필수
        id, // 정규화 매칭에 필수
        isLike: true,
        likeCount: likeCount + 1,
      },
    },
  });
}, [likeCount, mutation, id]);
// 서버 응답 전에 정규화 캐시를 먼저 업데이트 → 즉시 UI 반영. 실패 시 자동 롤백.
// 좋아요, 북마크 등 toggle 동작에 사용하여 반응성 확보.
```

### gql.tada

- **핵심**: GraphQL 쿼리를 작성하면 TypeScript 타입이 자동 추론되는 라이브러리. 코드젠 없이 타입 안전한 GraphQL.
- **`graphql()`**: tagged template literal로 쿼리/뮤테이션/Fragment 정의. 작성 즉시 타입 추론. Fragment를 두 번째 인자로 전달하여 재사용.
- **`ResultOf<typeof query>`**: 쿼리 실행 결과의 TypeScript 타입을 추출.
- **`VariablesOf<typeof query>`**: 쿼리에 필요한 변수의 TypeScript 타입을 추출.
- **`FragmentOf<typeof fragment>`**: Fragment 데이터의 불투명(opaque) 타입. Fragment Masking이 적용되어 `readFragment` 전까지 내부 필드 접근 불가.
- **`readFragment(fragment, data)`**: `FragmentOf` 타입을 실제 데이터로 언마스킹. 컴포넌트 경계에서 호출.
- **Fragment Masking**: Fragment로 정의한 필드는 해당 Fragment를 `readFragment`로 풀기 전까지 접근 불가. 컴포넌트별 데이터 의존성을 명시적으로 관리.

### Expo Router

- **핵심**: 파일 시스템 기반 라우팅. Next.js의 App Router와 유사한 컨셉을 React Native에 적용.
- **우리 프로젝트**: `app/` 디렉토리에 인증 분기, 탭 네비게이션, 동적 라우트, 딥링크, 모달 등 다양한 기능 활용 중.

### 라우트 정의

- **File-based Routing**: `app/` 디렉토리의 파일 구조가 곧 라우트. `app/settings/profile.tsx` → `/settings/profile`.
- **Layout Routes (`_layout.tsx`)**: 같은 디렉토리의 하위 라우트들이 공유하는 레이아웃 정의. Stack/Tabs 네비게이션 구조, Provider 래핑, 인증 가드 등을 여기서 설정.
- **Route Groups (`()`)**: URL 경로에 영향 주지 않고 라우트를 논리적으로 그룹화. `(authenticated)/`, `(unauthenticated)/` 같은 인증 분기나, `(tabs)/` 같은 네비게이션 구분에 활용.
- **Dynamic Routes (`[param]`)**: `[id].tsx`, `soldiers/[id]/edit.tsx` 같은 동적 세그먼트. `useLocalSearchParams`로 파라미터 접근.
- **Catch-all Routes (`[...param]`)**: 가변 길이 경로 매칭. `food/choose-menu/[...code].tsx`처럼 여러 세그먼트를 배열로 받을 때 사용.
- **Unmatched Routes (`[...unmatched]`)**: 매칭되지 않는 모든 경로를 잡는 404 처리용 라우트.
- **우리 프로젝트**: Route Groups로 인증 상태별 라우트 분기, Dynamic Routes로 상세 화면 (`[id]`, `[surveyId]` 등), Catch-all로 다중 파라미터 처리, `[...unmatched]`로 커스텀 404 페이지 구현.

### 네비게이션

- **Stack**: 화면을 카드처럼 쌓는 네비게이션. `_layout.tsx`에서 `<Stack>` 선언, `<Stack.Screen>`으로 개별 화면 옵션 설정.
- **Tabs**: 하단 탭 바 네비게이션. `<Tabs>` 컴포넌트로 구성, `tabBarIcon`/`tabBarLabel`로 탭 UI 커스터마이징.
- **Screen Options**: 화면별 네비게이션 동작 제어.
  - `animation`: 전환 애니메이션 (`ios_from_right`, `slide_from_bottom` 등)
  - `presentation`: 화면 표시 방식 (`modal`, `card` 등)
  - `gestureEnabled`: 스와이프 뒤로가기 허용 여부
  - `headerShown`: 기본 헤더 표시 여부
- **Slot**: 레이아웃/네비게이션 없이 매칭된 자식 라우트만 렌더링. 루트 `_layout.tsx`에서 Provider만 감싸고 네비게이션 구조 없이 렌더링할 때 사용.
- **Link**: 선언적 네비게이션 컴포넌트. `<Link href="/path">` 또는 `<Link href={{ pathname: "/soldiers/[id]", params: { id } }}>`. `asChild` prop으로 자식 컴포넌트에 네비게이션 동작 위임.
- **Redirect**: 조건부 리다이렉트. 레이아웃에서 인증 가드, 온보딩 완료 여부 체크 등에 사용. 렌더링 시 즉시 해당 경로로 이동.
- **우리 프로젝트**: Stack 기반 메인 네비게이션, Tabs로 하단 탭 (동적 표시/숨김 포함), 모달·생성 화면에 `slide_from_bottom` 애니메이션, 결제·편지 등 이탈 방지가 필요한 화면에 `gestureEnabled: false`, 루트에 Slot, 인증/온보딩 가드에 Redirect 활용.

### 훅

- **useRouter**: 프로그래밍적 네비게이션. `push`(스택에 추가), `replace`(현재 화면 교체), `back`(뒤로가기), `navigate`(중복 방지 네비게이션) 메서드 제공.
- **useLocalSearchParams**: 현재 화면의 라우트 파라미터를 타입 안전하게 접근. `useLocalSearchParams<{ id: string }>()`. 부모 라우트의 파라미터는 포함하지 않음.
- **useGlobalSearchParams**: 라우트 트리 전체의 파라미터를 접근. `useLocalSearchParams`와 달리 부모·자식 라우트의 파라미터도 포함. 불필요한 리렌더링에 주의.
- **usePathname**: 현재 경로 문자열 반환 (`/settings/profile` 등). 조건부 로직이나 네비게이션 가드에서 현재 위치 확인 용도.
- **useSegments**: 현재 경로를 세그먼트 배열로 반환 (`["settings", "profile"]`). 인증 가드 등에서 현재 라우트 그룹 확인에 유용.
- **useFocusEffect**: 화면이 포커스될 때마다 실행되는 효과. `useEffect`와 달리 탭 전환이나 뒤로가기로 화면에 돌아올 때도 다시 실행됨. 데이터 리프레시에 활용.
- **우리 프로젝트**: `useRouter`의 `back()`을 가장 많이 사용, `useLocalSearchParams`로 타입 안전한 파라미터 접근, `usePathname`으로 인증/온보딩 가드의 경로 체크에 활용.

### 고급 기능

- **Deep Linking**: 외부 URL(`goondori://path`)로 앱의 특정 화면을 직접 열기. 푸시 알림 탭, 웹 링크에서 앱 열기 등에 필수. `app.config.js`의 `scheme` 설정으로 커스텀 URL scheme 등록.
- **unstable_settings**: 딥링크로 진입 시 네비게이션 스택의 앵커(루트) 화면을 지정. 예를 들어 `anchor: "(tabs)"`를 설정하면 딥링크로 상세 화면에 직접 들어와도 뒤로가기 시 탭 화면으로 돌아감.
- **Screen Listeners**: 네비게이션 이벤트에 사이드 이펙트 연결. `blur`(화면 떠날 때), `focus`(화면 진입 시), `tabPress`(탭 탭 시) 등. 키보드 dismiss, 리뷰 요청 등에 활용.
- **ErrorBoundary**: 라우트 레벨에서 에러를 잡아 fallback UI 표시. 특정 화면에서 발생한 에러가 전체 앱을 크래시시키지 않도록 격리. `_layout.tsx`에서 export 가능.
- **Typed Routes**: `experiments.typedRoutes`로 라우트 경로에 타입 체크 적용. `router.push("/존재하지않는경로")`를 컴파일 타임에 잡아줌.
- **우리 프로젝트**: 커스텀 URL scheme(`goondori://`)으로 딥링크 구현, `unstable_settings`로 4개 레이아웃에 앵커 설정, Screen Listeners로 키보드 dismiss·리뷰 프롬프트, 루트에 ErrorBoundary export.

### Zustand

- **핵심**: 가벼운 전역 상태 관리. `create()`로 스토어 생성, 컴포넌트에서 훅처럼 사용.
- **우리 프로젝트**:
  - **영속 스토어**: `persist` 미들웨어 + AsyncStorage로 앱 재시작 후에도 유지 (인증 토큰, 사용자 설정 등)
  - **메모리 스토어**: 영속화 없이 앱 세션 동안만 유지 (임시 UI 상태 등)
  - **Context + Store 패턴**: 특정 컴포넌트 트리 범위에서만 유효한 스토어를 Context로 주입. 글로벌이 아닌 스코프드 상태 관리에 활용.
- **상태 관리 방식 선택 기준**:
  새로운 상태가 필요할 때, 아래 질문을 순서대로 따라가면 적절한 방식을 선택할 수 있습니다.
  **Q1. 이 데이터가 렌더 사이클에 참여하는가?**
  - **No** → **AsyncStorage 단독 사용**. 화면에 표시되지 않고 단순히 저장/읽기만 하는 데이터라면 Zustand 없이 AsyncStorage만으로 충분합니다.
  - **Yes** → Q2로.
  **Q2. 상태의 범위는?**
  - **특정 컴포넌트 트리에 한정** → Q3으로.
  - **앱 전역에서 필요** → Q4로.
  **Q3. 값이 런타임에 변하고, consumer가 여럿인가?**
  - **Yes** → **Context + `createStore()`**. store instance를 Context에 넣으면 값 자체가 아닌 store 참조만 공유하므로 Context의 리렌더링 문제에서 자유롭습니다. consumer는 Zustand selector로 필요한 부분만 구독합니다. ([참고: TkDodo — Zustand and React Context](https://tkdodo.eu/blog/zustand-and-react-context))
  - **No (값이 고정적이거나 거의 변하지 않음)** → **plain Context**로 충분합니다. 값이 변하지 않으면 리렌더링 이슈 자체가 발생하지 않습니다.
  **Q4. 앱 재시작 후에도 유지되어야 하는가?**
  - **No** → **Global Memory Store** (`create()`). 앱 세션 동안만 유지.
  - **Yes** → **Global Persist Store** (`create()` + `persist()`). AsyncStorage 또는 SecureStore에 영속화. hydration 처리(`hasHydrated`, `onRehydrateStorage`)가 필요합니다.
- **코드 예시**:
  **영속 스토어** — 앱 재시작 후에도 유지되어야 하는 전역 데이터 (`features/auth/stores/auth-token-store.ts`):
  ```tsx
  export const useAuthTokenStore = create<State & Action>()(
    persist(
      (set) => ({
        accessToken: null,
        refreshToken: null,
        actions: {
          initializeSession: ({ accessToken, refreshToken }) => {
            /* JWT 디코드 후 set */
          },
          clearSession: () => set({ accessToken: null, refreshToken: null }),
        },
      }),
      {
        name: 'auth-token-store',
        storage: createJSONStorage(() => SecureStorage), // expo-secure-store 래핑
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        }),
      },
    ),
  );
  ```
  **메모리 스토어** — 앱 전역에서 필요하지만 재시작 시 초기화되어도 되는 데이터 (`stores/migration-state-store.ts`):
  ```tsx
  export const useMigrationStateStore = create<State & Action>()((set) => ({
    shouldMigrate: false,
    actions: { setShouldMigrate: (value) => set({ shouldMigrate: value }) },
  }));
  // persist 미들웨어 없음 → 앱 종료 시 초기화
  ```
  **Context + Store 패턴** — 특정 컴포넌트 트리 범위에서 값이 변하고 여러 consumer가 구독하는 상태 (`fsd/shared/model/prohibited-word-dialog-state-store-context.tsx`):
  ```tsx
  // 1. createStore()로 Zustand store 생성 (create가 아닌 createStore)
  const [store] = useState(() =>
    createStore<State & Action>((set) => ({
      isOpen: false,
      actions: { open: () => set({ isOpen: true }) },
    })),
  );

  // 2. Context로 주입
  <ProhibitedWordDialogStateStoreContext value={store}>
    {children}
  </ProhibitedWordDialogStateStoreContext>;

  // 3. 소비 훅으로 접근
  export const useIsOpen = () =>
    useProhibitedWordDialogStateStore((s) => s.isOpen);
  ```
- **왜 Context만으로는 부족한가?**:
  React Context는 value가 바뀌면 해당 Context의 **모든 consumer가 리렌더**됩니다. 특정 필드만 구독하는 selector가 없기 때문입니다. React 19(`use(context)`)에서도, React Compiler(자동 memoization)가 도입되더라도 이 근본 구조는 동일합니다. Compiler는 value prop 참조 안정화와 컴포넌트 렌더링 비용 최적화에는 도움이 되지만, "모든 consumer 리렌더" 문제 자체를 해결하지는 않습니다. 그래서 값이 자주 변하고 consumer가 여럿인 경우에는 Zustand store를 Context에 넣어 selector 기반 구독을 활용합니다.

### React Hook Form + Zod

- **핵심**: RHF는 비제어(uncontrolled) 방식 폼 관리(리렌더 최소화, 성능 우수), Zod는 스키마 기반 유효성 검증. `@hookform/resolvers`의 `zodResolver`로 둘을 연결하면 타입 안전한 폼 구현 가능.

**Zod**:

- **`z.object` / `z.array`**: 스키마의 기본 빌딩 블록. 객체와 배열 구조를 선언적으로 정의.
- **`z.enum` / `z.nativeEnum` / `z.literal`**: 열거형 값 검증. `nativeEnum`은 TypeScript enum을 그대로 사용 가능.
- **`z.discriminatedUnion`**: 특정 필드 값에 따라 서로 다른 스키마를 적용하는 조건부 검증. 예: 군인 종류(일반병/부사관/장교)에 따라 필수 필드가 달라지는 폼.
- **`refine` / `superRefine`**: 커스텀 검증. `refine`은 단순 boolean 체크, `superRefine`은 `ctx.addIssue()`로 여러 에러를 동시에 추가하거나 조건 분기 가능.
- **`transform`**: 검증 후 값을 변환. 입력값과 출력 타입이 다를 때 사용.
- **`z.infer<typeof schema>`**: 스키마에서 TypeScript 타입을 자동 추론. 스키마와 타입이 항상 동기화됨.

**React Hook Form**:

- **`useForm`**: 폼 인스턴스 생성. `resolver`에 `zodResolver(schema)`를 전달하여 Zod 연결. `defaultValues`로 초기값, `mode`로 검증 시점 설정.
- **`mode`** (`onSubmit` / `onBlur` / `onChange`): 검증이 **최초로** 트리거되는 시점. `onSubmit`(제출 시), `onBlur`(포커스 해제 시), `onChange`(입력마다). 성능과 UX 트레이드오프.
- **`reValidateMode`** (`onSubmit` / `onBlur` / `onChange`): 에러가 발생한 **이후** 재검증이 트리거되는 시점. 기본값은 `onChange`(에러 난 필드를 고치면 즉시 반영). `onSubmit`으로 바꾸면 제출 전까지 에러가 유지됨.
- **`FormProvider` / `useFormContext`**: React Context로 폼 상태를 하위 컴포넌트 트리에 공유. 폼을 여러 컴포넌트로 분리할 때 필수.
- **`Controller`**: RN의 TextInput처럼 `ref` 기반 등록이 안 되는 컴포넌트를 RHF에 연결하는 래퍼. React Native에서는 사실상 모든 필드에 사용.
- **`handleSubmit`**: 폼 제출 핸들러. 검증 통과 시에만 콜백 실행.
- **`watch`**: 특정 필드 값의 변화를 구독. 조건부 렌더링이나 필드 간 연동에 사용.
- **`trigger`**: 특정 필드만 수동으로 검증. 멀티스텝 폼에서 다음 단계 전 부분 검증에 유용.
- **`useFieldArray`**: 동적으로 추가/삭제되는 배열 필드 관리. `append`, `remove`, `fields` 등 제공.
- **`formState`**: `errors`, `isDirty`, `isValid`, `isSubmitting` 등 폼의 현재 상태를 담은 객체.

### NativeWind (TailwindCSS for RN)

- **핵심**: TailwindCSS의 유틸리티 클래스를 React Native에서 사용. `className="flex-1 bg-white p-4"` 식으로 스타일링. `StyleSheet.create()` 대신 사용.
- **유틸리티 퍼스트(Utility-First)**: 미리 정의된 작은 클래스(`flex`, `p-4`, `text-lg`)를 조합하여 스타일링. 별도 스타일 파일 없이 컴포넌트 안에서 완결.
- **디자인 토큰**: `tailwind.config`에서 색상, 폰트, 간격 등을 커스텀 정의. 프로젝트 전체의 디자인 일관성을 설정 파일 하나로 관리.
- **조건부 스타일링**: `clsx`(조건부 클래스 조합) + `tailwind-merge`(충돌 클래스 병합)를 결합한 `cn()` 유틸리티로 동적 스타일링 처리.
- **반응형 / 상태 기반**: `hover:`, `focus:`, `dark:` 등 접두사로 상태별 스타일 적용. `platform:` 접두사로 iOS/Android 분기.

### TypeScript (Strict Mode)

- **핵심**: 정적 타입 시스템. strict 모드에서는 `any` 사용 제한, null 체크 강제 등 더 엄격한 타입 검사.
- **`strict` 모드**: `strictNullChecks`(null/undefined 구분 강제), `noImplicitAny`(암묵적 any 금지), `strictFunctionTypes`(함수 파라미터 타입 엄격 검사) 등을 한꺼번에 활성화.
- **타입 추론(Type Inference)**: 변수, 함수 반환값 등에 타입을 명시하지 않아도 컴파일러가 자동 추론. 불필요한 타입 어노테이션을 줄여줌.
- **유니온 타입(Union Types)과 타입 가드(Type Guards)**: `string | null` 같은 유니온을 `if (value == null)` 같은 가드로 좁혀서 안전하게 사용.
- **제네릭(Generics)**: 타입을 매개변수화하여 재사용 가능한 함수/컴포넌트 작성. `useState<T>`, `useForm<T>` 등 React/RHF 훅에서 광범위하게 사용.
- **Path Alias**: `~/`로 프로젝트 루트 기준 import. 상대 경로(`../../`)의 깊은 중첩을 방지.

---

## 권장

### React Native Reanimated

- 네이티브 UI 스레드에서 동작하는 고성능 애니메이션 라이브러리.
- **핵심 개념**: `useSharedValue`(네이티브 스레드 공유 값), `useAnimatedStyle`(값 기반 스타일 자동 갱신), `withSpring`/`withTiming`(애니메이션 전환 함수).
- JS 스레드와 독립적으로 동작하므로 60fps 유지에 유리. 스크롤 연동 애니메이션, 제스처 기반 트랜지션 등에 사용.

### Bottom Sheet (@gorhom/bottom-sheet)

- 하단에서 올라오는 시트 UI. Reanimated + Gesture Handler 기반.
- **핵심 개념**: snap points(시트가 멈추는 높이 목록), `enableDynamicSizing`(콘텐츠 크기에 맞춤), `ref.present()`/`ref.dismiss()`로 제어.
- 선택 UI, 상세 정보, 액션 메뉴 등 모바일에서 모달 대안으로 광범위하게 사용.

### react-native-gesture-handler

- 네이티브 스레드에서 동작하는 제스처 시스템. RN 기본 터치보다 부드럽고 정확한 제스처 처리.
- **핵심 개념**: `Gesture.Pan()`/`Gesture.Pinch()`(제스처 정의), `GestureDetector`(제스처 부착), `GestureHandlerRootView`(앱 루트에서 필수 래핑).
- Bottom Sheet, Swipeable 리스트 등 제스처 기반 UI의 기반 라이브러리.

### react-native-safe-area-context

- 노치, 상태바, 홈 인디케이터 등 디바이스별 안전 영역(safe area) 처리.
- **핵심 개념**: `SafeAreaView`(자동 패딩 적용 뷰), `useSafeAreaInsets()`(각 방향 inset 값 직접 접근 — `top`, `bottom`, `left`, `right`).
- 거의 모든 화면 레이아웃의 기본. 풀스크린, 모달, 커스텀 헤더에서 필수.

### react-native-keyboard-controller

- 키보드 노출/숨김에 따른 레이아웃 조정을 네이티브 수준에서 제어.
- **핵심 개념**: `KeyboardProvider`(앱 루트 래핑), `KeyboardAwareScrollView`(키보드에 반응하는 스크롤 뷰), Reanimated 연동으로 키보드 높이에 맞춘 부드러운 애니메이션.
- RN 기본 `KeyboardAvoidingView`보다 정교하고 안정적. 폼 화면, 댓글 입력 등에 사용.

### CVA (Class Variance Authority)

- 컴포넌트 변형(variant)을 선언적으로 관리하는 패턴. NativeWind와 함께 사용.
- **핵심 개념**: `cva()`(기본 스타일 + variants/compoundVariants 정의), `VariantProps<typeof variants>`(variant props 타입 자동 추출), `defaultVariants`(기본값 지정).
- 버튼, 라디오, 배지 등 size/color/state 조합이 있는 UI 컴포넌트에 적용.

---

## 필수이나 나중에 봐도 되는 것

### Hot Updater (OTA 업데이트)

- 앱스토어/플레이스토어 심사 없이 JavaScript 번들을 즉시 업데이트하는 도구.
- **핵심 개념**: OTA(Over-The-Air) 업데이트, fingerprint 기반 버전 관리(변경분만 업데이트), 번들 압축 및 배포.
- Cloudflare R2(스토리지) + D1(데이터베이스) 기반. 긴급 버그픽스나 소규모 변경을 스토어 심사 없이 즉시 배포할 때 사용.

### EAS (Expo Application Services)

- Expo의 클라우드 빌드/배포 서비스.
- **핵심 개념**: 빌드 프로필(`eas.json`에서 development/preview/production 환경별 설정), 클라우드 빌드(로컬 환경 없이 iOS/Android 빌드), 앱스토어 자동 제출(`eas submit`).

---

## 권장이나 나중에 봐도 되는 것

### Storybook

- 컴포넌트를 앱과 분리하여 독립적으로 개발/테스트하는 도구.
- **핵심 개념**: Story(컴포넌트의 특정 상태를 표현하는 단위), Meta(컴포넌트 메타데이터 — title, decorators 등), Decorators(스토리를 감싸는 래퍼 — Provider, ScrollView 등).
- `cross-env STORYBOOK_ENABLED='true' expo start`로 실행.

### i18next

- 다국어 지원 라이브러리. 번역 키 기반으로 텍스트 렌더링.
- **핵심 개념**: `t()` 함수(번역 키 → 현재 언어 텍스트 변환), 보간(interpolation, `{{변수}}` 문법으로 동적 값 삽입), namespace(번역 파일 분리 단위).
- 17개 이상 언어 지원. `assets/locales/[lang]/translation.json`에 번역 파일, Google Sheets에서 동기화(`bun download:i18n`).

# 라우트 경로 설계 가이드

이 문서는 Expo Router 파일 기반 라우팅에서 경로를 설계할 때 따라야 할 원칙을 정의한다.

---

## 원칙

### 1. 최상위 경로는 도메인 이름

경로의 첫 번째 세그먼트는 해당 기능이 속하는 도메인(비즈니스 영역)을 나타낸다.

```
/store/...                # 스토어 도메인
/community/...            # 커뮤니티 도메인
/food/...                 # 식단표 도메인
/benefit/...              # 혜택 도메인
/more/...                 # 더보기 (설정, 프로필 등)
/cheer/...                # 응원 도메인
```

도메인 아래에 해당 도메인의 리소스와 플로우가 위치한다. 이를 통해 경로만 보고도 어떤 비즈니스 영역의 화면인지 파악할 수 있다.

---

### 2. 경로 세그먼트의 두 가지 유형

경로의 각 세그먼트는 **리소스**이거나 **플로우/액션**이다. 유형에 따라 네이밍 규칙이 다르다.

**리소스 세그먼트 — 명사를 사용한다:**

리소스는 "무엇"을 나타내므로 명사로 표현한다. 컬렉션은 복수형을 쓴다.

```
/store/products/[productId]              # 상품이라는 리소스
/store/orders/[orderId]/detail           # 주문의 상세 정보
/store/delivery-addresses                # 배송지 목록
/store/notifications/setting             # 알림 설정
```

**플로우/액션 세그먼트 — 역할이 명확하면 동사를 허용한다:**

플로우 단계나 액션 화면은 동사 또는 동사+명사로 표현할 수 있다.

```
/store/order-options/[id]/cancel/reason          # cancel은 플로우
/auth/reset-password/verify-email/send           # verify-email은 플로우
/more/.../withdraw/verify-password               # verify-password는 액션
/store/delivery-addresses/create                 # create는 액션
/store/delivery-addresses/[id]/edit              # edit은 액션
/store/delivery-addresses/search                 # search는 액션
/onboarding/select-locale                        # select는 액션
```

**나쁜 예 — 리소스를 동사로 표현:**

리소스 세그먼트에 동사를 쓰면 "무엇"이 아니라 "무엇을 하는가"가 되어 경로의 의미가 모호해진다.

```
/more/setting/manage-account             # "manage"는 동사 → account-management (명사화)
```

**동적 세그먼트 — 특정 리소스 식별:**

컬렉션 내 특정 리소스를 가리킬 때는 `[리소스명Id]` 형태의 동적 세그먼트를 사용한다.

```
/store/products/[productId]                     # 특정 상품
/store/orders/[orderId]/detail                  # 특정 주문의 상세
/store/order-options/[orderOptionId]/cancel/reason  # 특정 주문 옵션의 취소 사유
```

규칙:

- 컬렉션은 복수형 명사 (`products`, `orders`, `order-options`)
- 동적 세그먼트는 `[컬렉션단수형Id]` 패턴 (`[productId]`, `[orderId]`, `[orderOptionId]`)
- 컬렉션 바로 아래에 위치한다: `컬렉션/[id]`
- 동적 세그먼트 뒤에 해당 리소스의 하위 경로를 이어서 소속 관계를 표현한다

```
/store/orders                            # 주문 목록 (컬렉션)
/store/orders/[orderId]                  # 특정 주문 (리소스)
/store/orders/[orderId]/detail           # 특정 주문의 상세 (하위 뷰)
/store/orders/[orderId]/receipt          # 특정 주문의 영수증 (하위 뷰)
```

---

### 3. 네이밍 일관성

같은 역할의 화면은 앱 전체에서 같은 이름을 쓴다. 진입 맥락이 달라도 화면의 역할이 같으면 이름도 같아야 한다.

모바일 앱에서 라우트는 사용자에게 보이지 않는다. 라우트의 소비자는 개발자이며, 일관된 네이밍은 개발자에게 다음의 가치를 제공한다:

- **같은 화면인지 판단 가능** — `forgot-password-code`와 `verify-email/code`가 같은 화면인지 다른 화면인지, 이름이 다르면 알 수 없다. 같은 이름 = 같은 역할이라는 신뢰가 있어야 코드를 읽을 때 불필요한 확인 과정이 줄어든다.
- **검색과 유지보수** — 이메일 인증 코드 화면을 수정해야 할 때, 하나의 이름으로 관련 파일을 전부 찾을 수 있어야 한다. 이름이 제각각이면 누락이 생긴다.
- **커뮤니케이션** — "코드 입력 화면"이라고 했을 때 팀원 모두가 같은 것을 떠올릴 수 있어야 한다.

**좋은 예 — store의 cancel/return 플로우:**

```
/store/order-options/[id]/cancel/reason
/store/order-options/[id]/cancel/confirm
/store/order-options/[id]/cancel/complete

/store/order-options/[id]/return/reason
/store/order-options/[id]/return/confirm
/store/order-options/[id]/return/complete
```

cancel과 return은 다른 플로우지만, 동일한 역할의 단계는 같은 이름(`reason`, `confirm`, `complete`)을 쓴다.

**나쁜 예 — 같은 역할인데 다른 이름:**

| 경로                                     | 역할                  |
| ---------------------------------------- | --------------------- |
| `/auth/reset-password/verify-email/code` | 이메일 인증 코드 입력 |
| `/more/setting/.../forgot-password-code` | 이메일 인증 코드 입력 |

둘 다 "이메일로 받은 인증 코드를 입력하는 화면"인데, 하나는 `verify-email/code`, 다른 하나는 `forgot-password-code`다.

| 경로                                          | 역할          |
| --------------------------------------------- | ------------- |
| `/more/profile/personal-info/verify-password` | 비밀번호 확인 |
| `/more/setting/.../withdraw/confirm`          | 비밀번호 확인 |

둘 다 "어떤 작업을 수행하기 전에 비밀번호를 확인하는 화면"인데, 하나는 `verify-password`, 다른 하나는 `confirm`이다. 이름이 이렇게 다르면 같은 역할의 화면이라고 판단하기 어렵다.

**왜 이런 불일치가 생기는가:**

경로 이름은 **화면이 하는 일**을 표현해야 한다. **사용자가 어떻게 여기 왔는지**를 표현하면 안 된다.

"어떻게 왔는지"로 이름을 지으면, 같은 기능의 화면이 진입 경로마다 다른 이름을 갖게 된다. "이메일 인증 코드 입력"이라는 동일한 화면이:

- 비밀번호 재설정에서 오면 `forgot-password-code`
- 회원 탈퇴에서 오면 `withdraw-email-code`
- 이메일 변경에서 오면 `change-email-code`

"화면이 하는 일"로 이름을 지으면 진입 경로가 달라도 `verify-email/code`라는 하나의 이름으로 통일되고, 일관성이 자연스럽게 유지된다.

```
# 나쁜 예 — 사용자가 어떻게 왔는지를 이름에 포함
/reset-password/forgot-password-code        # "forgot-password"는 여기 온 이유이지 화면의 기능이 아님

# 좋은 예 — 화면이 하는 일을 표현
/reset-password/verify-email/code           # 이 화면의 기능: 이메일 인증 코드 입력
```

---

### 4. 의미적 소속

라우트 깊이 자체를 제한하지 않는다. 리소스 간 소속 관계가 명확하면 중첩이 깊어도 괜찮다.

모바일 앱에서 경로 깊이는 네비게이션 스택 깊이와 다르다. `/store/order-options/[id]/cancel/reason`이 5단계 깊이라고 해서 사용자가 5번 뒤로가기를 누르는 것이 아니다.

**깊지만 적절한 예:**

```
/store/order-options/[orderOptionId]/cancel/reason
```

`order-options`라는 리소스의 특정 항목(`[orderOptionId]`)에 대한 `cancel` 플로우의 `reason` 단계 — 각 세그먼트가 소속 관계를 나타낸다.

**깊이를 줄이기 위해 소속 관계를 깨면 안 된다:**

```
# 나쁜 예 — 깊이를 줄이려고 소속을 제거
/store/cancel-reason/[orderOptionId]

# 좋은 예 — 소속 관계 유지
/store/order-options/[orderOptionId]/cancel/reason
```

---

### 5. 리소스 경로 vs 맥락 종속 경로

여러 곳에서 접근 가능한 화면을 설계할 때, 먼저 그 화면이 **리소스를 다루는 것인지**, **맥락에 종속된 동작인지**를 판단한다.

**리소스 경로 — 하나만 존재하면 된다:**

화면이 특정 리소스 자체를 다루고, 어디서 접근하든 보여주는 내용과 동작이 동일하면 경로를 하나만 둔다. 여러 화면에서 이 경로로 네비게이션하면 된다.

```
/store/orders/[orderId]/detail
```

주문 상세는 장바구니에서 접근하든, 마이페이지에서 접근하든, 알림에서 접근하든 항상 같은 주문 정보를 보여준다. 접근 경로가 여럿이라고 해서 경로를 복제할 이유가 없다.

```
# 나쁜 예 — 접근 경로마다 복제
/store/cart/orders/[orderId]/detail
/store/my-page/orders/[orderId]/detail
/store/notifications/orders/[orderId]/detail

# 좋은 예 — 리소스 경로 하나
/store/orders/[orderId]/detail
```

**맥락 종속 경로 — 분리가 필요할 수 있다:**

화면의 UI는 비슷하지만, 맥락에 따라 다음 중 하나라도 달라지면 맥락별로 경로를 분리하는 것이 적절하다:

1. **후속 동작이 다르다** — 같은 "비밀번호 확인" 화면이지만, 내 정보 경유 시에는 개인정보 조회로, 계정 관리 경유 시에는 비밀번호 재설정으로 이동해야 한다.
2. **권한 범위가 다르다** — 같은 "이메일 인증 코드 입력" 화면이지만, 백엔드에서 발급하는 코드가 맥락별로 다른 권한을 가질 수 있다.
3. **표시 데이터가 다르다** — 같은 역할의 화면이지만 맥락에 따라 표시하는 데이터나 UI가 달라진다.

```
# 맥락 종속 — 분리가 적절한 경우
/more/profile/personal-info/verify-password    # 확인 후 → 개인정보 조회
/more/setting/.../withdraw/verify-password     # 확인 후 → 회원 탈퇴 실행
```

두 화면 모두 "비밀번호 확인"이라는 같은 역할이므로 이름은 `verify-password`로 통일한다 (원칙 3). 맥락에 따라 후속 동작이 다르기 때문에 경로는 분리한다.

**판단 기준 — 분리 vs 중앙화:**

| 질문                                               | 답변 | 결론                    |
| -------------------------------------------------- | ---- | ----------------------- |
| 어디서 접근하든 동일한 리소스를 동일하게 다루는가? | 예   | 경로 하나 (리소스 경로) |
| 후속 동작이나 권한 범위가 맥락마다 다른가?         | 예   | 맥락별 분리             |

---

## 새 경로를 설계할 때

1. **도메인 결정** — 이 화면이 속하는 도메인을 정한다 (원칙 1). 기존 도메인에 속하는지, 새 도메인이 필요한지 판단한다.

2. **기존 경로 확인** — 같은 역할의 화면이 이미 존재하는지 확인한다. 존재하면 그 경로로 네비게이션하는 것으로 충분한지, 아니면 맥락 종속으로 분리해야 하는지 판단한다 (원칙 5).

3. **세그먼트 구성** — 각 세그먼트가 리소스인지 플로우/액션인지 구분한다 (원칙 2). 리소스는 명사, 플로우/액션은 역할이 명확한 이름을 쓴다.

4. **이름 결정** — 기존 경로에서 같은 역할의 화면이 어떤 이름을 쓰는지 확인하고, 같은 이름을 사용한다 (원칙 3). 이름은 화면이 하는 일을 표현하고, 사용자가 어떻게 왔는지를 표현하지 않는다.

5. **소속 관계 확인** — 각 세그먼트가 상위 세그먼트와 소속 관계를 나타내는지 확인한다 (원칙 4).

---

## 설계/리뷰 체크리스트

새 경로를 설계하거나 기존 경로를 리뷰할 때 다음을 확인한다.

### 네이밍

- [ ] 최상위 경로가 도메인 이름인가?
- [ ] 리소스 세그먼트가 명사로 되어 있는가? (동사는 플로우/액션 세그먼트에서만 사용)
- [ ] 같은 역할의 화면이 앱 다른 곳에 다른 이름으로 존재하지 않는가?
- [ ] 경로 이름이 화면의 기능을 표현하는가? (사용자가 어떻게 왔는지가 아님)
- [ ] 기존 경로에서 같은 역할의 화면이 어떤 이름을 쓰고 있는지 확인했는가?
- [ ] kebab-case, 소문자를 사용했는가?
- [ ] 컬렉션 리소스는 복수형인가? (예: `products`, `orders`)

### 구조

- [ ] 컬렉션은 복수형, 동적 세그먼트는 `[컬렉션단수형Id]` 패턴인가?
- [ ] 각 세그먼트가 소속 관계를 나타내는가?
- [ ] 맥락 차이 없이 동일한 화면이 불필요하게 복제되어 있지 않은가?
- [ ] 멀티 스텝 플로우가 하나의 상위 경로 아래 그룹되어 있는가?

### 일관성

- [ ] 유사한 기존 플로우와 step 패턴이 동일한가? (예: reason → confirm → complete)
- [ ] 기존 경로와 네이밍 컨벤션이 충돌하지 않는가?

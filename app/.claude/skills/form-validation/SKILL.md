---
name: form-validation
description: Use when implementing forms, input validation, or multi-step forms. Triggers on "폼", "form", "유효성 검증", "validation", "Zod schema", or when working with user input fields.
---

# React Hook Form + Zod

## Overview

Zod로 스키마를 먼저 정의하고, RHF의 `zodResolver`로 연결한다. React Native에서는 `Controller`를 통해 모든 필드를 연결한다.

## 기본 패턴

```tsx
// 1. Zod 스키마 정의
const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  rank: z.nativeEnum(Rank),
});
type FormData = z.infer<typeof schema>;

// 2. useForm + zodResolver
const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', rank: Rank.PRIVATE },
});

// 3. Controller로 RN 컴포넌트 연결
<Controller
  control={control}
  name="name"
  render={({ field: { onChange, value }, fieldError }) => (
    <TextInput value={value} onChangeText={onChange} />
  )}
/>
```

## 검증 시점 선택

| mode | 최초 검증 시점 | 용도 |
|------|--------------|------|
| `onSubmit` | 제출 시 | 기본값, 대부분의 폼 |
| `onBlur` | 포커스 해제 시 | 즉각 피드백 필요할 때 |
| `onChange` | 입력마다 | 실시간 검증 (성능 주의) |

`reValidateMode`는 기본 `onChange` 유지 — 에러 수정 시 즉시 반영.

## 고급 패턴

**조건부 스키마** — `discriminatedUnion`:
```tsx
const schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('soldier'), serviceNumber: z.string() }),
  z.object({ type: z.literal('officer'), commission: z.string() }),
]);
```

**멀티스텝 폼** — `trigger`로 부분 검증:
```tsx
const goNext = async () => {
  const valid = await trigger(['name', 'rank']); // step 1 필드만
  if (valid) setStep(2);
};
```

**동적 배열** — `useFieldArray`:
```tsx
const { fields, append, remove } = useFieldArray({ control, name: 'items' });
```

**폼 분리** — `FormProvider` + `useFormContext`:
```tsx
<FormProvider {...methods}>
  <StepOne />   {/* useFormContext()로 접근 */}
  <StepTwo />
</FormProvider>
```

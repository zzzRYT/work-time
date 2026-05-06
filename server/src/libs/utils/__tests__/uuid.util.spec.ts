import { generateUuidV7 } from '../uuid.util';

describe('generateUuidV7', () => {
  it('형식이 유효한 UUID 문자열을 반환한다', () => {
    const id = generateUuidV7();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('연속 호출 시 시간 순서가 보장된다(문자열 비교)', () => {
    const a = generateUuidV7();
    const b = generateUuidV7();
    expect(b >= a).toBe(true);
  });
});

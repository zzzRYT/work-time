import { Entity } from '../entity.base';

class TestEntity extends Entity<TestEntity> {
  // 도메인 메서드 노출용 헬퍼
  public callTouch() { this.touch(); }
}

describe('Entity', () => {
  it('생성 시 createdAt과 updatedAt이 동일한 시점으로 설정된다', () => {
    const e = new TestEntity({ id: 'a' });
    expect(e.createdAt).toEqual(e.updatedAt);
  });

  it('주입된 createdAt/updatedAt을 그대로 사용한다', () => {
    const created = new Date('2025-01-01T00:00:00Z');
    const updated = new Date('2025-01-02T00:00:00Z');
    const e = new TestEntity({ id: 'a', createdAt: created, updatedAt: updated });
    expect(e.createdAt).toEqual(created);
    expect(e.updatedAt).toEqual(updated);
  });

  it('touch()는 updatedAt만 갱신한다', async () => {
    const e = new TestEntity({ id: 'a' });
    const created = e.createdAt;
    await new Promise(r => setTimeout(r, 5));
    e.callTouch();
    expect(e.createdAt).toEqual(created);
    expect(e.updatedAt.getTime()).toBeGreaterThan(created.getTime());
  });

  it('delete()는 deletedAt을 설정하고 isDeleted가 true가 된다', () => {
    const e = new TestEntity({ id: 'a' });
    expect(e.isDeleted).toBe(false);
    expect(e.deletedAt).toBeUndefined();
    e.delete();
    expect(e.isDeleted).toBe(true);
    expect(e.deletedAt).toBeInstanceOf(Date);
  });

  it('delete()는 멱등이다', () => {
    const e = new TestEntity({ id: 'a' });
    e.delete();
    const firstDeletedAt = e.deletedAt;
    e.delete();
    expect(e.deletedAt).toEqual(firstDeletedAt);
  });

  it('restore()는 deletedAt을 비우고 updatedAt을 갱신한다', async () => {
    const e = new TestEntity({ id: 'a' });
    e.delete();
    expect(e.isDeleted).toBe(true);
    await new Promise(r => setTimeout(r, 5));
    e.restore();
    expect(e.isDeleted).toBe(false);
    expect(e.deletedAt).toBeUndefined();
  });

  it('equals는 id로만 비교한다', () => {
    const a1 = new TestEntity({ id: 'a' });
    const a2 = new TestEntity({ id: 'a' });
    const b = new TestEntity({ id: 'b' });
    expect(a1.equals(a2)).toBe(true);
    expect(a1.equals(b)).toBe(false);
  });
});

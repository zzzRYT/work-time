import { AggregateRoot } from '../aggregate-root.base';
import { DomainEvent } from '../domain-event.base';

class FooCreated implements DomainEvent {
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string) {}
}

class FooAggregate extends AggregateRoot<FooAggregate> {
  emitCreated() { this.addEvent(new FooCreated(this.id)); }
}

describe('AggregateRoot', () => {
  it('초기 domainEvents는 빈 배열', () => {
    const a = new FooAggregate({ id: 'a' });
    expect(a.domainEvents).toEqual([]);
  });

  it('addEvent로 이벤트가 누적된다', () => {
    const a = new FooAggregate({ id: 'a' });
    a.emitCreated();
    expect(a.domainEvents).toHaveLength(1);
    expect(a.domainEvents[0]).toBeInstanceOf(FooCreated);
  });

  it('domainEvents getter는 외부 변형으로부터 보호된다(복사본 반환)', () => {
    const a = new FooAggregate({ id: 'a' });
    a.emitCreated();
    a.domainEvents.pop();
    expect(a.domainEvents).toHaveLength(1);
  });

  it('clearEvents는 큐를 비운다', () => {
    const a = new FooAggregate({ id: 'a' });
    a.emitCreated();
    a.clearEvents();
    expect(a.domainEvents).toEqual([]);
  });
});

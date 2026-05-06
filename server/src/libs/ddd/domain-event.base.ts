export interface DomainEvent {
  readonly aggregateId: string;
  readonly occurredAt: Date;
}

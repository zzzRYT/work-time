import { AggregateRoot } from './aggregate-root.base';

export abstract class RepositoryPort<T extends AggregateRoot<unknown>> {
  abstract findById(id: string): Promise<T | null>;

  abstract findByIdOrThrow(id: string): Promise<T>;

  abstract save(entity: T): Promise<void>;

  abstract findWithDeleted(filter: Record<string, unknown>): Promise<T | null>;

  abstract hardDelete(entity: T): Promise<void>;
}

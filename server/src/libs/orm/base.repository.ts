import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { AggregateRoot } from '~/libs/ddd/aggregate-root.base';
import { IMapper } from '~/libs/ddd/mapper.interface';
import { RepositoryPort } from '~/libs/ddd/repository.port';
import { NotFoundException } from '~/libs/exceptions/not-found.exception';
import { OrmEntityBase } from './orm-entity.base';

export abstract class BaseRepository<
  TDomain extends AggregateRoot<unknown>,
  TOrm extends OrmEntityBase,
> extends RepositoryPort<TDomain> {
  constructor(
    protected readonly repo: EntityRepository<TOrm>,
    protected readonly mapper: IMapper<TDomain, TOrm, unknown>,
    protected readonly em: EntityManager,
  ) {
    super();
  }

  async findById(id: string): Promise<TDomain | null> {
    const orm = await this.repo.findOne({ id } as FilterQuery<TOrm>);
    return orm ? this.mapper.toDomain(orm) : null;
  }

  async findByIdOrThrow(id: string): Promise<TDomain> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(this.entityName, id);
    }
    return entity;
  }

  async save(entity: TDomain): Promise<void> {
    const orm = this.mapper.toOrm(entity);
    await this.em.upsert(orm);
  }

  async findWithDeleted(filter: Record<string, unknown>): Promise<TDomain | null> {
    const orm = await this.repo.findOne(filter as FilterQuery<TOrm>, {
      filters: { notDeleted: false },
    });
    return orm ? this.mapper.toDomain(orm) : null;
  }

  async hardDelete(entity: TDomain): Promise<void> {
    const orm = await this.repo.findOneOrFail(
      { id: entity.id } as FilterQuery<TOrm>,
      { filters: { notDeleted: false } },
    );
    await this.em.removeAndFlush(orm);
  }

  protected get entityName(): string {
    return this.constructor.name.replace(/Repository$/, '');
  }
}

export interface IMapper<DomainEntity, OrmEntity, GraphQLModel = never> {
  toDomain(orm: OrmEntity): DomainEntity;

  toOrm(domain: DomainEntity): OrmEntity;

  toGraphQL?(domain: DomainEntity): GraphQLModel;
}

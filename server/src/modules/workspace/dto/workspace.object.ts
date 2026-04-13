import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: '워크스페이스' })
export class Workspace {
  @Field(() => ID)
  id!: string;

  @Field({ description: '워크스페이스 이름' })
  name!: string;

  @Field({ description: '워크스페이스 슬러그' })
  slug!: string;

  @Field({ description: '소유자 ID' })
  ownerId!: string;

  @Field(() => String, { description: '생성일' })
  createdAt!: Date;
}

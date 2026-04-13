import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: '초대 링크' })
export class Invite {
  @Field(() => ID)
  id!: string;

  @Field({ description: '워크스페이스 ID' })
  workspaceId!: string;

  @Field({ description: '초대 토큰' })
  token!: string;

  @Field({ description: '생성자 ID' })
  createdBy!: string;

  @Field(() => String, { nullable: true, description: '만료일' })
  expiresAt!: Date | null;

  @Field(() => String, { description: '생성일' })
  createdAt!: Date;
}

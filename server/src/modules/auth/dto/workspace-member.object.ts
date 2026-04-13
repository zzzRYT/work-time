import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: '워크스페이스 멤버십' })
export class WorkspaceMemberObject {
  @Field(() => ID)
  id!: string;

  @Field({ description: '워크스페이스 ID' })
  workspaceId!: string;

  @Field({ description: '사용자 ID' })
  userId!: string;

  @Field({ description: '멤버 ID' })
  memberId!: string;

  @Field({ description: '역할 (OWNER 또는 MEMBER)' })
  role!: string;

  @Field(() => String, { description: '가입일' })
  joinedAt!: Date;
}

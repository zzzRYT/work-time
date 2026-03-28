import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: '사용자' })
export class User {
  @Field(() => ID)
  id!: string;

  @Field({ description: '이메일' })
  email!: string;

  @Field({ description: '이름' })
  name!: string;

  @Field(() => String, { nullable: true, description: '프로필 이미지 URL' })
  avatarUrl!: string | null;

  @Field({ description: '인증 제공자' })
  provider!: string;

  @Field(() => String, { description: '가입일' })
  createdAt!: Date;
}

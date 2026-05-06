import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthUserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;
}

import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from '~/libs/auth/auth.port';
import { CurrentUser } from '~/features/auth/graphql/decorators/current-user.decorator';
import { JwtAuthGuard } from '~/features/auth/infrastructure/jwt-auth.guard';
import { AuthUserModel } from '~/features/auth/graphql/schemas/models/auth-user.model';

@Resolver(() => AuthUserModel)
export class AuthQueriesResolver {
  @Query(() => AuthUserModel)
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthUser): AuthUserModel {
    return { id: user.id, email: user.email };
  }
}

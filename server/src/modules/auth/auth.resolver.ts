import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { UserEntity } from '../../entities/user.entity';
import type { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { User } from './dto/user.object';
import { WorkspaceMemberObject } from './dto/workspace-member.object';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => User, { description: '현재 로그인한 사용자 정보' })
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: UserEntity): Promise<UserEntity> {
    return user;
  }

  @Query(() => [WorkspaceMemberObject], {
    description: '내가 속한 워크스페이스 목록',
  })
  @UseGuards(AuthGuard)
  async myWorkspaces(
    @CurrentUser() user: UserEntity,
  ): Promise<WorkspaceMemberEntity[]> {
    return this.authService.getUserWorkspaces(user.id);
  }
}

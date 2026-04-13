import { Resolver, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import type { UserEntity } from '../../entities/user.entity';
import type { InviteEntity } from '../../entities/invite.entity';
import type { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { Invite } from './dto/invite.object';
import { WorkspaceMemberObject } from '../auth/dto/workspace-member.object';
import { AuthGuard } from '../auth/auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { CurrentWorkspaceRole } from '../auth/decorators/current-workspace-role.decorator';
import { InviteService } from './invite.service';

@Resolver()
export class InviteResolver {
  constructor(private readonly inviteService: InviteService) {}

  @Mutation(() => Invite, { description: '초대 링크 생성 (OWNER만 가능)' })
  @UseGuards(WorkspaceGuard)
  async createInvite(
    @Args('expiresInHours', { type: () => Int, nullable: true })
    expiresInHours: number | undefined,
    @CurrentUser() user: UserEntity,
    @CurrentWorkspace() workspaceId: string,
    @CurrentWorkspaceRole() role: string,
  ): Promise<InviteEntity> {
    if (role !== 'OWNER') {
      throw new ForbiddenException('Only workspace owners can create invites');
    }

    return this.inviteService.createInvite(
      workspaceId,
      user.id,
      expiresInHours,
    );
  }

  @Mutation(() => WorkspaceMemberObject, {
    description: '초대 토큰으로 워크스페이스 참가',
  })
  @UseGuards(AuthGuard)
  async joinWorkspace(
    @Args('token') token: string,
    @CurrentUser() user: UserEntity,
  ): Promise<WorkspaceMemberEntity> {
    return this.inviteService.joinByInvite(token, user.id, user.name);
  }
}

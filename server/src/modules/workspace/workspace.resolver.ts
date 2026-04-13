import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { UserEntity } from '../../entities/user.entity';
import type { WorkspaceEntity } from '../../entities/workspace.entity';
import type { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { Workspace } from './dto/workspace.object';
import { WorkspaceMemberObject } from '../auth/dto/workspace-member.object';
import { AuthGuard } from '../auth/auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { WorkspaceService } from './workspace.service';

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Mutation(() => Workspace, { description: '새 워크스페이스 생성' })
  @UseGuards(AuthGuard)
  async createWorkspace(
    @Args('name') name: string,
    @CurrentUser() user: UserEntity,
  ): Promise<WorkspaceEntity> {
    return this.workspaceService.createWorkspace(user.id, user.name, name);
  }

  @Query(() => Workspace, { description: '현재 워크스페이스 정보' })
  @UseGuards(WorkspaceGuard)
  async workspace(
    @CurrentWorkspace() workspaceId: string,
  ): Promise<WorkspaceEntity> {
    return this.workspaceService.getWorkspace(workspaceId);
  }

  @Query(() => [WorkspaceMemberObject], {
    description: '워크스페이스 멤버 목록',
  })
  @UseGuards(WorkspaceGuard)
  async workspaceMembers(
    @CurrentWorkspace() workspaceId: string,
  ): Promise<WorkspaceMemberEntity[]> {
    return this.workspaceService.getMembers(workspaceId);
  }
}

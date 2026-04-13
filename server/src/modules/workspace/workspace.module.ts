import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceEntity } from '../../entities/workspace.entity';
import { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { MemberEntity } from '../../entities/member.entity';
import { SettingsEntity } from '../../entities/settings.entity';
import { UserEntity } from '../../entities/user.entity';
import { WorkspaceService } from './workspace.service';
import { WorkspaceResolver } from './workspace.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspaceEntity,
      WorkspaceMemberEntity,
      MemberEntity,
      SettingsEntity,
      UserEntity,
    ]),
  ],
  providers: [WorkspaceService, WorkspaceResolver],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}

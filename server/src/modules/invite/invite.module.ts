import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteEntity } from '../../entities/invite.entity';
import { WorkspaceEntity } from '../../entities/workspace.entity';
import { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { MemberEntity } from '../../entities/member.entity';
import { UserEntity } from '../../entities/user.entity';
import { InviteService } from './invite.service';
import { InviteResolver } from './invite.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InviteEntity,
      WorkspaceEntity,
      WorkspaceMemberEntity,
      MemberEntity,
      UserEntity,
    ]),
  ],
  providers: [InviteService, InviteResolver],
  exports: [InviteService],
})
export class InviteModule {}

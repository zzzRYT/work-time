import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entities/user.entity';
import { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { AuthGuard } from './auth.guard';
import { WorkspaceGuard } from './workspace.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, WorkspaceMemberEntity])],
  providers: [AuthService, AuthResolver, AuthGuard, WorkspaceGuard],
  exports: [AuthService],
})
export class AuthModule {}

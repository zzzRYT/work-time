import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import { UserEntity } from '../../entities/user.entity';
import { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';

@Injectable()
export class AuthService {
  private readonly supabase;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly workspaceMemberRepo: Repository<WorkspaceMemberEntity>,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || '',
    );
  }

  async validateSupabaseToken(
    token: string,
  ): Promise<{
    id: string;
    email: string;
    user_metadata: any;
    app_metadata: any;
  }> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return {
      id: user.id,
      email: user.email ?? '',
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
    };
  }

  async getOrCreateUser(supabaseUser: {
    id: string;
    email: string;
    user_metadata: any;
    app_metadata: any;
  }): Promise<UserEntity> {
    let user = await this.userRepo.findOne({ where: { id: supabaseUser.id } });

    if (!user) {
      const name =
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        supabaseUser.email.split('@')[0];

      user = this.userRepo.create({
        id: supabaseUser.id,
        email: supabaseUser.email,
        name,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        provider: supabaseUser.app_metadata?.provider || 'email',
      });

      user = await this.userRepo.save(user);
    }

    return user;
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceMemberEntity[]> {
    return this.workspaceMemberRepo.find({
      where: { userId },
      relations: ['workspace'],
    });
  }

  async getWorkspaceMembership(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMemberEntity | null> {
    return this.workspaceMemberRepo.findOne({
      where: { userId, workspaceId },
    });
  }
}

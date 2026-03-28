import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { InviteEntity } from '../../entities/invite.entity';
import { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { MemberEntity } from '../../entities/member.entity';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(InviteEntity)
    private readonly inviteRepo: Repository<InviteEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly workspaceMemberRepo: Repository<WorkspaceMemberEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createInvite(
    workspaceId: string,
    createdBy: string,
    expiresInHours?: number,
  ): Promise<InviteEntity> {
    const token = randomBytes(32).toString('hex');

    const invite = this.inviteRepo.create({
      workspaceId,
      token,
      createdBy,
      expiresAt: expiresInHours
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
        : null,
    });

    return this.inviteRepo.save(invite);
  }

  async joinByInvite(
    token: string,
    userId: string,
    userName: string,
  ): Promise<WorkspaceMemberEntity> {
    const invite = await this.inviteRepo.findOne({ where: { token } });

    if (!invite) {
      throw new BadRequestException('Invalid invite token');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired');
    }

    const existing = await this.workspaceMemberRepo.findOne({
      where: { workspaceId: invite.workspaceId, userId },
    });

    if (existing) {
      throw new ConflictException('Already a member of this workspace');
    }

    const randomColor =
      '#' +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0');

    return this.dataSource.transaction(async (manager) => {
      const member = manager.create(MemberEntity, {
        name: userName,
        displayName: userName,
        color: randomColor,
        role: 'MEMBER',
        workspaceId: invite.workspaceId,
      });
      await manager.save(member);

      const workspaceMember = manager.create(WorkspaceMemberEntity, {
        workspaceId: invite.workspaceId,
        userId,
        memberId: member.id,
        role: 'MEMBER',
        invitedBy: invite.createdBy,
      });
      await manager.save(workspaceMember);

      return workspaceMember;
    });
  }
}

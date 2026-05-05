import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WorkspaceEntity } from '../../entities/workspace.entity';
import { WorkspaceMemberEntity } from '../../entities/workspace-member.entity';
import { MemberEntity } from '../../entities/member.entity';
import { SettingsEntity } from '../../entities/settings.entity';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepo: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly workspaceMemberRepo: Repository<WorkspaceMemberEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(SettingsEntity)
    private readonly settingsRepo: Repository<SettingsEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createWorkspace(
    userId: string,
    userName: string,
    name: string,
  ): Promise<WorkspaceEntity> {
    const slug =
      name.toLowerCase().replace(/\s+/g, '-') +
      '-' +
      Math.random().toString(36).substring(2, 6);

    const randomColor =
      '#' +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0');

    return this.dataSource.transaction(async (manager) => {
      const workspace = manager.create(WorkspaceEntity, {
        name,
        slug,
        ownerId: userId,
      });
      await manager.save(workspace);

      const settings = manager.create(SettingsEntity, {
        workspaceId: workspace.id,
      });
      await manager.save(settings);

      const member = manager.create(MemberEntity, {
        name: userName,
        displayName: userName,
        color: randomColor,
        role: 'ADMIN',
        workspaceId: workspace.id,
      });
      await manager.save(member);

      const workspaceMember = manager.create(WorkspaceMemberEntity, {
        workspaceId: workspace.id,
        userId,
        memberId: member.id,
        role: 'OWNER',
      });
      await manager.save(workspaceMember);

      return workspace;
    });
  }

  async getWorkspace(workspaceId: string): Promise<WorkspaceEntity> {
    return this.workspaceRepo.findOneOrFail({ where: { id: workspaceId } });
  }

  async getMembers(workspaceId: string): Promise<WorkspaceMemberEntity[]> {
    return this.workspaceMemberRepo.find({
      where: { workspaceId },
      relations: ['user'],
    });
  }
}

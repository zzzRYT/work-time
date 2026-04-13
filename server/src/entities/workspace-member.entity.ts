import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { WorkspaceEntity } from './workspace.entity';
import { MemberEntity } from './member.entity';

@Entity('workspace_members')
@Unique(['workspaceId', 'userId'])
export class WorkspaceMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'workspace_id' })
  workspaceId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'member_id' })
  memberId!: string;

  @Column({ type: 'varchar', length: 20, default: 'MEMBER' })
  role!: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;

  @Column({ type: 'uuid', name: 'invited_by', nullable: true })
  invitedBy!: string | null;

  @ManyToOne(() => WorkspaceEntity, (ws) => ws.members)
  @JoinColumn({ name: 'workspace_id' })
  workspace!: WorkspaceEntity;

  @ManyToOne(() => UserEntity, (user) => user.workspaceMembers)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'member_id' })
  member!: MemberEntity;
}

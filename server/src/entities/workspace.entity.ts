import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { WorkspaceMemberEntity } from './workspace-member.entity';
import { InviteEntity } from './invite.entity';
import { SettingsEntity } from './settings.entity';

@Entity('workspaces')
export class WorkspaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'owner_id' })
  owner!: UserEntity;

  @OneToMany(() => WorkspaceMemberEntity, (wm) => wm.workspace)
  members!: WorkspaceMemberEntity[];

  @OneToMany(() => InviteEntity, (invite) => invite.workspace)
  invites!: InviteEntity[];

  @OneToOne(() => SettingsEntity, (settings) => settings.workspace)
  settings!: SettingsEntity;
}

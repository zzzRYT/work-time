import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { WorkspaceEntity } from './workspace.entity';

@Entity('settings')
export class SettingsEntity {
  @PrimaryColumn({ type: 'uuid', name: 'workspace_id' })
  workspaceId!: string;

  @Column({ type: 'integer', name: 'study_start_hour', default: 10 })
  studyStartHour!: number;

  @Column({ type: 'integer', name: 'study_start_minute', default: 0 })
  studyStartMinute!: number;

  @Column({ type: 'integer', name: 'late_fee_amount', default: 1000 })
  lateFeeAmount!: number;

  @Column({ type: 'integer', name: 'monthly_fee_amount', default: 10000 })
  monthlyFeeAmount!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => WorkspaceEntity, (ws) => ws.settings)
  @JoinColumn({ name: 'workspace_id' })
  workspace!: WorkspaceEntity;
}

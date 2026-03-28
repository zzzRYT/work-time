import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('settings')
export class SettingsEntity {
  @PrimaryColumn({ type: 'varchar', length: 20, default: 'default' })
  id!: string;

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
}

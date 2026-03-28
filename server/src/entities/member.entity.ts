import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { SessionEntity } from './session.entity';
import { DailyVacationEntity } from './daily-vacation.entity';
import { MonthlyFeeEntity } from './monthly-fee.entity';

@Entity('members')
export class MemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName!: string;

  @Column({ type: 'varchar', length: 20 })
  color!: string;

  @Column({ type: 'varchar', length: 20, default: 'MEMBER' })
  role!: string;

  @Column({ type: 'uuid', name: 'workspace_id' })
  workspaceId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => SessionEntity, (session) => session.member)
  sessions!: SessionEntity[];

  @OneToMany(() => DailyVacationEntity, (vacation) => vacation.member)
  dailyVacations!: DailyVacationEntity[];

  @OneToMany(() => MonthlyFeeEntity, (fee) => fee.member)
  monthlyFees!: MonthlyFeeEntity[];
}

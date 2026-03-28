import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { MemberEntity } from './member.entity';

@Entity('monthly_fees')
@Unique(['memberId', 'month'])
export class MonthlyFeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'member_id' })
  memberId!: string;

  @Column({ type: 'varchar', length: 7 })
  month!: string;

  @Column({ type: 'varchar', length: 20, name: 'monthly_fee_status', default: 'UNPAID' })
  monthlyFeeStatus!: string;

  @Column({ type: 'varchar', length: 20, name: 'late_fee_status', default: 'UNPAID' })
  lateFeeStatus!: string;

  @ManyToOne(() => MemberEntity, (member) => member.monthlyFees)
  @JoinColumn({ name: 'member_id' })
  member!: MemberEntity;
}

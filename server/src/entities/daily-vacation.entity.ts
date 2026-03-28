import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { MemberEntity } from './member.entity';

@Entity('daily_vacations')
@Unique(['memberId', 'date'])
export class DailyVacationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'member_id' })
  memberId!: string;

  @Column({ type: 'varchar', length: 10 })
  date!: string;

  @Column({ type: 'integer' })
  hours!: number;

  @ManyToOne(() => MemberEntity, (member) => member.dailyVacations)
  @JoinColumn({ name: 'member_id' })
  member!: MemberEntity;
}

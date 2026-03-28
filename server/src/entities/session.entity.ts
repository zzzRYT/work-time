import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MemberEntity } from './member.entity';

@Entity('sessions')
@Index(['memberId', 'date'])
@Index(['date'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'member_id' })
  memberId!: string;

  @Column({ type: 'varchar', length: 10 })
  date!: string;

  @Column({ type: 'timestamptz', name: 'check_in_time' })
  checkInTime!: Date;

  @Column({ type: 'timestamptz', name: 'check_out_time', nullable: true })
  checkOutTime!: Date | null;

  @Column({ type: 'boolean', name: 'is_late', default: false })
  isLate!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => MemberEntity, (member) => member.sessions)
  @JoinColumn({ name: 'member_id' })
  member!: MemberEntity;
}

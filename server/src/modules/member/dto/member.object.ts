import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { AttendanceStatus } from '../../../common/enums';
import { MemberRole } from '../enums/member-role.enum';

@ObjectType({ description: '스터디 멤버' })
export class Member {
  @Field(() => ID)
  id!: string;

  @Field({ description: '실명' })
  name!: string;

  @Field({ description: '표시 이름' })
  displayName!: string;

  @Field({ description: '프로필 색상 (hex)' })
  color!: string;

  @Field(() => MemberRole, { description: '역할 (ADMIN 또는 MEMBER)' })
  role!: MemberRole;

  @Field(() => AttendanceStatus, { description: '오늘의 출석 상태' })
  currentStatus!: AttendanceStatus;

  @Field(() => Int, { description: '오늘 총 학습 시간(분)' })
  todayStudyMinutes!: number;

  @Field(() => Int, { nullable: true, description: '오늘 휴가 시간 (null이면 휴가 없음)' })
  todayVacationHours!: number | null;
}

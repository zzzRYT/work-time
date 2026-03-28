import { Resolver, Query, ResolveField, Parent, Int } from '@nestjs/graphql';
import type { MemberEntity } from '../../entities/member.entity';
import { Member } from './dto/member.object';
import { MemberService } from './member.service';
import { AttendanceStatus } from '../../common/enums';

@Resolver(() => Member)
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Query(() => [Member], { description: '전체 멤버 목록 조회' })
  async members(): Promise<MemberEntity[]> {
    return this.memberService.findAll();
  }

  @ResolveField(() => AttendanceStatus, { description: '오늘의 출석 상태' })
  async currentStatus(@Parent() member: MemberEntity): Promise<AttendanceStatus> {
    return this.memberService.getCurrentStatus(member.id);
  }

  @ResolveField(() => Int, { description: '오늘 총 학습 시간(분)' })
  async todayStudyMinutes(@Parent() member: MemberEntity): Promise<number> {
    return this.memberService.getTodayStudyMinutes(member.id);
  }

  @ResolveField(() => Int, { nullable: true, description: '오늘 휴가 시간 (null이면 휴가 없음)' })
  async todayVacationHours(@Parent() member: MemberEntity): Promise<number | null> {
    return this.memberService.getTodayVacationHours(member.id);
  }
}

import { ObjectType, Field } from '@nestjs/graphql';
import { AttendanceStatus } from '../../../common/enums';

@ObjectType({ description: '캘린더 날짜별 출석 상태' })
export class CalendarDay {
  @Field({ description: '날짜 (YYYY-MM-DD)' })
  date!: string;

  @Field(() => AttendanceStatus, { description: '해당 날짜의 출석 상태' })
  status!: AttendanceStatus;
}

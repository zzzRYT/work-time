import { registerEnumType } from '@nestjs/graphql';

export enum AttendanceStatus {
  NOT_ATTENDED = 'NOT_ATTENDED',
  STUDYING = 'STUDYING',
  COMPLETED = 'COMPLETED',
  LATE = 'LATE',
  VACATION = 'VACATION',
}

registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
  description: '출석 상태',
  valuesMap: {
    NOT_ATTENDED: { description: '미출석' },
    STUDYING: { description: '학습 중' },
    COMPLETED: { description: '학습 완료' },
    LATE: { description: '지각' },
    VACATION: { description: '휴가' },
  },
});

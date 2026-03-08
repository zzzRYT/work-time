import gql from "graphql-tag";

export const sessionTypeDefs = gql`
  """출석 세션 (체크인~체크아웃)"""
  type Session {
    id: ID!
    memberId: ID!
    """날짜 (YYYY-MM-DD)"""
    date: String!
    """체크인 시각 (ISO 8601)"""
    checkInTime: String!
    """체크아웃 시각 (ISO 8601, 학습 중이면 null)"""
    checkOutTime: String
    """지각 여부"""
    isLate: Boolean!
    """학습 시간(분), 체크아웃 전이면 현재까지 경과 시간"""
    durationMinutes: Int
  }

  """출석 요약 통계"""
  type AttendanceSummary {
    """전체 멤버 수"""
    total: Int!
    """출석한 멤버 수"""
    attended: Int!
    """현재 학습 중인 멤버 수"""
    studying: Int!
    """지각한 멤버 수"""
    late: Int!
  }

  """특정 날짜의 상세 출석 정보"""
  type DayDetailResult {
    sessions: [Session!]!
    """총 학습 시간(분)"""
    totalDurationMinutes: Int!
    """휴가 사용 시간"""
    vacationHours: Int
  }

  """캘린더 날짜별 출석 상태"""
  type CalendarDay {
    """날짜 (YYYY-MM-DD)"""
    date: String!
    """해당 날짜의 출석 상태"""
    status: AttendanceStatus!
  }

  """월간 요약 통계"""
  type MonthlySummaryResult {
    """출석 일수"""
    attendanceDays: Int!
    """총 학습 시간(분)"""
    totalStudyMinutes: Int!
    """일 평균 학습 시간(분)"""
    averageDailyMinutes: Int!
    """지각 횟수"""
    lateCount: Int!
    """휴가 일수"""
    vacationDays: Int!
    """총 지각 벌금(원)"""
    totalLateFee: Int!
  }

  extend type Query {
    """해당 멤버의 오늘 활성 세션 (체크아웃 전). 없으면 null"""
    activeSession(memberId: ID!): Session
    """오늘의 출석 요약"""
    todayAttendanceSummary: AttendanceSummary!
    """특정 멤버의 특정 날짜 상세 조회"""
    dayDetail(memberId: ID!, date: String!): DayDetailResult!
    """특정 멤버의 월간 캘린더"""
    calendar(memberId: ID!, year: Int!, month: Int!): [CalendarDay!]!
    """특정 멤버의 월간 요약"""
    monthlySummary(
      memberId: ID!
      year: Int!
      month: Int!
    ): MonthlySummaryResult!
  }

  extend type Mutation {
    """체크인 (지각 자동 감지)"""
    checkIn(memberId: ID!): Session!
    """체크아웃"""
    checkOut(memberId: ID!): Session!
  }
`;

import gql from "graphql-tag";

export const sessionTypeDefs = gql`
  type Session {
    id: ID!
    memberId: ID!
    date: String!
    checkInTime: String!
    checkOutTime: String
    isLate: Boolean!
    durationMinutes: Int
  }

  type AttendanceSummary {
    total: Int!
    attended: Int!
    studying: Int!
    late: Int!
  }

  type DayDetailResult {
    sessions: [Session!]!
    totalDurationMinutes: Int!
    vacationHours: Int
  }

  type CalendarDay {
    date: String!
    status: AttendanceStatus!
  }

  type MonthlySummaryResult {
    attendanceDays: Int!
    totalStudyMinutes: Int!
    averageDailyMinutes: Int!
    lateCount: Int!
    vacationDays: Int!
    totalLateFee: Int!
  }

  extend type Query {
    todayAttendanceSummary: AttendanceSummary!
    dayDetail(memberId: ID!, date: String!): DayDetailResult!
    calendar(memberId: ID!, year: Int!, month: Int!): [CalendarDay!]!
    monthlySummary(
      memberId: ID!
      year: Int!
      month: Int!
    ): MonthlySummaryResult!
  }

  extend type Mutation {
    checkIn(memberId: ID!): Session!
    checkOut(memberId: ID!): Session!
  }
`;

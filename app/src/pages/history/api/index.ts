import { graphql } from "@graphql";

export const CALENDAR_QUERY = graphql(`
  query Calendar($memberId: ID!, $year: Int!, $month: Int!) {
    calendar(memberId: $memberId, year: $year, month: $month) {
      date
      status
    }
    monthlySummary(memberId: $memberId, year: $year, month: $month) {
      attendanceDays
      totalStudyMinutes
      averageDailyMinutes
      lateCount
      vacationDays
      totalLateFee
    }
  }
`);

export const DAY_DETAIL_QUERY = graphql(`
  query DayDetail($memberId: ID!, $date: String!) {
    dayDetail(memberId: $memberId, date: $date) {
      sessions {
        id
        checkInTime
        checkOutTime
        isLate
        durationMinutes
      }
      totalDurationMinutes
      vacationHours
    }
  }
`);

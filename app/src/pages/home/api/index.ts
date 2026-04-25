import { graphql } from "@graphql";

export const HOME_QUERY = graphql(`
  query HomePageData($month: String!) {
    members {
      id
      name
      displayName
      color
      currentStatus
      todayStudyMinutes
      todayVacationHours
    }
    todayAttendanceSummary {
      total
      attended
      studying
      late
    }
    feeStatus(month: $month) {
      member { id }
      lateFee
      monthlyFee
      monthlyFeeStatus
      lateFeeStatus
      lateCount
    }
  }
`);

export const ACTIVE_SESSION = graphql(`
  query HomeActiveSession($memberId: ID!) {
    activeSession(memberId: $memberId) {
      id
      checkInTime
      isLate
    }
  }
`);

export const CHECK_IN = graphql(`
  mutation HomeCheckIn($memberId: ID!) {
    checkIn(memberId: $memberId) { id checkInTime isLate }
  }
`);

export const CHECK_OUT = graphql(`
  mutation HomeCheckOut($memberId: ID!) {
    checkOut(memberId: $memberId) { id checkOutTime }
  }
`);

export const USE_VACATION = graphql(`
  mutation HomeUseVacation($memberId: ID!, $date: String!, $hours: Int!) {
    useVacation(memberId: $memberId, date: $date, hours: $hours) { id hours }
  }
`);

export const REQUEST_FEE = graphql(`
  mutation HomeRequestFee($memberId: ID!, $month: String!, $type: FeeType!) {
    requestFeePayment(memberId: $memberId, month: $month, type: $type) {
      id monthlyFeeStatus lateFeeStatus
    }
  }
`);

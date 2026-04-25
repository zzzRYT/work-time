import { graphql } from "@graphql";

export const RANKING_QUERY = graphql(`
  query RankingPage($month: String!) {
    feeStatus(month: $month) {
      member {
        id
        displayName
        color
      }
      lateFee
      monthlyFee
      monthlyFeeStatus
      lateFeeStatus
      lateCount
    }
    weekly: memberRanking(period: WEEKLY) {
      member {
        id
        displayName
        color
      }
      totalStudyMinutes
      attendanceDays
      lateCount
    }
    monthly: memberRanking(period: MONTHLY) {
      member {
        id
        displayName
        color
      }
      totalStudyMinutes
      attendanceDays
      lateCount
    }
  }
`);

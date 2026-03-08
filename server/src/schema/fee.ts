import gql from "graphql-tag";

export const feeTypeDefs = gql`
  """월별 회비 납부 기록"""
  type MonthlyFee {
    id: ID!
    memberId: ID!
    """월 (YYYY-MM)"""
    month: String!
    """납부 여부"""
    isPaid: Boolean!
  }

  """회비 상태 항목"""
  type FeeStatusEntry {
    member: Member!
    """지각 벌금(원)"""
    lateFee: Int!
    """월 회비(원)"""
    monthlyFee: Int!
    """납부 여부"""
    isPaid: Boolean!
    """지각 횟수"""
    lateCount: Int!
  }

  """랭킹 항목"""
  type RankingEntry {
    member: Member!
    """총 학습 시간(분)"""
    totalStudyMinutes: Int!
    """출석 일수"""
    attendanceDays: Int!
    """지각 횟수"""
    lateCount: Int!
  }

  extend type Query {
    """월별 회비 상태 조회"""
    feeStatus(month: String!): [FeeStatusEntry!]!
    """멤버 랭킹 (주간/월간)"""
    memberRanking(period: RankingPeriod!): [RankingEntry!]!
  }

  extend type Mutation {
    """회비 납부 상태 토글"""
    toggleFeePayment(memberId: ID!, month: String!): MonthlyFee!
  }
`;

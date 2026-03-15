import gql from "graphql-tag";

export const feeTypeDefs = gql`
  """납부 상태"""
  enum PaymentStatus {
    """미납"""
    UNPAID
    """확인 대기"""
    PENDING
    """납부 완료"""
    PAID
  }

  """납부 항목 종류"""
  enum FeeType {
    """월 회비"""
    MONTHLY
    """지각비"""
    LATE
  }

  """월별 회비 납부 기록"""
  type MonthlyFee {
    id: ID!
    memberId: ID!
    """월 (YYYY-MM)"""
    month: String!
    """월 회비 납부 상태"""
    monthlyFeeStatus: PaymentStatus!
    """지각비 납부 상태"""
    lateFeeStatus: PaymentStatus!
  }

  """회비 상태 항목"""
  type FeeStatusEntry {
    member: Member!
    """지각 벌금(원)"""
    lateFee: Int!
    """월 회비(원)"""
    monthlyFee: Int!
    """월 회비 납부 상태"""
    monthlyFeeStatus: PaymentStatus!
    """지각비 납부 상태"""
    lateFeeStatus: PaymentStatus!
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
    """멤버가 납부 완료 신청 (UNPAID → PENDING)"""
    requestFeePayment(memberId: ID!, month: String!, type: FeeType!): MonthlyFee!
    """어드민이 납부 확인 (PENDING → PAID)"""
    confirmFeePayment(memberId: ID!, month: String!, type: FeeType!): MonthlyFee!
    """어드민이 납부 거절 (PENDING → UNPAID)"""
    rejectFeePayment(memberId: ID!, month: String!, type: FeeType!): MonthlyFee!
  }
`;

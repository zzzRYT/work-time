import gql from "graphql-tag";

export const vacationTypeDefs = gql`
  """일일 휴가 기록"""
  type DailyVacation {
    id: ID!
    memberId: ID!
    """날짜 (YYYY-MM-DD)"""
    date: String!
    """휴가 시간 (2, 4, 6, 8시간 단위)"""
    hours: Int!
  }

  """다중 날짜 휴가 등록 결과"""
  type UseVacationsResult {
    """등록 성공한 휴가 목록"""
    succeeded: [DailyVacation!]!
    """등록 실패한 날짜와 사유"""
    failed: [VacationFailure!]!
  }

  """휴가 등록 실패 정보"""
  type VacationFailure {
    date: String!
    reason: String!
  }

  extend type Mutation {
    """휴가 사용 등록"""
    useVacation(memberId: ID!, date: String!, hours: Int!): DailyVacation!
    """다중 날짜 휴가 일괄 등록"""
    useVacations(memberId: ID!, dates: [String!]!, hours: Int!): UseVacationsResult!
    """휴가 취소"""
    cancelVacation(memberId: ID!, date: String!): Boolean!
  }
`;

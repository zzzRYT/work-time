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

  extend type Mutation {
    """휴가 사용 등록"""
    useVacation(memberId: ID!, date: String!, hours: Int!): DailyVacation!
  }
`;

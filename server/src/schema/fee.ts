import gql from "graphql-tag";

export const feeTypeDefs = gql`
  type MonthlyFee {
    id: ID!
    memberId: ID!
    month: String!
    isPaid: Boolean!
  }

  type FeeStatusEntry {
    member: Member!
    lateFee: Int!
    monthlyFee: Int!
    isPaid: Boolean!
    lateCount: Int!
  }

  type RankingEntry {
    member: Member!
    totalStudyMinutes: Int!
    attendanceDays: Int!
    lateCount: Int!
  }

  extend type Query {
    feeStatus(month: String!): [FeeStatusEntry!]!
    memberRanking(period: RankingPeriod!): [RankingEntry!]!
  }

  extend type Mutation {
    toggleFeePayment(memberId: ID!, month: String!): MonthlyFee!
  }
`;

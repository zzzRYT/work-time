import gql from "graphql-tag";

export const vacationTypeDefs = gql`
  type DailyVacation {
    id: ID!
    memberId: ID!
    date: String!
    hours: Int!
  }

  extend type Mutation {
    useVacation(memberId: ID!, date: String!, hours: Int!): DailyVacation!
  }
`;

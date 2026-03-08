import gql from "graphql-tag";

export const memberTypeDefs = gql`
  type Member {
    id: ID!
    name: String!
    displayName: String!
    color: String!
    currentStatus: AttendanceStatus!
    todayStudyMinutes: Int!
  }

  extend type Query {
    members: [Member!]!
  }
`;

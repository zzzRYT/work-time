import gql from "graphql-tag";
import { memberTypeDefs } from "./member.js";
import { sessionTypeDefs } from "./session.js";
import { vacationTypeDefs } from "./vacation.js";
import { feeTypeDefs } from "./fee.js";

const baseTypeDefs = gql`
  enum AttendanceStatus {
    NOT_ATTENDED
    STUDYING
    COMPLETED
    LATE
    VACATION
  }

  enum RankingPeriod {
    WEEKLY
    MONTHLY
  }

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [
  baseTypeDefs,
  memberTypeDefs,
  sessionTypeDefs,
  vacationTypeDefs,
  feeTypeDefs,
];

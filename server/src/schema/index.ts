import gql from "graphql-tag";
import { memberTypeDefs } from "./member.js";
import { sessionTypeDefs } from "./session.js";
import { vacationTypeDefs } from "./vacation.js";
import { feeTypeDefs } from "./fee.js";

const baseTypeDefs = gql`
  """출석 상태"""
  enum AttendanceStatus {
    """미출석"""
    NOT_ATTENDED
    """학습 중"""
    STUDYING
    """학습 완료"""
    COMPLETED
    """지각"""
    LATE
    """휴가"""
    VACATION
  }

  """랭킹 기간"""
  enum RankingPeriod {
    """주간"""
    WEEKLY
    """월간"""
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

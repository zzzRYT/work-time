import gql from "graphql-tag";

export const memberTypeDefs = gql`
  """스터디 멤버"""
  type Member {
    id: ID!
    """실명"""
    name: String!
    """표시 이름"""
    displayName: String!
    """프로필 색상 (hex)"""
    color: String!
    """역할 (ADMIN 또는 MEMBER)"""
    role: MemberRole!
    """오늘의 출석 상태"""
    currentStatus: AttendanceStatus!
    """오늘 총 학습 시간(분)"""
    todayStudyMinutes: Int!
    """오늘 휴가 시간 (null이면 휴가 없음)"""
    todayVacationHours: Int
  }

  extend type Query {
    """전체 멤버 목록 조회"""
    members: [Member!]!
  }
`;

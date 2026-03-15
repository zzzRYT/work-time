import gql from "graphql-tag";

export const adminTypeDefs = gql`
  """멤버 역할"""
  enum MemberRole {
    """관리자"""
    ADMIN
    """일반 멤버"""
    MEMBER
  }

  """스터디 그룹 전역 설정"""
  type Settings {
    id: ID!
    """출근 시간 (시, 0~23)"""
    studyStartHour: Int!
    """출근 시간 (분, 0~59)"""
    studyStartMinute: Int!
    """지각비 (원, 0 이상)"""
    lateFeeAmount: Int!
    """마지막 수정 시각"""
    updatedAt: String!
  }

  extend type Query {
    """현재 설정 조회"""
    settings: Settings!
  }

  extend type Mutation {
    """멤버 역할 변경 (ADMIN 또는 MEMBER)"""
    updateMemberRole(memberId: ID!, role: MemberRole!): Member!
    """출근 시간 변경"""
    updateStudyStartTime(hour: Int!, minute: Int!): Settings!
    """지각비 변경"""
    updateLateFeeAmount(amount: Int!): Settings!
  }
`;

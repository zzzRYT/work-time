import { graphql } from "@graphql";

export const SETTINGS_QUERY = graphql(`
  query SettingsPage($month: String!) {
    members {
      id
      displayName
      color
      role
    }
    settings {
      id
      studyStartHour
      studyStartMinute
      lateFeeAmount
    }
    feeStatus(month: $month) {
      member {
        id
        displayName
        color
      }
      lateFee
      monthlyFee
      monthlyFeeStatus
      lateFeeStatus
      lateCount
    }
  }
`);

export const UPDATE_MEMBER_ROLE = graphql(`
  mutation SettingsUpdateMemberRole($memberId: ID!, $role: MemberRole!) {
    updateMemberRole(memberId: $memberId, role: $role) {
      id
      role
    }
  }
`);

export const UPDATE_STUDY_START_TIME = graphql(`
  mutation SettingsUpdateStudyStartTime($hour: Int!, $minute: Int!) {
    updateStudyStartTime(hour: $hour, minute: $minute) {
      id
      studyStartHour
      studyStartMinute
    }
  }
`);

export const UPDATE_LATE_FEE_AMOUNT = graphql(`
  mutation SettingsUpdateLateFeeAmount($amount: Int!) {
    updateLateFeeAmount(amount: $amount) {
      id
      lateFeeAmount
    }
  }
`);

export const CONFIRM_FEE_PAYMENT = graphql(`
  mutation SettingsConfirmFeePayment($memberId: ID!, $month: String!, $type: FeeType!) {
    confirmFeePayment(memberId: $memberId, month: $month, type: $type) {
      id
      monthlyFeeStatus
      lateFeeStatus
    }
  }
`);

export const REJECT_FEE_PAYMENT = graphql(`
  mutation SettingsRejectFeePayment($memberId: ID!, $month: String!, $type: FeeType!) {
    rejectFeePayment(memberId: $memberId, month: $month, type: $type) {
      id
      monthlyFeeStatus
      lateFeeStatus
    }
  }
`);

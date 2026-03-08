import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendanceCard } from "./ui/attendance-card";
import { VacationButton } from "./ui/vacation-button";
import { StudyingMembers } from "./ui/studying-members";

const MEMBERS_QUERY = gql`
  query Members {
    members {
      id
      name
      displayName
      color
      currentStatus
      todayStudyMinutes
    }
    todayAttendanceSummary {
      total
      attended
      studying
      late
    }
  }
`;

const CHECK_IN = gql`
  mutation CheckIn($memberId: ID!) {
    checkIn(memberId: $memberId) {
      id
      checkInTime
      isLate
    }
  }
`;

const CHECK_OUT = gql`
  mutation CheckOut($memberId: ID!) {
    checkOut(memberId: $memberId) {
      id
      checkOutTime
    }
  }
`;

const USE_VACATION = gql`
  mutation UseVacation($memberId: ID!, $date: String!, $hours: Int!) {
    useVacation(memberId: $memberId, date: $date, hours: $hours) {
      id
      hours
    }
  }
`;

function getTodayString(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function DashboardPage() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { data, loading, refetch } = useQuery(MEMBERS_QUERY, {
    pollInterval: 30_000,
  });
  const [checkIn] = useMutation(CHECK_IN);
  const [checkOut] = useMutation(CHECK_OUT);
  const [useVacation] = useMutation(USE_VACATION);

  if (loading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <Text className="text-gray-400">로딩중...</Text>
      </SafeAreaView>
    );
  }

  const d = data as any;
  const members = d?.members ?? [];
  const summary = d?.todayAttendanceSummary;
  const me = members.find((m: any) => m.id === selectedMemberId);

  if (!selectedMemberId) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="px-4 pt-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            누구세요?
          </Text>
          {members.map((m: any) => (
            <Pressable
              key={m.id}
              className="bg-white rounded-xl p-4 mb-3 flex-row items-center"
              onPress={() => setSelectedMemberId(m.id)}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: m.color }}
              >
                <Text className="text-white font-bold">
                  {m.displayName.charAt(0)}
                </Text>
              </View>
              <Text className="text-base font-medium">{m.displayName}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const handleCheckIn = async () => {
    try {
      await checkIn({
        variables: { memberId: selectedMemberId },
      });
      refetch();
    } catch (e: any) {
      Alert.alert("오류", e.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut({
        variables: { memberId: selectedMemberId },
      });
      refetch();
    } catch (e: any) {
      Alert.alert("오류", e.message);
    }
  };

  const handleVacation = async (hours: number) => {
    try {
      await useVacation({
        variables: {
          memberId: selectedMemberId,
          date: getTodayString(),
          hours,
        },
      });
      refetch();
    } catch (e: any) {
      Alert.alert("오류", e.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            {me?.displayName ?? ""}
          </Text>
          <Pressable onPress={() => setSelectedMemberId(null)}>
            <Text className="text-primary text-sm">멤버 변경</Text>
          </Pressable>
        </View>

        {summary && (
          <View className="flex-row bg-white rounded-xl p-3 mb-4 gap-2">
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-500">전체</Text>
              <Text className="text-lg font-bold">{summary.total}</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-500">출석</Text>
              <Text className="text-lg font-bold text-studying">
                {summary.attended}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-500">공부중</Text>
              <Text className="text-lg font-bold text-primary">
                {summary.studying}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-500">지각</Text>
              <Text className="text-lg font-bold text-late">
                {summary.late}
              </Text>
            </View>
          </View>
        )}

        <AttendanceCard
          date={getTodayString()}
          status={me?.currentStatus ?? "NOT_ATTENDED"}
          checkInTime={null}
          isLate={me?.currentStatus === "LATE"}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          className="mb-4"
        />

        <VacationButton
          onUseVacation={handleVacation}
          disabled={
            me?.currentStatus === "STUDYING" ||
            me?.currentStatus === "VACATION"
          }
          className="mb-4"
        />

        <StudyingMembers members={members} className="mb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

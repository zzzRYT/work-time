import { Tabs } from "expo-router";
import { useQuery } from "@apollo/client";
import { graphql } from "@graphql";
import { useMemberStore } from "@shared/store/member";

const SELECTED_MEMBER_ROLE = graphql(`
  query SelectedMemberRole {
    members {
      id
      role
    }
  }
`);

export default function TabsLayout() {
  const selectedMemberId = useMemberStore((s) => s.selectedMemberId);
  const { data } = useQuery(SELECTED_MEMBER_ROLE);

  const selectedMember = data?.members.find((m) => m.id === selectedMemberId);
  const isAdmin = selectedMember?.role === "ADMIN";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6366F1",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "대시보드",
          tabBarIcon: ({ color, size }) => null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "기록",
          tabBarIcon: ({ color, size }) => null,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: "멤버",
          tabBarIcon: ({ color, size }) => null,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "관리",
          tabBarIcon: ({ color, size }) => null,
          href: isAdmin ? "/admin" : null,
        }}
      />
    </Tabs>
  );
}

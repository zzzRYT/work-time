import { Tabs } from "expo-router";

export default function TabsLayout() {
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
    </Tabs>
  );
}

import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ScreenLoader() {
  return (
    <SafeAreaView className="flex-1 bg-bg items-center justify-center">
      <ActivityIndicator size="large" color="#F07A5A" />
    </SafeAreaView>
  );
}

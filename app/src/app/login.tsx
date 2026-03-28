import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@shared/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const handleGoogleLogin = async () => {
    const redirectTo = makeRedirectUri();
    const { data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (data?.url) {
      await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 justify-center px-5">
        <View className="items-center mb-12">
          <Text className="text-[32px] font-extrabold text-text-primary mb-2">
            WorkTime
          </Text>
          <Text className="text-[15px] text-text-muted text-center">
            함께 공부하고 있다는 연결감
          </Text>
        </View>

        <Pressable
          className="bg-white border border-border rounded-md py-4 px-6 flex-row items-center justify-center active:bg-surface"
          onPress={handleGoogleLogin}
        >
          <Text className="text-[15px] font-medium text-text-primary">
            Google로 시작하기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

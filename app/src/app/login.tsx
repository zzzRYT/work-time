import { Alert, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, isSupabaseConfigured } from "@shared/lib/supabase";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import type { Provider } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const handleOAuthLogin = async (provider: Provider) => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        "설정 필요",
        "SUPABASE_URL과 SUPABASE_ANON_KEY 환경 변수를 설정해주세요."
      );
      return;
    }

    try {
      const redirectTo = makeRedirectUri({ scheme: "work-time" });
      const { data } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams:
            provider === "google" ? { prompt: "select_account" } : undefined,
        },
      });
      if (!data?.url) return;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === "success") {
        const { url } = result;
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode) {
          Alert.alert("로그인 실패", errorCode);
          return;
        }

        const { access_token, refresh_token } = params;
        if (access_token && refresh_token) {
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
        }
      }
    } catch {
      Alert.alert(
        "로그인 오류",
        "소셜 로그인을 사용하려면 개발 빌드(dev client)가 필요합니다."
      );
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
          onPress={() => handleOAuthLogin("google")}
        >
          <Text className="text-[15px] font-medium text-text-primary">
            Google로 시작하기
          </Text>
        </Pressable>

        {Platform.OS === "ios" && (
          <Pressable
            className="bg-black rounded-md py-4 px-6 flex-row items-center justify-center mt-3 active:opacity-80"
            onPress={() => handleOAuthLogin("apple")}
          >
            <Text className="text-[15px] font-medium text-white">
              Apple로 시작하기
            </Text>
          </Pressable>
        )}

        {!isSupabaseConfigured && (
          <Text className="text-[11px] text-text-subtle text-center mt-4">
            Supabase 환경 변수가 설정되지 않았습니다
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

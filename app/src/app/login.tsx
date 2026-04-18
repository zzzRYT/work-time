import { Alert, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, isSupabaseConfigured } from "@shared/lib/supabase";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as AppleAuthentication from "expo-apple-authentication";
import type { Provider } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const handleAppleLogin = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        "설정 필요",
        "SUPABASE_URL과 SUPABASE_ANON_KEY 환경 변수를 설정해주세요."
      );
      return;
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert("로그인 실패", "Apple identity token이 없습니다.");
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) {
        Alert.alert("로그인 실패", error.message);
        return;
      }

      if (credential.fullName) {
        const nameParts = [
          credential.fullName.givenName,
          credential.fullName.middleName,
          credential.fullName.familyName,
        ].filter(Boolean);

        if (nameParts.length > 0) {
          await supabase.auth.updateUser({
            data: {
              full_name: nameParts.join(" "),
              given_name: credential.fullName.givenName,
              family_name: credential.fullName.familyName,
            },
          });
        }
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "ERR_REQUEST_CANCELED") {
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("로그인 실패", msg);
    }
  };

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

      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams:
            provider === "google" ? { prompt: "select_account" } : undefined,
        },
      });
      if (oauthErr) {
        Alert.alert("로그인 실패", oauthErr.message);
        return;
      }
      if (!data?.url) return;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== "success") {
        return;
      }

      const { url } = result;
      const { params, errorCode } = QueryParams.getQueryParams(url);

      if (params.error || errorCode) {
        const description = params.error_description ?? "알 수 없는 오류";
        Alert.alert("로그인 실패", description);
        return;
      }

      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          params.code
        );
        if (error) {
          Alert.alert("로그인 실패", error.message);
        }
        return;
      }

      const { access_token, refresh_token } = params;
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          Alert.alert("로그인 실패", error.message);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("로그인 실패", msg);
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
            onPress={handleAppleLogin}
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

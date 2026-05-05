import AsyncStorage from "@react-native-async-storage/async-storage";
import { PENDING_INVITE_TOKEN_KEY } from "@shared/lib/invite";

export async function storePendingInviteToken(token: string) {
  await AsyncStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
}

export async function getPendingInviteToken() {
  return AsyncStorage.getItem(PENDING_INVITE_TOKEN_KEY);
}

export async function clearPendingInviteToken() {
  await AsyncStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
}

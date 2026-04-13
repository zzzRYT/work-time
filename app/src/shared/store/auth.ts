import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@shared/lib/supabase";
import type { Session } from "@supabase/supabase-js";

const WORKSPACE_KEY = "@work-time/workspace-id";
const MEMBER_KEY = "@work-time/member-id";

interface AuthStore {
  session: Session | null;
  workspaceId: string | null;
  memberId: string | null;
  isLoaded: boolean;
  setSession: (session: Session | null) => void;
  setWorkspaceId: (id: string) => void;
  setMemberId: (id: string) => void;
  clearWorkspace: () => void;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  workspaceId: null,
  memberId: null,
  isLoaded: false,

  setSession: (session) => set({ session }),

  setWorkspaceId: (id) => {
    set({ workspaceId: id });
    AsyncStorage.setItem(WORKSPACE_KEY, id);
  },

  setMemberId: (id) => {
    set({ memberId: id });
    AsyncStorage.setItem(MEMBER_KEY, id);
  },

  clearWorkspace: () => {
    set({ workspaceId: null, memberId: null });
    AsyncStorage.multiRemove([WORKSPACE_KEY, MEMBER_KEY]);
  },

  hydrate: async () => {
    const { data } = await supabase.auth.getSession();
    const [[, workspaceId], [, memberId]] = await AsyncStorage.multiGet([
      WORKSPACE_KEY,
      MEMBER_KEY,
    ]);
    set({
      session: data.session,
      workspaceId: workspaceId ?? null,
      memberId: memberId ?? null,
      isLoaded: true,
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove([WORKSPACE_KEY, MEMBER_KEY]);
    set({ session: null, workspaceId: null, memberId: null });
  },
}));

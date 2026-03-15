import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@work-time/selected-member-id";

interface MemberStore {
  selectedMemberId: string | null;
  isLoaded: boolean;
  setSelectedMemberId: (id: string) => void;
  clearSelectedMemberId: () => void;
  hydrate: () => Promise<void>;
}

export const useMemberStore = create<MemberStore>((set) => ({
  selectedMemberId: null,
  isLoaded: false,

  setSelectedMemberId: (id: string) => {
    set({ selectedMemberId: id });
    AsyncStorage.setItem(STORAGE_KEY, id);
  },

  clearSelectedMemberId: () => {
    set({ selectedMemberId: null });
    AsyncStorage.removeItem(STORAGE_KEY);
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      set({ selectedMemberId: stored, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
}));

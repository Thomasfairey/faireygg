import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UsernameState {
  username: string;
  setUsername: (name: string) => void;
}

export const useUsernameStore = create<UsernameState>()(
  persist(
    (set) => ({
      username: "",
      setUsername: (name) => set({ username: name.trim().slice(0, 20) }),
    }),
    { name: "neural-pulse-username", version: 1 }
  )
);

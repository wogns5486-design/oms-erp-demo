"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BoxStandard } from "@/lib/types";

interface SettingsState {
  boxStandards: BoxStandard[];
  isReady: boolean;
  initialize: () => Promise<void>;
  reset: () => Promise<void>;
  updateStandard: (id: string, maxPerBox: number) => void;
  getStandardByCategory: (category: string) => BoxStandard | undefined;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      boxStandards: [],
      isReady: false,

      initialize: async () => {
        if (get().boxStandards.length > 0) {
          set({ isReady: true });
          return;
        }
        const boxStandards = await fetch("/data/box-standards.json").then((r) => r.json());
        set({ boxStandards, isReady: true });
      },

      reset: async () => {
        const boxStandards = await fetch("/data/box-standards.json").then((r) => r.json());
        set({ boxStandards, isReady: true });
      },

      updateStandard: (id, maxPerBox) =>
        set((s) => ({
          boxStandards: s.boxStandards.map((b) =>
            b.id === id ? { ...b, maxPerBox } : b
          ),
        })),

      getStandardByCategory: (category) =>
        get().boxStandards.find((b) => b.category === category),
    }),
    {
      name: "oms-settings-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        boxStandards: state.boxStandards,
      }),
    }
  )
);

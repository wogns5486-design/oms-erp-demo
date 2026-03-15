"use client";
import { create } from "zustand";
import type { DashboardStats } from "@/lib/types";

interface DashboardState {
  stats: DashboardStats | null;
  isReady: boolean;
  initialize: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  stats: null,
  isReady: false,

  initialize: async () => {
    if (get().stats) {
      set({ isReady: true });
      return;
    }
    const stats = await fetch("/data/dashboard-stats.json").then((r) => r.json());
    set({ stats, isReady: true });
  },

  reset: async () => {
    const stats = await fetch("/data/dashboard-stats.json").then((r) => r.json());
    set({ stats, isReady: true });
  },
}));

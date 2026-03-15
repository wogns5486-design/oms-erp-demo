"use client";
import { useEffect, useState } from "react";
import { useMappingStore } from "./mapping-store";
import { useShippingStore } from "./shipping-store";
import { useSettingsStore } from "./settings-store";
import { useDashboardStore } from "./dashboard-store";

export function useHydration() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([
      useMappingStore.getState().initialize(),
      useShippingStore.getState().initialize(),
      useSettingsStore.getState().initialize(),
      useDashboardStore.getState().initialize(),
    ]).then(() => setIsReady(true));
  }, []);

  return isReady;
}

export async function resetAllStores() {
  // Clear sessionStorage
  sessionStorage.removeItem("oms-mapping-store");
  sessionStorage.removeItem("oms-shipping-store");
  sessionStorage.removeItem("oms-settings-store");
  // Re-fetch seed data
  await Promise.all([
    useMappingStore.getState().reset(),
    useShippingStore.getState().reset(),
    useSettingsStore.getState().reset(),
    useDashboardStore.getState().reset(),
  ]);
}

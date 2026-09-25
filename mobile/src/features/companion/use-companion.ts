import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { companionStore } from "./companion-store";

export function useCompanion() {
  const snapshot = useSyncExternalStore(
    companionStore.subscribe,
    companionStore.getSnapshot,
    companionStore.getSnapshot,
  );
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    void companionStore.hydrate();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setNow(Date.now());
        void companionStore.hydrate();
      }
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  return {
    ...snapshot,
    now,
    execute: companionStore.execute,
    reload: companionStore.hydrate,
  };
}

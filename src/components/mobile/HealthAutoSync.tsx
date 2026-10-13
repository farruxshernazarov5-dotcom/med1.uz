import { useEffect } from "react";
import { useAuthSafe } from "@/hooks/useAuth";
import { isAutoSyncOn, syncHealthData } from "@/lib/vitals/healthConnect";

const MIN_GAP = 30 * 60 * 1000;
let lastRun = 0;

/** Background Health Connect import on launch and on return to the app (max every 30 min). */
export const HealthAutoSync = () => {
  const auth = useAuthSafe();
  const userId = auth?.user?.id;
  useEffect(() => {
    if (!userId) return;
    const run = () => {
      if (!isAutoSyncOn() || Date.now() - lastRun < MIN_GAP || document.visibilityState !== "visible") return;
      lastRun = Date.now();
      syncHealthData(userId).catch(() => { /* permission revoked or offline — retry next return */ });
    };
    run();
    document.addEventListener("visibilitychange", run);
    return () => document.removeEventListener("visibilitychange", run);
  }, [userId]);
  return null;
};

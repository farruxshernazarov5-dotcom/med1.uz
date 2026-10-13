// Health Connect (Android) / Apple Health import via @capgo/capacitor-health.
// Native only; every call no-ops on web. Imported data goes to the user's own
// `health_records` rows — only the on/off preference lives in local storage.
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import type { HealthDataType } from "@capgo/capacitor-health";

const READ: HealthDataType[] = ["heartRate", "oxygenSaturation", "sleep", "steps"];
const PREF = "med1.healthAutoSync";
export const SOURCE = "health_connect";

// Wrapped so the plugin proxy is never a Promise resolution value (Android `.then()` crash).
const plugin = async () => ({ p: (await import("@capgo/capacitor-health")).Health });

export const healthStoreName = () => (Capacitor.getPlatform() === "ios" ? "Apple Health" : "Health Connect");
export const healthSupportedPlatform = () => Capacitor.isNativePlatform();
export const isAutoSyncOn = () => localStorage.getItem(PREF) === "1";
export const setAutoSync = (on: boolean) => (on ? localStorage.setItem(PREF, "1") : localStorage.removeItem(PREF));

export type HealthStatus = "unsupported" | "not_installed" | "available";

export async function healthStatus(): Promise<HealthStatus> {
  if (!Capacitor.isNativePlatform()) return "unsupported";
  try {
    const { p } = await plugin();
    const r: any = await p.isAvailable();
    return r.available ? "available" : "not_installed";
  } catch { return "unsupported"; }
}

/** Opens the Health Connect permission sheet. Returns the granted types. */
export async function requestHealthAccess(): Promise<HealthDataType[]> {
  const { p } = await plugin();
  const s = await p.requestAuthorization({ read: READ });
  return s.readAuthorized ?? [];
}

export async function openHealthSettings() {
  try { const { p } = await plugin(); await (p as any).openHealthConnectSettings?.(); } catch { /* ignore */ }
}

type Row = { user_id: string; record_type: string; value: Record<string, unknown>; recorded_at: string };

async function lastImport(userId: string, type: string): Promise<Date> {
  const { data } = await supabase.from("health_records").select("recorded_at")
    .eq("user_id", userId).eq("record_type", type).eq("value->>source", SOURCE)
    .order("recorded_at", { ascending: false }).limit(1).maybeSingle();
  const fallback = new Date(Date.now() - 7 * 864e5);
  return data?.recorded_at ? new Date(new Date(data.recorded_at).getTime() + 1000) : fallback;
}

export type SyncResult = { imported: number; latest: { bpm?: number; spo2?: number; sleepHours?: number; steps?: number } };

/** Imports new samples since the previous import (first run: last 7 days). */
export async function syncHealthData(userId: string): Promise<SyncResult> {
  const { p } = await plugin();
  const end = new Date().toISOString();
  const rows: Row[] = [];
  const latest: SyncResult["latest"] = {};

  // Heart rate: hourly averages keep the history readable instead of thousands of beats.
  const hrFrom = await lastImport(userId, "vital_pulse");
  const hr = await p.queryAggregated({ dataType: "heartRate", startDate: hrFrom.toISOString(), endDate: end, bucket: "hour", aggregation: ["average", "min", "max"] });
  for (const s of hr.samples ?? []) {
    const avg = Math.round(s.values?.average ?? s.value);
    if (!avg) continue;
    rows.push({ user_id: userId, record_type: "vital_pulse", recorded_at: s.startDate,
      value: { pulse: avg, min: s.values?.min, max: s.values?.max, source: SOURCE } });
    latest.bpm = avg;
  }

  const spFrom = await lastImport(userId, "vital_spo2");
  const sp = await p.readSamples({ dataType: "oxygenSaturation", startDate: spFrom.toISOString(), endDate: end, limit: 200, ascending: true });
  for (const s of sp.samples ?? []) {
    const v = Math.round(s.value <= 1 ? s.value * 100 : s.value);
    rows.push({ user_id: userId, record_type: "vital_spo2", recorded_at: s.startDate, value: { spo2: v, source: SOURCE, device: s.sourceName } });
    latest.spo2 = v;
  }

  const stFrom = await lastImport(userId, "activity_steps");
  const st = await p.queryAggregated({ dataType: "steps", startDate: stFrom.toISOString(), endDate: end, bucket: "day", aggregation: "sum" });
  for (const s of st.samples ?? []) {
    const v = Math.round(s.value);
    // Today's bucket is still growing; it is re-imported tomorrow as a final value.
    if (!v || new Date(s.endDate) > new Date()) { if (v) latest.steps = v; continue; }
    rows.push({ user_id: userId, record_type: "activity_steps", recorded_at: s.startDate, value: { steps: v, source: SOURCE } });
    latest.steps = v;
  }

  const slFrom = await lastImport(userId, "sleep_session");
  const sl = await p.readSamples({ dataType: "sleep", startDate: slFrom.toISOString(), endDate: end, limit: 60, ascending: true });
  for (const s of sl.samples ?? []) {
    const minutes = Math.round((new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 60000);
    const asleep = s.stages?.filter((x: any) => x.stage !== "awake" && x.stage !== "inBed")
      .reduce((a: number, x: any) => a + x.durationMinutes, 0);
    const hours = Math.round(((asleep || minutes) / 60) * 10) / 10;
    if (hours < 0.5) continue;
    rows.push({ user_id: userId, record_type: "sleep_session", recorded_at: s.startDate,
      value: { hours, start: s.startDate, end: s.endDate, source: SOURCE, device: s.sourceName } });
    latest.sleepHours = hours;
  }

  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("health_records").insert(rows.slice(i, i + 200) as any);
    if (error) throw error;
  }
  return { imported: rows.length, latest };
}

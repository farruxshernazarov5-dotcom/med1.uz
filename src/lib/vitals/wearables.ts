// Wearable data sources: BLE heart-rate straps (Web Bluetooth) and a
// Health Connect / Apple Health bridge that no-ops until the native plugin ships.
import { Capacitor, registerPlugin } from "@capacitor/core";

export type WearableSummary = { bpm?: number | null; spo2?: number | null; sleepHours?: number | null; steps?: number | null; source: string };

/** BLE Heart Rate Service (0x180D). Calls onBeat for every notification. */
export async function connectBleHeartRate(onBeat: (bpm: number, rr: number[]) => void) {
  const bt = (navigator as any).bluetooth;
  if (!bt) throw new Error("NO_WEB_BLUETOOTH");
  const device = await bt.requestDevice({ filters: [{ services: ["heart_rate"] }] });
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService("heart_rate");
  const ch = await service.getCharacteristic("heart_rate_measurement");
  ch.addEventListener("characteristicvaluechanged", (e: any) => {
    const dv: DataView = e.target.value;
    const flags = dv.getUint8(0);
    const wide = flags & 0x01;
    let i = 1;
    const bpm = wide ? dv.getUint16(i, true) : dv.getUint8(i);
    i += wide ? 2 : 1;
    if (flags & 0x08) i += 2; // energy expended
    const rr: number[] = [];
    if (flags & 0x10) for (; i + 1 < dv.byteLength; i += 2) rr.push(Math.round((dv.getUint16(i, true) / 1024) * 1000));
    onBeat(bpm, rr);
  });
  await ch.startNotifications();
  return { name: device.name as string, disconnect: () => device.gatt.connected && device.gatt.disconnect() };
}

export const bleSupported = () => !!(navigator as any).bluetooth;

type HealthPlugin = {
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(o: { read: string[] }): Promise<void>;
  readLatest(o: { types: string[] }): Promise<Record<string, number | null>>;
};
const Health = registerPlugin<HealthPlugin>("Med1Health");

export const healthBridgePlatform = () =>
  Capacitor.getPlatform() === "ios" ? "Apple Health" : Capacitor.getPlatform() === "android" ? "Health Connect" : null;

/** Reads the latest watch metrics through the native bridge. Returns null when the bridge isn't installed. */
export async function readHealthStore(): Promise<WearableSummary | null> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("Med1Health")) return null;
  const { available } = await Health.isAvailable();
  if (!available) return null;
  const types = ["heart_rate", "spo2", "sleep", "steps"];
  await Health.requestAuthorization({ read: types });
  const d = await Health.readLatest({ types });
  return { bpm: d.heart_rate, spo2: d.spo2, sleepHours: d.sleep, steps: d.steps, source: healthBridgePlatform() ?? "Health" };
}

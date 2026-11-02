// BLE heart-rate watches/straps: native Bluetooth in the phone app, Web Bluetooth on the site.
// Health Connect lives in healthConnect.ts.
import { isNativeApp } from "@/lib/nativeApp";

export type WearableSummary = { bpm?: number | null; spo2?: number | null; sleepHours?: number | null; steps?: number | null; source: string };

const HR_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb";
const HR_MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb";

/** Parses a BLE Heart Rate Measurement (0x2A37) packet. */
export function parseHeartRate(dv: DataView): { bpm: number; rr: number[] } {
  const flags = dv.getUint8(0);
  const wide = flags & 0x01;
  let i = 1;
  const bpm = wide ? dv.getUint16(i, true) : dv.getUint8(i);
  i += wide ? 2 : 1;
  if (flags & 0x08) i += 2; // energy expended
  const rr: number[] = [];
  if (flags & 0x10) for (; i + 1 < dv.byteLength; i += 2) rr.push(Math.round((dv.getUint16(i, true) / 1024) * 1000));
  return { bpm, rr };
}

async function connectNative(onBeat: (bpm: number, rr: number[]) => void) {
  const { BleClient } = await import("@capacitor-community/bluetooth-le");
  await BleClient.initialize();
  if (!(await BleClient.isEnabled())) {
    try { await BleClient.requestEnable(); } catch { throw new Error("BT_OFF"); }
  }
  // Watches often only advertise the heart-rate service while "HR broadcast" is on,
  // so first try the filtered picker, then let the user choose from all nearby devices.
  let device;
  try {
    device = await BleClient.requestDevice({ services: [HR_SERVICE] });
  } catch {
    device = await BleClient.requestDevice({ optionalServices: [HR_SERVICE] });
  }
  await BleClient.connect(device.deviceId, () => { /* disconnected */ }, { timeout: 15000 });
  const services = await BleClient.getServices(device.deviceId);
  if (!services.some((s) => s.uuid.toLowerCase() === HR_SERVICE)) {
    await BleClient.disconnect(device.deviceId).catch(() => {});
    throw new Error("NO_HR_SERVICE");
  }
  await BleClient.startNotifications(device.deviceId, HR_SERVICE, HR_MEASUREMENT, (dv) => {
    const { bpm, rr } = parseHeartRate(dv);
    onBeat(bpm, rr);
  });
  return {
    name: device.name ?? "Bluetooth soat",
    disconnect: () => { void BleClient.stopNotifications(device.deviceId, HR_SERVICE, HR_MEASUREMENT).catch(() => {}).then(() => BleClient.disconnect(device.deviceId)).catch(() => {}); },
  };
}

/** BLE Heart Rate Service (0x180D). Calls onBeat for every notification. */
export async function connectBleHeartRate(onBeat: (bpm: number, rr: number[]) => void) {
  if (isNativeApp()) return connectNative(onBeat);
  const bt = (navigator as any).bluetooth;
  if (!bt) throw new Error("NO_WEB_BLUETOOTH");
  let device;
  try {
    device = await bt.requestDevice({ filters: [{ services: ["heart_rate"] }] });
  } catch (e: any) {
    if (e?.name !== "NotFoundError") throw e;
    device = await bt.requestDevice({ acceptAllDevices: true, optionalServices: ["heart_rate"] });
  }
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService("heart_rate").catch(() => { throw new Error("NO_HR_SERVICE"); });
  const ch = await service.getCharacteristic("heart_rate_measurement");
  ch.addEventListener("characteristicvaluechanged", (e: any) => {
    const { bpm, rr } = parseHeartRate(e.target.value as DataView);
    onBeat(bpm, rr);
  });
  await ch.startNotifications();
  return { name: device.name as string, disconnect: () => device.gatt.connected && device.gatt.disconnect() };
}

export const bleSupported = () => isNativeApp() || !!(navigator as any).bluetooth;

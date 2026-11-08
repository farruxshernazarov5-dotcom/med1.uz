// BLE heart-rate watches/straps: native Bluetooth in the phone app, Web Bluetooth on the site.
// Health Connect lives in healthConnect.ts.
import { isNativeApp } from "@/lib/nativeApp";

export type WearableSummary = { bpm?: number | null; spo2?: number | null; sleepHours?: number | null; steps?: number | null; source: string };

const HR_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb";
const HR_MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb";

/** Parses a BLE Heart Rate Measurement (0x2A37) packet. */
export function parseHeartRate(dv: DataView): { bpm: number; rr: number[] } {
  if (dv.byteLength < 2) throw new Error('INVALID_HR_PACKET');
  const flags = dv.getUint8(0);
  const wide = flags & 0x01;
  if (wide && dv.byteLength < 3) throw new Error('INVALID_HR_PACKET');
  let i = 1;
  const bpm = wide ? dv.getUint16(i, true) : dv.getUint8(i);
  if (bpm < 20 || bpm > 250) throw new Error('INVALID_HR_PACKET');
  i += wide ? 2 : 1;
  if (flags & 0x08) { i += 2; if (dv.byteLength < i) throw new Error('INVALID_HR_PACKET'); }
  const rr: number[] = [];
  if (flags & 0x10) for (; i + 1 < dv.byteLength; i += 2) rr.push(Math.round((dv.getUint16(i, true) / 1024) * 1000));
  return { bpm, rr };
}

async function connectNative(onBeat: (bpm: number, rr: number[]) => void, onDisconnect?: () => void) {
  const { BleClient } = await import("@capacitor-community/bluetooth-le");
  await BleClient.initialize();
  if (!(await BleClient.isEnabled())) {
    try { await BleClient.requestEnable(); } catch { throw new Error("BT_OFF"); }
  }
  // One chooser, including devices that advertise HR only after connecting.
  const device = await BleClient.requestDevice({ optionalServices: [HR_SERVICE] });
  try {
  await BleClient.connect(device.deviceId, () => onDisconnect?.(), { timeout: 15000 });
  const services = await BleClient.getServices(device.deviceId);
  if (!services.some((s) => s.uuid.toLowerCase() === HR_SERVICE)) {
    await BleClient.disconnect(device.deviceId).catch(() => {});
    throw new Error("NO_HR_SERVICE");
  }
  await BleClient.startNotifications(device.deviceId, HR_SERVICE, HR_MEASUREMENT, (dv) => {
    try { const { bpm, rr } = parseHeartRate(dv); onBeat(bpm, rr); } catch { /* Ignore malformed device packets. */ }
  });
  return {
    name: device.name ?? "Bluetooth soat",
    disconnect: () => { void BleClient.stopNotifications(device.deviceId, HR_SERVICE, HR_MEASUREMENT).catch(() => {}).then(() => BleClient.disconnect(device.deviceId)).catch(() => {}); },
  };
  } catch (error) { await BleClient.disconnect(device.deviceId).catch(() => {}); throw error; }
}

/** BLE Heart Rate Service (0x180D). Calls onBeat for every notification. */
export async function connectBleHeartRate(onBeat: (bpm: number, rr: number[]) => void, onDisconnect?: () => void) {
  if (isNativeApp()) return connectNative(onBeat, onDisconnect);
  const bt = (navigator as any).bluetooth;
  if (!bt) throw new Error("NO_WEB_BLUETOOTH");
  const device = await bt.requestDevice({ acceptAllDevices: true, optionalServices: ['heart_rate'] });
  const disconnected = () => onDisconnect?.();
  device.addEventListener('gattserverdisconnected', disconnected);
  try {
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService("heart_rate").catch(() => { throw new Error("NO_HR_SERVICE"); });
  const ch = await service.getCharacteristic("heart_rate_measurement");
  const changed = (e: any) => { try { const { bpm, rr } = parseHeartRate(e.target.value as DataView); onBeat(bpm, rr); } catch { /* malformed packet */ } };
  ch.addEventListener('characteristicvaluechanged', changed);
  await ch.startNotifications();
  return { name: device.name as string, disconnect: () => { ch.removeEventListener('characteristicvaluechanged', changed); device.removeEventListener('gattserverdisconnected', disconnected); if (device.gatt.connected) device.gatt.disconnect(); } };
  } catch (error) { device.removeEventListener('gattserverdisconnected', disconnected); if (device.gatt.connected) device.gatt.disconnect(); throw error; }
}

export const bleSupported = () => isNativeApp() || !!(navigator as any).bluetooth;

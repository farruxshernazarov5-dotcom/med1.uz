// BLE heart-rate straps via Web Bluetooth. Health Connect lives in healthConnect.ts.

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


import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/nativeApp', () => ({ isNativeApp: () => false }));
import { connectBleHeartRate, parseHeartRate } from './wearables';
const packet = (...bytes: number[]) => new DataView(new Uint8Array(bytes).buffer);
describe('Bluetooth pulse', () => {
  it('reads 16 bit heart rate and RR milliseconds', () => expect(parseHeartRate(packet(17,72,0,0,4))).toEqual({bpm:72,rr:[1000]}));
  it('rejects truncated or invalid packets', () => { expect(()=>parseHeartRate(packet(1,72))).toThrow(); expect(()=>parseHeartRate(packet(0,0))).toThrow(); });
  it('never opens another chooser on cancellation', async () => {
    const requestDevice=vi.fn().mockRejectedValue(new DOMException('Cancelled','NotFoundError'));
    Object.defineProperty(navigator,'bluetooth',{configurable:true,value:{requestDevice}});
    await expect(connectBleHeartRate(vi.fn())).rejects.toThrow('Cancelled');
    expect(requestDevice).toHaveBeenCalledTimes(1);
  });
});
import { afterEach, expect, it, vi } from 'vitest';
import { generateStampDataUrl } from './generatePaymentStamp';

afterEach(() => vi.unstubAllGlobals());

it('keeps the official 743 × 754 seal proportional in a square receipt image', async () => {
  const drawImage = vi.fn();
  const clearRect = vi.fn();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'image/png' }),
    blob: async () => new Blob(),
  }));
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:seal', revokeObjectURL: vi.fn() });
  vi.stubGlobal('Image', class {
    naturalWidth = 743;
    naturalHeight = 754;
    onload?: () => void;
    set src(_value: string) { this.onload?.(); }
  });
  vi.stubGlobal('document', {
    createElement: () => ({
      width: 0, height: 0,
      getContext: () => ({ drawImage, clearRect }),
      toDataURL: () => 'data:image/png;base64,seal',
    }),
  });
  await generateStampDataUrl({ receiptNumber: 'CHK-2026-1', paidAt: new Date(), microId: '123456' }, 960);
  const [, x, y, width, height] = drawImage.mock.calls[0];
  expect(width / height).toBeCloseTo(743 / 754, 10);
  expect(height).toBe(960);
  expect(y).toBe(0);
  expect(x).toBeCloseTo((960 - width) / 2, 10);
  expect(width).toBeLessThan(960);
});
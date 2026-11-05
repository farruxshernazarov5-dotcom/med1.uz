import { afterEach, describe, expect, it, vi } from 'vitest';
import { beginExternalPicker, endExternalPicker, isExternalPickerOpen, markHidden, saveLockSettings, shouldLockOnResume } from './appLock';
afterEach(() => { vi.useRealTimers(); sessionStorage.clear(); localStorage.clear(); });
describe('camera selection never counts as idle time', () => {
  it('clears an earlier background timestamp after photo selection', () => {
    saveLockSettings({ method: 'pin', biometric: false, timeoutMin: 0 });
    markHidden();
    expect(shouldLockOnResume()).toBe(true);
    beginExternalPicker();
    expect(shouldLockOnResume()).toBe(false);
    endExternalPicker();
    expect(shouldLockOnResume()).toBe(false);
  });
  it('keeps the three minute guard bounded', () => {
    vi.useFakeTimers(); beginExternalPicker();
    expect(isExternalPickerOpen()).toBe(true);
    vi.advanceTimersByTime(180001);
    expect(isExternalPickerOpen()).toBe(false);
  });
});
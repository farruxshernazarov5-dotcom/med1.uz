import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ schedule: vi.fn(), cancel: vi.fn(), getPending: vi.fn() }));
vi.mock("./nativeApp", () => ({ isNativeApp: () => true }));
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: () => "ios" } }));
vi.mock("@capacitor/local-notifications", () => ({ LocalNotifications: mocks }));
import { listReminders, scheduleMedication, snoozeReminder } from "./nativeHealth";
describe("OS reminders", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("schedules unique daily medication times", async () => {
    expect(await scheduleMedication("Test", "", ["08:00", "08:00"])).toBe(1);
    expect(mocks.schedule.mock.calls[0][0].notifications[0].schedule).toMatchObject({ on: { hour: 8, minute: 0 }, repeats: true });
  });
  it("keeps daily alarm when snoozed", async () => {
    await snoozeReminder({ id: 123, title: "Test", body: "", kind: "med", time: "08:00" });
    expect(mocks.cancel).not.toHaveBeenCalled();
    expect(mocks.schedule.mock.calls[0][0].notifications[0].id).not.toBe(123);
  });
  it("uses stored kind instead of guessing pregnancy from ID", async () => {
    mocks.getPending.mockResolvedValue({ notifications: [{ id: 450001, title: "Test", body: "", extra: { kind: "preg" } }] });
    expect((await listReminders())[0].kind).toBe("preg");
  });
});
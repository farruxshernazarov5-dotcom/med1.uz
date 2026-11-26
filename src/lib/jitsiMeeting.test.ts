import { beforeEach, expect, it, vi } from "vitest";
const native = vi.hoisted(() => ({ installed: true, completed: true, canOpenUrl: vi.fn(), openUrl: vi.fn(), browserOpen: vi.fn() }));
vi.mock("./nativeApp", () => ({ isNativeApp: () => true, nativePlatform: () => "android" }));
vi.mock("@capacitor/app-launcher", () => ({ AppLauncher: { canOpenUrl: native.canOpenUrl, openUrl: native.openUrl } }));
vi.mock("@capacitor/browser", () => ({ Browser: { open: native.browserOpen } }));
import { jitsiLinks, openJitsiMeeting } from "./jitsiMeeting";
beforeEach(() => { vi.clearAllMocks(); native.canOpenUrl.mockResolvedValue({ value: true }); native.openUrl.mockResolvedValue({ completed: true }); });
it("opens exactly the same consultation room in the Jitsi app", () => {
  expect(jitsiLinks("https://meet.jit.si/med1-123#config.prejoinPageEnabled=false")).toEqual({ web: "https://meet.jit.si/med1-123", app: "org.jitsi.meet://meet.jit.si/med1-123" });
});
it("rejects non-Jitsi and malformed room links", () => {
  for (const url of ["https://evil.test/room", "https://meet.jit.si.evil.test/room", "https://meet.jit.si/a/b", "https://user@meet.jit.si/room", "javascript:alert(1)"]) expect(() => jitsiLinks(url)).toThrow();
});
it("launches the installed Android Jitsi app without opening a browser", async () => {
  await openJitsiMeeting("https://meet.jit.si/med1-123");
  expect(native.canOpenUrl).toHaveBeenCalledWith({ url: "org.jitsi.meet" });
  expect(native.openUrl).toHaveBeenCalledWith({ url: "org.jitsi.meet://meet.jit.si/med1-123" });
  expect(native.browserOpen).not.toHaveBeenCalled();
});
it("opens the same official web meeting when Jitsi is absent", async () => {
  native.canOpenUrl.mockResolvedValue({ value: false });
  await openJitsiMeeting("https://meet.jit.si/med1-123");
  expect(native.openUrl).not.toHaveBeenCalled();
  expect(native.browserOpen).toHaveBeenCalledWith({ url: "https://meet.jit.si/med1-123" });
});
it("falls back to HTTPS when an older APK cannot use AppLauncher", async () => {
  native.canOpenUrl.mockRejectedValue(new Error("plugin unavailable"));
  await openJitsiMeeting("https://meet.jit.si/med1-123");
  expect(native.browserOpen).toHaveBeenCalledWith({ url: "https://meet.jit.si/med1-123" });
});
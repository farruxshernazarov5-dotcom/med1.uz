import { beforeEach, describe, expect, it, vi } from "vitest";

const hostInfo = {
  sdkVersion: "1.0.2", platform: "android", capabilities: {},
  context: { theme: "dark", locale: "uz", safeArea: { top: 0, right: 0, bottom: 0, left: 0 } },
};

function setMeta(name: string, content: string) {
  const el = document.createElement("meta");
  el.name = name; el.content = content; document.head.appendChild(el);
}

function mockHost(info = hostInfo) {
  const sdk = { init: vi.fn().mockResolvedValue(info), ready: vi.fn().mockResolvedValue(undefined) };
  Object.assign(window, { ClickSDK: sdk, ClickSDKAndroid: { postMessage: vi.fn() } });
  return sdk;
}

beforeEach(() => {
  vi.resetModules();
  for (const key of ["ClickSDK", "ClickSDKAndroid", "webkit"]) Reflect.deleteProperty(window, key);
  document.head.querySelectorAll('meta[name^="click-"]').forEach((el) => el.remove());
  document.documentElement.classList.remove("click-miniapp");
});

describe("Click MiniApp lifecycle", () => {
  it('returns through the official Click close method only after handshake', async () => {
    const sdk = {...mockHost(), close: vi.fn()};
    Object.assign(window,{ClickSDK:sdk});
    const click=await import('./clickMiniApp');
    await click.installClickMiniApp(); click.returnToClick();
    expect(sdk.close).toHaveBeenCalledTimes(1);
  });
  it("does not activate from the CDN global alone in an ordinary browser", async () => {
    const sdk = mockHost(); Reflect.deleteProperty(window, "ClickSDKAndroid");
    const click = await import("./clickMiniApp");
    await click.installClickMiniApp(); await click.readyClickMiniApp();
    expect(sdk.init).not.toHaveBeenCalled();
    expect(click.getClickMiniAppState().active).toBe(false);
  });

  it("initializes once, reports platform/theme, and sends ready only when requested", async () => {
    const sdk = mockHost();
    const click = await import("./clickMiniApp");
    await Promise.all([click.installClickMiniApp(), click.installClickMiniApp()]);
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(click.getClickMiniAppState()).toEqual({ active: true, platform: "android", theme: "dark" });
    expect(sdk.ready).not.toHaveBeenCalled();
    await Promise.all([click.readyClickMiniApp(), click.readyClickMiniApp()]);
    expect(sdk.ready).toHaveBeenCalledTimes(1);
  });

  it("supports the actual iOS SDK transport", async () => {
    const sdk = mockHost({ ...hostInfo, platform: "ios", context: { ...hostInfo.context, theme: "light" } });
    Reflect.deleteProperty(window, "ClickSDKAndroid");
    Object.assign(window, { webkit: { messageHandlers: { ClickSDK: { postMessage: vi.fn() } } } });
    const click = await import("./clickMiniApp"); await click.installClickMiniApp();
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(click.getClickMiniAppState()).toEqual({ active: true, platform: "ios", theme: "light" });
  });

  it("keeps the website usable after a failed handshake", async () => {
    const sdk = mockHost(); sdk.init.mockRejectedValue(new Error("TIMEOUT"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const click = await import("./clickMiniApp"); await click.readyClickMiniApp();
    expect(click.getClickMiniAppState().active).toBe(false);
    expect(sdk.ready).not.toHaveBeenCalled(); warn.mockRestore();
  });

  it("reads only a validated hosting session and never interprets it as login", async () => {
    const click = await import("./clickMiniApp");
    setMeta("click-web-session", "invalid"); expect(click.getClickWebSession()).toBeNull();
    document.head.querySelector('meta[name="click-web-session"]')?.remove();
    setMeta("click-web-session", "9719f458-de27-4784-96fb-1eec1fb03352");
    expect(click.getClickWebSession()).toBe("9719f458-de27-4784-96fb-1eec1fb03352");
    expect(click.getClickMiniAppState().active).toBe(false);
  });
});

describe("Click MiniApp payment links", () => {
  const checkout = "https://my.click.uz/services/pay?service_id=12345&merchant_id=678&amount=15000&transaction_param=invoice-1&return_url="
    + encodeURIComponent("https://med1.uz/payment/success?payment_id=invoice-1");

  it("leaves existing web and Payme links unchanged", async () => {
    const click = await import("./clickMiniApp");
    expect(click.clickMiniAppCheckoutUrl(checkout)).toBe(checkout);
    mockHost(); await click.installClickMiniApp();
    expect(click.clickMiniAppCheckoutUrl("https://checkout.paycom.uz/example")).toBe("https://checkout.paycom.uz/example");
  });

  it("uses the documented nested Click WebView return and preserves server invoice values", async () => {
    mockHost(); setMeta("click-miniapp-service-id", "12345");
    const click = await import("./clickMiniApp"); await click.installClickMiniApp();
    const out = new URL(click.clickMiniAppCheckoutUrl(checkout));
    expect(out.pathname).toBe("/services/pay/");
    expect(out.searchParams.get("amount")).toBe("15000");
    expect(out.searchParams.get("service_id")).toBe("12345");
    expect(out.searchParams.get("merchant_id")).toBe("678");
    expect(out.searchParams.get("transaction_param")).toBe("invoice-1");
    const nested = new URL(out.searchParams.get("return_url") ?? "");
    expect(nested.origin + nested.pathname).toBe("https://my.click.uz/app/webView");
    expect(nested.searchParams.get("auth")).toBe("true");
    expect(nested.searchParams.get("show_header")).toBe("true");
    expect(nested.searchParams.get("hide_cross")).toBe("false");
    expect([...nested.searchParams.keys()].at(-1)).toBe("url");
    expect(nested.searchParams.get("url")).toBe("https://med1.uz/payment/success?payment_id=invoice-1&transaction_id=");
    expect(out.href).toContain("https%253A%252F%252Fmed1.uz");
  });

  it("requires matching dedicated service configuration, without replacing IDs", async () => {
    mockHost(); const click = await import("./clickMiniApp"); await click.installClickMiniApp();
    expect(() => click.clickMiniAppCheckoutUrl(checkout)).toThrow("alohida Service ID");
    setMeta("click-miniapp-service-id", "99999");
    expect(() => click.clickMiniAppCheckoutUrl(checkout)).toThrow("alohida Service ID");
  });

  it("rejects external return hosts and URL credentials", async () => {
    const click = await import("./clickMiniApp");
    for (const url of ["https://evil.example/", "https://med1.uz.evil.example/", "http://med1.uz/", "https://u:p@med1.uz/", "https://med1.uz:8443/"]) {
      expect(() => click.clickMiniAppReturnUrl(url)).toThrow();
    }
    const nested = new URL(click.clickMiniAppReturnUrl("https://med1.uz/payment/success#old"));
    expect(nested.searchParams.get("url")).toBe("https://med1.uz/payment/success?transaction_id=");
  });
});
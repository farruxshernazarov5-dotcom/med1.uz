import { describe, it, expect } from "vitest";
import { beginServiceActivity, followServiceResponse, getServiceActivities } from "./serviceActivity";
describe("real service lifecycle", () => {
  it("keeps concurrent requests active independently", () => {
    const first = beginServiceActivity("ai-report-analysis"); const second = beginServiceActivity("ai-vital-signs");
    first(); first(); expect(getServiceActivities().map(a => a.service)).toEqual(["ai-vital-signs"]);
    second(); expect(getServiceActivities()).toEqual([]);
  });
  it("does not finish at headers and finishes only after consuming the result", async () => {
    const finish = beginServiceActivity("ai-doctor-chat");
    const response = followServiceResponse(new Response("data: result"), finish);
    expect(getServiceActivities()).toHaveLength(1);
    expect(await response.text()).toBe("data: result");
    expect(getServiceActivities()).toHaveLength(0);
  });
  it("clears a failed response", () => {
    const finish = beginServiceActivity("ai-fitness");
    followServiceResponse(new Response("error", { status: 500 }), finish);
    expect(getServiceActivities()).toHaveLength(0);
  });
  it("clears a cancelled stream", async () => {
    const finish = beginServiceActivity("ai-report-analysis");
    const response = followServiceResponse(new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1])); } })), finish);
    await response.body?.cancel(); expect(getServiceActivities()).toHaveLength(0);
  });
});
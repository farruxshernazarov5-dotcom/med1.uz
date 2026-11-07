export type ServiceActivity = { id: number; service: string; startedAt: number };
let serial = 0;
let activities: ServiceActivity[] = [];
const listeners = new Set<() => void>();
export const getServiceActivities = () => activities;
export function subscribeServiceActivities(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function beginServiceActivity(service: string) {
  const id = ++serial;
  activities = [...activities, { id, service, startedAt: Date.now() }];
  listeners.forEach(fn => fn());
  let ended = false;
  return () => { if (ended) return; ended = true; activities = activities.filter(a => a.id !== id); listeners.forEach(fn => fn()); };
}

/** Follow consumption, not headers: streaming AI stays active until its final byte or cancellation. */
export function followServiceResponse(response: Response, finish: () => void): Response {
  if (!response.ok || !response.body) { finish(); return response; }
  const reader = response.body.getReader();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try { const { done, value } = await reader.read(); if (done) { finish(); controller.close(); } else controller.enqueue(value); }
      catch (error) { finish(); controller.error(error); }
    },
    async cancel(reason) { finish(); await reader.cancel(reason); },
  }, { highWaterMark: 0 });
  const tracked = new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  Object.defineProperty(tracked, "url", { value: response.url });
  return tracked;
}
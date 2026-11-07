# MED ALL service status

`public/platform-status.json` is deployment-owned public configuration, not a user-writable preference. It contains no patient data and needs no database polling. Edit and publish it when an operational announcement is required; default maintenance is off and no release is announced.

## Maintenance

Set `maintenance.active` to `true`, provide `title`, `message` and optional human-readable `until`. Empty `paths` affects all public routes including Click; an explicit array (for example `["/ai-radiology"]`) limits the notice to those paths and descendants. Admin and authentication recovery remain accessible. Turn it off and publish when work ends. This is a presentation notice, not a server security/access gate.

## Releases

Set `release` to `{ "version": "unique-release-id", "title": "MED ALL yangilandi", "message": "Actual release summary", "highlights": ["Actual change"] }`. Visitors see it once per device/browser for that release ID. Set null when there is nothing to announce. A notice does not install a new native APK or claim an update that has not shipped. Status checks occur on startup and every five minutes while visible; failed reads do not invent downtime.

## Processing

Known AI endpoints on the configured backend are observed in `installAiInvokeHeaders.ts`; no unrelated network traffic or request payload is tracked. Streaming responses stay active until consumption finishes, errors or cancellation. The non-modal panel appears after 650 ms; minimize does not cancel the task. Counters represent elapsed time, never fabricated percentage or stages. Existing file inputs and page state remain mounted. Route loading and payment verification reuse the same visual component. Camera acquisition and payment terminal states keep their existing specialized workflows.

Verify on a rebuilt native APK for native distribution. Browser tests cover notice configuration, once-per-release dismissal, response completion, errors and cancellation.
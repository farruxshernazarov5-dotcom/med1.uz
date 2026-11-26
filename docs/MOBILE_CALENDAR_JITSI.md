# Calendar and Jitsi release setup

- Update the local checkout from the connected repository, install dependencies, then run `npm run android:update` (build, `npx cap sync android`, manifest patch). Install the rebuilt APK; old APKs do not have the calendar or app-launcher plugins.
- Calendar uses `createEventWithPrompt`: Android opens the device's event editor without reading calendars; the patient must save it. iOS presents EventKit's editor. No calendar events are silently inserted or tracked in browser storage. A moved/cancelled booking must also be updated in the phone calendar by the patient.
- Web exports a `.ics` file with the booked Uzbekistan time, doctor/service/address, and alarms. Import it using the phone calendar. Daily reminder exports preserve recurrence; Android's calendar editor controls its own alarms, while existing Med ALL local notifications remain separate.
- Android manifest patch adds package visibility for `org.jitsi.meet`. Installed Jitsi opens the same room via `org.jitsi.meet://meet.jit.si/<room>`, otherwise the official HTTPS meeting page opens. No conference credentials or patient data go in the link.
- iOS: add `org.jitsi.meet` to `LSApplicationQueriesSchemes` in `ios/App/App/Info.plist`; add `NSCalendarsUsageDescription` and `NSCalendarsWriteOnlyAccessUsageDescription` with a patient-facing reason for adding appointments. Update local code, build and run `npx cap sync ios` before rebuilding in Xcode.
- Booking QR opens the canonical HTTPS profile with `?booking=<code>`. Appointment and payment details read through existing account permissions; signing in never grants a stranger access. No new public appointment policy or legacy public document verification is used.
- Payment-safety photos resolve hosted asset pointers to `https://med1.uz` inside bundled native apps; ordinary web paths and bundled assets stay unchanged.

## Verification

- 17 focused tests passed, including Uzbekistan timestamps, daily recurrence, ICS alarms, same-room Android handoff and missing-plugin fallback. Preview build passed.
- Signed-in mobile browser: selected a real doctor's service, November 27 at 09:00, and reached the payment step without creating a booking. Confirmation stayed disabled until consent was checked. Native-hosted safety photo URLs decoded successfully for all six images.
- Browser exported an ICS with `DTSTART:20261127T040000Z` and 24-hour/1-hour alarms. An unknown booking QR was denied through account permissions. The signed-in account had no existing appointments, so a real appointment/payment QR read is not yet verified.
- Native event save, installed-Jitsi launch and actual phone image rendering require a rebuilt APK/device. No native platform project is present in this checkout.
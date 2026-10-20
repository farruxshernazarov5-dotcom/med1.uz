# Vital AI Rules

- Vital AI signal processing lives in `src/lib/vitals/` (pure DSP in `dsp.ts`, camera 3A/torch in `camera.ts`, BLE in `wearables.ts`, Health Connect/Apple Health import via `@capgo/capacitor-health` in `healthConnect.ts` (new-since-last-import rows into `health_records`, only an on/off flag locally)); sensors only report results, so finger, face and watch sources share one analysis and AI path.
- Face tracking for Vital AI rPPG and Psixolog AI expression scans runs only on-device via `src/lib/vitals/faceMesh.ts` (MediaPipe Face Landmarker); images never leave the phone and only numeric scores are sent to AI, because face images are sensitive biometric data.
- Camera `<video>` elements used for analysis must stay visible on screen, because Android Chrome/WebView pauses hidden muted videos and the measurement freezes.
- Finger PPG uses only rear lenses from `probeRearLenses()` and auto-scans torch lenses when the frame stays dark or pulse-less, because multi-lens phones put the flash next to only one lens.

// Adds the permissions and the Google sign-in return link to the Android app.
// Run after `npx cap sync android` (npm run android:update does all steps).
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const file = "android/app/src/main/AndroidManifest.xml";
if (!existsSync(file)) {
  console.error(`✗ ${file} topilmadi. Avval: npx cap add android`);
  process.exit(1);
}
let xml = readFileSync(file, "utf8");

const permissions = [
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.WAKE_LOCK",
  "android.permission.VIBRATE",
  "android.permission.USE_BIOMETRIC",
  "android.permission.USE_FINGERPRINT",
  "android.permission.CAMERA",
  "android.permission.RECORD_AUDIO",
  "android.permission.INTERNET",
];
const missing = permissions.filter((p) => !xml.includes(`"${p}"`));
if (missing.length) {
  xml = xml.replace(/<application/, `${missing.map((p) => `<uses-permission android:name="${p}" />`).join("\n    ")}\n\n    <application`);
}

// Google / Microsoft sign-in returns to the app through uz.medall.app://app-auth
if (!xml.includes('android:host="app-auth"')) {
  const filter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="uz.medall.app" android:host="app-auth" />
            </intent-filter>`;
  xml = xml.replace(/(<activity[^>]*android:name="\.?MainActivity"[\s\S]*?<\/intent-filter>)/, `$1${filter}`);
}

// Single task keeps one app window when the browser hands the sign-in back.
xml = xml.replace(/android:launchMode="[^"]*"/, 'android:launchMode="singleTask"');

writeFileSync(file, xml);
console.log(`✓ AndroidManifest yangilandi (${missing.length} ta ruxsat qo‘shildi, Google qaytish havolasi tayyor).`);

// Custom reminder sounds (Android reads them from res/raw by file name).
const rawDir = "android/app/src/main/res/raw";
mkdirSync(rawDir, { recursive: true });
for (const f of readdirSync("resources/android/raw")) copyFileSync(`resources/android/raw/${f}`, `${rawDir}/${f}`);
console.log("✓ Eslatma ovozlari qo‘shildi.");

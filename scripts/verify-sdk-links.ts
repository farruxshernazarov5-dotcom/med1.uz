import fs from "node:fs/promises";

type SdkManifest = {
  site_origin: string;
  sdks: Array<{ language: string; version: string; download_path: string }>;
};

const manifest = JSON.parse(await fs.readFile("public/sdk/manifest.json", "utf8")) as SdkManifest;
const origin = (process.env.SDK_VERIFY_ORIGIN || manifest.site_origin).replace(/\/$/, "");

async function check(path: string) {
  const url = `${origin}${path}`;
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: "GET", headers: { Range: "bytes=0-64" }, redirect: "follow" });
    }
    return { url, status: res.status, ok: res.ok };
  } catch (error) {
    return { url, status: 0, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

const results = await Promise.all(manifest.sdks.map((sdk) => check(sdk.download_path)));
for (const result of results) {
  const mark = result.ok ? "OK" : "FAIL";
  console.log(`${mark} ${result.status} ${result.url}${"error" in result ? ` — ${result.error}` : ""}`);
}

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(`\n${failed.length} SDK download link(s) are unavailable. Re-run with SDK_VERIFY_ORIGIN=http://localhost:8080 for local preview checks.`);
  process.exit(1);
}
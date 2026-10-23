import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./i18n/config";
import "./index.css";
import { installErrorTracker } from "./lib/errorTracker";
import { installAiInvokeHeaders } from "./lib/installAiInvokeHeaders";
import { installTelegramWebApp } from "./lib/telegramWebApp";
import { watchClickSDKLoad } from "./lib/clickMiniApp";

installErrorTracker();
installAiInvokeHeaders();
installTelegramWebApp();
watchClickSDKLoad();

// After an update, old page files disappear; reload once to fetch the new ones.
const CHUNK_RELOAD_KEY = "med1_chunk_reload_at";
const reloadForNewVersion = () => {
  const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
  if (Date.now() - last < 30_000) return false;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  window.location.reload();
  return true;
};
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});
window.addEventListener("unhandledrejection", (event) => {
  const msg = String((event.reason as Error)?.message ?? event.reason ?? "");
  if (/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) reloadForNewVersion();
});

const root = document.getElementById("root");
if (!root) throw new Error("App root topilmadi");
createRoot(root).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./i18n/config";
import "./index.css";
import { installErrorTracker } from "./lib/errorTracker";
import { installAiInvokeHeaders } from "./lib/installAiInvokeHeaders";

installErrorTracker();
installAiInvokeHeaders();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

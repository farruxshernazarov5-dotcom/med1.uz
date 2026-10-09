import type { NavigateFunction } from "react-router-dom";

/**
 * Go back inside the app; when the screen was opened directly (deep link,
 * notification, restored screen) there is no in-app history, so go Home.
 */
export function goBackSafe(navigate: NavigateFunction, fallback = "/") {
  const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
  if (idx > 0) navigate(-1);
  else navigate(fallback, { replace: true });
}

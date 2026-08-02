import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logActivity, labelForPath } from "@/lib/activityLog";

/**
 * Records every route change into the signed-in user's personal activity history.
 * Must be rendered inside <BrowserRouter>.
 */
const ActivityTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const module = path.startsWith("/ai-")
      ? "ai"
      : path.startsWith("/dashboard")
        ? "dashboard"
        : path.split("/")[1] || "home";

    const timer = window.setTimeout(() => {
      logActivity({
        action_type: "page_view",
        title: labelForPath(path),
        description: "Sahifa ochildi",
        module,
        path,
        metadata: location.search ? { query: location.search.slice(0, 200) } : {},
      });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
};

export default ActivityTracker;

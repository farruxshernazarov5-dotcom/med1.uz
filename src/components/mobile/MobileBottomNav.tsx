import { memo, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Sparkles, MapPin, HeartPulse, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/lib/dashboard";
import { hapticTap } from "@/lib/nativeApp";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  to: string;
  icon: typeof Home;
  match: (path: string) => boolean;
};

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { user, userRole } = useAuth();
  const dashboardPath = getDashboardPath(userRole);

  const items = useMemo<Item[]>(
    () => [
      { label: "Asosiy", to: "/", icon: Home, match: (p) => p === "/" },
      {
        label: "AI",
        to: "/ai-services",
        icon: Sparkles,
        match: (p) => p.startsWith("/ai") || p.startsWith("/symptom-checker") || p.startsWith("/smart-search"),
      },
      {
        label: "Yaqin",
        to: "/clinics",
        icon: MapPin,
        match: (p) =>
          ["/clinics", "/doctors", "/pharmacies", "/diagnostics", "/dental", "/maternity", "/blood-banks", "/cosmetology"].some(
            (r) => p.startsWith(r),
          ),
      },
      {
        label: "Salomatlik",
        to: user ? dashboardPath : "/health",
        icon: HeartPulse,
        match: (p) => p.startsWith("/health") || p.startsWith("/dashboard"),
      },
      {
        label: user ? "Kabinet" : "Kirish",
        to: user ? "/dashboard/patient" : "/auth",
        icon: User,
        match: (p) => p.startsWith("/auth") || p.startsWith("/dashboard/patient"),
      },
    ],
    [user, dashboardPath],
  );

  const hiddenOn = ["/auth", "/reset-password", "/forgot-password"];
  if (hiddenOn.some((r) => pathname.startsWith(r)) && pathname !== "/auth") return null;

  return (
    <nav
      aria-label="Asosiy mobil menyu"
      className="app-bottom-nav lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                onClick={() => void hapticTap()}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors active:scale-95",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/10",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default memo(MobileBottomNav);

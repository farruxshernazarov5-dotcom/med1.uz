import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarCheck, Grid2X2, Home, Sparkles, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/lib/dashboard";
import { hapticTap } from "@/lib/nativeApp";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const handleScroll = () => {
      const nextY = window.scrollY;
      const delta = nextY - lastY.current;
      if (nextY < 48 || delta < -8) setVisible(true);
      if (nextY > 120 && delta > 8) setVisible(false);
      lastY.current = nextY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const items = useMemo<Item[]>(
    () => [
      { label: "Asosiy", to: "/", icon: Home, match: (p) => p === "/" },
      {
        label: "Xizmatlar",
        to: "/mobile-services",
        icon: Grid2X2,
        match: (p) =>
          ["/mobile-services", "/clinics", "/doctors", "/pharmacies", "/diagnostics", "/dental", "/maternity", "/blood-banks", "/cosmetology"].some(
            (r) => p.startsWith(r),
          ),
      },
      {
        label: "Qabullar",
        to: "/mobile-appointments",
        icon: CalendarCheck,
        match: (p) => p.startsWith("/mobile-appointments") || p.startsWith("/mobile-tips") || p.startsWith("/booking"),
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
      className={cn(
        "app-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl transition-transform duration-300 lg:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <ul className="grid grid-cols-5">
        {items.slice(0, 2).map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                onClick={() => void hapticTap()}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
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
        <li className="relative flex justify-center">
          <Button
            id="mobile-ai-trigger"
            variant="ghost"
            onClick={() => {
              void hapticTap();
              window.dispatchEvent(new CustomEvent("med1:open-mobile-ai"));
            }}
            className="-mt-5 flex h-[4.75rem] w-[4.75rem] flex-col items-center justify-center gap-1 rounded-full border-4 border-card bg-ai-gradient p-0 text-accent-foreground shadow-glow transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Med1 AI markazini ochish"
            aria-haspopup="dialog"
          >
            <Sparkles className="h-6 w-6" />
            <span className="text-[10px] font-bold leading-none">Med1 AI</span>
          </Button>
        </li>
        {items.slice(2).map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                onClick={() => void hapticTap()}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className={cn("flex h-8 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary/10")}>
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

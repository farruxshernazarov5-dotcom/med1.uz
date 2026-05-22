/**
 * Floating "Return to partner app" button — shown only when the user landed
 * via a partner source (e.g. HAMBI Web-View). Hidden on auth/admin routes
 * to avoid covering critical CTAs.
 */
import { ArrowLeft } from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePartnerSource } from "@/hooks/usePartnerSource";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = ["/auth", "/admin", "/reset-password", "/forgot-password"];

const HambiReturnButton = () => {
  const { partner } = usePartnerSource();
  const { pathname } = useLocation();

  if (!partner || !partner.return_url) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const brand = partner.brand_color || "#E30613";

  return (
    <a
      href={partner.return_url}
      aria-label={`${partner.name} ilovasiga qaytish`}
      className={cn(
        "fixed z-[60] bottom-24 left-4 md:left-6",
        "flex items-center gap-2 px-4 py-2.5 rounded-full",
        "text-white text-sm font-semibold shadow-lg backdrop-blur",
        "transition-transform hover:scale-105 active:scale-95"
      )}
      style={{
        backgroundColor: brand,
        boxShadow: `0 8px 24px -8px ${brand}aa`,
      }}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{partner.slug === "hambi" ? "HAMBI ga qaytish" : `${partner.name} ga qaytish`}</span>
    </a>
  );
};

export default HambiReturnButton;

import { useEffect, useState } from "react";
import logo from "@/assets/logo.webp";
import { isNativeApp } from "@/lib/nativeApp";

const SESSION_KEY = "med1_splash_seen";
const DURATION = 2600;

/**
 * Animated launch screen: pulse rings, ECG trace drawing in, logo assembling
 * with a glow, then the wordmark letters rising. Shown on every native launch
 * and once per browser session on the web; respects reduced motion.
 */
export default function LaunchSplash() {
  const [phase, setPhase] = useState<"show" | "leave" | "done">(() => {
    if (typeof window === "undefined") return "done";
    if (window.location.pathname.startsWith("/click")) return "done";
    if (!isNativeApp() && sessionStorage.getItem(SESSION_KEY)) return "done";
    return "show";
  });

  useEffect(() => {
    if (phase !== "show") return;
    sessionStorage.setItem(SESSION_KEY, "1");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(() => setPhase("leave"), reduce ? 600 : DURATION);
    const t2 = setTimeout(() => setPhase("done"), (reduce ? 600 : DURATION) + 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  if (phase === "done") return null;
  const word = "MED ALL";

  return (
    <div
      aria-hidden
      onClick={() => setPhase("leave")}
      className={`splash-root fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden ${phase === "leave" ? "splash-leave" : ""}`}
    >
      <div className="splash-aurora" />
      <div className="splash-grid" />
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="splash-particle" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.25}s`, animationDuration: `${2.4 + (i % 4) * 0.5}s` }} />
      ))}

      <div className="relative flex items-center justify-center w-56 h-56">
        <span className="splash-ring" style={{ animationDelay: "0.3s" }} />
        <span className="splash-ring" style={{ animationDelay: "0.9s" }} />
        <span className="splash-ring" style={{ animationDelay: "1.5s" }} />
        <span className="splash-orbit"><i /></span>
        <div className="splash-logo-wrap">
          <img src={logo} alt="" className="w-[7.25rem] h-[7.25rem] object-cover rounded-[1.6rem] splash-logo" />
          <span className="splash-shine" />
        </div>
      </div>

      <svg viewBox="0 0 300 60" className="w-72 h-14 mt-2 splash-ecg">
        <path d="M0 30 H80 L95 30 L105 8 L118 52 L130 18 L140 30 H200 L210 22 L220 30 H300" />
      </svg>

      <h1 className="mt-3 flex gap-1 text-3xl font-extrabold tracking-[0.25em] splash-word">
        {word.split("").map((c, i) => (
          <span key={i} style={{ animationDelay: `${1.1 + i * 0.07}s` }}>{c === " " ? "\u00A0" : c}</span>
        ))}
      </h1>
      <p className="mt-2 text-xs tracking-[0.35em] uppercase splash-tag">Sog‘ligingiz — AI himoyasida</p>
      <div className="splash-bar mt-8"><i /></div>
    </div>
  );
}

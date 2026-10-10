import { useState, useEffect } from "react";
import { Cookie, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/hooks/useLanguage";
import { getDocs } from "@/i18n/docs";
import { isNativeApp } from "@/lib/nativeApp";

interface CookiePrefs { necessary: boolean; analytics: boolean; marketing: boolean }

const STORAGE_KEY = "med1-cookie-consent";
const COOKIE = "med1_cc";

/** Remembers the answer across med1.uz subdomains and Telegram/in-app browsers, not only one origin. */
const hasAnswered = () => {
  try { if (localStorage.getItem(STORAGE_KEY)) return true; } catch { /* storage blocked */ }
  return document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`));
};
const remember = (prefs: CookiePrefs) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* storage blocked */ }
  const domain = /(^|\.)med1\.uz$/.test(location.hostname) ? "; domain=.med1.uz" : "";
  document.cookie = `${COOKIE}=${prefs.analytics ? "a" : "n"}${prefs.marketing ? "m" : ""}; max-age=31536000; path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}${domain}`;
};

const CookieConsent = () => {
  const { lang } = useLanguage();
  const c = getDocs(lang).cookies;
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    // The phone app has no third-party cookies, so it never asks.
    if (isNativeApp() || hasAnswered()) return;
    {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (all: boolean) => {
    const final: CookiePrefs = all ? { necessary: true, analytics: true, marketing: true } : prefs;
    remember(final);
    setVisible(false);
  };

  const reject = () => {
    remember({ necessary: true, analytics: false, marketing: false });
    setVisible(false);
  };

  if (!visible) return null;

  const [before, after] = c.description.split("{link}");

  return (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-[60] p-4 animate-fade-up">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-card-hover p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-foreground">{c.title}</h3>
          </div>
          <button onClick={reject} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {before}
          <a href="/privacy" className="text-primary underline">{c.privacyLinkLabel}</a>
          {after}
        </p>

        {showSettings && (
          <div className="space-y-3 mb-4 p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{c.necessary}</p>
                <p className="text-xs text-muted-foreground">{c.necessaryDesc}</p>
              </div>
              <Switch checked disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{c.analytics}</p>
                <p className="text-xs text-muted-foreground">{c.analyticsDesc}</p>
              </div>
              <Switch checked={prefs.analytics} onCheckedChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{c.marketing}</p>
                <p className="text-xs text-muted-foreground">{c.marketingDesc}</p>
              </div>
              <Switch checked={prefs.marketing} onCheckedChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => accept(true)} className="bg-primary">{c.acceptAll}</Button>
          <Button size="sm" variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-3.5 h-3.5 mr-1" />
            {c.settings}
          </Button>
          {showSettings && (
            <Button size="sm" variant="outline" onClick={() => accept(false)}>{c.saveSelected}</Button>
          )}
          <Button size="sm" variant="ghost" onClick={reject}>{c.reject}</Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

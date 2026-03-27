import { useState, useEffect } from "react";
import { Cookie, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface CookiePrefs {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY = "med1-cookie-consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (all: boolean) => {
    const final: CookiePrefs = all
      ? { necessary: true, analytics: true, marketing: true }
      : prefs;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 animate-fade-up">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-card-hover p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-foreground">
              Cookie sozlamalari
            </h3>
          </div>
          <button onClick={reject} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Biz saytimizda tajribangizni yaxshilash uchun cookie fayllaridan foydalanamiz.
          Batafsil ma'lumot uchun{" "}
          <a href="/user-guide" className="text-primary underline">
            Maxfiylik siyosati
          </a>{" "}
          sahifasini ko'ring.
        </p>

        {showSettings && (
          <div className="space-y-3 mb-4 p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Zaruriy</p>
                <p className="text-xs text-muted-foreground">
                  Sayt ishlashi uchun majburiy
                </p>
              </div>
              <Switch checked disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Analitika</p>
                <p className="text-xs text-muted-foreground">
                  Saytni yaxshilash statistikasi
                </p>
              </div>
              <Switch
                checked={prefs.analytics}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Marketing</p>
                <p className="text-xs text-muted-foreground">
                  Shaxsiylashtirilgan reklamalar
                </p>
              </div>
              <Switch
                checked={prefs.marketing}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => accept(true)} className="bg-primary">
            Hammasini qabul qilish
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-3.5 h-3.5 mr-1" />
            Sozlamalar
          </Button>
          {showSettings && (
            <Button size="sm" variant="outline" onClick={() => accept(false)}>
              Tanlanganni saqlash
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={reject}>
            Rad etish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

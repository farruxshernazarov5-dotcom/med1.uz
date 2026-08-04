import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Cookie, ExternalLink, FileText, Scale, Shield, UserCheck } from "lucide-react";

type CookiePrefs = { necessary: boolean; analytics: boolean; marketing: boolean };

const COOKIE_KEY = "med1-cookie-consent";

const docLinks = [
  { title: "Foydalanish shartlari", href: "/terms", icon: FileText, badge: "Global" },
  { title: "Maxfiylik siyosati", href: "/privacy", icon: Shield, badge: "Privacy" },
  { title: "Tibbiy ogohlantirish", href: "/disclaimer", icon: UserCheck, badge: "AI" },
  { title: "SaaS HMS shartlari", href: "/saas-terms", icon: Scale, badge: "To'lov" },
  { title: "Hamkorlik shartnomasi", href: "/partner-terms", icon: Scale, badge: "Hamkor" },

  { title: "Referral shartlari", href: "/referral-terms", icon: FileText, badge: "Bonus" },
  { title: "Foydalanuvchi qo'llanmasi", href: "/user-guide", icon: BookOpen, badge: "Guide" },
  { title: "Barcha yuridik hujjatlar", href: "/legal-center", icon: Scale, badge: "Legal" },
];

const readPrefs = (): CookiePrefs => {
  try {
    const saved = localStorage.getItem(COOKIE_KEY);
    return saved ? { necessary: true, ...JSON.parse(saved) } : { necessary: true, analytics: false, marketing: false };
  } catch {
    return { necessary: true, analytics: false, marketing: false };
  }
};

const PatientLegalCenter = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<CookiePrefs>(readPrefs);
  const [acceptances, setAcceptances] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("legal_acceptances")
      .select("doc_type, doc_version, accepted_at, context")
      .eq("user_id", user.id)
      .order("accepted_at", { ascending: false })
      .limit(20)
      .then(({ data }: any) => setAcceptances(data || []));
  }, [user]);

  const savePrefs = (next: CookiePrefs) => {
    const finalPrefs = { ...next, necessary: true };
    setPrefs(finalPrefs);
    localStorage.setItem(COOKIE_KEY, JSON.stringify(finalPrefs));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">⚖️ Yuridik hujjatlar va maxfiylik</h2>
        <p className="text-sm text-muted-foreground">Shartlar, qo'llanma, cookie sozlamalari va qabul qilingan hujjatlar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {docLinks.map((doc) => {
          const Icon = doc.icon;
          return (
            <Link key={doc.href} to={doc.href} className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:bg-muted/30 transition group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-foreground truncate">{doc.title}</p>
                    <Badge variant="outline" className="text-[10px]">{doc.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    Ochish <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cookie className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Cookie sozlamalari</h3>
        </div>
        <div className="divide-y divide-border">
          <CookieRow title="Zarur cookie" desc="Kirish, xavfsizlik va asosiy funksiyalar uchun majburiy." checked disabled />
          <CookieRow title="Analitika" desc="Platformadan foydalanish statistikasini yaxshilashga yordam beradi." checked={prefs.analytics} onCheckedChange={(v) => savePrefs({ ...prefs, analytics: v })} />
          <CookieRow title="Marketing" desc="Aksiyalar, tavsiyalar va hamkor takliflarini moslashtirish uchun." checked={prefs.marketing} onCheckedChange={(v) => savePrefs({ ...prefs, marketing: v })} />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="sm" onClick={() => savePrefs({ necessary: true, analytics: true, marketing: true })}>Barchasini yoqish</Button>
          <Button size="sm" variant="outline" onClick={() => savePrefs({ necessary: true, analytics: false, marketing: false })}>Faqat zarur</Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Qabul qilingan hujjatlar tarixi</h3>
        </div>
        {acceptances.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali hujjat qabul qilish tarixi yo'q.</p>
        ) : (
          <div className="space-y-2">
            {acceptances.map((a, i) => (
              <div key={`${a.doc_type}-${a.doc_version}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{a.doc_type}</p>
                  <p className="text-xs text-muted-foreground">v{a.doc_version} • {a.context || "manual"}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(a.accepted_at).toLocaleString("uz-UZ")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CookieRow = ({ title, desc, checked, disabled, onCheckedChange }: { title: string; desc: string; checked: boolean; disabled?: boolean; onCheckedChange?: (v: boolean) => void }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
    <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
  </div>
);

export default PatientLegalCenter;
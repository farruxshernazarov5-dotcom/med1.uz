import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";

const ORG_TABLES: { table: string; label: string }[] = [
  { table: "registered_clinics", label: "Klinika" },
  { table: "registered_diagnostics", label: "Diagnostika markazi" },
  { table: "registered_pharmacies", label: "Dorixona" },
  { table: "registered_dental_clinics", label: "Stomatologiya klinikasi" },
  { table: "registered_cosmetology", label: "Kosmetologiya markazi" },
  { table: "registered_maternity", label: "Tug'ruqxona" },
  { table: "blood_banks_registered", label: "Qon banki" },
];

interface OrgState {
  label: string;
  name: string;
  isActive: boolean;
}

/**
 * Shows a warning inside every organization dashboard when the profile is
 * deactivated — an inactive organization is hidden from the public site.
 */
const OrgStatusBanner = () => {
  const { user } = useAuth();
  const [org, setOrg] = useState<OrgState | null>(null);

  useEffect(() => {
    if (!user) { setOrg(null); return; }
    let cancelled = false;

    (async () => {
      for (const t of ORG_TABLES) {
        const { data } = await (supabase as any)
          .from(t.table)
          .select("name,is_active")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          if (!cancelled) {
            setOrg({ label: t.label, name: data.name, isActive: !!data.is_active });
          }
          return;
        }
      }
      if (!cancelled) setOrg(null);
    })();

    return () => { cancelled = true; };
  }, [user]);

  if (!org || org.isActive) return null;

  return (
    <div className="mb-4 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">
            {org.label} nofaol holatda — saytda ko'rinmayapti
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            "{org.name}" profili hozirda o'chirilgan. Bemorlar sizni bosh sahifadagi hamkorlar
            ro'yxatida, qidiruvda va bron qilishda ko'ra olmaydi. Xizmatni davom ettirish uchun
            profilni qayta faollashtiring yoki tarifni yangilang.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link to="/dashboard?tab=settings">
              <Button size="sm">Qayta faollashtirish</Button>
            </Link>
            <Link to="/pricing">
              <Button size="sm" variant="outline">
                <Crown className="w-3.5 h-3.5 mr-1" /> Tariflar
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="sm" variant="ghost">Yordam</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgStatusBanner;

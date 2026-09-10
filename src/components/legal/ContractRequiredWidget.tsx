import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSignature, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";
import SignContractDialog from "./SignContractDialog";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  /** Slug of contract_templates required for this module, e.g. "pharmacy-agreement" */
  templateSlug: string;
  /** Display title shown in header */
  moduleTitle?: string;
}

export default function ContractRequiredWidget({ templateSlug, moduleTitle }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [signOpen, setSignOpen] = useState(false);

  const refresh = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data: tpl } = await (supabase as any)
      .from("contract_templates")
      .select("id,slug,title_uz,title_ru,summary_uz,body_uz,body_ru")
      .eq("slug", templateSlug).maybeSingle();
    setTemplate(tpl);
    if (!tpl) { setLoading(false); return; }

    const { data: c } = await (supabase as any)
      .from("contracts")
      .select("id,contract_number,status,approval_status,title_uz,body_uz,signed_at,template_id")
      .eq("owner_id", user.id).eq("template_id", tpl.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    setContract(c);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user, templateSlug]);

  const createAndOpen = async () => {
    if (!user || !template) return;
    const { data, error } = await (supabase as any).from("contracts").insert({
      template_id: template.id, owner_id: user.id,
      title_uz: template.title_uz, title_ru: template.title_ru,
      body_uz: template.body_uz, body_ru: template.body_ru,
      language: "uz", status: "draft",
    }).select().single();
    if (error) return;
    setContract(data); setSignOpen(true);
  };

  if (loading || !template) return null;

  const isActive = contract?.status === "active";
  const isPending = contract?.approval_status === "pending";

  const steps = [
    "Shartnoma matnini o'qing",
    "Muassasa ma'lumotlarini tasdiqlang",
    "Telefoningizga kelgan SMS kodni kiriting",
    "Imzoni ekranda chizib, yakunlang",
  ];

  return (
    <>
      <Card className={`p-4 border-2 ${isActive ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
            {isActive ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold">{moduleTitle || template.title_uz}</h4>
              {isActive && <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">Imzolangan</Badge>}
              {isPending && <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">Admin tasdiqi kutilmoqda</Badge>}
              {!contract && <Badge variant="outline">Imzolanmagan</Badge>}
              {contract && !isActive && !isPending && <Badge variant="outline">Imzo kutilmoqda</Badge>}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{template.summary_uz}</p>

            {isActive ? (
              <p className="text-xs text-emerald-700 mt-2">
                Shartnoma raqami: <span className="font-semibold">{contract.contract_number || "—"}</span>
                {contract.signed_at ? ` · ${new Date(contract.signed_at).toLocaleDateString("uz-UZ")}` : ""}
              </p>
            ) : (
              <div className="mt-3 rounded-lg bg-background/70 border border-border p-3">
                <p className="text-xs font-semibold text-foreground mb-1.5">
                  Shartnoma to'liq onlayn imzolanadi — qog'oz nusxa shart emas
                </p>
                <ol className="text-xs text-muted-foreground space-y-1">
                  {steps.map((s, i) => (
                    <li key={s} className="flex gap-2">
                      <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Imzolangan shartnoma PDF ko'rinishida saqlanadi va QR kod orqali istalgan vaqtda tekshiriladi.
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-3 flex-wrap">
              {contract ? (
                isActive ? (
                  <>
                    <Link to="/legal-center"><Button size="sm" variant="outline"><FileSignature className="w-3 h-3 mr-1" /> Shartnomani ko'rish / PDF</Button></Link>
                    <Link to="/contract-verify"><Button size="sm" variant="ghost"><ShieldCheck className="w-3 h-3 mr-1" /> Tekshirish</Button></Link>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setSignOpen(true)}>
                    <FileSignature className="w-3 h-3 mr-1" /> Onlayn imzolashni davom ettirish
                  </Button>
                )
              ) : (
                <Button size="sm" onClick={createAndOpen}>
                  <FileSignature className="w-3 h-3 mr-1" /> Onlayn imzolash
                </Button>
              )}
              <Link to="/legal-center">
                <Button size="sm" variant="ghost"><ExternalLink className="w-3 h-3 mr-1" /> Legal Center</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {contract && (
        <SignContractDialog
          open={signOpen} onOpenChange={setSignOpen}
          contract={contract}
          onSigned={refresh}
        />
      )}
    </>
  );
}

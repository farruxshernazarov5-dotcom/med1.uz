import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Eye, FileSignature, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { downloadContractPDF } from "@/utils/downloadContractPDF";
import SignContractDialog from "./SignContractDialog";

const STATUS_LABEL: Record<string, string> = {
  active: "Imzolangan",
  pending_signature: "Imzo kutilmoqda",
  draft: "Qoralama",
  expired: "Muddati tugagan",
  terminated: "Bekor qilingan",
  cancelled: "Bekor qilingan",
};

export default function MyContractsPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<any>(null);
  const [signing, setSigning] = useState<any>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("contracts")
      .select("id,contract_number,title_uz,title_ru,body_uz,body_ru,language,status,approval_status,signed_at,hash_id,effective_from,effective_until,counterparty_name,created_at")
      .or(`owner_id.eq.${user.id},counterparty_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDownload = async (c: any) => {
    setBusyId(c.id);
    try {
      const { data: sigs } = await (supabase as any)
        .from("contract_signatures")
        .select("signer_name,signer_role,method,signed_at,signature_hash")
        .eq("contract_id", c.id)
        .order("signed_at", { ascending: true });
      await downloadContractPDF({
        hashId: c.hash_id,
        contractNumber: c.contract_number,
        title: c.language === "ru" ? c.title_ru || c.title_uz : c.title_uz,
        body: c.language === "ru" ? c.body_ru || c.body_uz : c.body_uz,
        language: c.language || "uz",
        status: STATUS_LABEL[c.status] || c.status,
        signedAt: c.signed_at ? new Date(c.signed_at) : null,
        effectiveFrom: c.effective_from ? new Date(c.effective_from) : null,
        effectiveUntil: c.effective_until ? new Date(c.effective_until) : null,
        counterpartyName: c.counterparty_name,
        signatures: sigs || [],
      });
      toast.success("PDF yuklab olindi");
    } catch (e: any) {
      toast.error(e?.message || "PDF yaratishda xatolik");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileSignature className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Mening shartnomalarim</h3>
        <Badge variant="outline" className="text-[10px]">{rows.length}</Badge>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hozircha shartnoma yo'q. Xizmatga obuna bo'lganingizda shartnoma shu yerda paydo bo'ladi.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => {
            const active = c.status === "active";
            return (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.title_uz}</p>
                  <p className="text-xs text-muted-foreground">
                    № {c.contract_number || "—"} ·{" "}
                    <span className={active ? "text-emerald-600" : "text-amber-600"}>{STATUS_LABEL[c.status] || c.status}</span>
                    {c.signed_at ? ` · ${new Date(c.signed_at).toLocaleDateString("uz-UZ")}` : ""}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setViewing(c)}>
                    <Eye className="w-3 h-3 mr-1" /> Ko'rish
                  </Button>
                  <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => handleDownload(c)}>
                    <Download className="w-3 h-3 mr-1" /> {busyId === c.id ? "..." : "PDF"}
                  </Button>
                  {!active && (
                    <Button size="sm" onClick={() => setSigning(c)}>
                      <ShieldCheck className="w-3 h-3 mr-1" /> Imzolash
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewing?.title_uz}</DialogTitle>
            <DialogDescription>
              № {viewing?.contract_number} · {STATUS_LABEL[viewing?.status] || viewing?.status}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] border rounded-md p-4 text-sm whitespace-pre-wrap">
            {viewing?.body_uz}
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => viewing && handleDownload(viewing)}>
              <Download className="w-4 h-4 mr-1" /> PDF yuklab olish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {signing && (
        <SignContractDialog
          open={!!signing}
          onOpenChange={(o) => !o && setSigning(null)}
          contract={signing}
          onSigned={() => { setSigning(null); load(); }}
        />
      )}
    </Card>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Shield, CheckCircle, XCircle, Loader2, FileText, Calendar, Hash, Users, Globe, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type Contract = {
  hash_id: string;
  contract_number: string;
  title_uz: string;
  title_ru: string;
  status: string;
  approval_status: string;
  language: string;
  signed_at: string | null;
  effective_from: string | null;
  effective_until: string | null;
  required_signatures: number;
  collected_signatures: number;
  category_slug: string | null;
  counterparty_name: string | null;
  created_at: string;
};

type Signature = {
  signer_name: string;
  signer_role: string;
  method: string;
  signed_at: string;
  signature_hash: string;
  is_valid: boolean;
};

const STATUS_LABEL: Record<string, { label: string; tone: "ok" | "warn" | "bad" }> = {
  active: { label: "✓ Faol", tone: "ok" },
  pending_signature: { label: "⏳ Imzo kutilmoqda", tone: "warn" },
  draft: { label: "✎ Qoralama", tone: "warn" },
  expired: { label: "⌛ Muddati tugagan", tone: "bad" },
  terminated: { label: "✗ Bekor qilingan", tone: "bad" },
  rejected: { label: "✗ Rad etilgan", tone: "bad" },
};

export default function ContractVerifyPage() {
  const { hashId } = useParams<{ hashId: string }>();
  const [code, setCode] = useState(hashId || "");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);

  const verify = async (h: string) => {
    if (!h?.trim()) return;
    const code = h.trim();
    setLoading(true);
    setSearched(true);
    setContract(null);
    setSignatures([]);

    // Template documents: hashId = "TEMPLATE-<slug>"
    if (/^TEMPLATE-/i.test(code)) {
      const slug = code.replace(/^TEMPLATE-/i, "").toLowerCase();
      const { data: tpl } = await (supabase as any)
        .from("contract_templates")
        .select("slug,title_uz,title_ru,jurisdiction,is_active,created_at")
        .eq("slug", slug)
        .maybeSingle();
      if (tpl) {
        setContract({
          hash_id: code,
          contract_number: `TPL-${slug.toUpperCase()}`,
          title_uz: tpl.title_uz,
          title_ru: tpl.title_ru,
          status: tpl.is_active ? "active" : "terminated",
          approval_status: "template",
          language: "uz",
          signed_at: null,
          effective_from: tpl.created_at,
          effective_until: null,
          required_signatures: 0,
          collected_signatures: 0,
          category_slug: null,
          counterparty_name: "MED-ALL AI SYSTEM MChJ (Template)",
          created_at: tpl.created_at,
        });
      }
      setLoading(false);
      return;
    }

    const { data: c } = await (supabase.rpc as any)("verify_contract_by_hash", { _hash_id: code });
    if (c && (c as any[]).length > 0) {
      setContract((c as any[])[0]);
      const { data: s } = await (supabase.rpc as any)("verify_contract_signatures", { _hash_id: code });
      setSignatures((s as Signature[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { if (hashId) verify(hashId); }, [hashId]);

  const isActive = contract?.status === "active";
  const statusInfo = contract ? (STATUS_LABEL[contract.status] || { label: contract.status, tone: "warn" as const }) : null;
  const title = contract ? (contract.language === "ru" ? contract.title_ru : contract.title_uz) : "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            loading ? "bg-muted" :
            searched && isActive ? "bg-emerald-500/10" :
            searched && contract ? "bg-amber-500/10" :
            searched ? "bg-destructive/10" : "bg-muted"
          }`}>
            {loading ? <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" /> :
              searched && isActive ? <CheckCircle className="w-10 h-10 text-emerald-600" /> :
              searched && contract ? <Shield className="w-10 h-10 text-amber-600" /> :
              searched ? <XCircle className="w-10 h-10 text-destructive" /> :
              <FileText className="w-10 h-10 text-muted-foreground" />}
          </div>
          <h1 className="text-2xl font-bold mb-2">Shartnoma Verifikatsiyasi</h1>
          <p className="text-muted-foreground">Med1.uz — rasmiy yuridik tekshiruv portali</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Shartnoma Hash ID kodini kiriting:</p>
            <div className="flex gap-2">
              <Input
                placeholder="32-belgili hash kodi..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify(code)}
                className="font-mono text-sm"
              />
              <Button onClick={() => verify(code)} disabled={loading || !code.trim()}>
                <Search className="w-4 h-4 mr-1" /> Tekshirish
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Tekshirilmoqda...</CardContent></Card>
        ) : searched && contract ? (
          <>
            <Card className={`border-2 mb-4 ${
              statusInfo?.tone === "ok" ? "border-emerald-500/40" :
              statusInfo?.tone === "bad" ? "border-destructive/30" : "border-amber-500/40"
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Shartnoma raqami</p>
                    <p className="text-xl font-bold font-mono">{contract.contract_number}</p>
                  </div>
                  <Badge variant={statusInfo?.tone === "ok" ? "default" : statusInfo?.tone === "bad" ? "destructive" : "outline"}
                    className={statusInfo?.tone === "ok" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                    {statusInfo?.label}
                  </Badge>
                </div>

                <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sarlavha</p>
                  <p className="font-semibold leading-snug">{title}</p>
                </div>

                <div className="space-y-3">
                  <Row icon={<Hash className="w-5 h-5 text-primary" />} label="Hash ID" mono value={contract.hash_id} />
                  {contract.signed_at && (
                    <Row icon={<Calendar className="w-5 h-5 text-primary" />} label="Imzolangan vaqt"
                      value={new Date(contract.signed_at).toLocaleString("uz-UZ")} />
                  )}
                  <Row icon={<Users className="w-5 h-5 text-primary" />} label="Imzolar"
                    value={`${contract.collected_signatures} / ${contract.required_signatures}`} />
                  {contract.counterparty_name && (
                    <Row icon={<FileText className="w-5 h-5 text-primary" />} label="Ijrochi" value={contract.counterparty_name} />
                  )}
                  <Row icon={<Globe className="w-5 h-5 text-primary" />} label="Platforma" value="Med1.uz — MED-ALL AI SYSTEM MChJ" />
                </div>
              </CardContent>
            </Card>

            {signatures.length > 0 && (
              <Card className="mb-4">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" /> Elektron imzolar ({signatures.length})
                  </h3>
                  <div className="space-y-3">
                    {signatures.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{s.signer_name}</p>
                          <Badge variant={s.is_valid ? "default" : "destructive"} className="text-xs">
                            {s.is_valid ? "✓ Haqiqiy" : "✗ Bekor"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {s.signer_role}  •  {s.method}  •  {new Date(s.signed_at).toLocaleString("uz-UZ")}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-1 break-all">
                          {s.signature_hash}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : searched ? (
          <Card className="border-destructive/30">
            <CardContent className="p-6 text-center">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Shartnoma topilmadi</h3>
              <p className="text-sm text-muted-foreground">
                Ushbu hash kodi bo'yicha shartnoma mavjud emas: <span className="font-mono">{code}</span>
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-yellow-500/30 bg-yellow-500/5 mt-4">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">
              ⚠️ <strong>Eslatma:</strong> Ushbu portal MED-ALL AI SYSTEM MChJ tomonidan
              tuzilgan elektron shartnomalarning yuridik haqiqiyligini tasdiqlash uchun
              mo'ljallangan. Shartnoma matni va shaxsiy ma'lumotlar faqat avtorizatsiyadan
              o'tgan tomonlarga ko'rinadi.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function Row({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`font-semibold break-all ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { LockKeyhole, ShieldCheck, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Kind = "contract" | "document" | "vital";
type AccessResult = { error?: string; configured?: boolean; can_configure?: boolean; unlocked?: boolean; data?: unknown };
const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export default function PrivateDocumentVerification({ kind, initialCode = "" }: { kind: Kind; initialCode?: string }) {
  const navigate = useNavigate();
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [canConfigure, setCanConfigure] = useState(false);
  const [configure, setConfigure] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let active = true;
    setResult(null); setCanConfigure(false); setMessage("");
    if (code.trim().length >= 6) {
      supabase.rpc("private_document_access", { _kind: kind, _code: code.trim(), _action: "status" }).then(({ data }) => {
        if (!active) return;
        const status = asRecord(data);
        setCanConfigure(status.can_configure === true);
        if (status.configured !== true && typeof status.error === "string") setMessage(status.error);
      });
    }
    return () => { active = false; };
  }, [code, kind]);

  async function submit() {
    if (busy) return;
    if (kind === "document" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code.trim())) {
      navigate(`/verify?payment_id=${encodeURIComponent(code.trim())}`); return;
    }
    if (configure && password !== confirmation) { setMessage("Parollar mos emas"); return; }
    setBusy(true); setResult(null); setMessage("");
    try {
      const { data, error } = await supabase.rpc("private_document_access", {
        _kind: kind, _code: code.trim(), _password: password, _action: configure ? "set" : "verify",
      });
      if (error) throw new Error("Tekshiruv bajarilmadi. Aloqani tekshirib, qayta urinib ko‘ring.");
      const response = asRecord(data) as AccessResult;
      if (response.error) { setMessage(response.error); return; }
      if (configure && response.configured) {
        setConfigure(false); setPassword(""); setConfirmation("");
        setMessage("Parol saqlandi. Hujjatni ochish uchun tekshiruv parolini kiriting."); return;
      }
      if (response.unlocked && response.data) {
        const payload = asRecord(response.data);
        const document = kind === "contract" ? asRecord(payload.contract) : payload;
        if (Object.keys(document).length) { setResult(document); setPassword(""); }
        else setMessage("Hujjat topilmadi yoki bekor qilingan.");
      } else setMessage("Hujjat topilmadi yoki bekor qilingan.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Tekshiruv bajarilmadi"); }
    finally { setBusy(false); }
  }
  const fields: [string, string][] = kind === "contract" ? [
    ["contract_number", "Shartnoma raqami"], ["title_uz", "Shartnoma"], ["status", "Holat"],
    ["signed_at", "Imzolangan sana"], ["counterparty_name", "Shartnoma tomoni"],
  ] : kind === "vital" ? [["code", "Hujjat kodi"], ["content_hash", "Raqamli iz (SHA-256)"], ["created_at", "Yaratilgan sana"]] : [
    ["verification_code", "Hujjat kodi"], ["document_type", "Hujjat turi"], ["status", "Holat"], ["patient_name", "Bemor"], ["document_date", "Hujjat sanasi"],
  ];
  return <div className="min-h-screen bg-background">
    <SEO title="Himoyalangan hujjat — Med1.uz" description="Shaxsiy hujjatni parol orqali tekshirish." path="/verify" noindex />
    <Header />
    <main className="container mx-auto max-w-xl px-4 py-10 space-y-6">
      <div className="space-y-3 text-center">
        {result ? <ShieldCheck className="mx-auto h-12 w-12 text-primary" /> : <LockKeyhole className="mx-auto h-12 w-12 text-primary" />}
        <h1 className="text-2xl font-bold">{result ? "Hujjat yozuvi tekshirildi" : "Himoyalangan hujjat"}</h1>
        <p className="text-sm text-muted-foreground">{result ? "Med1.uz tizimida saqlangan haqiqiy yozuv." : "Shaxsiy ma’lumotlar tekshiruv parolidan keyin ochiladi."}</p>
      </div>
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <div className="space-y-2"><Label htmlFor="private-code">Hujjat kodi</Label><Input id="private-code" value={code} onChange={e => { setCode(e.target.value); setPassword(""); setConfirmation(""); }} autoComplete="off" /></div>
        {!result && <>
          <div className="space-y-2"><Label htmlFor="private-password">{configure ? "Yangi tekshiruv paroli" : "Tekshiruv paroli"}</Label><Input id="private-password" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} maxLength={72} autoComplete="new-password" required /></div>
          {configure && <div className="space-y-2"><Label htmlFor="private-confirmation">Parolni takrorlang</Label><Input id="private-confirmation" type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} minLength={8} maxLength={72} autoComplete="new-password" required /></div>}
          <Button className="w-full gap-2" disabled={busy || code.trim().length < 6}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}{configure ? "Parolni saqlash" : "Hujjatni tekshirish"}</Button>
          {canConfigure && <Button type="button" variant="outline" className="w-full" onClick={() => { setConfigure(!configure); setPassword(""); setConfirmation(""); setMessage(""); }}>{configure ? "Tekshiruvga qaytish" : "Tekshiruv parolini o‘rnatish / almashtirish"}</Button>}
        </>}
        {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      </form>
      {result && <dl className="divide-y divide-border border-y border-border">
        {fields.map(([key, label]) => typeof result[key] === "string" && <div key={key} className="py-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm font-medium">{String(result[key])}</dd></div>)}
      </dl>}
      <p className="text-xs text-muted-foreground">Tekshiruv paroli hisobga kirish parolidan alohida. Uni faqat hujjatni ko‘rishga ruxsat berilgan kishiga ulashing. Eski QR kodi o‘zgarmaydi; parolni hujjat egasi ushbu sahifada o‘rnatadi.</p>
    </main><Footer />
  </div>;
}
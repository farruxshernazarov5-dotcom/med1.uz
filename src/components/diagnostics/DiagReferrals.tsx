import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, ArrowRight, ArrowLeft, Loader2, Send } from "lucide-react";

type Props = {
  centerId: string;
  referrals: any[];
  services: any[];
  onReload: () => void;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda", accepted: "Qabul qilindi", completed: "Tugagan", rejected: "Rad etildi", cancelled: "Bekor qilindi",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-500", accepted: "bg-blue-500", completed: "bg-green-500", rejected: "bg-red-500", cancelled: "bg-gray-500",
};

const DiagReferrals = ({ centerId, referrals, services, onReload }: Props) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "inbound" | "outbound">("inbound");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    direction: "inbound", patient_name: "", patient_phone: "",
    from_doctor_name: "", from_clinic_name: "",
    to_service_id: "", to_service_name: "", to_doctor_name: "",
    reason: "", diagnosis: "", icd10_code: "", notes: "",
  });

  const filtered = tab === "all" ? referrals : referrals.filter((r) => r.direction === tab);

  const submit = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = { ...form, center_id: centerId, status: "pending", created_by: u?.user?.id };
    if (form.to_service_id) {
      const sv = services.find((x) => x.id === form.to_service_id);
      if (sv) payload.to_service_name = sv.name;
    }
    const { error } = await supabase.from("diagnostics_referrals" as any).insert(payload as any);
    if (error) toast.error(error.message);
    else { toast.success("Yo'naltirish saqlandi"); setOpen(false); onReload(); setForm({ direction: "inbound", patient_name: "", patient_phone: "", from_doctor_name: "", from_clinic_name: "", to_service_id: "", to_service_name: "", to_doctor_name: "", reason: "", diagnosis: "", icd10_code: "", notes: "" }); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("diagnostics_referrals" as any).update({ status } as any).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Status yangilandi"); onReload(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Send className="w-6 h-6" />Yo'naltirishlar</h2>
          <p className="text-muted-foreground text-sm">Inbound (kelayotgan) va Outbound (chiqayotgan) referrallar</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Yangi referral</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Yo'naltirish yaratish</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Yo'nalish</Label>
                <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound (shifokor → diagnostikaga)</SelectItem>
                    <SelectItem value="outbound">Outbound (diagnostika → shifokorga)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Bemor F.I.Sh" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
                <Input placeholder="Telefon" value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} />
              </div>
              {form.direction === "inbound" ? (
                <>
                  <Input placeholder="Yuboruvchi shifokor" value={form.from_doctor_name} onChange={(e) => setForm({ ...form, from_doctor_name: e.target.value })} />
                  <Input placeholder="Klinika nomi" value={form.from_clinic_name} onChange={(e) => setForm({ ...form, from_clinic_name: e.target.value })} />
                  <Select value={form.to_service_id} onValueChange={(v) => setForm({ ...form, to_service_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Xizmatga yo'naltirish" /></SelectTrigger>
                    <SelectContent>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </>
              ) : (
                <Input placeholder="Qabul qiluvchi shifokor / klinika" value={form.to_doctor_name} onChange={(e) => setForm({ ...form, to_doctor_name: e.target.value })} />
              )}
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="ICD-10 kodi" value={form.icd10_code} onChange={(e) => setForm({ ...form, icd10_code: e.target.value })} />
                <Input placeholder="Tashxis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
              </div>
              <Textarea placeholder="Sabab" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              <Button className="w-full" onClick={submit} disabled={saving || !form.patient_name}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Yaratish
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="inbound"><ArrowRight className="w-4 h-4 mr-1" />Inbound ({referrals.filter((r) => r.direction === "inbound").length})</TabsTrigger>
          <TabsTrigger value="outbound"><ArrowLeft className="w-4 h-4 mr-1" />Outbound ({referrals.filter((r) => r.direction === "outbound").length})</TabsTrigger>
          <TabsTrigger value="all">Barchasi</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-4">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Yo'naltirishlar yo'q</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((r: any) => (
                <div key={r.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{r.patient_name}</span>
                      <Badge className={`${STATUS_COLOR[r.status]} text-white`}>{STATUS_LABEL[r.status]}</Badge>
                      <Badge variant="outline">{r.direction === "inbound" ? "← Inbound" : "→ Outbound"}</Badge>
                      {r.icd10_code && <Badge variant="secondary">{r.icd10_code}</Badge>}
                    </div>
                    <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {r.direction === "inbound" ? (
                      <>Yuboruvchi: <b>{r.from_doctor_name}</b>{r.from_clinic_name && ` (${r.from_clinic_name})`} → {r.to_service_name}</>
                    ) : (
                      <>Yuborildi: <b>{r.to_doctor_name}</b></>
                    )}
                    {r.reason && <div className="mt-1">Sabab: {r.reason}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagReferrals;

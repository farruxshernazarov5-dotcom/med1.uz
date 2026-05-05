import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { esc } from "@/lib/htmlEscape";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import {
  Pill, Plus, X, Search, AlertTriangle, ShieldCheck, FileText,
  Printer, Trash2, CheckCircle2,
} from "lucide-react";
import {
  DRUG_DATABASE, DRUG_CATEGORIES, checkInteractions, checkAllergyConflicts,
  type Drug, type InteractionResult,
} from "./drugDatabase";

interface Props { doctorId: string }

type RxMed = {
  drug_id: string;
  name: string;
  generic: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: "Faol", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  dispensed: { label: "Berilgan", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  cancelled: { label: "Bekor qilingan", color: "bg-muted text-muted-foreground" },
};

const SEV_COLOR = {
  low: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  moderate: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  high: "bg-rose-500/10 text-rose-700 border-rose-500/30",
};

const addDays = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const DocPrescriptions = ({ doctorId }: Props) => {
  const [list, setList] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  // Form
  const [form, setForm] = useState({
    patient_id: "",
    diagnosis: "",
    icd_code: "",
    general_instructions: "",
    warnings: "",
    valid_until: addDays(30),
    medications: [] as RxMed[],
  });

  // Drug picker
  const [drugSearch, setDrugSearch] = useState("");
  const [drugCat, setDrugCat] = useState<string>("all");
  const [drugPickOpen, setDrugPickOpen] = useState(false);

  const load = async () => {
    const [rx, pt] = await Promise.all([
      supabase
        .from("doctor_prescriptions" as any)
        .select("*, doctor_patients(id, full_name, phone, allergies)")
        .eq("doctor_id", doctorId)
        .order("prescription_date", { ascending: false }),
      supabase
        .from("doctor_patients")
        .select("id, full_name, phone, allergies")
        .eq("doctor_id", doctorId),
    ]);
    setList((rx.data as any[]) || []);
    setPatients(pt.data || []);
  };
  useEffect(() => { load(); }, [doctorId]);

  // ───── derived
  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === form.patient_id),
    [patients, form.patient_id],
  );

  const drugIds = useMemo(() => form.medications.map((m) => m.drug_id), [form.medications]);

  const interactions: InteractionResult[] = useMemo(
    () => checkInteractions(drugIds),
    [drugIds],
  );

  const allergyConflicts = useMemo(
    () => selectedPatient?.allergies ? checkAllergyConflicts(selectedPatient.allergies, drugIds) : [],
    [selectedPatient, drugIds],
  );

  const filteredDrugs = useMemo(() => {
    return DRUG_DATABASE.filter((d) => {
      if (drugCat !== "all" && d.category !== drugCat) return false;
      if (drugSearch.trim()) {
        const s = drugSearch.toLowerCase();
        return d.name.toLowerCase().includes(s) ||
               d.generic.toLowerCase().includes(s) ||
               d.category.toLowerCase().includes(s);
      }
      return true;
    });
  }, [drugSearch, drugCat]);

  const filteredList = useMemo(() => {
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter((r) =>
      (r.patient_name || "").toLowerCase().includes(s) ||
      (r.diagnosis || "").toLowerCase().includes(s) ||
      (r.rx_number || "").toLowerCase().includes(s),
    );
  }, [list, q]);

  // ───── actions
  const addDrug = (d: Drug) => {
    if (form.medications.some((m) => m.drug_id === d.id)) {
      toast({ title: "Bu dori allaqachon qo'shilgan" });
      return;
    }
    setForm((p) => ({
      ...p,
      medications: [...p.medications, {
        drug_id: d.id,
        name: d.name,
        generic: d.generic,
        strength: d.strengths[0] || "",
        form: d.forms[0] || "",
        dosage: d.default_dosage,
        frequency: d.default_frequency,
        duration: d.default_duration,
        instructions: d.instructions,
      }],
    }));
    setDrugPickOpen(false);
  };

  const updateMed = (idx: number, key: keyof RxMed, v: string) => {
    setForm((p) => ({
      ...p,
      medications: p.medications.map((m, i) => i === idx ? { ...m, [key]: v } : m),
    }));
  };

  const removeMed = (idx: number) => {
    setForm((p) => ({ ...p, medications: p.medications.filter((_, i) => i !== idx) }));
  };

  const resetForm = () => setForm({
    patient_id: "", diagnosis: "", icd_code: "",
    general_instructions: "", warnings: "",
    valid_until: addDays(30), medications: [],
  });

  const save = async () => {
    if (!form.patient_id || form.medications.length === 0) {
      toast({ title: "Bemor va kamida 1 ta dori kerak", variant: "destructive" });
      return;
    }
    const highSev = interactions.some((i) => i.severity === "high");
    if (highSev) {
      const ok = window.confirm("Yuqori xavfli o'zaro ta'sir aniqlandi. Saqlashni davom ettirasizmi?");
      if (!ok) return;
    }
    const pat = patients.find((p) => p.id === form.patient_id);
    const { error } = await supabase.from("doctor_prescriptions" as any).insert({
      doctor_id: doctorId,
      patient_id: form.patient_id,
      patient_name: pat?.full_name || "—",
      patient_phone: pat?.phone || null,
      diagnosis: form.diagnosis,
      icd_code: form.icd_code || null,
      medications: form.medications as any,
      general_instructions: form.general_instructions,
      warnings: form.warnings,
      valid_until: form.valid_until,
      status: "active",
    });
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Retsept saqlandi" });
      setOpen(false);
      resetForm();
      load();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("doctor_prescriptions" as any).update({ status }).eq("id", id);
    load();
  };

  const printRx = (r: any) => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const meds = (r.medications as RxMed[] || []).map((m, i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
          <strong>${m.name}</strong> ${m.strength}<br/>
          <span style="color:#6b7280;font-size:12px;">${m.generic}</span>
        </td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${m.dosage}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${m.frequency}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${m.duration}</td>
      </tr>
      <tr><td colspan="5" style="padding:4px 8px 12px;color:#6b7280;font-size:12px;border-bottom:1px solid #e5e7eb;">${m.instructions || ""}</td></tr>
    `).join("");

    w.document.write(`
      <html><head><meta charset="utf-8"/><title>Retsept ${r.rx_number}</title>
      <style>body{font-family:system-ui,-apple-system,sans-serif;color:#0f172a;padding:32px;max-width:760px;margin:0 auto;}
      h1{color:#0ea5e9;margin:0 0 4px;font-size:24px;}
      .header{display:flex;justify-content:space-between;border-bottom:2px solid #0ea5e9;padding-bottom:16px;margin-bottom:24px;}
      table{width:100%;border-collapse:collapse;margin-top:12px;}
      th{background:#f1f5f9;padding:8px;text-align:left;font-size:12px;text-transform:uppercase;color:#475569;}
      .info{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
      .info div{padding:8px;background:#f8fafc;border-radius:6px;}
      .label{font-size:11px;text-transform:uppercase;color:#64748b;}
      .warn{background:#fef2f2;border-left:4px solid #ef4444;padding:12px;margin-top:16px;border-radius:4px;}
      .footer{margin-top:48px;border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#64748b;}
      </style></head><body>
      <div class="header">
        <div><h1>📋 RETSEPT</h1><div class="label">№ ${r.rx_number}</div></div>
        <div style="text-align:right;"><div class="label">Sana</div><div>${new Date(r.prescription_date).toLocaleDateString("uz-UZ")}</div></div>
      </div>
      <div class="info">
        <div><div class="label">Bemor</div><strong>${r.patient_name}</strong>${r.patient_phone ? `<br/>${r.patient_phone}` : ""}</div>
        <div><div class="label">Tashxis</div><strong>${r.diagnosis || "—"}</strong>${r.icd_code ? `<br/>ICD: ${r.icd_code}` : ""}</div>
      </div>
      <table><thead><tr><th>#</th><th>Dori</th><th>Doza</th><th>Qabul tartibi</th><th>Davomiyligi</th></tr></thead><tbody>${meds}</tbody></table>
      ${r.general_instructions ? `<div style="margin-top:16px;padding:12px;background:#f0f9ff;border-radius:6px;"><div class="label">Umumiy ko'rsatmalar</div>${r.general_instructions}</div>` : ""}
      ${r.warnings ? `<div class="warn"><strong>⚠️ Ogohlantirish:</strong> ${r.warnings}</div>` : ""}
      <div class="footer">Amal qilish muddati: ${r.valid_until ? new Date(r.valid_until).toLocaleDateString("uz-UZ") : "—"} • Med1.uz</div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">E-Retseptlar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dorilar bazasi • Allergiya va o'zaro ta'sir tekshiruvi
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-secondary to-accent text-white border-0"
        >
          <Plus className="w-4 h-4 mr-1" /> Yangi retsept
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Bemor, tashxis yoki № bo'yicha..."
          className="h-9 pl-7 text-xs"
        />
      </div>

      {/* List */}
      {filteredList.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
          {list.length === 0 ? "Hali retseptlar yo'q" : "Topilmadi"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((r) => {
            const s = STATUS[r.status] || STATUS.active;
            const meds = (r.medications || []) as RxMed[];
            return (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-secondary font-semibold">{r.rx_number}</span>
                      <Badge variant="outline" className={s.color}>{s.label}</Badge>
                    </div>
                    <p className="font-semibold text-foreground mt-1">{r.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.prescription_date).toLocaleDateString("uz-UZ")}
                      {r.diagnosis && ` • ${r.diagnosis}`}
                      {r.icd_code && ` • ${r.icd_code}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => printRx(r)}>
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {meds.slice(0, 3).map((m, i) => (
                    <div key={i} className="flex items-baseline gap-2 text-sm">
                      <Pill className="w-3 h-3 text-secondary shrink-0" />
                      <span className="font-medium text-foreground">{m.name} {m.strength}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        — {m.dosage}, {m.frequency}, {m.duration}
                      </span>
                    </div>
                  ))}
                  {meds.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-5">… va yana {meds.length - 3} ta</p>
                  )}
                </div>

                {r.warnings && (
                  <div className="mt-3 p-2 rounded-md bg-rose-500/5 border border-rose-500/20 text-xs text-rose-700">
                    ⚠️ {r.warnings}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  {r.status === "active" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "dispensed")}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Berildi
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(r.id, "cancelled")}>
                        Bekor qilish
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Rx */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-secondary" /> Yangi retsept
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Bemor + tashxis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Bemor *</Label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Tanlang...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} {p.phone ? `• ${p.phone}` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Amal qilish muddati</Label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {selectedPatient?.allergies && (
              <div className="p-2.5 rounded-md bg-amber-500/5 border border-amber-500/20 text-xs text-amber-800">
                <strong>Allergiya:</strong> {selectedPatient.allergies}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Tashxis</Label>
                <Input
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">ICD-10</Label>
                <Input
                  value={form.icd_code}
                  onChange={(e) => setForm({ ...form, icd_code: e.target.value })}
                  className="mt-1"
                  placeholder="J06.9"
                />
              </div>
            </div>

            {/* Dorilar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold">Dorilar ({form.medications.length})</Label>
                <Popover open={drugPickOpen} onOpenChange={setDrugPickOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" size="sm" variant="outline" className="gap-1.5 border-secondary/40 text-secondary">
                      <Plus className="w-3.5 h-3.5" /> Dori qo'shish
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[380px] p-0 max-h-[440px] flex flex-col">
                    <div className="p-2 border-b border-border space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={drugSearch}
                          onChange={(e) => setDrugSearch(e.target.value)}
                          placeholder="Dori nomi yoki INN..."
                          className="h-8 pl-7 text-xs"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant={drugCat === "all" ? "default" : "outline"}
                          className="cursor-pointer text-[10px]"
                          onClick={() => setDrugCat("all")}
                        >Hammasi</Badge>
                        {DRUG_CATEGORIES.map((c) => (
                          <Badge
                            key={c}
                            variant={drugCat === c ? "default" : "outline"}
                            className="cursor-pointer text-[10px]"
                            onClick={() => setDrugCat(c)}
                          >{c}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {filteredDrugs.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">Topilmadi</p>
                      ) : filteredDrugs.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => addDrug(d)}
                          className="w-full text-left px-3 py-2 hover:bg-muted border-b border-border/50 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{d.generic}</div>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0">{d.category}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {form.medications.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  Dorilar bazasidan dori qo'shing
                </div>
              ) : (
                <div className="space-y-2">
                  {form.medications.map((m, i) => {
                    const drug = DRUG_DATABASE.find((d) => d.id === m.drug_id);
                    return (
                      <div key={i} className="rounded-lg border border-border p-3 bg-muted/30">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm">{m.name}</p>
                            <p className="text-[11px] text-muted-foreground">{m.generic}</p>
                          </div>
                          <button onClick={() => removeMed(i)} className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[10px]">Doza</Label>
                            <select
                              value={m.strength}
                              onChange={(e) => updateMed(i, "strength", e.target.value)}
                              className="mt-1 w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                            >
                              {(drug?.strengths || [m.strength]).map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <Label className="text-[10px]">Shakl</Label>
                            <select
                              value={m.form}
                              onChange={(e) => updateMed(i, "form", e.target.value)}
                              className="mt-1 w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                            >
                              {(drug?.forms || [m.form]).map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                          </div>
                          <div>
                            <Label className="text-[10px]">Bir martalik</Label>
                            <Input
                              value={m.dosage}
                              onChange={(e) => updateMed(i, "dosage", e.target.value)}
                              className="mt-1 h-8 text-xs"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-[10px]">Qabul tartibi</Label>
                            <Input
                              value={m.frequency}
                              onChange={(e) => updateMed(i, "frequency", e.target.value)}
                              className="mt-1 h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Davomiyligi</Label>
                            <Input
                              value={m.duration}
                              onChange={(e) => updateMed(i, "duration", e.target.value)}
                              className="mt-1 h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <Label className="text-[10px]">Ko'rsatma</Label>
                          <Textarea
                            rows={1}
                            value={m.instructions}
                            onChange={(e) => updateMed(i, "instructions", e.target.value)}
                            className="mt-1 text-xs"
                          />
                        </div>
                        {drug?.pregnancy === "contraindicated" && (
                          <p className="text-[11px] text-rose-700 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Homiladorlikda QAT'IY MAN ETILGAN
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tekshiruvlar */}
            {(interactions.length > 0 || allergyConflicts.length > 0) && (
              <div className="space-y-2">
                {allergyConflicts.map((msg, i) => (
                  <div key={`a-${i}`} className="p-2.5 rounded-md border bg-rose-500/5 text-rose-700 border-rose-500/30 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div><strong>Allergiya konflikti:</strong> {msg}</div>
                  </div>
                ))}
                {interactions.map((it, i) => (
                  <div key={`i-${i}`} className={`p-2.5 rounded-md border text-xs flex items-start gap-2 ${SEV_COLOR[it.severity]}`}>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <strong>O'zaro ta'sir ({it.severity === "high" ? "yuqori" : it.severity === "moderate" ? "o'rta" : "past"}):</strong> {it.message}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {form.medications.length > 0 && interactions.length === 0 && allergyConflicts.length === 0 && (
              <div className="p-2.5 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-700 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Konfliktlar topilmadi
              </div>
            )}

            <div>
              <Label className="text-xs">Umumiy ko'rsatmalar</Label>
              <Textarea
                rows={2}
                value={form.general_instructions}
                onChange={(e) => setForm({ ...form, general_instructions: e.target.value })}
                className="mt-1"
                placeholder="Parhez, suyuqlik, dam olish va h.k."
              />
            </div>
            <div>
              <Label className="text-xs">Ogohlantirish</Label>
              <Input
                value={form.warnings}
                onChange={(e) => setForm({ ...form, warnings: e.target.value })}
                className="mt-1"
                placeholder="Mashina haydashdan saqlaning, alkogoldan voz keching..."
              />
            </div>

            <Button onClick={save} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">
              Retseptni saqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocPrescriptions;

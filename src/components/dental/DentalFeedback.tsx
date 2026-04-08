import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";
import { Star, MessageSquare, AlertCircle, TrendingUp, Search, Plus, X, Send, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { patients: any[]; clinicId: string }

const DentalFeedback = ({ patients, clinicId }: Props) => {
  const [tab, setTab] = useState<"reviews" | "complaints" | "stats">("reviews");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [form, setForm] = useState({ patient_id: "", doctor_name: "", service_type: "", rating: 5, comment: "" });
  const [complaintForm, setComplaintForm] = useState({ patient_id: "", issue: "", priority: "normal" });

  const fetchData = async () => {
    const [fb, comp] = await Promise.all([
      supabase.from("dental_feedback").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("dental_complaints").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
    ]);
    setFeedbacks(fb.data || []);
    setComplaints(comp.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const getPatientName = (pid: string | null) => patients.find(p => p.id === pid)?.full_name || "Noma'lum";

  const handleAddFeedback = async () => {
    if (!form.comment || !form.rating) { toast({ title: "Baho va izoh majburiy", variant: "destructive" }); return; }
    await supabase.from("dental_feedback").insert({
      clinic_id: clinicId, patient_id: form.patient_id || null,
      doctor_name: form.doctor_name || null, service_type: form.service_type || null,
      rating: form.rating, comment: form.comment,
    } as any);
    await writeAuditLog({ action: "create", entity_type: "dental_feedback", module: "dental" });
    toast({ title: "✅ Fikr qo'shildi" });
    setShowForm(false);
    setForm({ patient_id: "", doctor_name: "", service_type: "", rating: 5, comment: "" });
    fetchData();
  };

  const handleReply = async (id: string) => {
    if (!replyText) return;
    await supabase.from("dental_feedback").update({ reply: replyText, replied_at: new Date().toISOString(), status: "replied" } as any).eq("id", id);
    toast({ title: "✅ Javob saqlandi" });
    setReplyId(null);
    setReplyText("");
    fetchData();
  };

  const handleAddComplaint = async () => {
    if (!complaintForm.issue) { toast({ title: "Muammo majburiy", variant: "destructive" }); return; }
    await supabase.from("dental_complaints").insert({
      clinic_id: clinicId, patient_id: complaintForm.patient_id || null,
      issue: complaintForm.issue, priority: complaintForm.priority,
    } as any);
    await writeAuditLog({ action: "create", entity_type: "dental_complaint", module: "dental" });
    toast({ title: "✅ Shikoyat qo'shildi" });
    setShowComplaintForm(false);
    setComplaintForm({ patient_id: "", issue: "", priority: "normal" });
    fetchData();
  };

  const resolveComplaint = async (id: string, resolution: string) => {
    await supabase.from("dental_complaints").update({ status: "resolved", resolution, resolved_at: new Date().toISOString() } as any).eq("id", id);
    toast({ title: "✅ Hal qilindi" });
    fetchData();
  };

  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((a, r) => a + r.rating, 0) / feedbacks.length) : 0;
  const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
  const openComplaints = complaints.filter(c => c.status === "open").length;

  const filteredFeedbacks = feedbacks.filter(f => {
    const name = getPatientName(f.patient_id);
    return !search || name.toLowerCase().includes(search.toLowerCase()) || f.comment?.toLowerCase().includes(search.toLowerCase()) || f.doctor_name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">💬 Qayta aloqa & CRM</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "O'rtacha baho", value: avgRating.toFixed(1), icon: Star, color: "text-yellow-600" },
          { label: "Jami sharhlar", value: feedbacks.length, icon: MessageSquare, color: "text-blue-600" },
          { label: "Ijobiy", value: positiveCount, icon: TrendingUp, color: "text-green-600" },
          { label: "Ochiq shikoyatlar", value: openComplaints, icon: AlertCircle, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { id: "reviews" as const, label: "⭐ Sharhlar" },
          { id: "complaints" as const, label: "⚠️ Shikoyatlar" },
          { id: "stats" as const, label: "📊 Statistika" },
        ]).map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "outline"} onClick={() => setTab(t.id)}>{t.label}</Button>
        ))}
      </div>

      {tab === "reviews" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input className="flex-1" placeholder="🔍 Sharh qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
            <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Yangi</Button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-foreground">Yangi fikr</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
                  <option value="">Bemor tanlang</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
                <Input placeholder="Shifokor" value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} />
                <Input placeholder="Xizmat turi" value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-muted-foreground">Baho:</span>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setForm({ ...form, rating: n })}>
                    <Star className={cn("w-6 h-6", n <= form.rating ? "text-yellow-500 fill-yellow-500" : "text-muted")} />
                  </button>
                ))}
              </div>
              <Input className="mt-3" placeholder="Izoh *" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
              <Button size="sm" className="mt-3" onClick={handleAddFeedback}>Saqlash</Button>
            </div>
          )}

          {filteredFeedbacks.map(review => (
            <div key={review.id} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{getPatientName(review.patient_id)}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("w-4 h-4", i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                  {review.service_type && <Badge variant="outline" className="mt-1 text-xs">{review.service_type}</Badge>}
                  <p className="text-xs text-muted-foreground mt-2">👨‍⚕️ {review.doctor_name || "—"} • {review.created_at?.split("T")[0]}</p>
                  {review.reply && (
                    <div className="mt-3 bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-foreground">↩ Javob:</p>
                      <p className="text-sm text-muted-foreground">{review.reply}</p>
                    </div>
                  )}
                </div>
                <div>
                  {review.reply ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">Javob berildi</Badge>
                  ) : replyId === review.id ? (
                    <div className="flex gap-2">
                      <Input className="w-48" placeholder="Javob..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                      <Button size="sm" onClick={() => handleReply(review.id)}><Send className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setReplyId(review.id); setReplyText(""); }}>Javob berish</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredFeedbacks.length === 0 && <p className="text-center py-8 text-muted-foreground">Sharhlar topilmadi</p>}
        </div>
      )}

      {tab === "complaints" && (
        <div className="space-y-4">
          <Button size="sm" onClick={() => setShowComplaintForm(true)}><Plus className="w-4 h-4 mr-1" /> Yangi shikoyat</Button>

          {showComplaintForm && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-foreground">Yangi shikoyat</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowComplaintForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={complaintForm.patient_id} onChange={e => setComplaintForm({ ...complaintForm, patient_id: e.target.value })}>
                  <option value="">Bemor tanlang</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={complaintForm.priority} onChange={e => setComplaintForm({ ...complaintForm, priority: e.target.value })}>
                  <option value="low">Past</option>
                  <option value="normal">O'rta</option>
                  <option value="high">Yuqori</option>
                  <option value="critical">Jiddiy</option>
                </select>
              </div>
              <Input className="mt-3" placeholder="Muammo tavsifi *" value={complaintForm.issue} onChange={e => setComplaintForm({ ...complaintForm, issue: e.target.value })} />
              <Button size="sm" className="mt-3" onClick={handleAddComplaint}>Saqlash</Button>
            </div>
          )}

          {complaints.map(c => (
            <div key={c.id} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{getPatientName(c.patient_id)}</p>
                    <Badge className={cn("text-xs",
                      c.priority === "critical" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400" :
                      c.priority === "high" ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400" :
                      c.priority === "normal" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400" :
                      "bg-muted text-muted-foreground"
                    )}>{c.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{c.issue}</p>
                  <p className="text-xs text-muted-foreground mt-2">{c.created_at?.split("T")[0]}</p>
                  {c.resolution && (
                    <div className="mt-2 bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                      <p className="text-xs text-green-700 dark:text-green-400">✅ {c.resolution}</p>
                    </div>
                  )}
                </div>
                <div>
                  {c.status === "open" ? (
                    <Button size="sm" variant="outline" onClick={() => {
                      const res = prompt("Yechim:");
                      if (res) resolveComplaint(c.id, res);
                    }}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Hal qilish
                    </Button>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">Hal qilindi</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          {complaints.length === 0 && <p className="text-center py-8 text-muted-foreground">Shikoyatlar yo'q</p>}
        </div>
      )}

      {tab === "stats" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">📊 Baho taqsimoti</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(n => {
                const count = feedbacks.filter(f => f.rating === n).length;
                const pct = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-foreground">{n}</span>
                    </div>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top doctors */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">🏆 Eng yaxshi shifokorlar</h3>
            {(() => {
              const docs: Record<string, { total: number; count: number }> = {};
              feedbacks.forEach(f => {
                if (!f.doctor_name) return;
                if (!docs[f.doctor_name]) docs[f.doctor_name] = { total: 0, count: 0 };
                docs[f.doctor_name].total += f.rating;
                docs[f.doctor_name].count += 1;
              });
              const sorted = Object.entries(docs).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count));
              if (sorted.length === 0) return <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>;
              return sorted.map(([name, d], i) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👨‍⚕️"}</span>
                    <span className="text-sm font-medium text-foreground">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold text-foreground">{(d.total / d.count).toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({d.count} ta)</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalFeedback;

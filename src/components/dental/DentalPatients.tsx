import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, User, Phone, Calendar, Heart, FileText, FlaskConical, CreditCard, ClipboardList, X, Bell, Activity, TrendingUp, Download, Upload, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalPatientsProps {
  patients: any[];
  onAddPatient: (form: { full_name: string; phone: string; date_of_birth: string; gender: string; allergies?: string; notes?: string }) => Promise<void>;
  onOpenToothChart: (patient: any) => void;
  treatments?: any[];
  appointments?: any[];
  clinicId: string;
}

const DentalPatients = ({ patients, onAddPatient, onOpenToothChart, treatments = [], appointments = [] }: DentalPatientsProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [profileTab, setProfileTab] = useState("overview");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [form, setForm] = useState({ full_name: "", phone: "", date_of_birth: "", gender: "male", allergies: "", notes: "" });

  const handleAdd = async () => {
    if (!form.full_name || !form.phone) return;
    await onAddPatient(form);
    setForm({ full_name: "", phone: "", date_of_birth: "", gender: "male", allergies: "", notes: "" });
    setShowAdd(false);
  };

  const filtered = patients
    .filter(p => {
      const matchSearch = p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search);
      const matchGender = genderFilter === "all" || p.gender === genderFilter;
      return matchSearch && matchGender;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.full_name || "").localeCompare(b.full_name || "");
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const patientTreatments = treatments.filter(t => t.patient_id === selectedPatient?.id);
  const patientAppts = appointments.filter(a => a.patient_id === selectedPatient?.id);
  const totalSpent = patientTreatments.reduce((a: number, t: any) => a + (Number(t.price) || 0), 0);
  const completedTreatments = patientTreatments.filter((t: any) => t.status === "completed");
  const activeTreatments = patientTreatments.filter((t: any) => t.status !== "completed");

  const getAge = (dob: string) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  // Patient detail view
  if (selectedPatient) {
    const age = getAge(selectedPatient.date_of_birth);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedPatient(null); setProfileTab("overview"); }}>
            <X className="w-4 h-4 mr-1" /> Orqaga
          </Button>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-foreground">{selectedPatient.full_name}</h2>
            <p className="text-sm text-muted-foreground">{selectedPatient.phone} {age && `• ${age} yosh`}</p>
          </div>
          <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-950/30">
            Faol bemor
          </Badge>
        </div>

        {/* Quick Actions - 6 buttons */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Tish xaritasi", icon: Heart, color: "text-red-600 bg-red-50 dark:bg-red-950/30", action: () => onOpenToothChart(selectedPatient) },
            { label: "Davolash", icon: ClipboardList, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30", action: () => setProfileTab("treatment") },
            { label: "Qabul yozish", icon: Calendar, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30", action: () => setProfileTab("appointments") },
            { label: "To'lov", icon: CreditCard, color: "text-green-600 bg-green-50 dark:bg-green-950/30", action: () => setProfileTab("payments") },
            { label: "Labga yuborish", icon: FlaskConical, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30", action: () => setProfileTab("lab") },
            { label: "Fayllar", icon: FileText, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30", action: () => setProfileTab("files") },
          ].map(a => (
            <button key={a.label} onClick={a.action} className={cn("rounded-xl p-3 flex flex-col items-center gap-1.5 border border-border transition-all hover:shadow-md cursor-pointer", a.color)}>
              <a.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight text-center">{a.label}</span>
            </button>
          ))}
        </div>

        <Tabs value={profileTab} onValueChange={setProfileTab}>
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="overview">Umumiy</TabsTrigger>
            <TabsTrigger value="tooth-chart">Tish</TabsTrigger>
            <TabsTrigger value="treatment">Davolash</TabsTrigger>
            <TabsTrigger value="appointments">Qabullar</TabsTrigger>
            <TabsTrigger value="payments">To'lov</TabsTrigger>
            <TabsTrigger value="lab">Lab</TabsTrigger>
            <TabsTrigger value="files">Fayllar</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
                    {selectedPatient.gender === "female" ? "👩" : "👨"}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold text-foreground">{selectedPatient.full_name}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedPatient.phone}</span>
                      {selectedPatient.date_of_birth && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedPatient.date_of_birth} ({age} yosh)</span>}
                      <span>{selectedPatient.gender === "female" ? "👩 Ayol" : "👨 Erkak"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allergies warning */}
              {selectedPatient.allergies && (
                <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-200 dark:border-red-900 flex items-start gap-3">
                  <Bell className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-600">⚠️ Allergiya ogohlantirishi</p>
                    <p className="text-sm text-red-500 mt-1">{selectedPatient.allergies}</p>
                  </div>
                </div>
              )}

              {selectedPatient.notes && (
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <p className="text-sm text-muted-foreground">📝 Izohlar: {selectedPatient.notes}</p>
                </div>
              )}

              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-primary">{patientTreatments.length}</p>
                  <p className="text-xs text-muted-foreground">Davolashlar</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{patientAppts.length}</p>
                  <p className="text-xs text-muted-foreground">Qabullar</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{totalSpent.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Jami (so'm)</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <Heart className="w-5 h-5 mx-auto mb-1 text-red-600" />
                  <p className="text-2xl font-bold text-red-600">{activeTreatments.length}</p>
                  <p className="text-xs text-muted-foreground">Faol davolash</p>
                </div>
              </div>

              {/* Recent activity */}
              {patientTreatments.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="font-heading font-bold text-foreground mb-3">Oxirgi faoliyat</h3>
                  <div className="space-y-2">
                    {patientTreatments.slice(0, 3).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.treatment_type}</p>
                          <p className="text-xs text-muted-foreground">{t.tooth_number ? `Tish #${t.tooth_number} • ` : ""}{t.created_at?.split("T")[0]}</p>
                        </div>
                        <Badge variant="outline" className={cn(
                          t.status === "completed" && "text-green-600",
                          t.status === "in_progress" && "text-blue-600",
                          (!t.status || t.status === "pending") && "text-yellow-600"
                        )}>{t.status || "pending"}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TOOTH CHART TAB */}
          <TabsContent value="tooth-chart">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-4xl">🦷</div>
                <div>
                  <h3 className="font-heading font-bold text-foreground text-lg">Tish xaritasi</h3>
                  <p className="text-sm text-muted-foreground mt-1">32 ta tish holati interaktiv xaritada</p>
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                  {Object.entries(selectedPatient.tooth_chart || {}).length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 w-full max-w-xs mx-auto mb-4">
                      {Object.entries(selectedPatient.tooth_chart as Record<string, string>).map(([tooth, status]) => (
                        <div key={tooth} className="text-center p-2 bg-muted/50 rounded-lg">
                          <p className="text-xs font-bold text-foreground">#{tooth}</p>
                          <p className="text-[10px] text-muted-foreground">{status}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Hali ma'lumot kiritilmagan</p>
                  )}
                </div>
                <Button onClick={() => onOpenToothChart(selectedPatient)} className="px-8">🦷 Tish xaritasini ochish</Button>
              </div>
            </div>
          </TabsContent>

          {/* TREATMENT TAB */}
          <TabsContent value="treatment">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-foreground">Davolash tarixi</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-green-600">{completedTreatments.length} tugallangan</Badge>
                  <Badge variant="outline" className="text-blue-600">{activeTreatments.length} faol</Badge>
                </div>
              </div>
              {patientTreatments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Davolashlar topilmadi</p>
                  <p className="text-xs mt-1">Yangi davolash "Davolash kursi" bo'limidan boshlanadi</p>
                </div>
              ) : patientTreatments.map((t: any) => (
                <div key={t.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                        t.status === "completed" ? "bg-green-100 dark:bg-green-950/30" : "bg-blue-100 dark:bg-blue-950/30"
                      )}>
                        {t.status === "completed" ? "✅" : "🔄"}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{t.treatment_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.tooth_number && `Tish #${t.tooth_number} • `}
                          {t.created_at?.split("T")[0]}
                          {t.description && ` • ${t.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={cn(
                        t.status === "completed" ? "text-green-600 bg-green-50 dark:bg-green-950/30" : "text-blue-600 bg-blue-50 dark:bg-blue-950/30"
                      )}>{t.status || "pending"}</Badge>
                      {t.price && <p className="text-sm font-bold text-foreground mt-1">{Number(t.price).toLocaleString()} so'm</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* APPOINTMENTS TAB */}
          <TabsContent value="appointments">
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-foreground">Qabullar tarixi</h3>
              {patientAppts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Qabullar topilmadi</p>
                </div>
              ) : patientAppts.map((a: any) => (
                <div key={a.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{a.appointment_date} • {a.appointment_time}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.doctor_name && `👨‍⚕️ ${a.doctor_name} • `}{a.notes || "Izoh yo'q"}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn(
                      a.status === "completed" && "text-green-600",
                      a.status === "scheduled" && "text-blue-600",
                      a.status === "cancelled" && "text-red-600",
                    )}>{a.status || "scheduled"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments">
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-foreground">To'lovlar</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900 p-4 text-center">
                  <p className="text-xs text-green-600 font-medium">Jami davolash</p>
                  <p className="text-xl font-bold text-green-700">{totalSpent.toLocaleString()} so'm</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900 p-4 text-center">
                  <p className="text-xs text-red-600 font-medium">Qarzdorlik</p>
                  <p className="text-xl font-bold text-red-700">0 so'm</p>
                </div>
              </div>
              {patientTreatments.filter((t: any) => t.price).length > 0 ? (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-muted-foreground font-medium">Xizmat</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Sana</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Summa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientTreatments.filter((t: any) => t.price).map((t: any) => (
                        <tr key={t.id} className="border-t border-border">
                          <td className="p-3 text-foreground">{t.treatment_type}</td>
                          <td className="p-3 text-muted-foreground">{t.created_at?.split("T")[0]}</td>
                          <td className="p-3 text-right font-medium text-foreground">{Number(t.price).toLocaleString()} so'm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">To'lov ma'lumotlari topilmadi</p>
              )}
            </div>
          </TabsContent>

          {/* LAB TAB */}
          <TabsContent value="lab">
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-foreground">Laboratoriya</h3>
              <div className="bg-card rounded-2xl border border-border p-6 text-center">
                <FlaskConical className="w-16 h-16 mx-auto mb-4 text-purple-500 opacity-40" />
                <p className="text-foreground font-medium">Lab xizmatlari</p>
                <p className="text-sm text-muted-foreground mt-1">Bemorni laboratoriyaga yo'naltirish uchun "Labga yuborish" tugmasini bosing</p>
                <Button variant="outline" className="mt-4">
                  <FlaskConical className="w-4 h-4 mr-1" /> Labga yuborish
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* FILES TAB */}
          <TabsContent value="files">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-foreground">Hujjatlar va fayllar</h3>
                <Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-1" /> Yuklash</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Rentgen (X-ray)", icon: "🩻", count: 0 },
                  { label: "Before/After", icon: "📸", count: 0 },
                  { label: "Hujjatlar", icon: "📄", count: 0 },
                ].map(cat => (
                  <div key={cat.label} className="bg-card rounded-xl border border-border p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
                    <p className="text-3xl mb-2">{cat.icon}</p>
                    <p className="font-medium text-foreground">{cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{cat.count} ta fayl</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground">Fayllarni yuklash va boshqarish "Hujjatlar" bo'limida</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">👤 Bemorlar</h2>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Yangi bemor</Button>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Ism yoki telefon..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["all", "male", "female"].map(g => (
          <Button key={g} size="sm" variant={genderFilter === g ? "default" : "outline"} onClick={() => setGenderFilter(g)}>
            {g === "all" ? "Barchasi" : g === "male" ? "👨 Erkak" : "👩 Ayol"}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => setSortBy(sortBy === "name" ? "date" : "name")}>
          {sortBy === "name" ? "A→Z" : "📅 Sana"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{patients.length}</p>
          <p className="text-xs text-muted-foreground">Jami bemorlar</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{patients.filter(p => p.gender === "male").length}</p>
          <p className="text-xs text-muted-foreground">Erkak</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-pink-600">{patients.filter(p => p.gender === "female").length}</p>
          <p className="text-xs text-muted-foreground">Ayol</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{treatments.length}</p>
          <p className="text-xs text-muted-foreground">Jami davolashlar</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-foreground">Yangi bemor qo'shish</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Ism familiya *" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            <Input placeholder="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <Input type="date" placeholder="Tug'ilgan sana" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
              <option value="male">Erkak</option>
              <option value="female">Ayol</option>
            </select>
            <Input placeholder="Allergiya" value={form.allergies} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))} />
            <Input placeholder="Izohlar" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd}>Saqlash</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
          </div>
        </div>
      )}

      {/* Patient cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => {
          const pTreatments = treatments.filter(t => t.patient_id === p.id);
          const pAge = getAge(p.date_of_birth);
          return (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                  {p.gender === "female" ? "👩" : "👨"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.phone} {pAge && `• ${pAge} yosh`}</p>
                </div>
                {pTreatments.length > 0 && (
                  <Badge variant="outline" className="text-xs">{pTreatments.length} davolash</Badge>
                )}
              </div>
              {p.allergies && (
                <p className="text-xs text-red-500 mb-2">⚠️ {p.allergies}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setSelectedPatient(p)}>
                  <Eye className="w-3 h-3 mr-1" /> Profil
                </Button>
                <Button size="sm" variant="outline" onClick={() => onOpenToothChart(p)}>
                  🦷 Tish
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSelectedPatient(p); setProfileTab("treatment"); }}>
                  <ClipboardList className="w-3 h-3 mr-1" /> Davolash
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSelectedPatient(p); setProfileTab("payments"); }}>
                  <CreditCard className="w-3 h-3 mr-1" /> To'lov
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Bemorlar topilmadi</p>}
    </div>
  );
};

export default DentalPatients;

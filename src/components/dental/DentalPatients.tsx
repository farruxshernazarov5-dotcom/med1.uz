import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, User, Phone, Calendar, Heart, FileText, FlaskConical, CreditCard, ClipboardList, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalPatientsProps {
  patients: any[];
  onAddPatient: (form: { full_name: string; phone: string; date_of_birth: string; gender: string; allergies?: string; notes?: string }) => Promise<void>;
  onOpenToothChart: (patient: any) => void;
  treatments?: any[];
  appointments?: any[];
}

const DentalPatients = ({ patients, onAddPatient, onOpenToothChart, treatments = [], appointments = [] }: DentalPatientsProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [profileTab, setProfileTab] = useState("overview");
  const [form, setForm] = useState({ full_name: "", phone: "", date_of_birth: "", gender: "male", allergies: "", notes: "" });

  const handleAdd = async () => {
    await onAddPatient(form);
    setForm({ full_name: "", phone: "", date_of_birth: "", gender: "male", allergies: "", notes: "" });
    setShowAdd(false);
  };

  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  const patientTreatments = treatments.filter(t => t.patient_id === selectedPatient?.id);
  const patientAppts = appointments.filter(a => a.patient_id === selectedPatient?.id);

  // Patient detail view
  if (selectedPatient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
            <X className="w-4 h-4 mr-1" /> Orqaga
          </Button>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">{selectedPatient.full_name}</h2>
            <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Tish xaritasi", icon: Heart, color: "text-red-600 bg-red-50 dark:bg-red-950/30", action: () => onOpenToothChart(selectedPatient) },
            { label: "Davolash boshlash", icon: ClipboardList, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30", action: () => setProfileTab("treatment") },
            { label: "Labga yuborish", icon: FlaskConical, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30", action: () => setProfileTab("lab") },
            { label: "To'lov qilish", icon: CreditCard, color: "text-green-600 bg-green-50 dark:bg-green-950/30", action: () => setProfileTab("payments") },
          ].map(a => (
            <button key={a.label} onClick={a.action} className={cn("rounded-xl p-4 flex flex-col items-center gap-2 border border-border transition-all hover:shadow-md", a.color)}>
              <a.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{a.label}</span>
            </button>
          ))}
        </div>

        <Tabs value={profileTab} onValueChange={setProfileTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview">Umumiy</TabsTrigger>
            <TabsTrigger value="tooth-chart">Tish</TabsTrigger>
            <TabsTrigger value="treatment">Davolash</TabsTrigger>
            <TabsTrigger value="payments">To'lov</TabsTrigger>
            <TabsTrigger value="lab">Lab</TabsTrigger>
            <TabsTrigger value="files">Fayllar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                  {selectedPatient.gender === "female" ? "👩" : "👨"}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-foreground">{selectedPatient.full_name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedPatient.phone}</span>
                    {selectedPatient.date_of_birth && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedPatient.date_of_birth}</span>}
                  </div>
                </div>
              </div>
              {selectedPatient.allergies && (
                <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 border border-red-200 dark:border-red-900">
                  <p className="text-xs font-medium text-red-600">⚠️ Allergiya: {selectedPatient.allergies}</p>
                </div>
              )}
              {selectedPatient.notes && (
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">📝 {selectedPatient.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <p className="text-2xl font-bold text-primary">{patientTreatments.length}</p>
                  <p className="text-xs text-muted-foreground">Davolashlar</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{patientAppts.length}</p>
                  <p className="text-xs text-muted-foreground">Qabullar</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">
                    {patientTreatments.reduce((a: number, t: any) => a + (Number(t.price) || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Jami (so'm)</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tooth-chart">
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <Heart className="w-12 h-12 mx-auto mb-3 text-primary opacity-50" />
              <p className="text-muted-foreground mb-3">Tish xaritasini ko'rish</p>
              <Button onClick={() => onOpenToothChart(selectedPatient)}>🦷 Tish xaritasini ochish</Button>
            </div>
          </TabsContent>

          <TabsContent value="treatment">
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-foreground">Davolash tarixi</h3>
              {patientTreatments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Davolashlar topilmadi</p>
              ) : patientTreatments.map((t: any) => (
                <div key={t.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{t.treatment_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.tooth_number && `Tish #${t.tooth_number} • `}
                        {t.created_at?.split("T")[0]}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{t.status || "pending"}</Badge>
                      {t.price && <p className="text-xs text-muted-foreground mt-1">{Number(t.price).toLocaleString()} so'm</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-foreground">To'lovlar tarixi</h3>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Jami davolash summasi:</span>
                  <span className="font-bold text-foreground">{patientTreatments.reduce((a: number, t: any) => a + (Number(t.price) || 0), 0).toLocaleString()} so'm</span>
                </div>
              </div>
              <p className="text-center py-4 text-muted-foreground text-sm">Batafsil to'lovlar "Moliya" bo'limida</p>
            </div>
          </TabsContent>

          <TabsContent value="lab">
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 text-purple-500 opacity-50" />
              <p className="text-muted-foreground">Lab natijalari "Lab" bo'limida</p>
            </div>
          </TabsContent>

          <TabsContent value="files">
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-blue-500 opacity-50" />
              <p className="text-muted-foreground">Hujjatlar "Hujjatlar" bo'limida</p>
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Bemor qidirish (ism yoki telefon)..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
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
        {filtered.map(p => (
          <div key={p.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                {p.gender === "female" ? "👩" : "👨"}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">{p.phone} {p.date_of_birth && `• ${p.date_of_birth}`}</p>
              </div>
            </div>
            {p.allergies && (
              <p className="text-xs text-red-500 mb-2">⚠️ {p.allergies}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setSelectedPatient(p)}>
                <User className="w-3 h-3 mr-1" /> Ko'rish
              </Button>
              <Button size="sm" variant="outline" onClick={() => onOpenToothChart(p)}>
                🦷 Tish xaritasi
              </Button>
              <Button size="sm" variant="outline">
                <FlaskConical className="w-3 h-3 mr-1" /> Lab
              </Button>
              <Button size="sm" variant="outline">
                <CreditCard className="w-3 h-3 mr-1" /> To'lov
              </Button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Bemorlar topilmadi</p>}
    </div>
  );
};

export default DentalPatients;

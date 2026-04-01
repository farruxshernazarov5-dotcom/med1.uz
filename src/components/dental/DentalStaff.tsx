import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, Star, TrendingUp, Plus, Calendar, Phone, Mail, FileText, Upload, BarChart3, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  rating: number;
  patientsToday: number;
  patientsMonth: number;
  revenue: number;
  experience: number;
  status: "online" | "busy" | "offline";
  workingHours: string;
  avatar: string;
  documents: { name: string; type: string; date: string }[];
}

const SAMPLE_DOCTORS: Doctor[] = [
  { id: "1", name: "Dr. Karimov Bobur", specialty: "Implantolog", phone: "+998901234567", email: "karimov@med1.uz", rating: 4.8, patientsToday: 6, patientsMonth: 48, revenue: 15000000, experience: 12, status: "online", workingHours: "08:00 - 17:00", avatar: "👨‍⚕️", documents: [{ name: "Diplom", type: "PDF", date: "2014" }, { name: "Sertifikat - Implantologiya", type: "PDF", date: "2020" }] },
  { id: "2", name: "Dr. Sultonova Madina", specialty: "Ortodont", phone: "+998907654321", email: "sultonova@med1.uz", rating: 4.9, patientsToday: 4, patientsMonth: 35, revenue: 12000000, experience: 8, status: "busy", workingHours: "09:00 - 18:00", avatar: "👩‍⚕️", documents: [{ name: "Diplom", type: "PDF", date: "2018" }, { name: "Litsenziya", type: "PDF", date: "2022" }] },
  { id: "3", name: "Dr. Azimov Sanjar", specialty: "Terapevt", phone: "+998933456789", email: "azimov@med1.uz", rating: 4.6, patientsToday: 8, patientsMonth: 62, revenue: 8000000, experience: 5, status: "online", workingHours: "08:00 - 16:00", avatar: "👨‍⚕️", documents: [{ name: "Diplom", type: "PDF", date: "2021" }] },
  { id: "4", name: "Dr. Rahimova Nilufar", specialty: "Xirurg", phone: "+998945678901", email: "rahimova@med1.uz", rating: 4.7, patientsToday: 3, patientsMonth: 28, revenue: 20000000, experience: 15, status: "offline", workingHours: "10:00 - 19:00", avatar: "👩‍⚕️", documents: [{ name: "Diplom", type: "PDF", date: "2011" }, { name: "PhD Dissertatsiya", type: "PDF", date: "2018" }] },
];

const statusMap = {
  online: { label: "Faol", color: "bg-green-500" },
  busy: { label: "Band", color: "bg-yellow-500" },
  offline: { label: "Oflayn", color: "bg-muted-foreground" },
};

const SAMPLE_SCHEDULE = [
  { time: "08:00", patient: "Aliyev J.", procedure: "Konsultatsiya", status: "completed" },
  { time: "09:00", patient: "Karimova S.", procedure: "Plomba", status: "completed" },
  { time: "10:30", patient: "Toshmatov R.", procedure: "Implant", status: "in-progress" },
  { time: "12:00", patient: "—", procedure: "Tushlik", status: "break" },
  { time: "13:00", patient: "Usmonova G.", procedure: "Tish olish", status: "pending" },
  { time: "14:30", patient: "Nurmatov D.", procedure: "Profilaktika", status: "pending" },
  { time: "16:00", patient: "Xolmatova Z.", procedure: "Tozalash", status: "pending" },
];

const DentalStaff = () => {
  const [doctors] = useState<Doctor[]>(SAMPLE_DOCTORS);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [doctorTab, setDoctorTab] = useState("profile");
  const [addForm, setAddForm] = useState({ name: "", specialty: "", phone: "", email: "", experience: "" });

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedDoctor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedDoctor(null); setDoctorTab("profile"); }}>
            <X className="w-4 h-4 mr-1" /> Orqaga
          </Button>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-foreground">🩺 {selectedDoctor.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", statusMap[selectedDoctor.status].color)} />
            <span className="text-sm text-muted-foreground">{statusMap[selectedDoctor.status].label}</span>
          </div>
        </div>

        <Tabs value={doctorTab} onValueChange={setDoctorTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="schedule">Jadval</TabsTrigger>
            <TabsTrigger value="patients">Bemorlar</TabsTrigger>
            <TabsTrigger value="documents">Hujjatlar</TabsTrigger>
            <TabsTrigger value="performance">Samaradorlik</TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile">
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-5xl">
                    {selectedDoctor.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-foreground">{selectedDoctor.name}</p>
                    <p className="text-muted-foreground">{selectedDoctor.specialty}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedDoctor.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedDoctor.email}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedDoctor.workingHours}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">⭐ {selectedDoctor.rating}</Badge>
                      <Badge variant="outline">🏥 {selectedDoctor.experience} yil tajriba</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Bugungi bemorlar", value: selectedDoctor.patientsToday, color: "text-blue-600" },
                  { label: "Oylik bemorlar", value: selectedDoctor.patientsMonth, color: "text-purple-600" },
                  { label: "Reyting", value: selectedDoctor.rating, color: "text-yellow-600" },
                  { label: "Oylik daromad", value: `${(selectedDoctor.revenue / 1000000).toFixed(0)}M`, color: "text-green-600" },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
                    <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* SCHEDULE */}
          <TabsContent value="schedule">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Bugungi jadval
                </h3>
                <Badge variant="outline">{SAMPLE_SCHEDULE.filter(s => s.status !== "break").length} qabul</Badge>
              </div>
              <div className="space-y-2">
                {SAMPLE_SCHEDULE.map((s, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all",
                    s.status === "completed" && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
                    s.status === "in-progress" && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
                    s.status === "pending" && "bg-card border-border",
                    s.status === "break" && "bg-muted/50 border-border opacity-60",
                  )}>
                    <p className="font-mono text-sm font-bold text-foreground w-14">{s.time}</p>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{s.patient}</p>
                      <p className="text-xs text-muted-foreground">{s.procedure}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      s.status === "completed" && "text-green-600",
                      s.status === "in-progress" && "text-blue-600",
                    )}>
                      {s.status === "completed" ? "✅ Bajarildi" : s.status === "in-progress" ? "🔄 Jarayonda" : s.status === "break" ? "☕ Tanaffus" : "⏳ Kutilmoqda"}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Weekly schedule */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h4 className="font-bold text-foreground mb-3">Haftalik jadval</h4>
                <div className="grid grid-cols-7 gap-2">
                  {["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"].map((day, i) => (
                    <div key={day} className={cn(
                      "text-center p-3 rounded-xl text-sm",
                      i < 5 ? "bg-primary/10" : "bg-muted/30"
                    )}>
                      <p className="font-bold text-foreground">{day}</p>
                      <p className="text-xs text-muted-foreground">{i < 5 ? selectedDoctor.workingHours : "Dam"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* PATIENTS */}
          <TabsContent value="patients">
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-foreground">Bemorlar tarixi</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{selectedDoctor.patientsMonth}</p>
                  <p className="text-xs text-muted-foreground">Bu oy</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedDoctor.patientsToday}</p>
                  <p className="text-xs text-muted-foreground">Bugun</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{Math.round(selectedDoctor.patientsMonth * 0.85)}</p>
                  <p className="text-xs text-muted-foreground">Muvaffaqiyatli</p>
                </div>
              </div>
              <p className="text-center py-4 text-sm text-muted-foreground">Batafsil bemorlar ro'yxati "Bemorlar" bo'limida</p>
            </div>
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-foreground">Hujjatlar</h3>
                <Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-1" /> Yuklash</Button>
              </div>
              {selectedDoctor.documents.map((doc, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.type} • {doc.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"><Eye className="w-3 h-3 mr-1" /> Ko'rish</Button>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {["Diplom", "Sertifikat", "Litsenziya"].map(cat => (
                  <div key={cat} className="bg-muted/30 rounded-xl p-4 text-center border border-dashed border-border cursor-pointer hover:bg-muted/60 transition-colors">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{cat} yuklash</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* PERFORMANCE */}
          <TabsContent value="performance">
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-foreground">Samaradorlik ko'rsatkichlari</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Oylik daromad", value: `${(selectedDoctor.revenue / 1000000).toFixed(0)}M`, color: "text-green-600", icon: TrendingUp },
                  { label: "O'rtacha chek", value: `${(selectedDoctor.revenue / selectedDoctor.patientsMonth / 1000).toFixed(0)}K`, color: "text-blue-600", icon: BarChart3 },
                  { label: "Bemor qoniqishi", value: `${(selectedDoctor.rating * 20).toFixed(0)}%`, color: "text-yellow-600", icon: Star },
                  { label: "Bandlik", value: "78%", color: "text-purple-600", icon: Clock },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
                    <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
                    <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Performance bars */}
              <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                {[
                  { label: "Qabul samaradorligi", value: 92 },
                  { label: "Vaqtida boshlash", value: 85 },
                  { label: "Bemor qaytishi", value: 72 },
                  { label: "Hujjatlar to'liqligi", value: 95 },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span className="font-bold text-foreground">{bar.value}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className={cn(
                        "rounded-full h-2.5 transition-all",
                        bar.value >= 90 ? "bg-green-500" : bar.value >= 70 ? "bg-blue-500" : "bg-yellow-500"
                      )} style={{ width: `${bar.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">👨‍⚕️ Shifokorlar</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}><Plus className="w-4 h-4 mr-1" /> Yangi shifokor</Button>
      </div>

      <Input placeholder="🔍 Shifokor qidirish..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* Add form */}
      {showAddForm && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-foreground">Yangi shifokor qo'shish</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Ism familiya *" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Mutaxassislik *" value={addForm.specialty} onChange={e => setAddForm(p => ({ ...p, specialty: e.target.value }))} />
            <Input placeholder="Telefon *" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} />
            <Input placeholder="Email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
            <Input type="number" placeholder="Tajriba (yil)" value={addForm.experience} onChange={e => setAddForm(p => ({ ...p, experience: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button>Saqlash</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Bekor</Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami shifokorlar", value: doctors.length, icon: Users, color: "text-primary" },
          { label: "Faol", value: doctors.filter(d => d.status === "online").length, icon: TrendingUp, color: "text-green-600" },
          { label: "O'rtacha reyting", value: (doctors.reduce((a, d) => a + d.rating, 0) / doctors.length).toFixed(1), icon: Star, color: "text-yellow-600" },
          { label: "Bugungi bemorlar", value: doctors.reduce((a, d) => a + d.patientsToday, 0), icon: Clock, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Doctors list */}
      {filtered.map(doc => {
        const st = statusMap[doc.status];
        return (
          <div key={doc.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDoctor(doc)}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                {doc.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{doc.name}</p>
                  <div className={cn("w-2.5 h-2.5 rounded-full", st.color)} />
                  <span className="text-xs text-muted-foreground">{st.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{doc.specialty} • {doc.experience} yil tajriba</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">⏰ {doc.workingHours}</span>
                  <span className="text-xs text-yellow-600">⭐ {doc.rating}</span>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-foreground">{doc.patientsToday} bemor</p>
                <p className="text-xs text-green-600">{(doc.revenue / 1000000).toFixed(0)}M so'm</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DentalStaff;

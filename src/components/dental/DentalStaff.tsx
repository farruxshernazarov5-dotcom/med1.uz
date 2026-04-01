import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Clock, Star, TrendingUp, Plus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  rating: number;
  patientsToday: number;
  revenue: number;
  status: "online" | "busy" | "offline";
  workingHours: string;
  avatar: string;
}

const SAMPLE_DOCTORS: Doctor[] = [
  { id: "1", name: "Dr. Karimov Bobur", specialty: "Implantolog", phone: "+998901234567", rating: 4.8, patientsToday: 6, revenue: 15000000, status: "online", workingHours: "08:00 - 17:00", avatar: "👨‍⚕️" },
  { id: "2", name: "Dr. Sultonova Madina", specialty: "Ortodont", phone: "+998907654321", rating: 4.9, patientsToday: 4, revenue: 12000000, status: "busy", workingHours: "09:00 - 18:00", avatar: "👩‍⚕️" },
  { id: "3", name: "Dr. Azimov Sanjar", specialty: "Terapevt", phone: "+998933456789", rating: 4.6, patientsToday: 8, revenue: 8000000, status: "online", workingHours: "08:00 - 16:00", avatar: "👨‍⚕️" },
  { id: "4", name: "Dr. Rahimova Nilufar", specialty: "Xirurg", phone: "+998945678901", rating: 4.7, patientsToday: 3, revenue: 20000000, status: "offline", workingHours: "10:00 - 19:00", avatar: "👩‍⚕️" },
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
];

const DentalStaff = () => {
  const [doctors] = useState<Doctor[]>(SAMPLE_DOCTORS);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [search, setSearch] = useState("");

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedDoctor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedDoctor(null)}>← Orqaga</Button>
          <h2 className="font-heading text-xl font-bold text-foreground">🩺 {selectedDoctor.name} kabineti</h2>
        </div>

        {/* Doctor info */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl">
              {selectedDoctor.avatar}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-foreground">{selectedDoctor.name}</p>
              <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm text-yellow-600">
                  <Star className="w-4 h-4 fill-yellow-500" /> {selectedDoctor.rating}
                </span>
                <span className="text-sm text-muted-foreground">⏰ {selectedDoctor.workingHours}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Oylik daromad</p>
              <p className="text-lg font-bold text-green-600">{selectedDoctor.revenue.toLocaleString()} so'm</p>
            </div>
          </div>
        </div>

        {/* Today's schedule */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Bugungi jadval
          </h3>
          <div className="space-y-3">
            {SAMPLE_SCHEDULE.map((s, i) => (
              <div key={i} className={cn(
                "flex items-center gap-4 p-3 rounded-xl border",
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
                  s.status === "break" && "text-muted-foreground",
                )}>
                  {s.status === "completed" ? "✅" : s.status === "in-progress" ? "🔄" : s.status === "break" ? "☕" : "⏳"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Bugungi bemorlar", value: selectedDoctor.patientsToday, color: "text-blue-600" },
            { label: "Oylik bemorlar", value: 45, color: "text-purple-600" },
            { label: "Reyting", value: selectedDoctor.rating, color: "text-yellow-600" },
            { label: "Samaradorlik", value: "92%", color: "text-green-600" },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">👨‍⚕️ Shifokorlar</h2>
        <Button><Plus className="w-4 h-4 mr-1" /> Yangi shifokor</Button>
      </div>

      <Input placeholder="🔍 Shifokor qidirish..." value={search} onChange={e => setSearch(e.target.value)} />

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
          <div
            key={doc.id}
            className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedDoctor(doc)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                {doc.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{doc.name}</p>
                  <div className={cn("w-2.5 h-2.5 rounded-full", st.color)} />
                  <span className="text-xs text-muted-foreground">{st.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{doc.specialty} • ⏰ {doc.workingHours}</p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-foreground">{doc.patientsToday} bemor</p>
                <p className="text-xs text-muted-foreground">⭐ {doc.rating}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DentalStaff;

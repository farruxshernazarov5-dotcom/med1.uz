import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, Heart, Search, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useMobileFavorites } from "@/hooks/useMobileFavorites";

type Doctor = { id: string; slug: string; name: string; clinic_id: string | null; primary_specialty: string | null; services: string[] | null };
type Clinic = { id: string; name: string };

export function MobileDoctorSearch() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [clinic, setClinic] = useState("all");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availableIds, setAvailableIds] = useState<Set<string> | null>(null);
  const favorites = useMobileFavorites();

  useEffect(() => {
    let alive = true;
    void Promise.all([
      supabase.from("doctors_external").select("id, slug, name, clinic_id, primary_specialty, services").order("name").limit(300),
      supabase.from("registered_clinics_public").select("id, name").eq("is_active", true).order("name").limit(200),
    ]).then(([doctorResult, clinicResult]) => {
      if (!alive) return;
      setDoctors((doctorResult.data as Doctor[] | null) ?? []);
      setClinics(((clinicResult.data ?? []).filter((item) => item.id && item.name)) as Clinic[]);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!date) { setAvailableIds(null); return; }
    let alive = true;
    const weekday = new Date(`${date}T12:00:00`).getDay();
    void supabase.from("doctor_ext_availability").select("doctor_id, start_time, end_time").eq("weekday", weekday).eq("is_active", true)
      .then(({ data }) => {
        if (!alive) return;
        const ids = new Set((data ?? []).filter((row) => !time || (String(row.start_time).slice(0, 5) <= time && String(row.end_time).slice(0, 5) > time)).map((row) => row.doctor_id));
        setAvailableIds(ids);
      });
    return () => { alive = false; };
  }, [date, time]);

  const specialties = useMemo(() => [...new Set(doctors.map((doctor) => doctor.primary_specialty).filter(Boolean) as string[])].sort(), [doctors]);
  const visible = useMemo(() => doctors.filter((doctor) => {
    const term = query.trim().toLocaleLowerCase();
    return (!term || `${doctor.name} ${doctor.primary_specialty ?? ""} ${(doctor.services ?? []).join(" ")}`.toLocaleLowerCase().includes(term))
      && (specialty === "all" || doctor.primary_specialty === specialty)
      && (clinic === "all" || doctor.clinic_id === clinic)
      && (!availableIds || availableIds.has(doctor.id));
  }).slice(0, 60), [availableIds, clinic, doctors, query, specialty]);

  return (
    <section aria-labelledby="doctor-search-title" className="space-y-3 px-4 pb-6">
      <div>
        <h2 id="doctor-search-title" className="text-lg font-bold text-foreground">Shifokor qidirish</h2>
        <p className="text-xs text-muted-foreground">Mutaxassislik, klinika va bo‘sh qabul vaqti bo‘yicha</p>
      </div>
      <label className="relative block">
        <span className="sr-only">Shifokor yoki xizmat nomi</span>
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Shifokor yoki xizmat..." className="pl-9" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted-foreground">Mutaxassislik
          <select value={specialty} onChange={(event) => setSpecialty(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="all">Barchasi</option>{specialties.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Klinika
          <select value={clinic} onChange={(event) => setClinic(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="all">Barchasi</option>{clinics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Qabul sanasi
          <Input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} className="mt-1" />
        </label>
        <label className="text-xs text-muted-foreground">Qabul vaqti
          <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} disabled={!date} className="mt-1" />
        </label>
      </div>
      <p className="text-xs text-muted-foreground" role="status">{loading ? "Shifokorlar yuklanmoqda…" : `${visible.length} ta shifokor topildi`}</p>
      {loading ? <div className="space-y-2">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-28 w-full" />)}</div> : visible.length ? visible.map((doctor) => (
        <article key={doctor.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Stethoscope aria-hidden="true" /></span>
            <div className="min-w-0 flex-1"><h3 className="font-semibold text-foreground">{doctor.name}</h3><p className="text-xs text-primary">{doctor.primary_specialty ?? "Shifokor"}</p></div>
            <Button variant="ghost" size="icon" aria-label={favorites.has("doctor", doctor.id) ? `${doctor.name}ni sevimlilardan olib tashlash` : `${doctor.name}ni sevimlilarga qo‘shish`} onClick={() => void favorites.toggle({ entity_type: "doctor", entity_id: doctor.id, label: doctor.name, route: `/doctors/ext/${doctor.slug}`, metadata: { specialty: doctor.primary_specialty } })}><Heart className={favorites.has("doctor", doctor.id) ? "fill-current text-destructive" : ""} /></Button>
          </div>
          {date && <p className="mt-2 flex items-center gap-1 text-xs text-medical-green"><CalendarDays className="h-3.5 w-3.5" /> {date} {time && <><Clock3 className="ml-1 h-3.5 w-3.5" /> {time}</>}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" size="sm" asChild><Link to={`/doctors/ext/${doctor.slug}`}>Profil</Link></Button><Button size="sm" asChild><Link to={`/doctors/ext/${doctor.slug}${date ? `?book=1&date=${date}${time ? `&time=${time}` : ""}` : "?book=1"}`}>Qabulga yozilish</Link></Button></div>
        </article>
      )) : <div className="py-10 text-center"><Stethoscope className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-2 font-semibold">Mos shifokor topilmadi</p><Button variant="outline" size="sm" className="mt-3" onClick={() => { setQuery(""); setSpecialty("all"); setClinic("all"); setDate(""); setTime(""); }}>Filtrlarni tozalash</Button></div>}
    </section>
  );
}
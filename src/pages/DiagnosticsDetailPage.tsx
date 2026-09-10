import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SocialVideoShowcase from "@/components/media/SocialVideoShowcase";
import {
  Activity, ArrowLeft, Award, Building2, CalendarPlus, Clock, Globe, Mail,
  MapPin, Phone, Send, Stethoscope, UserRound,
} from "lucide-react";

interface Center {
  id: string;
  name: string;
  legal_name: string | null;
  director_name: string | null;
  license_number: string | null;
  inn: string | null;
  description: string | null;
  equipment_info: string | null;
  address: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  additional_phone: string | null;
  email: string | null;
  website: string | null;
  telegram: string | null;
  logo_url: string | null;
  working_hours: Record<string, string> | null;
  specialties: string[] | null;
  amenities: string[] | null;
}

interface Service {
  id: string; name: string; category: string | null; price: number | null;
  duration_minutes: number | null; description: string | null;
}

interface Staff {
  id: string; full_name: string; role: string | null; specialization: string | null;
  experience_years: number | null; department: string | null; avatar_url: string | null;
}

const money = (n: number | null) =>
  n == null ? "—" : `${Math.round(n).toLocaleString("ru-RU").replace(/\u00A0/g, " ")} so'm`;

const DiagnosticsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [center, setCenter] = useState<Center | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      const [c, s, st] = await Promise.all([
        supabase.from("registered_diagnostics" as any).select("*").eq("id", id).eq("is_active", true).maybeSingle(),
        supabase.from("diagnostics_services" as any)
          .select("id,name,category,price,duration_minutes,description")
          .eq("center_id", id).eq("is_active", true).order("name"),
        supabase.from("diagnostics_staff" as any)
          .select("id,full_name,role,specialization,experience_years,department,avatar_url")
          .eq("center_id", id).eq("is_active", true).order("full_name"),
      ]);
      if (!alive) return;
      setCenter((c.data as any) || null);
      setServices(((s.data as any) || []) as Service[]);
      setStaff(((st.data as any) || []) as Staff[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Yuklanmoqda...</div>
        <Footer />
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-heading text-xl font-bold text-foreground mb-2">Markaz topilmadi</h1>
          <p className="text-muted-foreground mb-5">Markaz o'chirilgan yoki vaqtincha nofaol bo'lishi mumkin.</p>
          <Button asChild><Link to="/diagnostics">Diagnostika bo'limiga qaytish</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const hours = center.working_hours && typeof center.working_hours === "object"
    ? Object.entries(center.working_hours) : [];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${center.name} — diagnostika markazi | Med1.uz`}
        description={
          (center.description || `${center.name} diagnostika markazi: xizmatlar, narxlar, manzil va aloqa ma'lumotlari.`)
            .slice(0, 155)
        }
        path={`/diagnostics/${center.id}`}
        ogType="website"
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/diagnostics")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Diagnostika bo'limi
        </Button>

        {/* Header card */}
        <Card className="p-5">
          <div className="flex flex-col md:flex-row gap-5">
            {center.logo_url ? (
              <img src={center.logo_url} alt={`${center.name} logotipi`} className="w-24 h-24 rounded-2xl object-contain bg-muted shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Activity className="w-10 h-10 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">{center.name}</h1>
              {center.legal_name && <p className="text-sm text-muted-foreground">{center.legal_name}</p>}
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                <MapPin className="w-4 h-4 text-primary" />
                {[center.address, center.city, center.region].filter(Boolean).join(", ") || "Manzil ko'rsatilmagan"}
              </p>
              {center.specialties && center.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {center.specialties.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button asChild><Link to={`/diagnostics/${center.id}/book`}><CalendarPlus className="w-4 h-4 mr-1" /> Qabulga yozilish</Link></Button>
                {center.phone && <Button asChild variant="outline"><a href={`tel:${center.phone}`}><Phone className="w-4 h-4 mr-1" /> {center.phone}</a></Button>}
                {center.telegram && (
                  <Button asChild variant="outline">
                    <a href={center.telegram} target="_blank" rel="noopener noreferrer"><Send className="w-4 h-4 mr-1" /> Telegram</a>
                  </Button>
                )}
                {center.website && (
                  <Button asChild variant="outline">
                    <a href={center.website} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4 mr-1" /> Veb-sayt</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {center.description && (
          <Card className="p-5">
            <h2 className="font-heading font-bold text-foreground mb-2">Markaz haqida</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{center.description}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Services */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" /> Xizmatlar va narxlar
            </h2>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">Xizmatlar ro'yxati hali kiritilmagan.</p>
            ) : (
              <div className="divide-y divide-border">
                {services.map((s) => (
                  <div key={s.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[s.category, s.duration_minutes ? `${s.duration_minutes} daq` : null].filter(Boolean).join(" · ")}
                      </p>
                      {s.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>}
                    </div>
                    <span className="text-sm font-semibold text-primary shrink-0">{money(s.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Info */}
          <Card className="p-5 space-y-4">
            <div>
              <h2 className="font-heading font-bold text-foreground mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Rasmiy ma'lumot
              </h2>
              <dl className="text-sm space-y-1.5">
                {center.director_name && (
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Rahbar</dt><dd className="text-foreground text-right">{center.director_name}</dd></div>
                )}
                {center.license_number && (
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Litsenziya</dt><dd className="text-foreground text-right">{center.license_number}</dd></div>
                )}
                {center.inn && (
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">INN</dt><dd className="text-foreground text-right">{center.inn}</dd></div>
                )}
                {center.email && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</dt>
                    <dd className="text-foreground text-right break-all">{center.email}</dd>
                  </div>
                )}
                {center.additional_phone && (
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Qo'shimcha tel.</dt><dd className="text-foreground text-right">{center.additional_phone}</dd></div>
                )}
              </dl>
            </div>

            {hours.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> Ish vaqti
                </h3>
                <ul className="text-sm space-y-1">
                  {hours.map(([d, v]) => (
                    <li key={d} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{d}</span>
                      <span className="text-foreground">{String(v)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {center.amenities && center.amenities.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2">Qulayliklar</h3>
                <div className="flex flex-wrap gap-1">
                  {center.amenities.map((a) => (
                    <span key={a} className="text-[10px] bg-accent text-accent-foreground px-2 py-1 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {center.equipment_info && (
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">Jihozlar</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{center.equipment_info}</p>
              </div>
            )}

            {center.latitude != null && center.longitude != null && (
              <Button asChild variant="outline" className="w-full">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${center.latitude},${center.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="w-4 h-4 mr-1" /> Xaritada ko'rish
                </a>
              </Button>
            )}
          </Card>
        </div>

        {/* Staff */}
        <Card className="p-5">
          <h2 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Mutaxassislar va xodimlar
          </h2>
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">Xodimlar ro'yxati hali kiritilmagan.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staff.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border p-3 flex gap-3 items-start">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.full_name} loading="lazy" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserRound className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">{p.specialization || p.role || "Mutaxassis"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {[p.department, p.experience_years ? `${p.experience_years} yil tajriba` : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Media */}
        <SocialVideoShowcase
          entityType="diagnostics"
          entityId={center.id}
          includeStaff
          title="Ijtimoiy tarmoqlar, video va fotolar"
        />
      </main>

      <Footer />
    </div>
  );
};

export default DiagnosticsDetailPage;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Star, ExternalLink, Loader2, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  region: string;
  logo_url: string;
  specialties: string[];
}

const ClinicRecommendations = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    const { data } = await supabase
      .from("registered_cosmetology" as any)
      .select("id, name, address, phone, city, region, logo_url, specialties")
      .eq("is_active", true)
      .limit(6) as any;
    setClinics(data || []);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-foreground">Tavsiya etilgan kosmetologiya klinikalari</h3>
        <p className="text-sm text-muted-foreground">AI tahlil natijalariga asosan yaqin markazlar</p>
      </div>

      {clinics.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Hozircha ro'yxatdan o'tgan kosmetologiya klinikalari yo'q</p>
            <p className="text-xs mt-1">Klinikalar ro'yxatdan o'tgach, bu yerda ko'rsatiladi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clinics.map((clinic) => (
            <Card key={clinic.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {clinic.logo_url ? (
                    <img loading="lazy" decoding="async" src={clinic.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-sm">{clinic.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" /> {clinic.city || clinic.region}, {clinic.address}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" /> {clinic.phone}
                    </div>
                    {clinic.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {clinic.specialties.slice(0, 3).map((s: string) => (
                          <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1" asChild>
                    <Link to={`/booking?type=cosmetology&id=${clinic.id}`}>Qabulga yozilish</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${clinic.phone}`}><Phone className="w-3 h-3" /></a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center">
        <Button variant="outline" asChild>
          <Link to="/cosmetology">Barcha kosmetologiya markazlarini ko'rish →</Link>
        </Button>
      </div>
    </div>
  );
};

export default ClinicRecommendations;

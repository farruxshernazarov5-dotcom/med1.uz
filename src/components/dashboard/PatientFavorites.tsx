import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MapPin, Phone, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const PatientFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorite_clinics")
      .select("*, registered_clinics(id, name, address, phone, logo_url, specialties, category)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setFavorites(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const removeFavorite = async (id: string) => {
    await supabase.from("favorite_clinics").delete().eq("id", id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    toast({ title: "Sevimlilardan o'chirildi" });
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>;

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-heading text-lg font-bold text-foreground mb-2">Sevimli klinikalar yo'q</h3>
        <p className="text-muted-foreground text-sm mb-4">Klinikalarni sevimlilaringizga qo'shing</p>
        <Button asChild variant="outline">
          <Link to="/clinics">Klinikalarni ko'rish</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-6">⭐ Sevimli klinikalar</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favorites.map((fav) => {
          const clinic = fav.registered_clinics;
          if (!clinic) return null;
          return (
            <div key={fav.id} className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {clinic.logo_url ? (
                    <img src={clinic.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {clinic.name?.[0]}
                    </div>
                  )}
                  <div>
                    <Link to={`/clinics/${clinic.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                      {clinic.name}
                    </Link>
                    {clinic.category && <p className="text-xs text-muted-foreground">{clinic.category}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeFavorite(fav.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {clinic.address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" /> {clinic.address}
                </p>
              )}
              {clinic.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {clinic.specialties.slice(0, 3).map((s: string) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                  ))}
                  {clinic.specialties.length > 3 && <span className="text-[10px] text-muted-foreground">+{clinic.specialties.length - 3}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatientFavorites;

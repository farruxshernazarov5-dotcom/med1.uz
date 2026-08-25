import { Link } from "react-router-dom";
import { Star, Stethoscope, Award, MapPin, Heart, Scale, Languages } from "lucide-react";
import { useDoctorFavorites, useDoctorCompare } from "@/hooks/useDoctorFavorites";
import DoctorAvatar from "@/components/doctors/DoctorAvatar";
import { cn } from "@/lib/utils";

export interface DoctorCardData {
  id: string;
  slug: string;
  name: string;
  rank?: string | null;
  experience?: number | null;
  photo_url?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  primary_specialty?: string | null;
  primary_region?: string | null;
  languages?: string[] | null;
}

interface Props {
  doctor: DoctorCardData;
  compact?: boolean;
  showActions?: boolean;
}

const DoctorCard = ({ doctor: d, compact = false, showActions = true }: Props) => {
  const fav = useDoctorFavorites();
  const cmp = useDoctorCompare();

  return (
    <div className="group relative bg-card rounded-2xl border hover:border-primary/40 hover:shadow-xl transition-all overflow-hidden">
      {showActions && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          <button
            onClick={(e) => { e.preventDefault(); fav.toggle(d.id); }}
            className={cn(
              "w-8 h-8 rounded-full backdrop-blur-md bg-background/80 border flex items-center justify-center hover:scale-110 transition-all",
              fav.has(d.id) && "text-red-500 border-red-200"
            )}
            aria-label="Sevimlilarga qo'shish"
          >
            <Heart className={cn("w-4 h-4", fav.has(d.id) && "fill-current")} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); cmp.toggle(d.id); }}
            className={cn(
              "w-8 h-8 rounded-full backdrop-blur-md bg-background/80 border flex items-center justify-center hover:scale-110 transition-all",
              cmp.has(d.id) && "text-primary border-primary/40 bg-primary/10"
            )}
            aria-label="Taqqoslash"
          >
            <Scale className="w-4 h-4" />
          </button>
        </div>
      )}

      <Link to={`/doctors/ext/${d.slug}`} className="block p-5">
        <div className="flex items-start gap-4">
          <DoctorAvatar
            name={d.name}
            photoUrl={d.photo_url}
            specialty={d.primary_specialty}
            className={cn(
              "border-2 border-primary/10 group-hover:border-primary/30 transition-colors text-xl",
              compact ? "w-14 h-14" : "w-16 h-16"
            )}
          />
          <div className="min-w-0 flex-1 pr-16">
            <h3 className="font-heading font-bold text-base group-hover:text-primary transition-colors line-clamp-2">
              {d.name}
            </h3>
            {d.primary_specialty && (
              <p className="text-sm text-primary font-medium mt-0.5 truncate">{d.primary_specialty}</p>
            )}
            {d.rank && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                <Award className="w-3 h-3 shrink-0" /> {d.rank}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3 mt-4 pt-3 border-t text-sm">
          {d.rating != null && d.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold">{Number(d.rating).toFixed(1)}</span>
              {d.reviews_count != null && d.reviews_count > 0 && (
                <span className="text-xs text-muted-foreground">({d.reviews_count})</span>
              )}
            </div>
          )}
          {d.experience != null && d.experience > 0 && (
            <span className="text-xs text-muted-foreground">{d.experience} yil tajriba</span>
          )}
          {d.languages && d.languages.length > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Languages className="w-3 h-3" />
              {d.languages.slice(0, 3).join(", ")}
            </span>
          )}
        </div>

        {d.primary_region && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{d.primary_region}</span>
          </div>
        )}
      </Link>
    </div>
  );
};

export default DoctorCard;

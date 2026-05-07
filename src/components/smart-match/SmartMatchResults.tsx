import { SmartMatchResult } from "@/hooks/useSmartMatch";
import { Sparkles, MapPin, Star, Tag, AlertTriangle, ChevronRight, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const priorityStyles: Record<string, string> = {
  critical: "bg-red-500/10 text-red-600 border-red-500/30",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  medium: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

const priorityLabel: Record<string, string> = {
  critical: "🚨 Shoshilinch",
  high: "⚡ Yuqori",
  medium: "📌 O'rta",
  low: "ℹ️ Past",
};

interface Props {
  result: SmartMatchResult;
  onTrackClick?: (recId?: string, promoId?: string) => void;
  compact?: boolean;
}

export function SmartMatchResults({ result, onTrackClick, compact }: Props) {
  const { analysis, clinics, doctors, promotions, recommendation_id } = result;

  return (
    <div className="space-y-3">
      {/* AI Summary */}
      <div className={cn("rounded-2xl border p-3 flex items-start gap-3", priorityStyles[analysis.priority])}>
        <div className="w-8 h-8 rounded-full bg-background/50 flex items-center justify-center shrink-0">
          {analysis.is_emergency ? <AlertTriangle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/60 border border-current/20">
              {priorityLabel[analysis.priority]}
            </span>
            {analysis.specialties?.[0] && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-background/40">
                {analysis.specialties[0]}
              </span>
            )}
          </div>
          <p className="text-sm leading-snug">{analysis.ai_summary}</p>
        </div>
      </div>

      {/* Promotions */}
      {promotions.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Sizga mos aksiyalar
          </h4>
          <div className="space-y-2">
            {promotions.slice(0, compact ? 2 : 4).map((p) => (
              <Link
                key={p.id}
                to={p.clinic_id ? `/clinics/${p.clinic_id}` : "/clinics"}
                onClick={() => onTrackClick?.(recommendation_id, p.id)}
                className="block bg-card border border-border hover:border-primary/40 rounded-xl p-3 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {p.discount_percent > 0 && (
                    <div className="bg-gradient-to-br from-pink-500 to-orange-500 text-white text-xs font-bold rounded-lg px-2 py-1 shrink-0">
                      -{p.discount_percent}%
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{p.title}</p>
                    {p.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>}
                    {p.promo_price && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-primary">{Number(p.promo_price).toLocaleString()} so'm</span>
                        {p.original_price && <span className="text-xs text-muted-foreground line-through">{Number(p.original_price).toLocaleString()}</span>}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Clinics */}
      {clinics.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Mos klinikalar
          </h4>
          <div className="space-y-2">
            {clinics.slice(0, compact ? 2 : 5).map((c) => (
              <Link
                key={c.id}
                to={`/clinics/${c.id}`}
                onClick={() => onTrackClick?.(recommendation_id)}
                className="flex items-center gap-3 bg-card border border-border hover:border-primary/40 rounded-xl p-2.5 transition-colors"
              >
                {c.logo_url && <img src={c.logo_url} alt="" loading="lazy" className="w-10 h-10 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{c.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{c.address}</p>
                  {c.distance != null && <p className="text-[10px] text-primary mt-0.5">{c.distance.toFixed(1)} km</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Doctors */}
      {doctors.length > 0 && !compact && (
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Stethoscope className="w-3 h-3" /> Tavsiya etilgan shifokorlar
          </h4>
          <div className="space-y-2">
            {doctors.slice(0, 3).map((d) => (
              <Link
                key={d.id}
                to={`/doctors/${d.id}`}
                onClick={() => onTrackClick?.(recommendation_id)}
                className="flex items-center gap-3 bg-card border border-border hover:border-primary/40 rounded-xl p-2.5"
              >
                {d.photo_url && <img src={d.photo_url} alt="" loading="lazy" className="w-10 h-10 rounded-full object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{d.full_name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{d.specialty}</p>
                </div>
                {d.avg_rating > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {Number(d.avg_rating).toFixed(1)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {clinics.length === 0 && doctors.length === 0 && promotions.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">Mos natija topilmadi. Boshqa so'rov bilan urinib ko'ring.</p>
      )}
    </div>
  );
}

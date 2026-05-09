import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

interface Props { onGrant: () => void; }

export function GeoConsentBanner({ onGrant }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("med1_geo_banner_seen");
    if (!seen) {
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show || dismissed) return null;

  const accept = () => {
    localStorage.setItem("med1_geo_banner_seen", "1");
    setDismissed(true);
    onGrant();
  };
  const decline = () => {
    localStorage.setItem("med1_geo_banner_seen", "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-[60] bg-card border border-border rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5">
      <button onClick={decline} className="absolute top-2 right-2 w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Yaqin chegirmalarni ko'rish</p>
          <p className="text-xs text-muted-foreground mt-1">
            Joylashuvga ruxsat bering — sizga yaqin klinikalardagi aksiyalarni real-time ko'rsatamiz.
            <Link to="/privacy" className="text-primary ml-1 underline">Maxfiylik</Link>
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={accept} className="bg-gradient-to-r from-blue-600 to-purple-600 flex-1">Ruxsat berish</Button>
            <Button size="sm" variant="outline" onClick={decline}>Keyin</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

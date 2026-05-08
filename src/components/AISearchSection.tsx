import { useState, useCallback } from "react";
import { Brain, Search, ArrowRight, Sparkles, Stethoscope, Pill, Building2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const popularSearches = [
  { label: "Bosh og'rig'i", icon: Brain },
  { label: "Qandli diabet", icon: Stethoscope },
  { label: "MRT", icon: Pill },
  { label: "Toshkent klinikalari", icon: Building2 },
];

const AISearchSection = () => {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Xatolik", description: "Brauzeringiz ovozli qidiruvni qo'llab-quvvatlamaydi.", variant: "destructive" });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "uz-UZ";
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => { setIsListening(false); };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      if (event.results[0].isFinal) {
        navigate(`/smart-search?q=${encodeURIComponent(transcript)}`);
      }
    };
    recognition.start();
  }, [navigate, toast]);

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate(`/smart-search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          {/* Header */}
          <div className="bg-hero-gradient px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-primary-foreground">AI Aqlli Qidiruv</h2>
                <p className="text-primary-foreground/70 text-sm">Simptom, xizmat yoki klinika — AI sizga eng mos natijani topadi</p>
              </div>
            </div>
            <Link to="/smart-search" className="hidden md:flex items-center gap-1 text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              Kengaytirilgan qidiruv <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-6">
            {/* Location preferences chip */}
            <div className="flex justify-end mb-3">
              <LocationPreferences />
            </div>
            {/* Search */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Masalan: bosh og'rig'i, kardiolog, MRT..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              <Button
                onClick={startVoiceSearch}
                disabled={isListening}
                className={`rounded-xl transition-all ${isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
                title="Ovozli qidiruv"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button onClick={handleSearch} disabled={!query.trim()} className="bg-hero-gradient text-primary-foreground border-0 px-6 rounded-xl hover:opacity-90">
                Qidirish
              </Button>
            </div>

            {/* Popular searches */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Mashhur:</span>
              {popularSearches.map((s) => (
                <button
                  key={s.label}
                  onClick={() => navigate(`/smart-search?q=${encodeURIComponent(s.label)}`)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <s.icon className="w-3 h-3" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AISearchSection;

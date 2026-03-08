import { useState, useEffect, useRef } from "react";
import { Search, X, Sparkles, Brain, Stethoscope, Pill, Building2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const popularSearches = [
  { label: "Bosh og'rig'i", icon: Brain },
  { label: "Qandli diabet", icon: Stethoscope },
  { label: "MRT", icon: Pill },
  { label: "Toshkent klinikalari", icon: Building2 },
];

const FloatingAISearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const isHome = location.pathname === "/";

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const startVoiceSearch = () => {
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
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      if (event.results[0].isFinal) {
        setIsOpen(false);
        navigate(`/smart-search?q=${encodeURIComponent(transcript)}`);
      }
    };
    recognition.start();
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsOpen(false);
    navigate(`/smart-search?q=${encodeURIComponent(query.trim())}`);
  };

  if (shouldHide) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-hero-gradient text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
        title="AI Aqlli Qidiruv (⌘K)"
      >
        <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
      </button>

      {/* Search Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg mx-4 bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-hero-gradient px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
                <span className="font-heading font-bold text-primary-foreground">AI Aqlli Qidiruv</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {/* Search Input */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Simptom, shifokor, klinika..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>
                <Button
                  onClick={startVoiceSearch}
                  disabled={isListening}
                  size="icon"
                  className={`rounded-xl shrink-0 ${isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button onClick={handleSearch} disabled={!query.trim()} className="bg-hero-gradient text-primary-foreground border-0 rounded-xl hover:opacity-90 shrink-0">
                  Qidirish
                </Button>
              </div>

              {/* Popular */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Mashhur:</span>
                {popularSearches.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/smart-search?q=${encodeURIComponent(s.label)}`);
                    }}
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
      )}
    </>
  );
};

export default FloatingAISearch;

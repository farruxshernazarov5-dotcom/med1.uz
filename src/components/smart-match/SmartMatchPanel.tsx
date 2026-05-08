import { useState } from "react";
import { Sparkles, Send, X, Loader2, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSmartMatch } from "@/hooks/useSmartMatch";
import { SmartMatchResults } from "./SmartMatchResults";
import { LocationPreferences } from "./LocationPreferences";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["Tishim og'riyapti", "Yurak urishi tez", "Ko'zim qizaryapti", "Bolam yo'taliyapti"];

export function SmartMatchPanel() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { match, trackClick, loading, result, reset } = useSmartMatch();

  const send = async (q?: string) => {
    const v = (q ?? text).trim();
    if (!v) return;
    setText(v);
    await match(v, { source_channel: "web_search" });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:scale-105 transition-transform"
        aria-label="AI Smart Match"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">AI Tavsiya</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:right-6 md:w-[400px] z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
      <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">AI Smart Match</p>
            <p className="text-[10px] text-muted-foreground">Sizga mos xizmatni topamiz</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {result && (
            <button onClick={() => { reset(); setText(""); }} className="text-xs text-primary px-2 py-1 hover:bg-muted rounded">Yangi</button>
          )}
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="flex justify-end">
          <LocationPreferences />
        </div>
        {!result && !loading && (
          <>
            <p className="text-sm text-muted-foreground">Simptom yoki kerakli xizmatni yozing — AI sizga eng mos klinika va aksiyalarni topadi.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70">{s}</button>
              ))}
            </div>
          </>
        )}
        {loading && (
          <div className="flex flex-col items-center py-8 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">AI tahlil qilmoqda...</p>
          </div>
        )}
        {result && !loading && <SmartMatchResults result={result} onTrackClick={trackClick} compact />}
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Masalan: tishim og'riyapti..."
          disabled={loading}
          className="text-sm"
        />
        <Button onClick={() => send()} disabled={loading || !text.trim()} size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

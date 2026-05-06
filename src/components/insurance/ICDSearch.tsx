import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface ICDResult {
  code: string;
  name: string;
  category?: string | null;
  source?: string;
}

interface Props {
  value?: { code: string; name: string } | null;
  onChange: (v: { code: string; name: string } | null) => void;
  placeholder?: string;
  lang?: "uz" | "ru" | "en";
}

const ICDSearch = ({ value, onChange, placeholder = "ICD kodi yoki kasallik nomi...", lang = "uz" }: Props) => {
  const [q, setQ] = useState(value?.code ? `${value.code} — ${value.name}` : "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ICDResult[]>([]);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (!q || q.length < 1) { setResults([]); return; }
    if (value && q === `${value.code} — ${value.name}`) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await supabase.functions.invoke("icd-search", { body: { query: q, lang, limit: 15 } });
        setResults((data as any)?.results || []);
        setOpen(true);
      } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [q, lang]);

  const pick = (r: ICDResult) => {
    onChange({ code: r.code, name: r.name });
    setQ(`${r.code} — ${r.name}`);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); if (!e.target.value) onChange(null); }}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          className="pl-9"
        />
        {loading && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.code + r.source}
              type="button"
              onClick={() => pick(r)}
              className="w-full text-left px-3 py-2 hover:bg-accent border-b border-border last:border-0 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-primary">{r.code}</span>
                <span className="text-foreground flex-1">{r.name}</span>
                {r.source && <span className="text-[10px] text-muted-foreground">{r.source.split(" ")[0]}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ICDSearch;

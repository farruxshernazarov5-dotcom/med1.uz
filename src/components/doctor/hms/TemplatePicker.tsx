import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  [k: string]: any;
}

interface Props<T extends TemplateItem> {
  templates: T[];
  categories: string[];
  onPick: (tpl: T) => void;
  label?: string;
  preview?: (tpl: T) => string;
}

function TemplatePicker<T extends TemplateItem>({
  templates,
  categories,
  onPick,
  label = "Shablon",
  preview,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = templates.filter((t) => {
    const matchCat = cat === "all" || t.category === cat;
    const matchQ =
      !q.trim() ||
      t.name.toLowerCase().includes(q.toLowerCase()) ||
      t.category.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-1.5 border-secondary/40 text-secondary">
          <Sparkles className="w-3.5 h-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0 max-h-[420px] flex flex-col">
        <div className="p-2 border-b border-border space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Shablon qidirish..."
              className="h-8 pl-7 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge
              variant={cat === "all" ? "default" : "outline"}
              className="cursor-pointer text-[10px]"
              onClick={() => setCat("all")}
            >
              Hammasi
            </Badge>
            {categories.map((c) => (
              <Badge
                key={c}
                variant={cat === c ? "default" : "outline"}
                className="cursor-pointer text-[10px]"
                onClick={() => setCat(c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Topilmadi</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onPick(t);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 hover:bg-muted border-b border-border/50 last:border-b-0 transition-colors"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">{t.category}</span>
                </div>
                {preview && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{preview(t)}</p>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default TemplatePicker;

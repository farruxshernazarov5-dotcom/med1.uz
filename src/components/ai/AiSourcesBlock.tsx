import { BookOpen, ExternalLink } from "lucide-react";
import { sourceLink } from "@/lib/aiSources";

interface AiSourcesBlockProps {
  sources: string[];
  className?: string;
  compact?: boolean;
}

/**
 * Renders the evidence / "Manbalar" section of an AI answer as a visible,
 * clickable list (WHO, PubMed PMID, guideline names, ...).
 */
export function AiSourcesBlock({ sources, className = "", compact }: AiSourcesBlockProps) {
  const items = sources.filter(Boolean);
  if (!items.length) return null;

  return (
    <div className={`rounded-xl border border-primary/20 bg-primary/5 p-3 ${className}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <BookOpen className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">Manbalar (ilmiy asos)</span>
      </div>
      <ol className={`space-y-1 ${compact ? "text-[11px]" : "text-xs"} text-muted-foreground`}>
        {items.map((s, i) => {
          const href = sourceLink(s);
          return (
            <li key={i} className="flex gap-1.5">
              <span className="text-primary/70 font-medium">{i + 1}.</span>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="hover:text-primary hover:underline inline-flex items-start gap-1"
                >
                  <span>{s}</span>
                  <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-60" />
                </a>
              ) : (
                <span>{s}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default AiSourcesBlock;

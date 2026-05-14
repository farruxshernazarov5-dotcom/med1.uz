/**
 * Live status pill — green pulse + label.
 * Useful for "All systems operational", "Live", "Connected" etc.
 */
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  tone?: "green" | "blue" | "amber" | "red";
  className?: string;
}

const toneMap = {
  green: { bg: "bg-emerald-400/10", text: "text-emerald-300", dot: "bg-emerald-400" },
  blue: { bg: "bg-sky-400/10", text: "text-sky-300", dot: "bg-sky-400" },
  amber: { bg: "bg-amber-400/10", text: "text-amber-300", dot: "bg-amber-400" },
  red: { bg: "bg-red-400/10", text: "text-red-300", dot: "bg-red-400" },
};

const LiveStatusPill = ({ label = "Live", tone = "green", className }: Props) => {
  const t = toneMap[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/10",
        t.bg, t.text, className
      )}
    >
      <span className={cn("w-2 h-2 rounded-full live-dot", t.dot)} style={{ background: undefined }} />
      {label}
    </span>
  );
};

export default LiveStatusPill;

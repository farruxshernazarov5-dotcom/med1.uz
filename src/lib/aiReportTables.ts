import { parseMarkdown, stripMd } from "@/lib/markdownRender";

export type ReportTable = { head: string[]; rows: string[][] };

/** Fixed-column tables: preserve model tables and frame prose without inventing results. */
export function reportTables(content: string): ReportTable[] {
  return parseMarkdown(content).filter(b => b.type !== "hr").map(b => {
    const text = (runs: {text:string}[]) => stripMd(runs.map(r=>r.text).join(""));
    if (b.type === "table") return {head:b.head.map(text), rows:b.rows.map(row => b.head.map((_,i)=>text(row[i] ?? [{text:"—"}])))};
    if (b.type === "ul" || b.type === "ol") return {head:["Band", "Izoh / tavsiya"], rows:b.items.map((runs,i)=>[String(i+1),text(runs)])};
    return {head:["Bo‘lim", "Xulosa"],rows:[[b.type === "p" ? "Tahlil" : "Mavzu",text(b.runs)]]};
  });
}
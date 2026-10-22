import { parseMarkdown, stripMd } from "@/lib/markdownRender";

export type ReportTable = { head: string[]; rows: string[][] };

/** Fixed-column tables: preserve model tables and frame prose without inventing results. */
export function reportTables(content: string): ReportTable[] {
  const tables = parseMarkdown(content).filter(b => b.type !== "hr").map(b => {
    const text = (runs: {text:string}[]) => stripMd(runs.map(r=>r.text).join(""));
    if (b.type === "table") return {head:b.head.map(text), rows:b.rows.map(row => b.head.map((_,i)=>text(row[i] ?? [{text:"—"}])))};
    if (b.type === "ul" || b.type === "ol") return {head:["Band", "Izoh / tavsiya"], rows:b.items.map((runs,i)=>[String(i+1),text(runs)])};
    return {head:["Bo‘lim", "Xulosa"],rows:[[b.type === "p" ? "Tahlil" : "Mavzu",text(b.runs)]]};
  });
  return tables.map(table => ({...table, rows: table.rows.flatMap(row => {
    const chunks = row.map(cell => {
      const words = cell.split(/\s+/); const parts: string[] = []; let part = "";
      for (const word of words) { if (part.length + word.length > 320 && part) { parts.push(part); part = ""; } part += (part ? " " : "") + word; }
      parts.push(part); return parts;
    });
    return Array.from({length:Math.max(...chunks.map(c=>c.length))},(_,i)=>chunks.map(c=>c[i] ?? "—"));
  })}));
}
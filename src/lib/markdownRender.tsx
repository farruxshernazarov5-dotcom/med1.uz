// Lightweight markdown renderer for legal documents — no external deps.
// Supports: # H1, ## H2, ### H3, - bullets, 1. numbered, **bold**, blank-line paragraphs.
import React from "react";

export type MdBlock =
  | { type: "h1" | "h2" | "h3" | "p"; runs: MdRun[] }
  | { type: "ul"; items: MdRun[][] }
  | { type: "ol"; items: MdRun[][] }
  | { type: "table"; head: MdRun[][]; rows: MdRun[][][] }
  | { type: "hr" };

export type MdRun = { text: string; bold?: boolean };

const parseInline = (s: string): MdRun[] => {
  const runs: MdRun[] = [];
  const re = /\*\*([^*]+)\*\*|__([^_]+)__/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) runs.push({ text: s.slice(last, m.index) });
    runs.push({ text: m[1] || m[2], bold: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) runs.push({ text: s.slice(last) });
  return runs.length ? runs : [{ text: s }];
};

export function parseMarkdown(src: string): MdBlock[] {
  const lines = (src || "").replace(/\r\n/g, "\n").split("\n");
  const out: MdBlock[] = [];
  let para: string[] = [];
  let ul: string[] = [];
  let ol: string[] = [];

  const flushPara = () => {
    if (para.length) { out.push({ type: "p", runs: parseInline(para.join(" ")) }); para = []; }
  };
  const flushUl = () => {
    if (ul.length) { out.push({ type: "ul", items: ul.map(parseInline) }); ul = []; }
  };
  const flushOl = () => {
    if (ol.length) { out.push({ type: "ol", items: ol.map(parseInline) }); ol = []; }
  };
  const flushAll = () => { flushPara(); flushUl(); flushOl(); };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushAll(); continue; }
    if (/^---+$/.test(line)) { flushAll(); out.push({ type: "hr" }); continue; }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^###\s+(.*)$/))) { flushAll(); out.push({ type: "h3", runs: parseInline(m[1]) }); continue; }
    if ((m = line.match(/^##\s+(.*)$/)))  { flushAll(); out.push({ type: "h2", runs: parseInline(m[1]) }); continue; }
    if ((m = line.match(/^#\s+(.*)$/)))   { flushAll(); out.push({ type: "h1", runs: parseInline(m[1]) }); continue; }
    if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) { flushPara(); flushOl(); ul.push(m[1]); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushPara(); flushUl(); ol.push(m[1]); continue; }
    flushUl(); flushOl();
    para.push(line);
  }
  flushAll();
  return out;
}

/** Strip all markdown markers — useful as a last-resort sanitizer. */
export const stripMd = (s: string): string =>
  (s || "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1");

/** React renderer for in-app preview / AI explanation cards. */
export function MarkdownView({ source, className }: { source: string; className?: string }) {
  const blocks = parseMarkdown(source);
  const renderRuns = (runs: MdRun[]) =>
    runs.map((r, i) =>
      r.bold ? <strong key={i} className="font-semibold">{r.text}</strong> : <span key={i}>{r.text}</span>,
    );
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.type === "h1") return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{renderRuns(b.runs)}</h2>;
        if (b.type === "h2") return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{renderRuns(b.runs)}</h3>;
        if (b.type === "h3") return <h4 key={i} className="text-base font-semibold mt-3 mb-1">{renderRuns(b.runs)}</h4>;
        if (b.type === "hr") return <hr key={i} className="my-3 border-current opacity-20" />;
        if (b.type === "ul") return <ul key={i} className="list-disc pl-5 space-y-1 my-2">{b.items.map((it, j) => <li key={j}>{renderRuns(it)}</li>)}</ul>;
        if (b.type === "ol") return <ol key={i} className="list-decimal pl-5 space-y-1 my-2">{b.items.map((it, j) => <li key={j}>{renderRuns(it)}</li>)}</ol>;
        return <p key={i} className="my-2 leading-relaxed">{renderRuns(b.runs)}</p>;
      })}
    </div>
  );
}

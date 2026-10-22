import { describe, expect, it } from "vitest";
import { reportTables } from "./aiReportTables";
describe("AI report data tables",()=>{
  it("preserves concrete lab results as separate columns",()=>{
    expect(reportTables("| Ko‘rsatkich | Natija | Me’yor |\n| --- | --- | --- |\n| Hb | 120 | 110–160 |")[0]).toEqual({head:["Ko‘rsatkich","Natija","Me’yor"],rows:[["Hb","120","110–160"]]});
  });
  it("normalizes missing cells without inventing values",()=>{
    expect(reportTables("| Test | Natija |\n| --- | --- |\n| Hb |")[0].rows).toEqual([["Hb","—"]]);
  });
  it("keeps non-tabular conclusions in a two-column data model",()=>{
    expect(reportTables("Dam oling.")[0].rows).toEqual([["Tahlil","Dam oling."]]);
  });
  it("splits long explanations without losing words or columns",()=>{
    const text = "Tavsiya ".repeat(100).trim();
    const table = reportTables(text)[0];
    expect(table.rows.length).toBeGreaterThan(1);
    expect(table.rows.every(row=>row.length===2)).toBe(true);
    expect(table.rows.map(row=>row[1]).join(" ")).toBe(text);
  });
});
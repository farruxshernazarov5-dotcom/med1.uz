import { describe, it, expect } from "vitest";
import { extractVitalMetrics, scientificSources, topicQuery } from "./aiReportExtras";
import { voiceKind, voicePhrase } from "./voiceNotify";
import { parseHeartRate } from "./vitals/wearables";

describe("AI report extras", () => {
  it("lists PubMed, Scopus and Web of Science search links for the topic", () => {
    const names = scientificSources("loperamid").map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(["PubMed (NCBI/NLM)", "Scopus (Elsevier)", "Web of Science"]));
    expect(scientificSources("loperamid")[0].url).toContain("pubmed.ncbi.nlm.nih.gov/?term=loperamid");
  });
  it("builds the query from the AI service title", () => {
    expect(topicQuery("Med AI - AI Farmatsevt")).toBe("Farmatsevt");
  });
  it("rebuilds the signal table from a saved Vital AI text", () => {
    const m = extractVitalMetrics("Puls: 72 bpm\nSpO₂: 97%\nNafas soni: 16/daq\nSignal sifati: 81%");
    expect(m.map((x) => x.label)).toEqual(["Puls", "SpO2 (taxminiy)", "Nafas soni", "Signal sifati / ishonch"]);
  });
});

describe("MED ALL voice phrases", () => {
  it("says AI conclusion ready", () => expect(voicePhrase(voiceKind("AI xulosangiz tayyor"))).toBe("MED ALL. AI xulosangiz tayyor."));
  it("says the account was topped up", () => expect(voicePhrase(voiceKind("Hisob to'ldirildi", "50 000 so'm"))).toBe("MED ALL. Hisobingiz to'ldirildi."));
  it("keeps appointment reminders separate", () => expect(voiceKind("🩺 Qabulingiz yaqinlashdi")).toBe("appointment"));
  it("defaults to new message", () => expect(voicePhrase(voiceKind("Shifokordan javob"))).toBe("MED ALL. Sizda yangi xabar bor."));
});

describe("BLE heart rate packet", () => {
  it("reads 8-bit bpm", () => expect(parseHeartRate(new DataView(new Uint8Array([0, 75]).buffer)).bpm).toBe(75));
});

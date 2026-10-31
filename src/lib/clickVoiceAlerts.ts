export type ClickVoiceRow = { id: string; kind: string; created_at: string };

/** Only new support requests, never historical rows or QR/SDK reports. */
export function createClickVoiceTracker(startedAt = Date.now()) {
  const seen = new Set<string>();
  return (rows: ClickVoiceRow[]): string[] => {
    const fresh: string[] = [];
    for (const row of rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      if (row.kind === 'support' && Date.parse(row.created_at) > startedAt) fresh.push(row.id);
    }
    return fresh;
  };
}
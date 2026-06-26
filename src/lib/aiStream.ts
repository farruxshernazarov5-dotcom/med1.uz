type DeltaHandler = (content: string) => void;

function readDelta(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as any;
  return data.choices?.[0]?.delta?.content
    ?? data.choices?.[0]?.message?.content
    ?? data.delta?.content
    ?? data.content
    ?? "";
}

export async function consumeAiStream(response: Response, onDelta: DeltaHandler): Promise<string> {
  if (!response.body) throw new Error("Stream not available");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  const processLine = (rawLine: string): boolean => {
    let line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (line.startsWith(":")) return true;
    if (!line.trim()) return true;
    if (!line.startsWith("data:")) return true;

    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return true;

    try {
      const delta = readDelta(JSON.parse(payload));
      if (delta) {
        fullText += delta;
        onDelta(delta);
      }
      return true;
    } catch {
      return false;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let index: number;
    while ((index = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      const ok = processLine(line);
      if (!ok) {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    for (const line of buffer.split("\n")) processLine(line);
  }

  return fullText;
}
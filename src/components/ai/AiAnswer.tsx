import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseAiAnswer } from "@/lib/aiSources";
import AiSourcesBlock from "@/components/ai/AiSourcesBlock";

interface AiAnswerProps {
  text: string;
  compact?: boolean;
}

/**
 * Renders an AI answer: markdown body + a visible, clickable
 * "Manbalar (ilmiy asos)" block parsed out of the response.
 */
export function AiAnswer({ text, compact = true }: AiAnswerProps) {
  const { body, sources } = parseAiAnswer(text || "");
  return (
    <>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body || "..."}</ReactMarkdown>
      {sources.length > 0 && (
        <div className="not-prose">
          <AiSourcesBlock sources={sources} className="mt-2" compact={compact} />
        </div>
      )}
    </>
  );
}

export default AiAnswer;

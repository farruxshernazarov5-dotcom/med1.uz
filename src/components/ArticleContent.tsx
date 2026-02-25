import React from "react";

/**
 * Renders a single paragraph with inline markdown:
 * **bold** → <strong>, - list items → bullet, ### → heading
 */
const renderInlineMarkdown = (text: string): React.ReactNode => {
  // Split by **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

interface ArticleContentProps {
  content: string[];
}

const ArticleContent = ({ content }: ArticleContentProps) => {
  return (
    <div className="space-y-4">
      {content.map((paragraph, i) => {
        const trimmed = paragraph.trim();

        // ### Header
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="font-heading text-lg font-bold text-foreground mt-6 mb-2 border-l-4 border-primary pl-3">
              {trimmed.slice(4)}
            </h3>
          );
        }

        // ## Header
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="font-heading text-xl font-bold text-foreground mt-8 mb-3">
              {trimmed.slice(3)}
            </h2>
          );
        }

        // Numbered list items (1. 2. etc)
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={i} className="flex gap-3 items-start pl-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {trimmed.match(/^(\d+)/)?.[1]}
              </span>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {renderInlineMarkdown(trimmed.replace(/^\d+\.\s*/, ""))}
              </p>
            </div>
          );
        }

        // Bullet list items (- item)
        if (trimmed.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-3 items-start pl-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              <p className="text-muted-foreground leading-relaxed text-sm">
                {renderInlineMarkdown(trimmed.slice(2))}
              </p>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="text-muted-foreground leading-relaxed">
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export default ArticleContent;

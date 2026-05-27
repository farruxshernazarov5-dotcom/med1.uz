import type { ReactNode } from "react";

type Bullet = string | { bold: string; text: string };

export const Bullets = ({ items }: { items: Bullet[] }) => (
  <ul className="list-disc pl-5">
    {items.map((b, i) => (
      <li key={i}>
        {typeof b === "string" ? b : (<><strong>{b.bold}</strong> {b.text}</>)}
      </li>
    ))}
  </ul>
);

export const DocSection = ({
  icon: Icon,
  title,
  paragraphs,
  bullets,
  children,
}: {
  icon: any;
  title: string;
  paragraphs?: string[];
  bullets?: Bullet[];
  children?: ReactNode;
}) => (
  <section className="bg-card border border-border rounded-2xl p-6 mb-5">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h2 className="font-heading font-bold text-xl text-foreground">{title}</h2>
    </div>
    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground space-y-2">
      {paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
      {bullets && <Bullets items={bullets} />}
      {children}
    </div>
  </section>
);

/** Render text that may include simple <b>...</b> tags */
export const RichText = ({ html, className }: { html: string; className?: string }) => (
  <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Link2, Video } from "lucide-react";
import { MediaLink, getEmbedUrl, platformLabel } from "./mediaLinks";

interface Props {
  entityType: string;
  entityId: string;
  /** Xodim havolalarini ham ko'rsatish */
  includeStaff?: boolean;
  title?: string;
}

/** Saytdagi ommaviy sahifalarda ijtimoiy tarmoq va video materiallarni ko'rsatish */
const SocialVideoShowcase = ({ entityType, entityId, includeStaff = false, title }: Props) => {
  const [links, setLinks] = useState<MediaLink[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      let q = supabase
        .from("entity_media_links" as any)
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("is_published", true)
        .order("sort_order", { ascending: true }) as any;
      if (!includeStaff) q = q.is("staff_id", null);
      const { data } = await q;
      if (active) setLinks((data || []) as MediaLink[]);
    })();
    return () => { active = false; };
  }, [entityType, entityId, includeStaff]);

  if (links.length === 0) return null;

  const socials = links.filter((l) => l.kind === "social");
  const videos = links.filter((l) => l.kind === "video");

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-bold text-foreground">{title || "Ijtimoiy tarmoqlar va videolar"}</h2>

      {socials.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {socials.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary transition-colors">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              <span>{l.title || platformLabel("social", l.platform)}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {videos.map((l) => {
            const embed = getEmbedUrl(l.url);
            return (
              <Card key={l.id}>
                <CardContent className="p-3 space-y-2">
                  {embed ? (
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                      <iframe src={embed} title={l.title || "Video material"} className="w-full h-full" loading="lazy"
                        allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen />
                    </div>
                  ) : (
                    <a href={l.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-muted/50 p-4 text-sm hover:bg-muted">
                      <Video className="w-4 h-4 text-primary" />
                      <span className="truncate">{l.title || l.url}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{platformLabel("video", l.platform)}</Badge>
                    <p className="text-sm font-medium truncate">{l.title || "Video material"}</p>
                  </div>
                  {l.description && <p className="text-xs text-muted-foreground line-clamp-2">{l.description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SocialVideoShowcase;

import { useRef, useState } from "react";
import { Camera, Check, ImagePlus, Loader2, Palette, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { coverSrc, PROFILE_COVERS } from "@/data/profileCovers";
import { saveProfileField, uploadProfileImage } from "@/lib/profileMedia";
import { cn } from "@/lib/utils";

/** Profile top card: background (preset or own photo) + avatar with upload buttons. */
export function ProfileHeaderCard({ subtitle, badge }: { subtitle: string; badge?: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"avatar" | "cover" | null>(null);
  const [picker, setPicker] = useState(false);
  const cover = coverSrc(profile?.cover_url);
  const initials = profile?.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2);

  const upload = async (kind: "avatar" | "cover", file?: File) => {
    if (!user || !file) return;
    setBusy(kind);
    try {
      const url = await uploadProfileImage(user.id, file, kind);
      await saveProfileField(user.id, kind === "avatar" ? "avatar_url" : "cover_url", url);
      await refreshProfile();
      toast.success(kind === "avatar" ? "Profil rasmi yangilandi" : "Fon yangilandi");
      setPicker(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Rasm yuklanmadi"); }
    setBusy(null);
  };
  const choose = async (value: string | null) => {
    if (!user) return;
    setBusy("cover");
    try { await saveProfileField(user.id, "cover_url", value); await refreshProfile(); toast.success(value ? "Fon tanlandi" : "Fon olib tashlandi"); }
    catch { toast.error("Saqlab bo‘lmadi"); }
    setBusy(null);
  };

  return (
    <section className="relative">
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-background">
        {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        {user && (
          <Button size="sm" variant="secondary" className="absolute right-3 top-3 h-9 bg-card/85 backdrop-blur" onClick={() => setPicker(true)} disabled={busy === "cover"}>
            {busy === "cover" ? <Loader2 className="animate-spin" /> : <Palette />} Fon
          </Button>
        )}
      </div>
      <div className="-mt-10 flex items-end gap-4 px-5 pb-4">
        <div className="relative">
          <Avatar className="h-20 w-20 border-4 border-background tier-ring">
            <AvatarImage src={profile?.avatar_url ?? ""} className="object-cover" />
            <AvatarFallback className="tier-soft tier-text text-xl font-bold">{initials || <User />}</AvatarFallback>
          </Avatar>
          {user && (
            <button type="button" aria-label="Profil rasmini yuklash" onClick={() => avatarRef.current?.click()} disabled={busy === "avatar"}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow active:scale-95">
              {busy === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
          )}
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void upload("avatar", e.target.files?.[0]); e.target.value = ""; }} />
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <h2 className="break-words text-xl font-bold">{profile?.full_name || "Xush kelibsiz!"}</h2>
          <p className="mt-0.5 break-all text-sm text-muted-foreground">{subtitle}</p>
          {badge}
        </div>
      </div>

      <Sheet open={picker} onOpenChange={setPicker}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="text-left">
            <SheetTitle>Fon va manzara</SheetTitle>
            <SheetDescription>Tavsiya etilgan fonlardan birini tanlang yoki o‘z rasmingizni yuklang.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {PROFILE_COVERS.map((c) => {
              const active = profile?.cover_url === `preset:${c.id}`;
              return (
                <button key={c.id} type="button" onClick={() => void choose(`preset:${c.id}`)} aria-pressed={active}
                  className={cn("relative overflow-hidden rounded-lg border-2 text-left", active ? "border-primary" : "border-transparent")}>
                  <img src={c.src} alt="" width={1280} height={640} loading="lazy" className="h-24 w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent px-2 py-1 text-xs font-semibold text-background">{c.title}</span>
                  {active && <Check className="absolute right-2 top-2 h-5 w-5 rounded-full bg-primary p-0.5 text-primary-foreground" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={() => coverRef.current?.click()} disabled={busy === "cover"}><ImagePlus /> O‘z rasmim</Button>
            <Button variant="outline" onClick={() => void choose(null)} disabled={!profile?.cover_url || busy === "cover"}><Trash2 /> Olib tashlash</Button>
          </div>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void upload("cover", e.target.files?.[0]); e.target.value = ""; }} />
        </SheetContent>
      </Sheet>
    </section>
  );
}

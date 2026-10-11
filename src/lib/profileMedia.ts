/** Profile photo and background uploads (public `clinic-photos` bucket, per-user folder, new file each time). */
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadProfileImage(userId: string, file: File, kind: "avatar" | "cover"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Faqat rasm faylini tanlang");
  if (file.size > MAX_BYTES) throw new Error("Rasm hajmi 5 MB dan oshmasin");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `avatars/${userId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("clinic-photos").upload(path, file, { contentType: file.type, cacheControl: "3600" });
  if (error) throw error;
  return supabase.storage.from("clinic-photos").getPublicUrl(path).data.publicUrl;
}

export async function saveProfileField(userId: string, field: "avatar_url" | "cover_url", value: string | null): Promise<void> {
  const { error } = await supabase.from("profiles").update(field === "avatar_url" ? { avatar_url: value ?? "" } : { cover_url: value }).eq("user_id", userId);
  if (error) throw error;
}

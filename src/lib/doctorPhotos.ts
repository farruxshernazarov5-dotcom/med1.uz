import sources from "@/data/doctorPhotoSources.json";

const photoSources: Record<string, string> = sources;
export function doctorPhotoCandidates(name: string, photo?: string | null): string[] {
  const known = photoSources[name];
  const urls = [photo, known].filter((url): url is string => !!url && /^https:\/\//i.test(url));
  // The old image project no longer resolves; retain the doctor's original only.
  return [...new Set(urls.filter(url => !url.includes("eqvwmwycjunvtyzbycis.supabase.co")))];
}
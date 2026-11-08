export type Reel = { id:string; title:string; description:string; media_kind:string; external_url:string|null; storage_path:string|null; owner_id:string; status:string; created_at:string; url?:string };
export function allowedReelUrl(value:string): boolean {
  try { const u=new URL(value); return u.protocol==='https:' && ['youtube.com','www.youtube.com','youtu.be','instagram.com','www.instagram.com','tiktok.com','www.tiktok.com','vimeo.com','www.vimeo.com','t.me','facebook.com','www.facebook.com'].includes(u.hostname); } catch { return false; }
}
export const reelFileError=(file:{type:string;size:number})=> !['video/mp4','video/webm','image/jpeg','image/png','image/webp'].includes(file.type)?'MP4, WebM, JPG, PNG yoki WebP tanlang':file.size>50*1024*1024?'Fayl 50 MB dan oshmasin':null;
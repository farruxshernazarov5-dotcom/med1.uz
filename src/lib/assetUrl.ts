import { isNativeApp, PUBLIC_SITE } from "./nativeApp";

/** CDN paths are served by Lovable hosting, not the bundled phone's localhost. */
export function hostedAssetUrl(url: string, native = isNativeApp()): string {
  return native && url.startsWith("/__l5e/assets-v1/") ? `${PUBLIC_SITE}${url}` : url;
}